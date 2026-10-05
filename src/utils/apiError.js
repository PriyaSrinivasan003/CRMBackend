class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad Request', details = [], code = 'BAD_REQUEST') {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized', details = [], code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code, details);
  }

  static forbidden(message = 'Forbidden', details = [], code = 'FORBIDDEN') {
    return new ApiError(403, message, code, details);
  }

  static notFound(message = 'Resource not found', details = [], code = 'NOT_FOUND') {
    return new ApiError(404, message, code, details);
  }

  static conflict(message = 'Resource conflict', details = [], code = 'CONFLICT') {
    return new ApiError(409, message, code, details);
  }

  static unprocessable(message = 'Validation failed', details = [], code = 'VALIDATION_ERROR') {
    return new ApiError(422, message, code, details);
  }

  static internal(message = 'Internal server error', details = [], code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code, details);
  }
}

module.exports = ApiError;
