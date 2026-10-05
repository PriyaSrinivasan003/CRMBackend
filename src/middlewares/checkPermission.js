const ApiError = require('../utils/apiError');
const { RolePermission, Permission } = require('../models');

/**
 * Fine-grained Permission Authorization Middleware
 * Verifies whether the authenticated user's role has the required permission code
 * @param {string} requiredPermissionCode - E.g. 'users:create', 'collections:read'
 */
const checkPermission = (requiredPermissionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required before permission check'));
      }

      const roleId = req.user.role_id || (req.user.role ? req.user.role.id : null);
      if (!roleId) {
        return next(ApiError.forbidden('User has no role assigned'));
      }

      // If user is ADMIN, grant access by default or verify in role_permissions
      if (req.user.role && req.user.role.code === 'ADMIN') {
        return next();
      }

      const hasPermission = await RolePermission.findOne({
        where: { role_id: roleId },
        include: [
          {
            model: Permission,
            as: 'permission',
            where: { code: requiredPermissionCode }
          }
        ]
      });

      if (!hasPermission) {
        return next(
          ApiError.forbidden(
            `Access denied. Missing required permission: '${requiredPermissionCode}'`,
            [],
            'INSUFFICIENT_PERMISSIONS'
          )
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = checkPermission;
