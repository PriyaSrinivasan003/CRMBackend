const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../constants/statusCodes');

router.use(authenticate);

router.get('/getAdminDashboard', authorize(ROLES.ADMIN), dashboardController.getAdminDashboard);
router.get('/admin', authorize(ROLES.ADMIN), dashboardController.getAdminDashboard);

router.get('/getSupervisorDashboard', authorize(ROLES.SUPERVISOR), dashboardController.getSupervisorDashboard);
router.get('/supervisor', authorize(ROLES.SUPERVISOR), dashboardController.getSupervisorDashboard);

router.get('/getAgentDashboard', authorize(ROLES.FIELD_AGENT), dashboardController.getAgentDashboard);
router.get('/agent', authorize(ROLES.FIELD_AGENT), dashboardController.getAgentDashboard);

module.exports = router;
