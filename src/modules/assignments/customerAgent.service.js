const {
  CustomerAgentAssignment,
  Customer,
  Agent,
  User,
  Branch,
  sequelize
} = require('../../models');
const { CUSTOMER_STATUS, AGENT_STATUS, ASSIGNMENT_STATUS, ROLES } = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class CustomerAgentAssignmentService {
  async assignCustomerToAgent({ customer_id, agent_id, effective_from }, assignedById) {
    const customer = await Customer.findByPk(customer_id);
    if (!customer || customer.status === CUSTOMER_STATUS.INACTIVE) {
      throw ApiError.badRequest('Customer does not exist or is inactive');
    }
    if (customer.status === CUSTOMER_STATUS.BLOCKED) {
      throw ApiError.badRequest('Cannot assign an agent to a blocked customer');
    }

    const agent = await Agent.findByPk(agent_id);
    if (!agent || agent.status !== AGENT_STATUS.ACTIVE) {
      throw ApiError.badRequest('Target agent does not exist or is not active');
    }

    return sequelize.transaction(async (t) => {
      // 1. Terminate any existing active assignment for this customer
      await CustomerAgentAssignment.update(
        {
          status: ASSIGNMENT_STATUS.INACTIVE,
          effective_to: new Date()
        },
        {
          where: {
            customer_id,
            status: ASSIGNMENT_STATUS.ACTIVE
          },
          transaction: t
        }
      );

      // 2. Create new active assignment
      const assignment = await CustomerAgentAssignment.create(
        {
          customer_id,
          agent_id,
          assigned_by: assignedById,
          assigned_at: new Date(),
          effective_from: effective_from || new Date(),
          status: ASSIGNMENT_STATUS.ACTIVE
        },
        { transaction: t }
      );

      return assignment;
    });
  }

  async getCustomerAgentAssignments(query, requestingUser) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['assigned_at', 'effective_from', 'effective_to', 'status', 'created_at'],
      'assigned_at',
      'DESC'
    );

    const where = {};
    if (query.customer_id) where.customer_id = query.customer_id;
    if (query.status !== undefined) where.status = parseInt(query.status, 10);

    // Role-based filtering
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent) {
        throw ApiError.forbidden('Field Agent profile missing');
      }
      where.agent_id = requestingUser.agent.id;
    } else if (query.agent_id) {
      where.agent_id = query.agent_id;
    }

    const agentInclude = {
      model: Agent,
      as: 'agent',
      attributes: ['id', 'employee_code', 'supervisor_id'],
      include: [{ model: User, as: 'user', attributes: ['name', 'mobile'] }]
    };

    if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor) {
        throw ApiError.forbidden('Supervisor profile missing');
      }
      agentInclude.where = { supervisor_id: requestingUser.supervisor.id };
    }

    const { count, rows } = await CustomerAgentAssignment.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [{ model: Branch, as: 'branch' }]
        },
        agentInclude,
        {
          model: User,
          as: 'assigner',
          attributes: ['id', 'name']
        }
      ],
      limit,
      offset,
      order
    });

    return {
      assignments: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async updateCustomerAgentAssignment(id, updateData) {
    const assignment = await CustomerAgentAssignment.findByPk(id);
    if (!assignment) {
      throw ApiError.notFound(`Assignment with id '${id}' not found`);
    }

    return assignment.update(updateData);
  }
}

module.exports = new CustomerAgentAssignmentService();
