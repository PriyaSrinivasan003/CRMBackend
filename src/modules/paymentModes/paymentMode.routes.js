const express = require('express');
const router = express.Router();
const paymentModeController = require('./paymentMode.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createPaymentModeSchema,
  updatePaymentModeSchema,
  updatePaymentModeStatusSchema,
  uuidParamSchema
} = require('./paymentMode.validation');

router.use(authenticate);

// Payment Mode CRUD routes
router.post(['/', '/createPaymentMode'], authorize(ROLES.ADMIN), validateRequest({ body: createPaymentModeSchema }), paymentModeController.createPaymentMode);
router.get(['/', '/getAllPaymentModes'], paymentModeController.getAllPaymentModes);
router.get(['/:id', '/getPaymentModeById/:id'], validateRequest({ params: uuidParamSchema }), paymentModeController.getPaymentModeById);
router.patch(['/:id', '/updatePaymentMode/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updatePaymentModeSchema }), paymentModeController.updatePaymentMode);
router.patch(['/:id/status', '/updatePaymentModeStatus/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updatePaymentModeStatusSchema }), paymentModeController.updatePaymentModeStatus);

module.exports = router;
