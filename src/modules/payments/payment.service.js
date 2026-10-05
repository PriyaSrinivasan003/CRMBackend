const { Op } = require('sequelize');
const {
  Payment,
  PaymentAllocation,
  PaymentMode,
  Collection,
  Customer,
  Agent,
  User,
  Branch,
  Supervisor,
  sequelize
} = require('../../models');
const { ROLES, PAYMENT_STATUS, COLLECTION_STATUS, AGENT_STATUS } = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class PaymentService {
  /**
   * Helper to recalculate collection amount_collected and collection_status
   */
  async _syncCollectionTotals(collectionId, transaction) {
    const collection = await Collection.findByPk(collectionId, { transaction });
    if (!collection) return null;

    // Only confirmed payments are counted towards collected money!
    const totalConfirmed = await Payment.sum('amount', {
      where: {
        collection_id: collectionId,
        payment_status: PAYMENT_STATUS.CONFIRMED
      },
      transaction
    }) || 0;

    const amountCollected = parseFloat(totalConfirmed);
    const amountDue = parseFloat(collection.amount_due);

    let newStatus = COLLECTION_STATUS.PENDING;
    if (amountCollected >= amountDue) {
      newStatus = COLLECTION_STATUS.FULLY_COLLECTED;
    } else if (amountCollected > 0) {
      newStatus = COLLECTION_STATUS.PARTIALLY_COLLECTED;
    }

    await collection.update(
      {
        amount_collected: amountCollected,
        collection_status: newStatus
      },
      { transaction }
    );

    return collection;
  }

  /**
   * Record a payment
   */
  async createPayment(data, requestingUser) {
    const {
      collection_id,
      receipt_number: rawReceipt,
      amount,
      payment_method,
      transaction_reference,
      payment_date,
      collected_at,
      installment_id,
      allocations,
      payment_status = PAYMENT_STATUS.CONFIRMED,
      notes
    } = data;

    const collection = await Collection.findByPk(collection_id);
    if (!collection) {
      throw ApiError.badRequest(`Collection record '${collection_id}' not found`);
    }

    let agentId = collection.agent_id;
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (!requestingUser.agent || requestingUser.agent.id !== collection.agent_id) {
        throw ApiError.forbidden('You can only record payments for your own collections');
      }
      agentId = requestingUser.agent.id;
    }

    // Verify agent active
    const agent = await Agent.findByPk(agentId);
    if (!agent || agent.status !== AGENT_STATUS.ACTIVE) {
      throw ApiError.forbidden('Inactive or terminated agents cannot record payments');
    }

    // Validate allocations total against payment amount if allocations provided
    if (allocations && allocations.length > 0) {
      const totalAllocated = allocations.reduce((sum, item) => sum + Number(item.allocated_amount), 0);
      if (Math.abs(totalAllocated - Number(amount)) > 0.009) {
        throw ApiError.badRequest(
          `Total allocated amount (${totalAllocated.toFixed(2)}) must equal payment amount (${Number(amount).toFixed(2)})`
        );
      }
    }

    // Generate receipt number if omitted
    const receipt_number = rawReceipt || `RCP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // Duplicate check on receipt number
    const existingReceipt = await Payment.findOne({ where: { receipt_number } });
    if (existingReceipt) {
      throw ApiError.conflict(`Payment with receipt number '${receipt_number}' already exists`);
    }

    // Duplicate check on transaction reference if provided (e.g. UPI/bank ref)
    if (transaction_reference) {
      const existingRef = await Payment.findOne({ where: { transaction_reference } });
      if (existingRef) {
        throw ApiError.conflict(`A payment with transaction reference '${transaction_reference}' has already been processed`);
      }
    }

    // Dynamic Payment Mode Lookup from Table
    let resolvedPaymentModeId = data.payment_mode_id || null;
    let numericMethod = typeof payment_method === 'number' ? payment_method : 0;

    if (data.payment_mode_id) {
      const mode = await PaymentMode.findByPk(data.payment_mode_id);
      if (!mode || mode.status !== 1) {
        throw ApiError.badRequest(`Payment mode '${data.payment_mode_id}' not found or is inactive`);
      }
      resolvedPaymentModeId = mode.id;
    } else if (data.payment_mode) {
      const mode = await PaymentMode.findOne({ where: { code: data.payment_mode.toUpperCase(), status: 1 } });
      if (!mode) {
        throw ApiError.badRequest(`Payment mode code '${data.payment_mode}' not found or is inactive`);
      }
      resolvedPaymentModeId = mode.id;
    } else if (payment_method !== undefined) {
      const codeMap = { 0: 'CASH', 1: 'UPI', 2: 'BANK_TRANSFER', 3: 'OTHER' };
      const targetCode = typeof payment_method === 'string' ? payment_method.toUpperCase() : codeMap[payment_method];
      if (targetCode) {
        const mode = await PaymentMode.findOne({ where: { code: targetCode, status: 1 } });
        if (mode) {
          resolvedPaymentModeId = mode.id;
        }
      }
    }

    return sequelize.transaction(async (t) => {
      const payment = await Payment.create(
        {
          collection_id,
          customer_id: collection.customer_id,
          agent_id: agentId,
          receipt_number,
          amount,
          payment_method: numericMethod,
          payment_mode_id: resolvedPaymentModeId,
          transaction_reference: transaction_reference || null,
          payment_date: payment_date || new Date(),
          collected_at: collected_at || payment_date || new Date(),
          payment_status,
          notes: notes || null,
          created_by: requestingUser.id
        },
        { transaction: t }
      );

      // Create payment allocation(s)
      if (allocations && allocations.length > 0) {
        const allocationRecords = allocations.map((alloc) => ({
          payment_id: payment.id,
          installment_id: alloc.installment_id || null,
          allocated_amount: alloc.allocated_amount
        }));
        await PaymentAllocation.bulkCreate(allocationRecords, { transaction: t });
      } else {
        await PaymentAllocation.create(
          {
            payment_id: payment.id,
            installment_id: installment_id || null,
            allocated_amount: amount
          },
          { transaction: t }
        );
      }

      // If payment is confirmed, update collection totals atomically
      if (payment_status === PAYMENT_STATUS.CONFIRMED) {
        await this._syncCollectionTotals(collection_id, t);
      }

      await payment.reload({
        include: [
          { model: PaymentAllocation, as: 'allocations' },
          { model: PaymentMode, as: 'paymentMode' }
        ],
        transaction: t
      });

      return payment;
    });
  }

  /**
   * Confirm a pending payment
   */
  async confirmPayment(id, requestingUser) {
    const payment = await Payment.findByPk(id);
    if (!payment) {
      throw ApiError.notFound(`Payment with id '${id}' not found`);
    }

    if (payment.payment_status === PAYMENT_STATUS.CONFIRMED) {
      return payment; // Idempotent: already confirmed
    }

    if (payment.payment_status === PAYMENT_STATUS.REVERSED) {
      throw ApiError.badRequest('Cannot confirm a reversed payment transaction');
    }

    return sequelize.transaction(async (t) => {
      await payment.update({ payment_status: PAYMENT_STATUS.CONFIRMED }, { transaction: t });
      await this._syncCollectionTotals(payment.collection_id, t);
      return payment;
    });
  }

  /**
   * Reverse an existing confirmed payment
   */
  async reversePayment(id, requestingUser) {
    const payment = await Payment.findByPk(id);
    if (!payment) {
      throw ApiError.notFound(`Payment with id '${id}' not found`);
    }

    if (payment.payment_status === PAYMENT_STATUS.REVERSED) {
      return payment; // Idempotent
    }

    return sequelize.transaction(async (t) => {
      await payment.update({ payment_status: PAYMENT_STATUS.REVERSED }, { transaction: t });
      // Re-sync collection totals without this payment
      await this._syncCollectionTotals(payment.collection_id, t);
      return payment;
    });
  }

  /**
   * Get all payments with role scoping, filtering, and pagination
   */
  async getAllPayments(query, requestingUser) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['payment_date', 'amount', 'payment_status', 'payment_method', 'created_at'],
      'payment_date',
      'DESC'
    );

    const where = {};
    if (query.payment_status !== undefined) {
      where.payment_status = parseInt(query.payment_status, 10);
    }
    if (query.payment_method !== undefined) {
      where.payment_method = parseInt(query.payment_method, 10);
    }
    if (query.collection_id) {
      where.collection_id = query.collection_id;
    }
    if (query.customer_id) {
      where.customer_id = query.customer_id;
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

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'customer_code', 'full_name', 'mobile']
        },
        agentInclude,
        {
          model: Collection,
          as: 'collection',
          attributes: ['id', 'amount_due', 'amount_collected', 'collection_status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: PaymentAllocation,
          as: 'allocations'
        },
        {
          model: PaymentMode,
          as: 'paymentMode',
          attributes: ['id', 'code', 'name', 'status']
        }
      ],
      limit,
      offset,
      order,
      distinct: true
    });

    return {
      payments: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  /**
   * Get single payment by ID
   */
  async getPaymentById(id, requestingUser) {
    const payment = await Payment.findByPk(id, {
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
          model: Collection,
          as: 'collection'
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        },
        {
          model: PaymentAllocation,
          as: 'allocations'
        },
        {
          model: PaymentMode,
          as: 'paymentMode',
          attributes: ['id', 'code', 'name', 'status']
        }
      ]
    });

    if (!payment) {
      throw ApiError.notFound(`Payment with id '${id}' not found`);
    }

    // Role ownership check
    if (requestingUser.role.code === ROLES.FIELD_AGENT) {
      if (payment.agent_id !== requestingUser.agent?.id) {
        throw ApiError.forbidden('You are not authorized to view payments recorded by another agent');
      }
    } else if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (payment.agent?.supervisor_id !== requestingUser.supervisor?.id) {
        throw ApiError.forbidden('You are not authorized to view payments from agents outside your team');
      }
    }

    return payment;
  }
}

module.exports = new PaymentService();
