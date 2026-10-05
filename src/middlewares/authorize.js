const ApiError = require('../utils/apiError');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if req.user has one of the allowed role codes
 * @param  {...string} allowedRoles - E.g. 'ADMIN', 'SUPERVISOR', 'FIELD_AGENT'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required before authorization check'));
    }

    const userRoleCode = req.user.role ? req.user.role.code : null;

    if (!userRoleCode || !allowedRoles.includes(userRoleCode)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${userRoleCode || 'UNKNOWN'}' is not authorized to perform this action.`,
          [],
          'FORBIDDEN'
        )
      );
    }

    return next();
  };
};

module.exports = authorize;
