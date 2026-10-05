const { Op } = require('sequelize');
const {
  User,
  Supervisor,
  Agent,
  Customer,
  Branch,
  Collection,
  Payment,
  CustomerAgentAssignment,
  sequelize
} = require('../../models');
const { ROLES, PAYMENT_STATUS, COLLECTION_STATUS, ASSIGNMENT_STATUS } = require('../../constants/statusCodes');
const ApiError = require('../../utils/apiError');

class DashboardService {
  /**
   * System-wide administrator dashboard
   */
  async getAdminDashboard() {
    const [
      totalUsers,
      totalSupervisors,
      totalAgents,
      totalCustomers,
      totalBranches,
      totalDue,
      totalCollected,
      confirmedPaymentsTotal,
      confirmedPaymentsCount,
      recentCollections,
      recentPayments
    ] = await Promise.all([
      User.count(),
      Supervisor.count(),
      Agent.count(),
      Customer.count(),
      Branch.count(),
      Collection.sum('amount_due') || 0,
      Collection.sum('amount_collected') || 0,
      Payment.sum('amount', { where: { payment_status: PAYMENT_STATUS.CONFIRMED } }) || 0,
      Payment.count({ where: { payment_status: PAYMENT_STATUS.CONFIRMED } }),
      Collection.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'customer_code'] },
          { model: Agent, as: 'agent', attributes: ['id', 'employee_code'] }
        ]
      }),
      Payment.findAll({
        limit: 5,
        order: [['created_at', 'DESC']],
        include: [
          { model: Customer, as: 'customer', attributes: ['id', 'full_name'] },
          { model: Agent, as: 'agent', attributes: ['id', 'employee_code'] }
        ]
      })
    ]);

    const parsedDue = parseFloat(totalDue);
    const parsedCollected = parseFloat(totalCollected);

    return {
      overview: {
        totalUsers,
        totalSupervisors,
        totalAgents,
        totalCustomers,
        totalBranches
      },
      collections: {
        totalDue: parsedDue.toFixed(2),
        totalCollected: parsedCollected.toFixed(2),
        totalOutstanding: (parsedDue - parsedCollected).toFixed(2),
        collectionEfficiency: parsedDue > 0 ? ((parsedCollected / parsedDue) * 100).toFixed(1) + '%' : '0.0%'
      },
      payments: {
        totalConfirmedAmount: parseFloat(confirmedPaymentsTotal).toFixed(2),
        totalConfirmedTransactions: confirmedPaymentsCount
      },
      recentActivity: {
        collections: recentCollections,
        payments: recentPayments
      }
    };
  }

  /**
   * Team-level supervisor dashboard
   */
  async getSupervisorDashboard(supervisorUser) {
    if (!supervisorUser.supervisor) {
      throw ApiError.forbidden('Supervisor profile not found');
    }

    const supervisorId = supervisorUser.supervisor.id;

    // Get agents in this supervisor's team
    const teamAgents = await Agent.findAll({
      where: { supervisor_id: supervisorId },
      include: [{ model: User, as: 'user', attributes: ['name', 'mobile'] }]
    });

    const agentIds = teamAgents.map(a => a.id);

    // Active customer assignments for team
    const assignedCustomersCount = await CustomerAgentAssignment.count({
      where: {
        agent_id: { [Op.in]: agentIds },
        status: ASSIGNMENT_STATUS.ACTIVE
      }
    });

    // Collection stats for team
    const [teamDue, teamCollected, pendingVisits, completedVisits] = await Promise.all([
      Collection.sum('amount_due', { where: { agent_id: { [Op.in]: agentIds } } }) || 0,
      Collection.sum('amount_collected', { where: { agent_id: { [Op.in]: agentIds } } }) || 0,
      Collection.count({
        where: {
          agent_id: { [Op.in]: agentIds },
          collection_status: COLLECTION_STATUS.PENDING
        }
      }),
      Collection.count({
        where: {
          agent_id: { [Op.in]: agentIds },
          collection_status: COLLECTION_STATUS.FULLY_COLLECTED
        }
      })
    ]);

    const parsedDue = parseFloat(teamDue);
    const parsedCollected = parseFloat(teamCollected);

    // Agent breakdown
    const agentBreakdown = await Promise.all(
      teamAgents.map(async (ag) => {
        const agDue = await Collection.sum('amount_due', { where: { agent_id: ag.id } }) || 0;
        const agCollected = await Collection.sum('amount_collected', { where: { agent_id: ag.id } }) || 0;
        const agCustomers = await CustomerAgentAssignment.count({
          where: { agent_id: ag.id, status: ASSIGNMENT_STATUS.ACTIVE }
        });
        return {
          agentId: ag.id,
          employeeCode: ag.employee_code,
          name: ag.user ? ag.user.name : 'Unknown',
          assignedCustomers: agCustomers,
          totalDue: parseFloat(agDue).toFixed(2),
          totalCollected: parseFloat(agCollected).toFixed(2)
        };
      })
    );

    return {
      teamSummary: {
        totalAgents: teamAgents.length,
        totalCustomersAssigned: assignedCustomersCount,
        totalTeamDue: parsedDue.toFixed(2),
        totalTeamCollected: parsedCollected.toFixed(2),
        totalTeamOutstanding: (parsedDue - parsedCollected).toFixed(2),
        pendingVisits,
        completedVisits
      },
      agentPerformance: agentBreakdown
    };
  }

  /**
   * Field agent personal dashboard
   */
  async getAgentDashboard(agentUser) {
    if (!agentUser.agent) {
      throw ApiError.forbidden('Field Agent profile not found');
    }

    const agentId = agentUser.agent.id;

    const [
      assignedCustomersCount,
      totalDue,
      totalCollected,
      pendingVisits,
      partialVisits,
      completedVisits,
      recentPayments
    ] = await Promise.all([
      CustomerAgentAssignment.count({
        where: { agent_id: agentId, status: ASSIGNMENT_STATUS.ACTIVE }
      }),
      Collection.sum('amount_due', { where: { agent_id: agentId } }) || 0,
      Collection.sum('amount_collected', { where: { agent_id: agentId } }) || 0,
      Collection.count({
        where: { agent_id: agentId, collection_status: COLLECTION_STATUS.PENDING }
      }),
      Collection.count({
        where: { agent_id: agentId, collection_status: COLLECTION_STATUS.PARTIALLY_COLLECTED }
      }),
      Collection.count({
        where: { agent_id: agentId, collection_status: COLLECTION_STATUS.FULLY_COLLECTED }
      }),
      Payment.findAll({
        where: { agent_id: agentId },
        limit: 5,
        order: [['payment_date', 'DESC']],
        include: [{ model: Customer, as: 'customer', attributes: ['id', 'full_name'] }]
      })
    ]);

    const parsedDue = parseFloat(totalDue);
    const parsedCollected = parseFloat(totalCollected);

    return {
      profile: {
        agentId,
        employeeCode: agentUser.agent.employee_code,
        name: agentUser.name,
        branch: agentUser.agent.branch ? agentUser.agent.branch.branch_name : null
      },
      customersAssigned: assignedCustomersCount,
      collectionStats: {
        totalDue: parsedDue.toFixed(2),
        totalCollected: parsedCollected.toFixed(2),
        totalOutstanding: (parsedDue - parsedCollected).toFixed(2),
        pendingVisits,
        partiallyCollectedVisits: partialVisits,
        fullyCollectedVisits: completedVisits
      },
      recentPayments
    };
  }
}

module.exports = new DashboardService();
