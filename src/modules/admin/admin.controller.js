const adminService = require('./admin.service');
const ApiResponse = require('../../utils/apiResponse');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const result = await adminService.getOrganizationSummary();
      return ApiResponse.success(res, 'dashboard', result);
    } catch (error) {
      return next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      return ApiResponse.paginated(res, 'usersList', result.users, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const result = await adminService.createUser(req.body, req.user.id);
      return ApiResponse.created(res, 'userCreated', result);
    } catch (error) {
      return next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const result = await adminService.updateUserStatus(req.params.id, req.body.status, req.user.id);
      return ApiResponse.updated(res, 'userStatusUpdated', result);
    } catch (error) {
      return next(error);
    }
  }

  async getBranches(req, res, next) {
    try {
      const result = await adminService.getBranches(req.query);
      return ApiResponse.paginated(res, 'branchesList', result.branches, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getAreas(req, res, next) {
    try {
      const result = await adminService.getAreas(req.query);
      return ApiResponse.paginated(res, 'areasList', result.areas, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const result = await adminService.getAuditLogs(req.query);
      return ApiResponse.paginated(res, 'auditLogs', result.auditLogs, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getReconciliation(req, res, next) {
    try {
      const result = await adminService.getReconciliationExceptions(req.query);
      return ApiResponse.success(res, 'reconciliation', result);
    } catch (error) {
      return next(error);
    }
  }

  async getAgingReport(req, res, next) {
    try {
      const result = await adminService.getAgingReport(req.query);
      return ApiResponse.success(res, 'agingReport', result);
    } catch (error) {
      return next(error);
    }
  }

  async getCollectionsReport(req, res, next) {
    try {
      const result = await adminService.getCollectionPerformance(req.query);
      return ApiResponse.success(res, 'collectionsReport', result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AdminController();
