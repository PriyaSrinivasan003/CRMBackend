const express = require('express');
const router = express.Router();
const branchController = require('./branch.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createBranchSchema,
  updateBranchSchema,
  updateBranchStatusSchema,
  uuidParamSchema,
  organisationParamSchema
} = require('./branch.validation');

router.use(authenticate);

router.post(['/', '/createBranch'], authorize(ROLES.ADMIN), validateRequest({ body: createBranchSchema }), branchController.createBranch);
router.get(['/', '/getAllBranches'], branchController.getAllBranches);
router.get(['/:id', '/getBranchById/:id'], validateRequest({ params: uuidParamSchema }), branchController.getBranchById);
router.get(['/organisation/:organisationId', '/getBranchesByOrganisation/:organisationId'], validateRequest({ params: organisationParamSchema }), branchController.getBranchesByOrganisation);
router.patch(['/:id', '/updateBranch/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateBranchSchema }), branchController.updateBranch);
router.patch(['/:id/status', '/updateBranchStatus/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateBranchStatusSchema }), branchController.updateBranchStatus);

module.exports = router;
