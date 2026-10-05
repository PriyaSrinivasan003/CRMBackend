const { Op } = require('sequelize');
const {
  Customer,
  Branch,
  Area,
  Agent,
  User,
  Supervisor,
  CustomerAgentAssignment,
  sequelize
} = require('../../models');
const { CUSTOMER_STATUS, AGENT_STATUS, ASSIGNMENT_STATUS, ROLES } = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const customerAgentService = require('../assignments/customerAgent.service');
const ApiError = require('../../utils/apiError');

class CustomerService {
  /**
   * Create customer record with transaction and optional initial assignment
   */
  async createCustomer(data, creatorId) {
    const {
      customer_code: rawCode,
      branch_id,
      area_id,
      initial_agent_id,
      ...customerData
    } = data;

    // Check branch exists and is active
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      throw ApiError.badRequest(`Branch with id '${branch_id}' does not exist`);
    }

    // Check area if provided
    if (area_id) {
      const area = await Area.findByPk(area_id);
      if (!area || area.status !== 1) {
        throw ApiError.badRequest(`Area with id '${area_id}' does not exist or is inactive`);
      }
      if (area.branch_id !== branch_id) {
        throw ApiError.badRequest(`Area '${area.name}' does not belong to branch '${branch.branch_name}'`);
      }
    }

    const customer_code = rawCode || `CUST-${Date.now().toString(36).toUpperCase()}`;

    const existing = await Customer.findOne({ where: { customer_code } });
    if (existing) {
      throw ApiError.conflict(`Customer with code '${customer_code}' already exists`);
    }

    return sequelize.transaction(async (t) => {
      const customer = await Customer.create(
        {
          ...customerData,
          customer_code,
          branch_id,
          area_id: area_id || null,
          status: CUSTOMER_STATUS.ACTIVE,
          created_by: creatorId
        },
        { transaction: t }
      );

      let initialAssignment = null;
      if (initial_agent_id) {
        const agent = await Agent.findByPk(initial_agent_id);
        if (!agent || agent.status !== AGENT_STATUS.ACTIVE) {
          throw ApiError.badRequest('Initial assigned agent does not exist or is not active');
        }

        initialAssignment = await CustomerAgentAssignment.create(
          {
            customer_id: customer.id,
            agent_id: initial_agent_id,
            assigned_by: creatorId,
            assigned_at: new Date(),
            effective_from: new Date(),
            status: ASSIGNMENT_STATUS.ACTIVE
          },
          { transaction: t }
        );
      }

      return {
        customer,
        initialAssignment
      };
    });
  }

  /**
   * List customers with role-based scoping, search, filter, and pagination
   */
  async getAllCustomers(query, requestingUser) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['customer_code', 'full_name', 'mobile', 'city', 'status', 'created_at'],
      'created_at',
      'DESC'
    );

    const where = {};
    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }
    if (query.branch_id) {
      where.branch_id = query.branch_id;
    }
    if (query.search) {
      where[Op.or] = [
        { customer_code: { [Op.like]: `%${query.search}%` } },
        { full_name: { [Op.like]: `%${query.search}%` } },
        { mobile: { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
        { city: { [Op.like]: `%${query.search}%` } }
      ];
    }

    // Role-based restrictions:
    // 1. Field Agent: Only view customers currently assigned to them
    // 2. Supervisor: Only view customers assigned to agents in their team
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent) {
        throw ApiError.forbidden('Agent profile missing');
      }
      const activeAssignments = await CustomerAgentAssignment.findAll({
        where: {
          agent_id: requestingUser.agent.id,
          status: ASSIGNMENT_STATUS.ACTIVE
        },
        attributes: ['customer_id']
      });
      const customerIds = activeAssignments.map(a => a.customer_id);
      where.id = { [Op.in]: customerIds };
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor) {
        throw ApiError.forbidden('Supervisor profile missing');
      }
      // Get all agents in supervisor's team
      const teamAgents = await Agent.findAll({
        where: { supervisor_id: requestingUser.supervisor.id },
        attributes: ['id']
      });
      const agentIds = teamAgents.map(a => a.id);

      const activeAssignments = await CustomerAgentAssignment.findAll({
        where: {
          agent_id: { [Op.in]: agentIds },
          status: ASSIGNMENT_STATUS.ACTIVE
        },
        attributes: ['customer_id']
      });
      const customerIds = activeAssignments.map(a => a.customer_id);
      where.id = { [Op.in]: customerIds };
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'branch_code', 'branch_name']
        },
        {
          model: Area,
          as: 'area',
          attributes: ['id', 'area_code', 'name', 'status']
        },
        {
          model: CustomerAgentAssignment,
          as: 'assignments',
          where: { status: ASSIGNMENT_STATUS.ACTIVE },
          required: false,
          include: [
            {
              model: Agent,
              as: 'agent',
              attributes: ['id', 'employee_code'],
              include: [{ model: User, as: 'user', attributes: ['name', 'mobile'] }]
            }
          ]
        }
      ],
      limit,
      offset,
      order,
      distinct: true
    });

    return {
      customers: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  /**
   * Get single customer with record-level permission check
   */
  async getCustomerById(id, requestingUser) {
    const customer = await Customer.findByPk(id, {
      include: [
        { model: Branch, as: 'branch' },
        { model: Area, as: 'area', attributes: ['id', 'area_code', 'name', 'status'] },
        {
          model: CustomerAgentAssignment,
          as: 'assignments',
          include: [
            {
              model: Agent,
              as: 'agent',
              include: [
                { model: User, as: 'user', attributes: ['name', 'mobile'] },
                { model: Supervisor, as: 'supervisor' }
              ]
            }
          ]
        }
      ]
    });

    if (!customer) {
      throw ApiError.notFound(`Customer with id '${id}' not found`);
    }

    // Record-level ownership checks
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      const isAssigned = customer.assignments.some(
        a => a.agent_id === requestingUser.agent?.id && a.status === ASSIGNMENT_STATUS.ACTIVE
      );
      if (!isAssigned) {
        throw ApiError.forbidden('You are not authorized to view this customer');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      const isTeamCustomer = customer.assignments.some(
        a => a.agent?.supervisor_id === requestingUser.supervisor?.id && a.status === ASSIGNMENT_STATUS.ACTIVE
      );
      if (!isTeamCustomer) {
        throw ApiError.forbidden('This customer is not assigned to any agent in your team');
      }
    }

    return customer;
  }

  async updateCustomer(id, data, updaterId) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw ApiError.notFound(`Customer with id '${id}' not found`);
    }

    const branchId = data.branch_id || customer.branch_id;
    if (data.area_id) {
      const area = await Area.findByPk(data.area_id);
      if (!area || area.status !== 1) {
        throw ApiError.badRequest(`Area with id '${data.area_id}' does not exist or is inactive`);
      }
      if (area.branch_id !== branchId) {
        throw ApiError.badRequest(`Area '${area.name}' does not belong to branch`);
      }
    }

    return customer.update({ ...data, updated_by: updaterId });
  }

  async updateCustomerStatus(id, status, updaterId) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      throw ApiError.notFound(`Customer with id '${id}' not found`);
    }

    return customer.update({ status, updated_by: updaterId });
  }

  async getCustomerAssignments(customerId, requestingUser) {
    // Verify customer access first
    await this.getCustomerById(customerId, requestingUser);

    return CustomerAgentAssignment.findAll({
      where: { customer_id: customerId },
      include: [
        {
          model: Agent,
          as: 'agent',
          include: [{ model: User, as: 'user', attributes: ['name', 'mobile'] }]
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'name']
        }
      ],
      order: [['assigned_at', 'DESC']]
    });
  }

  async assignCustomer(customerId, agentId, assignedById) {
    return customerAgentService.assignCustomerToAgent(
      { customer_id: customerId, agent_id: agentId },
      assignedById
    );
  }
}

module.exports = new CustomerService();
