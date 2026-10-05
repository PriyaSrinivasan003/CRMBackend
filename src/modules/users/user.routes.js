const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  uuidParamSchema
} = require('./user.validation');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.post(['/', '/createUser'], validateRequest({ body: createUserSchema }), userController.createUser);
router.get(['/', '/getAllUsers'], userController.getAllUsers);
router.get(['/:id', '/getUserById/:id'], validateRequest({ params: uuidParamSchema }), userController.getUserById);
router.patch(['/:id', '/updateUser/:id'], validateRequest({ params: uuidParamSchema, body: updateUserSchema }), userController.updateUser);
router.patch(['/:id/status', '/updateUserStatus/:id'], validateRequest({ params: uuidParamSchema, body: updateUserStatusSchema }), userController.updateUserStatus);

module.exports = router;
