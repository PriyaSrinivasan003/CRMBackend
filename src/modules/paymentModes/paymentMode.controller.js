const paymentModeService = require('./paymentMode.service');
const ApiResponse = require('../../utils/apiResponse');

class PaymentModeController {
  async createPaymentMode(req, res, next) {
    try {
      const mode = await paymentModeService.createPaymentMode(req.body);
      return ApiResponse.created(res, 'Payment mode created successfully', mode);
    } catch (error) {
      return next(error);
    }
  }

  async getAllPaymentModes(req, res, next) {
    try {
      const result = await paymentModeService.getAllPaymentModes(req.query);
      return ApiResponse.paginated(res, 'Payment modes retrieved successfully', result.paymentModes, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getPaymentModeById(req, res, next) {
    try {
      const mode = await paymentModeService.getPaymentModeById(req.params.id);
      return ApiResponse.success(res, 'Payment mode details retrieved successfully', mode);
    } catch (error) {
      return next(error);
    }
  }

  async updatePaymentMode(req, res, next) {
    try {
      const mode = await paymentModeService.updatePaymentMode(req.params.id, req.body);
      return ApiResponse.success(res, 'Payment mode updated successfully', mode);
    } catch (error) {
      return next(error);
    }
  }

  async updatePaymentModeStatus(req, res, next) {
    try {
      const mode = await paymentModeService.updatePaymentModeStatus(req.params.id, req.body.status);
      return ApiResponse.success(res, 'Payment mode status updated successfully', mode);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new PaymentModeController();
