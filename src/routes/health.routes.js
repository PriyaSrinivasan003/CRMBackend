const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const ApiResponse = require('../utils/apiResponse');

// Liveness probe
router.get('/health', (req, res) => {
  return ApiResponse.success(res, 'System is healthy', {
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness probe (checks database connection)
router.get('/health/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    return ApiResponse.success(res, 'System and database are ready', {
      status: 'READY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return ApiResponse.error(
      res,
      'Database connection failed',
      'SERVICE_UNAVAILABLE',
      [error.message],
      503
    );
  }
});

module.exports = router;
