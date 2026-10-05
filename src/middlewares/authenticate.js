const { verifyAccessToken } = require('../utils/jwt');
const { User, Role, Supervisor, Agent } = require('../models');
const { USER_STATUS } = require('../constants/statusCodes');
const ApiError = require('../utils/apiError');

/**
 * Authentication Middleware: validates access token and user state
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication token missing or invalid format', [], 'MISSING_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Authentication token has expired', [], 'TOKEN_EXPIRED');
      }
      throw ApiError.unauthorized('Invalid authentication token', [], 'INVALID_TOKEN');
    }

    if (!decoded || !decoded.id) {
      throw ApiError.unauthorized('Malformed token payload', [], 'INVALID_TOKEN');
    }

    // Load user with roles and profile references
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: Role, as: 'role' },
        { model: Supervisor, as: 'supervisor' },
        { model: Agent, as: 'agent' }
      ]
    });

    if (!user) {
      throw ApiError.unauthorized('User account no longer exists', [], 'USER_NOT_FOUND');
    }

    // Check account status
    if (user.status !== USER_STATUS.ACTIVE) {
      let statusDesc = 'inactive';
      if (user.status === USER_STATUS.SUSPENDED) statusDesc = 'suspended';
      if (user.status === USER_STATUS.LOCKED) statusDesc = 'locked';
      throw ApiError.unauthorized(`Account is ${statusDesc}. Please contact an administrator.`, [], 'ACCOUNT_LOCKED');
    }

    // Attach authenticated user to request
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = authenticate;
