const express = require('express');
const router = express.Router();
const followUpController = require('./followup.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createFollowUpSchema,
  completeFollowUpSchema,
  uuidParamSchema
} = require('./followup.validation');

router.use(authenticate);

router.post(['/', '/createFollowUp'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ body: createFollowUpSchema }), followUpController.createFollowUp);
router.get(['/', '/getAllFollowUps'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), followUpController.getAllFollowUps);
router.get(['/:id', '/getFollowUpById/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), followUpController.getFollowUpById);
router.patch(['/:id/complete', '/completeFollowUp/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema, body: completeFollowUpSchema }), followUpController.completeFollowUp);

module.exports = router;
