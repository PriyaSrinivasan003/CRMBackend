const express = require('express');
const router = express.Router();
const visitController = require('./visit.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createVisitSchema,
  uuidParamSchema
} = require('./visit.validation');

router.use(authenticate);

router.post(['/', '/createVisit'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ body: createVisitSchema }), visitController.createVisit);
router.get(['/', '/getAllVisits'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), visitController.getAllVisits);
router.get(['/:id', '/getVisitById/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), visitController.getVisitById);

module.exports = router;
