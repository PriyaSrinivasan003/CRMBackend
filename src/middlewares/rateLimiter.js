const rateLimit = require('express-rate-limit');
const ApiResponse = require('../utils/apiResponse');

const createLimiter = (windowMinutes, maxRequests, message) => {
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return ApiResponse.error(
        res,
        message || 'Too many requests from this IP. Please try again later.',
        'RATE_LIMIT_EXCEEDED',
        [],
        429
      );
    }
  });
};

const loginLimiter = createLimiter(15, 15, 'Too many login attempts. Please try again in 15 minutes.');
const authLimiter = createLimiter(15, 30, 'Too many authentication requests. Please try again later.');
const apiLimiter = createLimiter(15, 300, 'Too many API requests. Please slow down.');

module.exports = {
  loginLimiter,
  authLimiter,
  apiLimiter
};
