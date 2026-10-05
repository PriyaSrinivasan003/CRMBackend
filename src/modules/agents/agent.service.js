const { Op } = require('sequelize');
const {
  Agent,
  User,
  Supervisor,
  Branch,
  Customer,
  CustomerAgentAssignment,
  Collection
} = require('../../models');
const { ROLES, AGENT_STATUS, ASSIGNMENT_STATUS } = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const userService = require('../users/user.service');
const ApiError = require('../../utils/apiError');

class AgentService {
  async createAgent(data, creatorId) {
    return userService.createUser({
      ...data,
      role_code: ROLES.FIELD_AGENT
    }, creatorId);
  }

  async getAllAgents(query, requestingUser) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['employee_code', 'joining_date', 'status', 'created_at'],
      'created_at',
      'DESC'
    );

    const where = {};

    // Role-based scoping: Supervisor can only view their own agents
    if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor) {
        throw ApiError.forbidden('Supervisor profile not attached to account');
      }
      where.supervisor_id = requestingUser.supervisor.id;
    } else if (query.supervisor_id) {
      where.supervisor_id = query.supervisor_id;
    }

    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }
    if (query.branch_id) {
      where.branch_id = query.branch_id;
    }
    if (query.search) {
      where[Op.or] = [
        { employee_code: { [Op.like]: `%${query.search}%` } },
        { '$user.name$': { [Op.like]: `%${query.search}%` } },
        { '$user.email$': { [Op.like]: `%${query.search}%` } },
        { '$user.mobile$': { [Op.like]: `%${query.search}%` } }
      ];
    }

    const { count, rows } = await Agent.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'mobile', 'status', 'last_login_at']
        },
        {
          model: Supervisor,
          as: 'supervisor',
          attributes: ['id', 'employee_code'],
          include: [{ model: User, as: 'user', attributes: ['name'] }]
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'branch_code', 'branch_name']
        }
      ],
      limit,
      offset,
      order
    });

    return {
      agents: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getAgentById(id, requestingUser) {
    // Record-level permission checks for field agents (cannot query any agent other than self)
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent || requestingUser.agent.id !== id) {
        throw ApiError.forbidden('Field agents can only view their own profile');
      }
    }

    const agent = await Agent.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'mobile', 'status', 'last_login_at']
        },
        {
          model: Supervisor,
          as: 'supervisor',
          include: [{ model: User, as: 'user', attributes: ['name', 'email', 'mobile'] }]
        },
        {
          model: Branch,
          as: 'branch'
        }
      ]
    });

    if (!agent) {
      throw ApiError.notFound(`Agent with id '${id}' not found`);
    }

    if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor || agent.supervisor_id !== requestingUser.supervisor.id) {
        throw ApiError.forbidden('Supervisors can only view agents assigned to their team');
      }
    }

    return agent;
  }

  async updateAgent(id, data, requestingUser) {
    const agent = await Agent.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!agent) {
      throw ApiError.notFound(`Agent with id '${id}' not found`);
    }

    // Role-level checks on permitted update fields
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent || requestingUser.agent.id !== id) {
        throw ApiError.forbidden('You can only update your own agent profile');
      }
      // Permitted fields for field agent self-update
      const allowedUpdates = {};
      if (data.mobile !== undefined) allowedUpdates.mobile = data.mobile;
      if (data.address !== undefined) allowedUpdates.address = data.address;
      if (data.emergency_contact !== undefined) allowedUpdates.emergency_contact = data.emergency_contact;
      if (data.date_of_birth !== undefined) allowedUpdates.date_of_birth = data.date_of_birth;

      return agent.update({ ...allowedUpdates, updated_by: requestingUser.id });
    }

    // Admin full update
    const { name, ...agentFields } = data;
    if (name && agent.user) {
      await agent.user.update({ name, updated_by: requestingUser.id });
    }

    return agent.update({ ...agentFields, updated_by: requestingUser.id });
  }

  async updateAgentStatus(id, status, updaterId) {
    const agent = await Agent.findByPk(id);
    if (!agent) {
      throw ApiError.notFound(`Agent with id '${id}' not found`);
    }

    return agent.update({ status, updated_by: updaterId });
  }

  async getAgentCustomers(agentId, requestingUser, query) {
    // Permission check
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent || requestingUser.agent.id !== agentId) {
        throw ApiError.forbidden('You can only view customers assigned to yourself');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      const agent = await Agent.findByPk(agentId);
      if (!agent || agent.supervisor_id !== requestingUser.supervisor?.id) {
        throw ApiError.forbidden('You can only view customers for agents in your team');
      }
    }

    const { page, limit, offset, order } = getPagination(
      query,
      ['assigned_at', 'status'],
      'assigned_at',
      'DESC'
    );

    const where = {
      agent_id: agentId,
      status: ASSIGNMENT_STATUS.ACTIVE
    };

    const { count, rows } = await CustomerAgentAssignment.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [{ model: Branch, as: 'branch' }]
        }
      ],
      limit,
      offset,
      order
    });

    const customers = rows.map(r => ({
      assignmentId: r.id,
      assignedAt: r.assigned_at,
      effectiveFrom: r.effective_from,
      customer: r.customer
    }));

    return {
      customers,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getAgentCollections(agentId, requestingUser, query) {
    // Permission check
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent || requestingUser.agent.id !== agentId) {
        throw ApiError.forbidden('You can only view your own collections');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      const agent = await Agent.findByPk(agentId);
      if (!agent || agent.supervisor_id !== requestingUser.supervisor?.id) {
        throw ApiError.forbidden('You can only view collections for agents in your team');
      }
    }

    const { page, limit, offset, order } = getPagination(
      query,
      ['collection_date', 'amount_due', 'amount_collected', 'collection_status', 'created_at'],
      'collection_date',
      'DESC'
    );

    const where = { agent_id: agentId };
    if (query.collection_status !== undefined) {
      where.collection_status = parseInt(query.collection_status, 10);
    }
    if (query.startDate && query.endDate) {
      where.collection_date = { [Op.between]: [query.startDate, query.endDate] };
    }

    const { count, rows } = await Collection.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_code', 'full_name', 'mobile', 'address_line1']
        }
      ],
      limit,
      offset,
      order
    });

    return {
      collections: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }
}

module.exports = new AgentService();
