const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authenticate = require('../../middlewares/authenticate');
const validateRequest = require('../../middlewares/validateRequest');
const { loginLimiter, authLimiter } = require('../../middlewares/rateLimiter');
const {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyMobileSchema
} = require('./auth.validation');

// Public auth routes
router.post(['/login', '/userLogin'], loginLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/refresh', authLimiter, validateRequest({ body: refreshTokenSchema }), authController.refresh);
router.post('/logout', validateRequest({ body: refreshTokenSchema }), authController.logout);
router.post('/forgot-password', authLimiter, validateRequest({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest({ body: resetPasswordSchema }), authController.resetPassword);

// Authenticated auth routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/change-password', authenticate, validateRequest({ body: changePasswordSchema }), authController.changePassword);
router.post('/send-email-otp', authenticate, authLimiter, authController.sendEmailOtp);
router.post('/verify-email', authenticate, validateRequest({ body: verifyEmailSchema }), authController.verifyEmail);
router.post('/send-mobile-otp', authenticate, authLimiter, authController.sendMobileOtp);
router.post('/verify-mobile', authenticate, validateRequest({ body: verifyMobileSchema }), authController.verifyMobile);

module.exports = router;
