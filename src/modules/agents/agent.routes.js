const express = require('express');
const router = express.Router();
const agentController = require('./agent.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createAgentSchema,
  updateAgentSchema,
  updateAgentStatusSchema,
  uuidParamSchema
} = require('./agent.validation');

router.use(authenticate);

// Admin-only creation & status update
router.post(['/', '/createAgent'], authorize(ROLES.ADMIN), validateRequest({ body: createAgentSchema }), agentController.createAgent);
router.patch(['/:id/status', '/updateAgentStatus/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateAgentStatusSchema }), agentController.updateAgentStatus);

// List agents: Admin or Supervisor
router.get(['/', '/getAllAgents'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR), agentController.getAllAgents);

// Get agent by ID: Admin, Supervisor, or Self Field Agent
router.get(['/:id', '/getAgentById/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), agentController.getAgentById);

// Update agent: Admin or Field Agent (permitted fields)
router.patch(['/:id', '/updateAgent/:id'], authorize(ROLES.ADMIN, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema, body: updateAgentSchema }), agentController.updateAgent);

// Sub-resources
router.get(['/:id/customers', '/getAgentCustomers/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), agentController.getAgentCustomers);
router.get(['/:id/collections', '/getAgentCollections/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), agentController.getAgentCollections);

module.exports = router;
