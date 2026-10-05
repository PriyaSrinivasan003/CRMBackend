/**
 * Extract and sanitize pagination and sorting parameters from req.query
 * @param {Object} query - Express req.query
 * @param {Array<string>} allowedSortFields - Allowlist of DB columns
 * @param {string} defaultSortField - Default column to sort by
 * @param {string} defaultOrder - Default direction (ASC or DESC)
 */
const getPagination = (query, allowedSortFields = ['created_at'], defaultSortField = 'created_at', defaultOrder = 'DESC') => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requestedLimit = parseInt(query.limit, 10) || 10;
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  let sortBy = defaultSortField;
  if (query.sortBy && allowedSortFields.includes(query.sortBy)) {
    sortBy = query.sortBy;
  }

  let sortOrder = defaultOrder.toUpperCase();
  if (query.sortOrder && ['ASC', 'DESC'].includes(query.sortOrder.toUpperCase())) {
    sortOrder = query.sortOrder.toUpperCase();
  }

  return {
    page,
    limit,
    offset,
    order: [[sortBy, sortOrder]]
  };
};

module.exports = {
  getPagination
};
