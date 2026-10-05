const { Op } = require('sequelize');
const {
  FieldVisit,
  FollowUp,
  Customer,
  Agent,
  User,
  CustomerAgentAssignment
} = require('../../models');
const {
  ROLES,
  AGENT_STATUS,
  ASSIGNMENT_STATUS,
  FOLLOW_UP_TYPE,
  FOLLOW_UP_STATUS
} = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class VisitService {
  async createVisit(data, requestingUser) {
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
      throw ApiError.forbidden('Suspended, terminated, or non-existent agents cannot record visits');
    }

    // Supervisor team scoping
    if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor) {
        throw ApiError.forbidden('Supervisor profile not found on user account');
      }
      if (agent.supervisor_id !== requestingUser.supervisor.id) {
        throw ApiError.forbidden('Cannot record visit for an agent outside your team');
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

    // Create Field Visit
    const visit = await FieldVisit.create({
      customer_id: data.customer_id,
      agent_id: agentId,
      assignment_id: assignment ? assignment.id : null,
      visit_date: data.visit_date || new Date(),
      visit_outcome: data.visit_outcome,
      remarks: data.remarks || null,
      next_follow_up_at: data.next_follow_up_at || null,
      latitude: data.latitude !== undefined ? data.latitude : null,
      longitude: data.longitude !== undefined ? data.longitude : null
    });

    // Automatically schedule follow-up if next_follow_up_at is provided
    let scheduledFollowUp = null;
    if (data.next_follow_up_at) {
      scheduledFollowUp = await FollowUp.create({
        customer_id: data.customer_id,
        agent_id: agentId,
        assignment_id: assignment ? assignment.id : null,
        visit_id: visit.id,
        scheduled_at: data.next_follow_up_at,
        follow_up_type: FOLLOW_UP_TYPE.VISIT,
        status: FOLLOW_UP_STATUS.PENDING,
        remarks: data.remarks ? `Auto-scheduled from visit: ${data.remarks}` : 'Auto-scheduled from field visit'
      });
    }

    const result = visit.toJSON();
    if (scheduledFollowUp) {
      result.scheduled_follow_up = scheduledFollowUp;
    }
    return result;
  }

  async getAllVisits(query, requestingUser) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['visit_date', 'visit_outcome', 'created_at'],
      'visit_date',
      'DESC'
    );

    const where = {};
    if (query.visit_outcome !== undefined) {
      where.visit_outcome = parseInt(query.visit_outcome, 10);
    }
    if (query.customer_id) {
      where.customer_id = query.customer_id;
    }
    if (query.startDate && query.endDate) {
      where.visit_date = { [Op.between]: [new Date(query.startDate), new Date(query.endDate)] };
    }

    // Role-based scoping
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

    const { count, rows } = await FieldVisit.findAndCountAll({
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
          model: FollowUp,
          as: 'followUps',
          attributes: ['id', 'scheduled_at', 'status', 'follow_up_type', 'completed_at']
        }
      ],
      limit,
      offset,
      order,
      distinct: true
    });

    return {
      visits: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getVisitById(id, requestingUser) {
    const visit = await FieldVisit.findByPk(id, {
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
          model: FollowUp,
          as: 'followUps'
        }
      ]
    });

    if (!visit) {
      throw ApiError.notFound(`Field visit with id '${id}' not found`);
    }

    // Role scoping
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (visit.agent_id !== requestingUser.agent.id) {
        throw ApiError.forbidden('You are not authorized to view visits recorded by other agents');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (visit.agent && visit.agent.supervisor_id !== requestingUser.supervisor.id) {
        throw ApiError.forbidden('You are not authorized to view visits from other teams');
      }
    }

    return visit;
  }
}

module.exports = new VisitService();
