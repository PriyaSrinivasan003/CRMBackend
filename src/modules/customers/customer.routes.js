const express = require('express');
const router = express.Router();
const customerController = require('./customer.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createCustomerSchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
  customerAssignmentBodySchema,
  uuidParamSchema
} = require('./customer.validation');

router.use(authenticate);

// Admin-only management
router.post(['/', '/createCustomer'], authorize(ROLES.ADMIN), validateRequest({ body: createCustomerSchema }), customerController.createCustomer);
router.patch(['/:id', '/updateCustomer/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateCustomerSchema }), customerController.updateCustomer);
router.patch(['/:id/status', '/updateCustomerStatus/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateCustomerStatusSchema }), customerController.updateCustomerStatus);

// Admin or Supervisor customer assignment
router.post(['/:id/assignments', '/assignCustomer/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ params: uuidParamSchema, body: customerAssignmentBodySchema }), customerController.assignCustomer);

// Read endpoints: Scoped access for Admin, Supervisor, Field Agent
router.get(['/', '/getAllCustomers'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), customerController.getAllCustomers);
router.get(['/:id', '/getCustomerById/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), customerController.getCustomerById);
router.get(['/:id/assignments', '/getCustomerAssignments/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), customerController.getCustomerAssignments);

module.exports = router;
