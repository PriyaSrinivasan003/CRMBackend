const { Op } = require('sequelize');
const {
  FollowUp,
  FieldVisit,
  Customer,
  Agent,
  User,
  CustomerAgentAssignment
} = require('../../models');
const {
  ROLES,
  AGENT_STATUS,
  ASSIGNMENT_STATUS,
  FOLLOW_UP_STATUS
} = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class FollowUpService {
  async createFollowUp(data, requestingUser) {
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
      throw ApiError.forbidden('Suspended, terminated, or non-existent agents cannot have follow-ups assigned');
    }

    // Supervisor team scoping
    if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor) {
        throw ApiError.forbidden('Supervisor profile not found on user account');
      }
      if (agent.supervisor_id !== requestingUser.supervisor.id) {
        throw ApiError.forbidden('Cannot assign follow-up to an agent outside your team');
      }
    }

    // Verify customer exists
    const customer = await Customer.findByPk(data.customer_id);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Check assignment
    let assignment = null;
    if (data.assignment_id) {
      assignment = await CustomerAgentAssignment.findByPk(data.assignment_id);
    } else {
      assignment = await CustomerAgentAssignment.findOne({
        where: {
          customer_id: data.customer_id,
          agent_id: agentId,
          status: ASSIGNMENT_STATUS.ACTIVE
        }
      });
    }

    if (!assignment && requestingUser.role.code === ROLES.FIELD_AGENT) {
      throw ApiError.forbidden('You are not assigned to this customer');
    }

    // Optional visit validation
    if (data.visit_id) {
      const visit = await FieldVisit.findByPk(data.visit_id);
      if (!visit) {
        throw ApiError.notFound(`Field visit '${data.visit_id}' not found`);
      }
    }

    return FollowUp.create({
      customer_id: data.customer_id,
      agent_id: agentId,
      assignment_id: assignment ? assignment.id : null,
      visit_id: data.visit_id || null,
      scheduled_at: data.scheduled_at,
      follow_up_type: data.follow_up_type,
      status: data.status !== undefined ? data.status : FOLLOW_UP_STATUS.PENDING,
      remarks: data.remarks || null
    });
  }

  async getAllFollowUps(query, requestingUser) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['scheduled_at', 'status', 'follow_up_type', 'created_at', 'completed_at'],
      'scheduled_at',
      'ASC'
    );

    const where = {};
    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }
    if (query.follow_up_type !== undefined) {
      where.follow_up_type = parseInt(query.follow_up_type, 10);
    }
    if (query.customer_id) {
      where.customer_id = query.customer_id;
    }
    if (query.startDate && query.endDate) {
      where.scheduled_at = { [Op.between]: [new Date(query.startDate), new Date(query.endDate)] };
    }

    // Role scoping
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

    const { count, rows } = await FollowUp.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'mobile', 'address_line1', 'city', 'state']
        },
        agentInclude,
        {
          model: CustomerAgentAssignment,
          as: 'assignment',
          attributes: ['id', 'status', 'effective_from', 'effective_to']
        },
        {
          model: FieldVisit,
          as: 'visit',
          attributes: ['id', 'visit_date', 'visit_outcome', 'remarks']
        }
      ],
      limit,
      offset,
      order,
      distinct: true
    });

    return {
      follow_ups: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getFollowUpById(id, requestingUser) {
    const followUp = await FollowUp.findByPk(id, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'mobile', 'address_line1', 'city', 'state', 'pincode']
        },
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'employee_code', 'supervisor_id'],
          include: [{ model: User, as: 'user', attributes: ['name', 'mobile', 'email'] }]
        },
        {
          model: CustomerAgentAssignment,
          as: 'assignment',
          attributes: ['id', 'status', 'effective_from', 'effective_to']
        },
        {
          model: FieldVisit,
          as: 'visit'
        }
      ]
    });

    if (!followUp) {
      throw ApiError.notFound(`Follow-up with id '${id}' not found`);
    }

    // Role scoping
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (followUp.agent_id !== requestingUser.agent.id) {
        throw ApiError.forbidden('You are not authorized to view follow-ups assigned to other agents');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (followUp.agent && followUp.agent.supervisor_id !== requestingUser.supervisor.id) {
        throw ApiError.forbidden('You are not authorized to view follow-ups from other teams');
      }
    }

    return followUp;
  }

  async completeFollowUp(id, data, requestingUser) {
    const followUp = await FollowUp.findByPk(id, {
      include: [{ model: Agent, as: 'agent' }]
    });

    if (!followUp) {
      throw ApiError.notFound(`Follow-up with id '${id}' not found`);
    }

    // Role scoping
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (followUp.agent_id !== requestingUser.agent.id) {
        throw ApiError.forbidden('You can only complete follow-ups assigned to you');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (followUp.agent && followUp.agent.supervisor_id !== requestingUser.supervisor.id) {
        throw ApiError.forbidden('You can only complete follow-ups for agents in your team');
      }
    }

    const updates = {
      status: FOLLOW_UP_STATUS.COMPLETED,
      completed_at: data.completed_at || new Date()
    };

    if (data.remarks) {
      updates.remarks = followUp.remarks
        ? `${followUp.remarks} | Completion notes: ${data.remarks}`
        : data.remarks;
    }

    return followUp.update(updates);
  }
}

module.exports = new FollowUpService();
