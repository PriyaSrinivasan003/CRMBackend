const { Op } = require('sequelize');
const { PaymentMode } = require('../../models');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class PaymentModeService {
  async createPaymentMode(data) {
    const { code, name, status } = data;

    const existing = await PaymentMode.findOne({ where: { code } });
    if (existing) {
      throw ApiError.conflict(`Payment mode with code '${code}' already exists`);
    }

    return PaymentMode.create({
      code,
      name,
      status: status !== undefined ? status : 1
    });
  }

  async getAllPaymentModes(query = {}) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['code', 'name', 'status', 'created_at'],
      'created_at',
      'ASC'
    );

    const where = {};
    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }

    if (query.search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${query.search}%` } },
        { name: { [Op.like]: `%${query.search}%` } }
      ];
    }

    const { count, rows } = await PaymentMode.findAndCountAll({
      where,
      limit,
      offset,
      order
    });

    return {
      paymentModes: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getPaymentModeById(id) {
    const paymentMode = await PaymentMode.findByPk(id);
    if (!paymentMode) {
      throw ApiError.notFound(`Payment mode with id '${id}' not found`);
    }
    return paymentMode;
  }

  async updatePaymentMode(id, data) {
    const paymentMode = await PaymentMode.findByPk(id);
    if (!paymentMode) {
      throw ApiError.notFound(`Payment mode with id '${id}' not found`);
    }

    if (data.code && data.code !== paymentMode.code) {
      const existing = await PaymentMode.findOne({ where: { code: data.code } });
      if (existing) {
        throw ApiError.conflict(`Payment mode with code '${data.code}' already exists`);
      }
    }

    return paymentMode.update(data);
  }

  async updatePaymentModeStatus(id, status) {
    const paymentMode = await PaymentMode.findByPk(id);
    if (!paymentMode) {
      throw ApiError.notFound(`Payment mode with id '${id}' not found`);
    }

    return paymentMode.update({ status });
  }
}

module.exports = new PaymentModeService();
