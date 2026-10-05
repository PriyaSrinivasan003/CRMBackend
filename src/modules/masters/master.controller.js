const masterService = require('./master.service');
const ApiResponse = require('../../utils/apiResponse');

class MasterController {
  async getAllMasters(req, res, next) {
    try {
      const data = await masterService.getAllMasters(req.query);
      return ApiResponse.success(res, 'Active master tables loaded successfully', data);
    } catch (error) {
      return next(error);
    }
  }

  async getActiveBranches(req, res, next) {
    try {
      const branches = await masterService.getActiveBranches(req.query);
      return ApiResponse.success(res, 'Active branches loaded successfully', branches);
    } catch (error) {
      return next(error);
    }
  }

  async getActiveAreas(req, res, next) {
    try {
      const areas = await masterService.getActiveAreas(req.query);
      return ApiResponse.success(res, 'Active areas loaded successfully', areas);
    } catch (error) {
      return next(error);
    }
  }

  async getActivePaymentModes(req, res, next) {
    try {
      const modes = await masterService.getActivePaymentModes();
      return ApiResponse.success(res, 'Active payment modes loaded successfully', modes);
    } catch (error) {
      return next(error);
    }
  }

  async getActiveOrganizations(req, res, next) {
    try {
      const organizations = await masterService.getActiveOrganizations();
      return ApiResponse.success(res, 'Active organizations loaded successfully', organizations);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new MasterController();
