const express = require('express');
const router = express.Router();
const assignmentController = require('./assignment.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  assignAgentSupervisorSchema,
  updateAgentSupervisorAssignmentSchema,
  uuidParamSchema: agentAssignmentUuidParam
} = require('./agentSupervisor.validation');
const {
  assignCustomerAgentSchema,
  updateCustomerAgentAssignmentSchema,
  uuidParamSchema: customerAssignmentUuidParam
} = require('./customerAgent.validation');

router.use(authenticate);

// --- Agent-Supervisor assignment routes (ADMIN only) ---
router.post('/assignAgentToSupervisor', authorize(ROLES.ADMIN), validateRequest({ body: assignAgentSupervisorSchema }), assignmentController.assignAgentToSupervisor);
router.post('/agents', authorize(ROLES.ADMIN), validateRequest({ body: assignAgentSupervisorSchema }), assignmentController.assignAgentToSupervisor);

router.get('/getAgentSupervisorAssignments', authorize(ROLES.ADMIN), assignmentController.getAgentSupervisorAssignments);
router.get('/agents', authorize(ROLES.ADMIN), assignmentController.getAgentSupervisorAssignments);

router.patch('/updateAgentSupervisorAssignment/:id', authorize(ROLES.ADMIN), validateRequest({ params: agentAssignmentUuidParam, body: updateAgentSupervisorAssignmentSchema }), assignmentController.updateAgentSupervisorAssignment);
router.patch('/agents/:id', authorize(ROLES.ADMIN), validateRequest({ params: agentAssignmentUuidParam, body: updateAgentSupervisorAssignmentSchema }), assignmentController.updateAgentSupervisorAssignment);

// --- Customer-Agent assignment routes (ADMIN, SUPERVISOR, FIELD_AGENT with scoping) ---
router.post('/assignCustomerToAgent', authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ body: assignCustomerAgentSchema }), assignmentController.assignCustomerToAgent);
router.post('/customers', authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ body: assignCustomerAgentSchema }), assignmentController.assignCustomerToAgent);

router.get('/getCustomerAgentAssignments', authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), assignmentController.getCustomerAgentAssignments);
router.get('/customers', authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), assignmentController.getCustomerAgentAssignments);

router.patch('/updateCustomerAgentAssignment/:id', authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ params: customerAssignmentUuidParam, body: updateCustomerAgentAssignmentSchema }), assignmentController.updateCustomerAgentAssignment);
router.patch('/customers/:id', authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ params: customerAssignmentUuidParam, body: updateCustomerAgentAssignmentSchema }), assignmentController.updateCustomerAgentAssignment);

module.exports = router;
