const paymentService = require('./payment.service');
const ApiResponse = require('../../utils/apiResponse');

class PaymentController {
  async createPayment(req, res, next) {
    try {
      const payment = await paymentService.createPayment(req.body, req.user);
      return ApiResponse.created(res, 'Payment recorded successfully', payment);
    } catch (error) {
      return next(error);
    }
  }

  async getAllPayments(req, res, next) {
    try {
      const result = await paymentService.getAllPayments(req.query, req.user);
      return ApiResponse.paginated(res, 'Payments retrieved successfully', result.payments, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getPaymentById(req, res, next) {
    try {
      const payment = await paymentService.getPaymentById(req.params.id, req.user);
      return ApiResponse.success(res, 'Payment details retrieved', payment);
    } catch (error) {
      return next(error);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const payment = await paymentService.confirmPayment(req.params.id, req.user);
      return ApiResponse.success(res, 'Payment confirmed successfully', payment);
    } catch (error) {
      return next(error);
    }
  }

  async reversePayment(req, res, next) {
    try {
      const payment = await paymentService.reversePayment(req.params.id, req.user);
      return ApiResponse.success(res, 'Payment reversed successfully', payment);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new PaymentController();
