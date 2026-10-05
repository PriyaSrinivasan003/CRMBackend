const { Op } = require('sequelize');
const {
  PromiseToPay,
  FollowUpTask,
  Customer,
  User,
  Agent,
  Supervisor,
  Payment,
  Collection,
  CustomerAgentAssignment,
  AgentSupervisorAssignment
} = require('../../models');
const ApiError = require('../../utils/apiError');
const { ROLES } = require('../../constants/statusCodes');

class PtpService {
  /**
   * Record a new Promise to Pay (PTP).
   * NOTE: A PTP is a commitment only. It is NOT a payment and MUST NOT reduce the outstanding balance.
   */
  async createPromiseToPay(data, user) {
    const customer = await Customer.findByPk(data.customer_id);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Role-based scoping for Field Agents
    if (user.role && user.role.code === ROLES.FIELD_AGENT) {
      const agent = await Agent.findOne({ where: { user_id: user.id } });
      if (agent) {
        const assignment = await CustomerAgentAssignment.findOne({
          where: {
            customer_id: customer.id,
            agent_id: agent.id,
            status: 1
          }
        });
        if (!assignment) {
          throw ApiError.forbidden('You are not assigned to record commitments for this customer');
        }
      }
    }

    // Record the Promise to Pay with status OPEN
    const ptp = await PromiseToPay.create({
      customer_id: data.customer_id,
      collection_case_id: data.collection_case_id || null,
      promised_amount: data.promised_amount,
      promised_date: data.promised_date,
      status: 'OPEN',
      recorded_by: user.id,
      recorded_at: new Date(),
      remarks: data.remarks || null
    });

    // Automatically schedule a follow-up task as per workflow
    const followUpDate = data.action_date || data.promised_date;
    const assignedEmployee = data.assigned_employee_id || user.id;

    const followUpTask = await FollowUpTask.create({
      promise_id: ptp.id,
      customer_id: ptp.customer_id,
      action_date: followUpDate,
      assigned_employee_id: assignedEmployee,
      task_type: 'PTP_FOLLOWUP',
      completion_status: 'PENDING',
      outcome: null,
      remarks: data.remarks ? `Automated follow-up for PTP: ${data.remarks}` : 'Automated follow-up scheduled for Promise to Pay'
    });

    return {
      ...ptp.toJSON(),
      follow_up_task: followUpTask.toJSON()
    };
  }

  /**
   * Get all Promises to Pay with filtering, pagination, and role-based access scoping.
   */
  async getAllPromises(query = {}, user = null) {
    const {
      page = 1,
      limit = 10,
      status,
      customer_id,
      from_date,
      to_date,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = query;

    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (status) {
      where.status = status;
    }
    if (customer_id) {
      where.customer_id = customer_id;
    }
    if (from_date && to_date) {
      where.promised_date = { [Op.between]: [from_date, to_date] };
    } else if (from_date) {
      where.promised_date = { [Op.gte]: from_date };
    } else if (to_date) {
      where.promised_date = { [Op.lte]: to_date };
    }

    // Apply role-based scoping
    if (user && user.role) {
      if (user.role.code === ROLES.FIELD_AGENT) {
        const agent = await Agent.findOne({ where: { user_id: user.id } });
        if (agent) {
          const assignments = await CustomerAgentAssignment.findAll({
            where: { agent_id: agent.id },
            attributes: ['customer_id']
          });
          const assignedCustomerIds = assignments.map(a => a.customer_id);
          where[Op.or] = [
            { recorded_by: user.id },
            { customer_id: { [Op.in]: assignedCustomerIds } }
          ];
        } else {
          where.recorded_by = user.id;
        }
      } else if (user.role.code === ROLES.SUPERVISOR) {
        const supervisor = await Supervisor.findOne({ where: { user_id: user.id } });
        if (supervisor) {
          const team = await AgentSupervisorAssignment.findAll({
            where: { supervisor_id: supervisor.id },
            attributes: ['agent_id']
          });
          const teamAgentIds = team.map(t => t.agent_id);
          const teamAgents = await Agent.findAll({
            where: { id: { [Op.in]: teamAgentIds } },
            attributes: ['user_id', 'id']
          });
          const teamUserIds = teamAgents.map(a => a.user_id);
          teamUserIds.push(user.id);

          const customerAssignments = await CustomerAgentAssignment.findAll({
            where: { agent_id: { [Op.in]: teamAgentIds } },
            attributes: ['customer_id']
          });
          const teamCustomerIds = customerAssignments.map(c => c.customer_id);

          where[Op.or] = [
            { recorded_by: { [Op.in]: teamUserIds } },
            { customer_id: { [Op.in]: teamCustomerIds } }
          ];
        }
      }
    }

    const { count, rows } = await PromiseToPay.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'customer_code', 'mobile'] },
        { model: User, as: 'recordedByUser', attributes: ['id', 'name', 'email'] },
        { model: FollowUpTask, as: 'followUpTasks' }
      ]
    });

    return {
      promises: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }

  /**
   * Get single Promise to Pay details by ID.
   */
  async getPromiseById(id, user = null) {
    const ptp = await PromiseToPay.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: User, as: 'recordedByUser', attributes: ['id', 'name', 'email'] },
        { model: FollowUpTask, as: 'followUpTasks' },
        { model: Collection, as: 'collectionCase' }
      ]
    });

    if (!ptp) {
      throw ApiError.notFound('Promise to pay not found');
    }

    return ptp;
  }

  /**
   * Update Promise to Pay.
   */
  async updatePromise(id, data, user = null) {
    const ptp = await PromiseToPay.findByPk(id);
    if (!ptp) {
      throw ApiError.notFound('Promise to pay not found');
    }

    if (data.status && data.status !== ptp.status) {
      ptp.status = data.status;
      if (data.status === 'KEPT' || data.status === 'BROKEN' || data.status === 'CANCELLED') {
        ptp.resolved_at = new Date();
      }
    }

    if (data.promised_amount !== undefined) ptp.promised_amount = data.promised_amount;
    if (data.promised_date !== undefined) ptp.promised_date = data.promised_date;
    if (data.remarks !== undefined) ptp.remarks = data.remarks;

    await ptp.save();
    return ptp;
  }

  /**
   * Evaluate a commitment against verified payments.
   * "A verified payment may fulfill the commitment."
   * "A partial payment should not automatically mark a promise fully kept unless the applicable policy explicitly permits that."
   */
  async evaluateCommitmentFulfillment(id, options = {}) {
    const ptp = await PromiseToPay.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        { model: FollowUpTask, as: 'followUpTasks' }
      ]
    });

    if (!ptp) {
      throw ApiError.notFound('Promise to pay not found');
    }

    if (ptp.status !== 'OPEN') {
      return {
        ptp,
        already_resolved: true,
        message: `Promise is already ${ptp.status}`
      };
    }

    // Query all verified payments recorded for this customer from recorded_at onwards
    const payments = await Payment.findAll({
      where: {
        customer_id: ptp.customer_id,
        created_at: {
          [Op.gte]: ptp.recorded_at
        },
        payment_status: {
          [Op.ne]: 2 // Exclude reversed / cancelled payments (0=Pending, 1=Confirmed)
        }
      }
    });

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const promisedAmount = Number(ptp.promised_amount);
    const allowPartial = options.allow_partial === true;

    let isKept = false;
    let outcome = null;

    if (totalPaid >= promisedAmount) {
      // Fully fulfilled
      isKept = true;
      outcome = 'PTP_KEPT';
      ptp.status = 'KEPT';
      ptp.resolved_at = new Date();
      await ptp.save();
    } else if (totalPaid > 0 && allowPartial) {
      // Partial payment allowed by explicit policy
      isKept = true;
      outcome = 'PTP_KEPT_PARTIAL';
      ptp.status = 'KEPT';
      ptp.resolved_at = new Date();
      await ptp.save();
    } else if (totalPaid > 0 && !allowPartial) {
      // Partial payment received but policy does NOT permit full fulfillment
      outcome = 'PARTIAL_PAYMENT_RECEIVED';
    }

    // Update associated follow-up tasks
    if (isKept) {
      await FollowUpTask.update(
        {
          completion_status: 'COMPLETED',
          outcome,
          completed_at: new Date()
        },
        {
          where: {
            promise_id: ptp.id,
            completion_status: 'PENDING'
          }
        }
      );
    } else if (totalPaid > 0) {
      await FollowUpTask.update(
        {
          remarks: `Partial payment of ${totalPaid.toFixed(2)} received towards commitment of ${promisedAmount.toFixed(2)}`
        },
        {
          where: {
            promise_id: ptp.id,
            completion_status: 'PENDING'
          }
        }
      );
    }

    return {
      ptp,
      total_paid: totalPaid,
      promised_amount: promisedAmount,
      is_kept: isKept,
      partial_payment: totalPaid > 0 && totalPaid < promisedAmount,
      outcome: outcome || 'NO_PAYMENT'
    };
  }

  /**
   * Check and mark overdue commitments as BROKEN.
   * "If the commitment date passes without the expected payment, mark it as potentially broken according to policy."
   */
  async checkAndMarkOverdueCommitments() {
    const today = new Date().toISOString().split('T')[0];

    // Find all OPEN commitments where promised_date is strictly in the past
    const overduePromises = await PromiseToPay.findAll({
      where: {
        status: 'OPEN',
        promised_date: {
          [Op.lt]: today
        }
      }
    });

    const brokenPromises = [];

    for (const ptp of overduePromises) {
      // Check if payments were made that might keep it
      const evalResult = await this.evaluateCommitmentFulfillment(ptp.id, { allow_partial: false });

      if (!evalResult.is_kept) {
        ptp.status = 'BROKEN';
        ptp.resolved_at = new Date();
        await ptp.save();

        await FollowUpTask.update(
          {
            completion_status: 'OVERDUE',
            outcome: 'PTP_BROKEN',
            remarks: 'Promise broken: commitment date passed without expected payment'
          },
          {
            where: {
              promise_id: ptp.id,
              completion_status: 'PENDING'
            }
          }
        );

        brokenPromises.push(ptp);
      }
    }

    return {
      checked_count: overduePromises.length,
      broken_count: brokenPromises.length,
      broken_promises: brokenPromises
    };
  }

  /**
   * Supervisor receives overdue commitment alerts.
   * "Supervisor receives an overdue commitment alert."
   */
  async getSupervisorOverdueAlerts(user, query = {}) {
    const today = new Date().toISOString().split('T')[0];

    // Find broken commitments or open commitments whose promised_date has passed
    const where = {
      [Op.or]: [
        { status: 'BROKEN' },
        {
          status: 'OPEN',
          promised_date: { [Op.lt]: today }
        }
      ]
    };

    // Scoping for Supervisor
    if (user.role && user.role.code === ROLES.SUPERVISOR) {
      const supervisor = await Supervisor.findOne({ where: { user_id: user.id } });
      if (supervisor) {
        const team = await AgentSupervisorAssignment.findAll({
          where: { supervisor_id: supervisor.id },
          attributes: ['agent_id']
        });
        const teamAgentIds = team.map(t => t.agent_id);
        const teamAgents = await Agent.findAll({
          where: { id: { [Op.in]: teamAgentIds } },
          attributes: ['user_id', 'id']
        });
        const teamUserIds = teamAgents.map(a => a.user_id);

        const customerAssignments = await CustomerAgentAssignment.findAll({
          where: { agent_id: { [Op.in]: teamAgentIds } },
          attributes: ['customer_id']
        });
        const teamCustomerIds = customerAssignments.map(c => c.customer_id);

        where[Op.and] = [
          {
            [Op.or]: [
              { recorded_by: { [Op.in]: teamUserIds } },
              { customer_id: { [Op.in]: teamCustomerIds } }
            ]
          }
        ];
      }
    }

    const alerts = await PromiseToPay.findAll({
      where,
      order: [['promised_date', 'ASC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'customer_code', 'mobile'] },
        { model: User, as: 'recordedByUser', attributes: ['id', 'name', 'email'] },
        { model: FollowUpTask, as: 'followUpTasks' }
      ]
    });

    const formattedAlerts = alerts.map(ptp => {
      const promisedDate = new Date(ptp.promised_date);
      const diffTime = Math.abs(new Date() - promisedDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: ptp.id,
        customer_id: ptp.customer_id,
        customer_name: ptp.customer ? ptp.customer.full_name : 'Unknown',
        customer_code: ptp.customer?.customer_code,
        promised_amount: ptp.promised_amount,
        promised_date: ptp.promised_date,
        days_overdue: diffDays,
        status: ptp.status,
        recorded_by_name: ptp.recordedByUser?.name,
        alert_severity: diffDays > 7 ? 'CRITICAL' : (diffDays > 3 ? 'HIGH' : 'MEDIUM'),
        follow_up_tasks: ptp.followUpTasks
      };
    });

    return formattedAlerts;
  }

  /**
   * Agent continues follow-up or requests escalation.
   * "Agent continues follow-up or requests escalation."
   */
  async escalatePromise(id, { reason }, user) {
    const ptp = await PromiseToPay.findByPk(id, {
      include: [{ model: FollowUpTask, as: 'followUpTasks' }]
    });

    if (!ptp) {
      throw ApiError.notFound('Promise to pay not found');
    }

    // Update follow up task to ESCALATED
    await FollowUpTask.update(
      {
        outcome: 'ESCALATED',
        completion_status: 'OVERDUE',
        remarks: `Escalated by ${user.name}: ${reason}`
      },
      {
        where: {
          promise_id: ptp.id,
          completion_status: ['PENDING', 'OVERDUE']
        }
      }
    );

    // Add remark on PTP
    ptp.remarks = ptp.remarks ? `${ptp.remarks} | Escalated: ${reason}` : `Escalated: ${reason}`;
    await ptp.save();

    const updatedTasks = await FollowUpTask.findAll({ where: { promise_id: ptp.id } });

    return {
      ptp,
      escalated_by: user.id,
      escalation_reason: reason,
      escalated_at: new Date(),
      follow_up_tasks: updatedTasks
    };
  }

  /**
   * Get all Follow-Up tasks with filtering and pagination.
   */
  async getAllFollowUpTasks(query = {}, user = null) {
    const {
      page = 1,
      limit = 10,
      completion_status,
      task_type,
      assigned_employee_id,
      customer_id,
      sortBy = 'action_date',
      sortOrder = 'ASC'
    } = query;

    const offset = (Number(page) - 1) * Number(limit);
    const where = {};

    if (completion_status) where.completion_status = completion_status;
    if (task_type) where.task_type = task_type;
    if (assigned_employee_id) where.assigned_employee_id = assigned_employee_id;
    if (customer_id) where.customer_id = customer_id;

    if (user && user.role && user.role.code === ROLES.FIELD_AGENT) {
      where.assigned_employee_id = user.id;
    }

    const { count, rows } = await FollowUpTask.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'full_name', 'customer_code', 'mobile'] },
        { model: PromiseToPay, as: 'promise' },
        { model: User, as: 'assignedEmployee', attributes: ['id', 'name', 'email'] }
      ]
    });

    return {
      tasks: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords: count
      }
    };
  }

  /**
   * Update follow-up task action, completion, or outcome.
   */
  async updateFollowUpTask(id, data, user = null) {
    const task = await FollowUpTask.findByPk(id);
    if (!task) {
      throw ApiError.notFound('Follow-up task not found');
    }

    if (data.completion_status) task.completion_status = data.completion_status;
    if (data.completion_status === 'COMPLETED' && !task.completed_at) {
      task.completed_at = new Date();
    }
    if (data.outcome !== undefined) task.outcome = data.outcome;
    if (data.remarks !== undefined) task.remarks = data.remarks;
    if (data.action_date !== undefined) task.action_date = data.action_date;

    await task.save();
    return task;
  }
}

module.exports = new PtpService();
