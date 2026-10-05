const { Op } = require('sequelize');
const {
  Collection,
  Customer,
  Agent,
  User,
  Branch,
  Payment,
  CustomerAgentAssignment,
  Supervisor,
  sequelize
} = require('../../models');
const { ROLES, AGENT_STATUS, ASSIGNMENT_STATUS, COLLECTION_STATUS } = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class CollectionService {
  async createCollection(data, requestingUser) {
    let agentId = data.agent_id;

    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent) {
        throw ApiError.forbidden('Field Agent profile not found on user account');
      }
      agentId = requestingUser.agent.id;
    }

    if (!agentId) {
      throw ApiError.badRequest('Agent ID must be specified');
    }

    // Verify agent is active
    const agent = await Agent.findByPk(agentId);
    if (!agent || agent.status !== AGENT_STATUS.ACTIVE) {
      throw ApiError.forbidden('Suspended, terminated, or non-existent agents cannot create collection records');
    }

    // Verify customer assignment
    const assignment = await CustomerAgentAssignment.findOne({
      where: {
        customer_id: data.customer_id,
        agent_id: agentId,
        status: ASSIGNMENT_STATUS.ACTIVE
      }
    });

    if (!assignment && requestingUser.role.code === ROLES.FIELD_AGENT) {
      throw ApiError.forbidden('You are not assigned to collect from this customer');
    }

    return Collection.create({
      customer_id: data.customer_id,
      agent_id: agentId,
      assignment_id: assignment ? assignment.id : null,
      collection_date: data.collection_date,
      amount_due: data.amount_due,
      amount_collected: 0.00,
      collection_status: COLLECTION_STATUS.PENDING,
      remarks: data.remarks || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      created_by: requestingUser.id
    });
  }

  async getAllCollections(query, requestingUser) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['collection_date', 'amount_due', 'amount_collected', 'collection_status', 'created_at'],
      'collection_date',
      'DESC'
    );

    const where = {};
    if (query.collection_status !== undefined) {
      where.collection_status = parseInt(query.collection_status, 10);
    }
    if (query.customer_id) {
      where.customer_id = query.customer_id;
    }
    if (query.startDate && query.endDate) {
      where.collection_date = { [Op.between]: [query.startDate, query.endDate] };
    }

    // Role-based restrictions
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
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

    const { count, rows } = await Collection.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_code', 'full_name', 'mobile', 'address_line1'],
          include: [{ model: Branch, as: 'branch', attributes: ['branch_name'] }]
        },
        agentInclude,
        {
          model: Payment,
          as: 'payments',
          attributes: ['id', 'receipt_number', 'amount', 'payment_status', 'payment_date']
        }
      ],
      limit,
      offset,
      order,
      distinct: true
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

  async getCollectionById(id, requestingUser) {
    const collection = await Collection.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          include: [{ model: Branch, as: 'branch' }]
        },
        {
          model: Agent,
          as: 'agent',
          include: [
            { model: User, as: 'user', attributes: ['name', 'mobile', 'email'] },
            { model: Supervisor, as: 'supervisor' }
          ]
        },
        {
          model: Payment,
          as: 'payments'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!collection) {
      throw ApiError.notFound(`Collection record with id '${id}' not found`);
    }

    // Role ownership check
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (collection.agent_id !== requestingUser.agent?.id) {
        throw ApiError.forbidden('You are not authorized to view collections assigned to another agent');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (collection.agent?.supervisor_id !== requestingUser.supervisor?.id) {
        throw ApiError.forbidden('You are not authorized to view collections for agents outside your team');
      }
    }

    return collection;
  }

  async updateCollection(id, updateData, requestingUser) {
    const collection = await this.getCollectionById(id, requestingUser);

    // Agents cannot arbitrarily change collection amounts after confirmation
    if (requestingUser.role.code === ROLES.FIELD_AGENT && collection.collection_status === COLLECTION_STATUS.FULLY_COLLECTED) {
      throw ApiError.badRequest('Fully collected visit records cannot be modified by field agents');
    }

    return collection.update(updateData);
  }

  async getCollectionSummary(query, requestingUser) {
    const where = {};
    if (query.startDate && query.endDate) {
      where.collection_date = { [Op.between]: [query.startDate, query.endDate] };
    }

    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      where.agent_id = requestingUser.agent.id;
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      const teamAgents = await Agent.findAll({
        where: { supervisor_id: requestingUser.supervisor.id },
        attributes: ['id']
      });
      where.agent_id = { [Op.in]: teamAgents.map(a => a.id) };
    }

    const totalDue = await Collection.sum('amount_due', { where }) || 0;
    const totalCollected = await Collection.sum('amount_collected', { where }) || 0;
    const totalRecords = await Collection.count({ where });

    const pendingCount = await Collection.count({
      where: { ...where, collection_status: COLLECTION_STATUS.PENDING }
    });
    const completedCount = await Collection.count({
      where: { ...where, collection_status: COLLECTION_STATUS.FULLY_COLLECTED }
    });
    const partialCount = await Collection.count({
      where: { ...where, collection_status: COLLECTION_STATUS.PARTIALLY_COLLECTED }
    });

    return {
      totalDue: parseFloat(totalDue).toFixed(2),
      totalCollected: parseFloat(totalCollected).toFixed(2),
      totalOutstanding: parseFloat(totalDue - totalCollected).toFixed(2),
      totalVisits: totalRecords,
      breakdown: {
        pending: pendingCount,
        partiallyCollected: partialCount,
        fullyCollected: completedCount
      }
    };
  }
}

module.exports = new CollectionService();
