const { ZodError } = require('zod');
const ApiResponse = require('../utils/apiResponse');

/**
 * Higher-order middleware to validate incoming request segments using Zod
 * @param {Object} schemas - { body, query, params }
 */
const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          rule: issue.code
        }));
        return ApiResponse.error(
          res,
          'Validation failed for one or more fields',
          'VALIDATION_ERROR',
          details,
          422
        );
      }
      return next(error);
    }
  };
};

module.exports = validateRequest;
