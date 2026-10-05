const {
  AgentSupervisorAssignment,
  Supervisor,
  Agent,
  User,
  Branch,
  sequelize
} = require('../../models');
const { SUPERVISOR_STATUS, AGENT_STATUS, ASSIGNMENT_STATUS } = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class AgentSupervisorAssignmentService {
  async assignAgentToSupervisor({ supervisor_id, agent_id, effective_from }, assignedById) {
    const supervisor = await Supervisor.findByPk(supervisor_id);
    if (!supervisor || supervisor.status !== SUPERVISOR_STATUS.ACTIVE) {
      throw ApiError.badRequest('Target supervisor does not exist or is not active');
    }

    const agent = await Agent.findByPk(agent_id);
    if (!agent || agent.status !== AGENT_STATUS.ACTIVE) {
      throw ApiError.badRequest('Target agent does not exist or is not active');
    }

    return sequelize.transaction(async (t) => {
      // 1. Terminate any previous active assignment for this agent to prevent duplicate active supervisors
      await AgentSupervisorAssignment.update(
        {
          status: ASSIGNMENT_STATUS.INACTIVE,
          effective_to: new Date()
        },
        {
          where: {
            agent_id,
            status: ASSIGNMENT_STATUS.ACTIVE
          },
          transaction: t
        }
      );

      // 2. Create new active assignment
      const assignment = await AgentSupervisorAssignment.create(
        {
          supervisor_id,
          agent_id,
          assigned_by: assignedById,
          assigned_at: new Date(),
          effective_from: effective_from || new Date(),
          status: ASSIGNMENT_STATUS.ACTIVE
        },
        { transaction: t }
      );

      // 3. Update agent current supervisor_id reference
      await agent.update({ supervisor_id }, { transaction: t });

      return assignment;
    });
  }

  async getAgentSupervisorAssignments(query) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['assigned_at', 'effective_from', 'effective_to', 'status', 'created_at'],
      'assigned_at',
      'DESC'
    );

    const where = {};
    if (query.supervisor_id) where.supervisor_id = query.supervisor_id;
    if (query.agent_id) where.agent_id = query.agent_id;
    if (query.status !== undefined) where.status = parseInt(query.status, 10);

    const { count, rows } = await AgentSupervisorAssignment.findAndCountAll({
      where,
      include: [
        {
          model: Supervisor,
          as: 'supervisor',
          attributes: ['id', 'employee_code'],
          include: [{ model: User, as: 'user', attributes: ['name', 'email', 'mobile'] }]
        },
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'employee_code'],
          include: [{ model: User, as: 'user', attributes: ['name', 'email', 'mobile'] }]
        },
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

  async updateAgentSupervisorAssignment(id, updateData) {
    const assignment = await AgentSupervisorAssignment.findByPk(id);
    if (!assignment) {
      throw ApiError.notFound(`Assignment with id '${id}' not found`);
    }

    return sequelize.transaction(async (t) => {
      await assignment.update(updateData, { transaction: t });

      // If assignment is deactivated, clear agent supervisor_id if it matched this supervisor
      if (updateData.status === ASSIGNMENT_STATUS.INACTIVE) {
        const agent = await Agent.findByPk(assignment.agent_id);
        if (agent && agent.supervisor_id === assignment.supervisor_id) {
          await agent.update({ supervisor_id: null }, { transaction: t });
        }
      }

      return assignment;
    });
  }
}

module.exports = new AgentSupervisorAssignmentService();
