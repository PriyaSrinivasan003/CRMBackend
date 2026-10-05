const { Op, fn, col, literal } = require('sequelize');
const {
  User,
  Role,
  Supervisor,
  Agent,
  Customer,
  Branch,
  Area,
  Organization,
  Collection,
  Payment,
  PaymentAllocation,
  PaymentMode,
  LoginAudit,
  CustomerAgentAssignment,
  AgentSupervisorAssignment,
  FieldVisit,
  PromiseToPay,
  FollowUpTask,
  RefreshToken,
  sequelize
} = require('../../models');
const { ROLES, PAYMENT_STATUS, COLLECTION_STATUS, ASSIGNMENT_STATUS } = require('../../constants/statusCodes');
const ApiError = require('../../utils/apiError');
const userService = require('../users/user.service');

class AdminService {
  /**
   * 1. Consolidate Organization-Wide Admin Dashboard
   * Consolidates:
   * - Total receivables and outstanding balances
   * - Amount overdue by aging bucket
   * - Collections received and verified
   * - Payment reconciliation exceptions
   * - Branch, Supervisor, and Agent performance counts
   * - Unassigned cases and workload imbalances
   * - Customer disputes and escalations
   * - User status, failed logins, and security events
   * - Collection policy configuration and audit activity
   */
  async getOrganizationSummary() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const d30Str = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d60Str = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d90Str = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Bounded, targeted aggregations to prevent unbounded database memory scans
    const [
      totalDue,
      totalCollected,
      // Aging buckets for overdue collections (collection_status != FULLY_COLLECTED)
      overdue0to30,
      overdue31to60,
      overdue61to90,
      overdue90plus,
      // Verified vs Pending payments
      verifiedAmount,
      verifiedCount,
      pendingAmount,
      pendingCount,
      reversedAmount,
      reversedCount,
      // Entity counts
      totalBranches,
      totalSupervisors,
      totalAgents,
      totalCustomers,
      activeAssignmentsCount,
      // Disputes & Escalations
      disputedVisitsCount,
      refusedVisitsCount,
      brokenPtpsCount,
      escalatedTasksCount,
      // User Security
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      failedLogins24h,
      totalLogins24h,
      recentFailedLogins,
      // Configurable masters
      activePaymentModesCount,
      activeAreasCount
    ] = await Promise.all([
      Collection.sum('amount_due') || 0,
      Collection.sum('amount_collected') || 0,
      // Aging buckets
      Collection.sum('amount_due', {
        where: {
          collection_status: { [Op.ne]: COLLECTION_STATUS.FULLY_COLLECTED },
          collection_date: { [Op.between]: [d30Str, todayStr] }
        }
      }) || 0,
      Collection.sum('amount_due', {
        where: {
          collection_status: { [Op.ne]: COLLECTION_STATUS.FULLY_COLLECTED },
          collection_date: { [Op.between]: [d60Str, d30Str] }
        }
      }) || 0,
      Collection.sum('amount_due', {
        where: {
          collection_status: { [Op.ne]: COLLECTION_STATUS.FULLY_COLLECTED },
          collection_date: { [Op.between]: [d90Str, d60Str] }
        }
      }) || 0,
      Collection.sum('amount_due', {
        where: {
          collection_status: { [Op.ne]: COLLECTION_STATUS.FULLY_COLLECTED },
          collection_date: { [Op.lt]: d90Str }
        }
      }) || 0,
      // Payments
      Payment.sum('amount', { where: { payment_status: PAYMENT_STATUS.CONFIRMED } }) || 0,
      Payment.count({ where: { payment_status: PAYMENT_STATUS.CONFIRMED } }),
      Payment.sum('amount', { where: { payment_status: PAYMENT_STATUS.PENDING } }) || 0,
      Payment.count({ where: { payment_status: PAYMENT_STATUS.PENDING } }),
      Payment.sum('amount', { where: { payment_status: PAYMENT_STATUS.REVERSED } }) || 0,
      Payment.count({ where: { payment_status: PAYMENT_STATUS.REVERSED } }),
      // Entities
      Branch.count(),
      Supervisor.count(),
      Agent.count(),
      Customer.count(),
      CustomerAgentAssignment.count({ where: { status: ASSIGNMENT_STATUS.ACTIVE } }),
      // Disputes & Escalations
      FieldVisit.count({ where: { visit_outcome: 5 } }), // Dispute Raised
      FieldVisit.count({ where: { visit_outcome: 6 } }), // Refused
      PromiseToPay.count({ where: { status: 'BROKEN' } }),
      FollowUpTask.count({ where: { outcome: 'ESCALATED' } }),
      // Users & Security
      User.count({ where: { status: 1 } }),
      User.count({ where: { status: 0 } }),
      User.count({ where: { status: 2 } }),
      LoginAudit.count({ where: { success: 0, created_at: { [Op.gte]: past24h } } }),
      LoginAudit.count({ where: { created_at: { [Op.gte]: past24h } } }),
      LoginAudit.findAll({
        where: { success: 0 },
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'login_identifier', 'ip_address', 'failure_reason', 'created_at']
      }),
      // Master counts
      PaymentMode.count({ where: { status: 1 } }),
      Area.count({ where: { status: 1 } })
    ]);

    const parsedDue = parseFloat(totalDue);
    const parsedCollected = parseFloat(totalCollected);
    const totalOutstanding = parsedDue - parsedCollected;
    const efficiency = parsedDue > 0 ? ((parsedCollected / parsedDue) * 100).toFixed(1) + '%' : '0.0%';

    const unassignedCases = Math.max(0, totalCustomers - activeAssignmentsCount);
    const avgCasesPerAgent = totalAgents > 0 ? (activeAssignmentsCount / totalAgents).toFixed(1) : '0.0';

    return {
      financialSummary: {
        totalReceivables: parsedDue.toFixed(2),
        totalCollected: parsedCollected.toFixed(2),
        totalOutstanding: totalOutstanding.toFixed(2),
        collectionEfficiency: efficiency
      },
      agingBuckets: {
        bucket_0_30: parseFloat(overdue0to30).toFixed(2),
        bucket_31_60: parseFloat(overdue31to60).toFixed(2),
        bucket_61_90: parseFloat(overdue61to90).toFixed(2),
        bucket_90_plus: parseFloat(overdue90plus).toFixed(2),
        totalOverdue: (parseFloat(overdue0to30) + parseFloat(overdue31to60) + parseFloat(overdue61to90) + parseFloat(overdue90plus)).toFixed(2)
      },
      verifiedCollections: {
        verifiedAmount: parseFloat(verifiedAmount).toFixed(2),
        verifiedTransactions: verifiedCount,
        pendingVerificationAmount: parseFloat(pendingAmount).toFixed(2),
        pendingTransactions: pendingCount
      },
      reconciliationExceptions: {
        reversedTransactionsCount: reversedCount,
        reversedAmount: parseFloat(reversedAmount).toFixed(2),
        pendingVerificationCount: pendingCount
      },
      organizationPerformance: {
        totalBranches,
        totalSupervisors,
        totalAgents,
        totalCustomers
      },
      workloadDistribution: {
        activeAssignmentsCount,
        unassignedCases,
        averageCasesPerAgent: Number(avgCasesPerAgent),
        workloadImbalanceFlag: unassignedCases > 0 || Number(avgCasesPerAgent) > 50
      },
      disputesAndEscalations: {
        disputedVisitsCount,
        refusedVisitsCount,
        brokenPromisesCount: brokenPtpsCount,
        escalatedTasksCount,
        totalAttentionRequired: disputedVisitsCount + refusedVisitsCount + brokenPtpsCount + escalatedTasksCount
      },
      securityAndAccess: {
        usersByStatus: {
          active: activeUsers,
          inactive: inactiveUsers,
          suspended: suspendedUsers,
          total: activeUsers + inactiveUsers + suspendedUsers
        },
        failedLoginsLast24h: failedLogins24h,
        totalLoginsLast24h: totalLogins24h,
        recentSecurityEvents: recentFailedLogins
      },
      policyAndConfiguration: {
        activePaymentModes: activePaymentModesCount,
        activeAreas: activeAreasCount,
        activeBranches: totalBranches
      }
    };
  }

  /**
   * 2. Search and filter all authorized users
   */
  async getUsers(query = {}) {
    return userService.getAllUsers(query);
  }

  /**
   * 3. Create authorized user
   */
  async createUser(data, creatorId) {
    return userService.createUser(data, creatorId);
  }

  /**
   * 4. Update user status (Activate / Deactivate / Suspend)
   */
  async updateUserStatus(userId, rawStatus, modifierId) {
    let statusNum;
    if (typeof rawStatus === 'string') {
      const upper = rawStatus.toUpperCase();
      if (upper === 'ACTIVE' || upper === '1') statusNum = 1;
      else if (upper === 'INACTIVE' || upper === '0') statusNum = 0;
      else if (upper === 'SUSPENDED' || upper === '2') statusNum = 2;
      else statusNum = parseInt(rawStatus, 10);
    } else {
      statusNum = Number(rawStatus);
    }

    if (![0, 1, 2].includes(statusNum)) {
      throw ApiError.badRequest('Invalid status. Must be 0 (Inactive), 1 (Active), or 2 (Suspended)');
    }

    const updated = await userService.updateUserStatus(userId, statusNum, modifierId);

    // If deactivated or suspended, revoke all active sessions immediately
    if (statusNum === 0 || statusNum === 2) {
      await RefreshToken.destroy({ where: { user_id: userId } });
    }

    return updated;
  }

  /**
   * 5. Branch management overview
   */
  async getBranches(query = {}) {
    const { page = 1, limit = 10, search, status, organization_id, sortBy = 'branch_name', sortOrder = 'ASC' } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status !== undefined) where.status = status;
    if (organization_id) where.organization_id = organization_id;
    if (search) {
      where[Op.or] = [
        { branch_name: { [Op.like]: `%${search}%` } },
        { branch_code: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Branch.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: Organization, as: 'organisation', attributes: ['id', 'name', 'code'] }
      ]
    });

    const enrichedBranches = await Promise.all(
      rows.map(async (b) => {
        const [areasCount, supervisorsCount, agentsCount, customersCount] = await Promise.all([
          Area.count({ where: { branch_id: b.id } }),
          Supervisor.count({ where: { branch_id: b.id } }),
          Agent.count({ where: { branch_id: b.id } }),
          Customer.count({ where: { branch_id: b.id } })
        ]);
        return {
          ...b.toJSON(),
          metrics: {
            areasCount,
            supervisorsCount,
            agentsCount,
            customersCount
          }
        };
      })
    );

    return {
      branches: enrichedBranches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }

  /**
   * 6. Area management overview
   */
  async getAreas(query = {}) {
    const { page = 1, limit = 10, search, status, branch_id, sortBy = 'name', sortOrder = 'ASC' } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status !== undefined) where.status = status;
    if (branch_id) where.branch_id = branch_id;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { area_code: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Area.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'branch_name', 'branch_code'],
          include: [{ model: Organization, as: 'organisation', attributes: ['id', 'name'] }]
        }
      ]
    });

    const enrichedAreas = await Promise.all(
      rows.map(async (a) => {
        const customersCount = await Customer.count({ where: { area_id: a.id } });
        return {
          ...a.toJSON(),
          customersCount
        };
      })
    );

    return {
      areas: enrichedAreas,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }

  /**
   * 7. Audit log event search
   */
  async getAuditLogs(query = {}) {
    const {
      page = 1,
      limit = 20,
      user_id,
      success,
      search,
      from_date,
      to_date,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (user_id) where.user_id = user_id;
    if (success !== undefined) where.success = Number(success);
    if (from_date && to_date) {
      where.created_at = { [Op.between]: [new Date(from_date), new Date(to_date)] };
    } else if (from_date) {
      where.created_at = { [Op.gte]: new Date(from_date) };
    } else if (to_date) {
      where.created_at = { [Op.lte]: new Date(to_date) };
    }

    if (search) {
      where[Op.or] = [
        { login_identifier: { [Op.like]: `%${search}%` } },
        { ip_address: { [Op.like]: `%${search}%` } },
        { failure_reason: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await LoginAudit.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    return {
      auditLogs: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }

  /**
   * 8. Financial Reconciliation Exceptions
   */
  async getReconciliationExceptions(query = {}) {
    const { page = 1, limit = 10, exception_type } = query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {};
    if (exception_type === 'REVERSED') {
      where.payment_status = PAYMENT_STATUS.REVERSED;
    } else if (exception_type === 'PENDING') {
      where.payment_status = PAYMENT_STATUS.PENDING;
    } else {
      where.payment_status = { [Op.in]: [PAYMENT_STATUS.REVERSED, PAYMENT_STATUS.PENDING] };
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'customer_code'] },
        { model: Agent, as: 'agent', attributes: ['id', 'employee_code'] },
        { model: PaymentAllocation, as: 'allocations' },
        { model: PaymentMode, as: 'paymentMode', attributes: ['id', 'name', 'code'] }
      ]
    });

    const [totalReversedAmount, totalPendingAmount] = await Promise.all([
      Payment.sum('amount', { where: { payment_status: PAYMENT_STATUS.REVERSED } }) || 0,
      Payment.sum('amount', { where: { payment_status: PAYMENT_STATUS.PENDING } }) || 0
    ]);

    const formattedExceptions = rows.map(p => {
      const allocatedSum = (p.allocations || []).reduce((s, a) => s + Number(a.allocated_amount || 0), 0);
      const isMismatch = p.allocations && p.allocations.length > 0 && Math.abs(allocatedSum - Number(p.amount)) > 0.01;

      let exceptionReason = 'Pending Verification';
      if (p.payment_status === PAYMENT_STATUS.REVERSED) {
        exceptionReason = 'Payment Reversed';
      } else if (isMismatch) {
        exceptionReason = `Allocation Mismatch: Allocated ${allocatedSum.toFixed(2)} vs Payment ${Number(p.amount).toFixed(2)}`;
      }

      return {
        id: p.id,
        receipt_number: p.receipt_number,
        amount: Number(p.amount).toFixed(2),
        payment_status: p.payment_status,
        customer_name: p.customer?.full_name,
        customer_code: p.customer?.customer_code,
        agent_code: p.agent?.employee_code,
        payment_mode: p.paymentMode?.name || 'Cash',
        exception_reason: exceptionReason,
        created_at: p.created_at
      };
    });

    return {
      summary: {
        totalExceptions: count,
        totalReversedAmount: parseFloat(totalReversedAmount).toFixed(2),
        totalPendingAmount: parseFloat(totalPendingAmount).toFixed(2)
      },
      exceptions: formattedExceptions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }

  /**
   * 9. Aging Report
   */
  async getAgingReport(query = {}) {
    const { page = 1, limit = 10, branch_id, as_of_date } = query;
    const offset = (Number(page) - 1) * Number(limit);

    const now = as_of_date ? new Date(as_of_date) : new Date();
    const todayStr = now.toISOString().split('T')[0];
    const d30Str = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d60Str = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d90Str = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const d120Str = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const where = {
      collection_status: { [Op.ne]: COLLECTION_STATUS.FULLY_COLLECTED }
    };

    if (branch_id) {
      where['$customer.branch_id$'] = branch_id;
    }

    // Bucket Summary Aggregations
    const [b0to30, b31to60, b61to90, b91to120, b120plus] = await Promise.all([
      Collection.sum('amount_due', { where: { ...where, collection_date: { [Op.between]: [d30Str, todayStr] } } }) || 0,
      Collection.sum('amount_due', { where: { ...where, collection_date: { [Op.between]: [d60Str, d30Str] } } }) || 0,
      Collection.sum('amount_due', { where: { ...where, collection_date: { [Op.between]: [d90Str, d60Str] } } }) || 0,
      Collection.sum('amount_due', { where: { ...where, collection_date: { [Op.between]: [d120Str, d90Str] } } }) || 0,
      Collection.sum('amount_due', { where: { ...where, collection_date: { [Op.lt]: d120Str } } }) || 0
    ]);

    const { count, rows } = await Collection.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['collection_date', 'ASC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'customer_code', 'mobile', 'branch_id'],
          include: [{ model: Branch, as: 'branch', attributes: ['id', 'branch_name'] }]
        },
        { model: Agent, as: 'agent', attributes: ['id', 'employee_code'] }
      ]
    });

    const lineItems = rows.map(c => {
      const colDate = new Date(c.collection_date);
      const diffTime = Math.max(0, now - colDate);
      const daysPastDue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let bucket = '0-30 Days';
      if (daysPastDue > 120) bucket = '120+ Days';
      else if (daysPastDue > 90) bucket = '91-120 Days';
      else if (daysPastDue > 60) bucket = '61-90 Days';
      else if (daysPastDue > 30) bucket = '31-60 Days';

      const due = Number(c.amount_due);
      const collected = Number(c.amount_collected);
      const outstanding = Math.max(0, due - collected);

      return {
        collection_id: c.id,
        customer_id: c.customer_id,
        customer_name: c.customer?.full_name,
        customer_code: c.customer?.customer_code,
        branch_name: c.customer?.branch?.branch_name,
        collection_date: c.collection_date,
        amount_due: due.toFixed(2),
        amount_collected: collected.toFixed(2),
        outstanding_balance: outstanding.toFixed(2),
        days_past_due: daysPastDue,
        aging_bucket: bucket
      };
    });

    return {
      asOfDate: todayStr,
      summary: {
        bucket_0_30: parseFloat(b0to30).toFixed(2),
        bucket_31_60: parseFloat(b31to60).toFixed(2),
        bucket_61_90: parseFloat(b61to90).toFixed(2),
        bucket_91_120: parseFloat(b91to120).toFixed(2),
        bucket_120_plus: parseFloat(b120plus).toFixed(2),
        totalOutstandingPortfolio: (
          parseFloat(b0to30) + parseFloat(b31to60) + parseFloat(b61to90) + parseFloat(b91to120) + parseFloat(b120plus)
        ).toFixed(2)
      },
      lineItems,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }

  /**
   * 10. Collection Performance Report
   */
  async getCollectionPerformance(query = {}) {
    const { from_date, to_date, branch_id, page = 1, limit = 10 } = query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (from_date && to_date) {
      where.collection_date = { [Op.between]: [from_date, to_date] };
    } else if (from_date) {
      where.collection_date = { [Op.gte]: from_date };
    } else if (to_date) {
      where.collection_date = { [Op.lte]: to_date };
    }

    if (branch_id) {
      where['$customer.branch_id$'] = branch_id;
    }

    const [totalTargeted, totalRealized] = await Promise.all([
      Collection.sum('amount_due', { where }) || 0,
      Collection.sum('amount_collected', { where }) || 0
    ]);

    const efficiency = totalTargeted > 0 ? ((totalRealized / totalTargeted) * 100).toFixed(1) + '%' : '0.0%';

    // Breakdown by payment modes
    const paymentModeStats = await Payment.findAll({
      attributes: [
        'payment_mode_id',
        [fn('COUNT', col('Payment.id')), 'transaction_count'],
        [fn('SUM', col('Payment.amount')), 'total_amount']
      ],
      where: {
        payment_status: PAYMENT_STATUS.CONFIRMED
      },
      group: ['Payment.payment_mode_id', 'paymentMode.id'],
      include: [
        { model: PaymentMode, as: 'paymentMode', attributes: ['id', 'name', 'code'] }
      ]
    });

    const paymentModesSummary = paymentModeStats.map(stat => ({
      mode_name: stat.paymentMode?.name || 'Cash',
      mode_code: stat.paymentMode?.code || 'CASH',
      transaction_count: parseInt(stat.dataValues.transaction_count, 10),
      total_amount: parseFloat(stat.dataValues.total_amount || 0).toFixed(2)
    }));

    // Line items by collection case
    const { count, rows } = await Collection.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'full_name', 'customer_code', 'branch_id'],
          include: [{ model: Branch, as: 'branch', attributes: ['id', 'branch_name'] }]
        },
        {
          model: Agent,
          as: 'agent',
          attributes: ['id', 'employee_code'],
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
        }
      ]
    });

    return {
      performanceSummary: {
        totalTargetedAmount: parseFloat(totalTargeted).toFixed(2),
        totalRealizedAmount: parseFloat(totalRealized).toFixed(2),
        overallEfficiency: efficiency,
        paymentModesDistribution: paymentModesSummary
      },
      collections: rows.map(c => ({
        id: c.id,
        customer_name: c.customer?.full_name,
        customer_code: c.customer?.customer_code,
        branch_name: c.customer?.branch?.branch_name,
        agent_code: c.agent?.employee_code,
        agent_name: c.agent?.user?.name,
        collection_date: c.collection_date,
        amount_due: Number(c.amount_due).toFixed(2),
        amount_collected: Number(c.amount_collected).toFixed(2),
        status: c.collection_status
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }
}

module.exports = new AdminService();
