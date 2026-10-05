const dashboardService = require('./dashboard.service');
const ApiResponse = require('../../utils/apiResponse');

class DashboardController {
  async getAdminDashboard(req, res, next) {
    try {
      const data = await dashboardService.getAdminDashboard();
      return ApiResponse.success(res, 'Administrator dashboard statistics retrieved', data);
    } catch (error) {
      return next(error);
    }
  }

  async getSupervisorDashboard(req, res, next) {
    try {
      const data = await dashboardService.getSupervisorDashboard(req.user);
      return ApiResponse.success(res, 'Supervisor dashboard statistics retrieved', data);
    } catch (error) {
      return next(error);
    }
  }

  async getAgentDashboard(req, res, next) {
    try {
      const data = await dashboardService.getAgentDashboard(req.user);
      return ApiResponse.success(res, 'Agent dashboard statistics retrieved', data);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new DashboardController();
