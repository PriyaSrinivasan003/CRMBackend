const ApiResponse = require('../utils/apiResponse');

const notFound = (req, res) => {
  return ApiResponse.error(
    res,
    `Resource not found: ${req.method} ${req.originalUrl}`,
    'NOT_FOUND',
    [],
    404
  );
};

module.exports = notFound;
