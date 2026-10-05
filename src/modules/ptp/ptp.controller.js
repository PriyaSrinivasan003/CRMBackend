const ptpService = require('./ptp.service');
const ApiResponse = require('../../utils/apiResponse');

class PtpController {
  async createPromiseToPay(req, res, next) {
    try {
      const result = await ptpService.createPromiseToPay(req.body, req.user);
      return ApiResponse.created(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async getAllPromises(req, res, next) {
    try {
      const result = await ptpService.getAllPromises(req.query, req.user);
      return ApiResponse.paginated(res, result.promises, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getPromiseById(req, res, next) {
    try {
      const ptp = await ptpService.getPromiseById(req.params.id, req.user);
      return ApiResponse.success(res, ptp);
    } catch (error) {
      return next(error);
    }
  }

  async updatePromise(req, res, next) {
    try {
      const updated = await ptpService.updatePromise(req.params.id, req.body, req.user);
      return ApiResponse.updated(res, updated);
    } catch (error) {
      return next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const result = await ptpService.evaluateCommitmentFulfillment(req.params.id, req.body);
      return ApiResponse.success(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async checkOverdue(req, res, next) {
    try {
      const result = await ptpService.checkAndMarkOverdueCommitments();
      return ApiResponse.success(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async getSupervisorAlerts(req, res, next) {
    try {
      const alerts = await ptpService.getSupervisorOverdueAlerts(req.user, req.query);
      return ApiResponse.success(res, alerts);
    } catch (error) {
      return next(error);
    }
  }

  async escalatePromise(req, res, next) {
    try {
      const result = await ptpService.escalatePromise(req.params.id, req.body, req.user);
      return ApiResponse.success(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async getAllFollowUpTasks(req, res, next) {
    try {
      const result = await ptpService.getAllFollowUpTasks(req.query, req.user);
      return ApiResponse.paginated(res, result.tasks, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async updateFollowUpTask(req, res, next) {
    try {
      const updated = await ptpService.updateFollowUpTask(req.params.id, req.body, req.user);
      return ApiResponse.updated(res, updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new PtpController();
