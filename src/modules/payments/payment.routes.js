const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const { createPaymentSchema, uuidParamSchema } = require('./payment.validation');

router.use(authenticate);

router.post(['/', '/createPayment'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ body: createPaymentSchema }), paymentController.createPayment);
router.get(['/', '/getAllPayments'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), paymentController.getAllPayments);
router.get(['/:id', '/getPaymentById/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), paymentController.getPaymentById);

// Payment confirmation (Admin or Supervisor)
router.post(['/:id/confirm', '/confirmPayment/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ params: uuidParamSchema }), paymentController.confirmPayment);

// Payment reversal (Admin only)
router.post(['/:id/reverse', '/reversePayment/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema }), paymentController.reversePayment);

module.exports = router;
