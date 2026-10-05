const express = require('express');
const router = express.Router();
const ptpController = require('./ptp.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createPromiseToPaySchema,
  updatePromiseToPaySchema,
  escalatePromiseSchema,
  verifyPaymentSchema,
  updateFollowUpTaskSchema,
  uuidParamSchema
} = require('./ptp.validation');

router.use(authenticate);

// 1. Supervisor Overdue Commitment Alerts
router.get(
  ['/alerts', '/getOverdueAlerts', '/supervisor-alerts'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR),
  ptpController.getSupervisorAlerts
);

// 2. Policy-based Overdue Commitments Check
router.post(
  ['/check-overdue', '/evaluateCommitments'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR),
  ptpController.checkOverdue
);

// 3. Follow-up Tasks endpoints
router.get(
  ['/tasks', '/getAllFollowUpTasks'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  ptpController.getAllFollowUpTasks
);

router.patch(
  ['/tasks/:id', '/updateFollowUpTask/:id'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  validateRequest({ params: uuidParamSchema, body: updateFollowUpTaskSchema }),
  ptpController.updateFollowUpTask
);

// 4. Record new Promise to Pay (PTP)
router.post(
  ['/', '/createPromiseToPay', '/recordPromiseToPay'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  validateRequest({ body: createPromiseToPaySchema }),
  ptpController.createPromiseToPay
);

// 5. Get all Promises to Pay
router.get(
  ['/', '/getAllPromisesToPay'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  ptpController.getAllPromises
);

// 6. Verify payment fulfillment against PTP
router.post(
  ['/:id/verify-payment', '/verifyPromisePayment/:id'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  validateRequest({ params: uuidParamSchema, body: verifyPaymentSchema }),
  ptpController.verifyPayment
);

// 7. Request escalation for PTP
router.post(
  ['/:id/escalate', '/escalatePromise/:id'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  validateRequest({ params: uuidParamSchema, body: escalatePromiseSchema }),
  ptpController.escalatePromise
);

// 8. Get Promise to Pay details by ID
router.get(
  ['/:id', '/getPromiseToPayById/:id'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  validateRequest({ params: uuidParamSchema }),
  ptpController.getPromiseById
);

// 9. Update Promise to Pay
router.patch(
  ['/:id', '/updatePromiseToPay/:id'],
  authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT),
  validateRequest({ params: uuidParamSchema, body: updatePromiseToPaySchema }),
  ptpController.updatePromise
);

module.exports = router;
