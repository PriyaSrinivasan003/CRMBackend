const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const env = require('../config/env');

// Centralized Error Handling Middleware
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known ApiError instances
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.message, err.code, err.details, err.statusCode);
  }

  // Handle JSON parsing syntax error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return ApiResponse.error(res, 'Malformed JSON in request body', 'INVALID_JSON', [], 400);
  }

  // Handle Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors ? err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    })) : [];
    return ApiResponse.error(res, 'A record with matching unique field already exists', 'DUPLICATE_ENTRY', details, 409);
  }

  // Handle Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return ApiResponse.error(res, 'Referenced parent record does not exist or cannot be modified', 'FOREIGN_KEY_VIOLATION', [], 400);
  }

  // Handle Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors ? err.errors.map(e => ({
      field: e.path,
      message: e.message
    })) : [];
    return ApiResponse.error(res, 'Database validation error', 'DATABASE_VALIDATION_ERROR', details, 422);
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.error(res, 'Invalid authentication token', 'INVALID_TOKEN', [], 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.error(res, 'Authentication token has expired', 'TOKEN_EXPIRED', [], 401);
  }

  // Log unexpected errors
  console.error('[Unhandled Error]:', err);

  // Return generic error in production, detailed in development
  const message = env.NODE_ENV === 'production' 
    ? 'An unexpected internal server error occurred' 
    : err.message || 'Internal Server Error';

  const details = env.NODE_ENV === 'development' && err.stack ? [err.stack] : [];

  return ApiResponse.error(res, message, 'INTERNAL_SERVER_ERROR', details, 500);
};

module.exports = errorHandler;
