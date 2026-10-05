const express = require('express');
const router = express.Router();
const supervisorController = require('./supervisor.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createSupervisorSchema,
  updateSupervisorSchema,
  updateSupervisorStatusSchema,
  uuidParamSchema
} = require('./supervisor.validation');

router.use(authenticate);

// Admin-only endpoints
router.post(['/', '/createSupervisor'], authorize(ROLES.ADMIN), validateRequest({ body: createSupervisorSchema }), supervisorController.createSupervisor);
router.get(['/', '/getAllSupervisors'], authorize(ROLES.ADMIN), supervisorController.getAllSupervisors);
router.patch(['/:id', '/updateSupervisor/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateSupervisorSchema }), supervisorController.updateSupervisor);
router.patch(['/:id/status', '/updateSupervisorStatus/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateSupervisorStatusSchema }), supervisorController.updateSupervisorStatus);

// Admin or Supervisor (supervisor checked via service ownership check)
router.get(['/:id', '/getSupervisorById/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ params: uuidParamSchema }), supervisorController.getSupervisorById);
router.get(['/:id/agents', '/getSupervisorAgents/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR), validateRequest({ params: uuidParamSchema }), supervisorController.getSupervisorAgents);

module.exports = router;
