const express = require('express');
const router = express.Router();
const organizationController = require('./organization.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createOrganizationSchema,
  updateOrganizationSchema,
  uuidParamSchema
} = require('./organization.validation');
const { createBranchSchema } = require('../branches/branch.validation');

router.use(authenticate);

// Organization Management (Admin only)
router.post(['/', '/createOrganization'], authorize(ROLES.ADMIN), validateRequest({ body: createOrganizationSchema }), organizationController.createOrganization);
router.get(['/', '/getAllOrganizations'], organizationController.getAllOrganizations);
router.get(['/:id', '/getOrganizationById/:id'], validateRequest({ params: uuidParamSchema }), organizationController.getOrganizationById);
router.patch(['/:id', '/updateOrganization/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema, body: updateOrganizationSchema }), organizationController.updateOrganization);

// Add and retrieve branches based on organization id
router.post(['/:id/branches', '/createBranchForOrganization/:id'], authorize(ROLES.ADMIN), validateRequest({ params: uuidParamSchema }), organizationController.createBranchForOrganization);
router.get(['/:id/branches', '/getBranchesForOrganization/:id'], validateRequest({ params: uuidParamSchema }), organizationController.getBranchesForOrganization);

module.exports = router;
