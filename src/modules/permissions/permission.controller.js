const permissionService = require('./permission.service');
const ApiResponse = require('../../utils/apiResponse');

class PermissionController {
  async getAllPermissions(req, res, next) {
    try {
      const result = await permissionService.getAllPermissions(req.query);
      return ApiResponse.paginated(res, 'Permissions retrieved successfully', result.permissions, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getRolePermissions(req, res, next) {
    try {
      const result = await permissionService.getRolePermissions(req.params.roleCode);
      return ApiResponse.success(res, `Permissions for role '${req.params.roleCode}' retrieved successfully`, result);
    } catch (error) {
      return next(error);
    }
  }

  async getAdminPermissions(req, res, next) {
    try {
      const result = await permissionService.getAdminPermissions();
      return ApiResponse.success(res, 'Admin permissions retrieved successfully', result);
    } catch (error) {
      return next(error);
    }
  }

  async getSupervisorPermissions(req, res, next) {
    try {
      const result = await permissionService.getSupervisorPermissions();
      return ApiResponse.success(res, 'Supervisor permissions retrieved successfully', result);
    } catch (error) {
      return next(error);
    }
  }

  async getAgentPermissions(req, res, next) {
    try {
      const result = await permissionService.getAgentPermissions();
      return ApiResponse.success(res, 'Agent permissions retrieved successfully', result);
    } catch (error) {
      return next(error);
    }
  }

  async createPermission(req, res, next) {
    try {
      const permission = await permissionService.createPermission(req.body);
      return ApiResponse.created(res, 'Permission created successfully', permission);
    } catch (error) {
      return next(error);
    }
  }

  async assignPermissionToRole(req, res, next) {
    try {
      const assignment = await permissionService.assignPermissionToRole(req.body.role_id, req.body.permission_id);
      return ApiResponse.created(res, 'Permission assigned to role successfully', assignment);
    } catch (error) {
      return next(error);
    }
  }

  async revokePermissionFromRole(req, res, next) {
    try {
      const result = await permissionService.revokePermissionFromRole(req.body.role_id, req.body.permission_id);
      return ApiResponse.success(res, 'Permission revoked from role successfully', result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new PermissionController();
