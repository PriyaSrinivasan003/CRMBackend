const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createUserSchema,
  updateUserStatusSchema,
  uuidParamSchema
} = require('./admin.validation');

// Require authentication and ADMIN role for all admin routes
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// 1. Organization Summary Dashboard
router.get(['/dashboard', '/getAdminDashboard'], adminController.getDashboard);

// 2. User Search, Creation & Status Management
router.get(['/users', '/getAllAdminUsers'], adminController.getUsers);
router.post(['/users', '/createAdminUser'], validateRequest({ body: createUserSchema }), adminController.createUser);
router.patch(
  ['/users/:id/status', '/updateAdminUserStatus/:id'],
  validateRequest({ params: uuidParamSchema, body: updateUserStatusSchema }),
  adminController.updateUserStatus
);

// 3. Branch Management Overview
router.get(['/branches', '/getAllAdminBranches'], adminController.getBranches);

// 4. Area Management Overview
router.get(['/areas', '/getAllAdminAreas'], adminController.getAreas);

// 5. Audit Event Search
router.get(['/audit-logs', '/getAuditLogs'], adminController.getAuditLogs);

// 6. Financial Reconciliation Exceptions
router.get(['/reconciliation', '/getReconciliationExceptions'], adminController.getReconciliation);

// 7. Reports
router.get(['/reports/aging', '/getAgingReport'], adminController.getAgingReport);
router.get(['/reports/collections', '/getCollectionPerformanceReport'], adminController.getCollectionsReport);

module.exports = router;
