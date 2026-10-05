const express = require('express');
const router = express.Router();
const permissionController = require('./permission.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createPermissionSchema,
  assignPermissionSchema,
  roleCodeParamSchema
} = require('./permission.validation');

router.use(authenticate);

// View endpoints
router.get(['/', '/getAllPermissions'], permissionController.getAllPermissions);
router.get(['/role/:roleCode', '/getRolePermissions/:roleCode'], validateRequest({ params: roleCodeParamSchema }), permissionController.getRolePermissions);
router.get(['/admin', '/getAdminPermissions'], permissionController.getAdminPermissions);
router.get(['/supervisor', '/getSupervisorPermissions'], permissionController.getSupervisorPermissions);
router.get(['/agent', '/getAgentPermissions'], permissionController.getAgentPermissions);

// Admin-only management endpoints
router.post(['/', '/createPermission'], authorize(ROLES.ADMIN), validateRequest({ body: createPermissionSchema }), permissionController.createPermission);
router.post('/assignPermissionToRole', authorize(ROLES.ADMIN), validateRequest({ body: assignPermissionSchema }), permissionController.assignPermissionToRole);
router.post('/revokePermissionFromRole', authorize(ROLES.ADMIN), validateRequest({ body: assignPermissionSchema }), permissionController.revokePermissionFromRole);

module.exports = router;
