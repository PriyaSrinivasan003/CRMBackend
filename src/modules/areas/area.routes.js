const express = require('express');
const router = express.Router();
const areaController = require('./area.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createAreaSchema,
  updateAreaSchema,
  updateAreaStatusSchema,
  uuidParamSchema,
  branchParamSchema
} = require('./area.validation');

router.use(authenticate);

// Area CRUD & Branch-specific Area routes
router.post(['/', '/createArea'], authorize(ROLES.ADMIN), validateRequest({ body: createAreaSchema }), areaController.createArea);
router.get(['/', '/getAllAreas'], areaController.getAllAreas);
router.get(['/:id', '/getAreaById/:id'], validateRequest({ params: uuidParamSchema }), areaController.getAreaById);
router.get(['/branch/:branchId', '/getAreasByBranch/:branchId'], validateRequest({ params: branchParamSchema }), areaController.getAreasByBranch);
router.patch(['/:id', '/updateArea/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateAreaSchema }), areaController.updateArea);
router.patch(['/:id/status', '/updateAreaStatus/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateAreaStatusSchema }), areaController.updateAreaStatus);

module.exports = router;
