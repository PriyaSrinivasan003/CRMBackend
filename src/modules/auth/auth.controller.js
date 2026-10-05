const authService = require('./auth.service');
const ApiResponse = require('../../utils/apiResponse');

class AuthController {
  async login(req, res, next) {
    try {
      const identifier = req.body.identifier || req.body.email || req.body.mobile || req.body.employee_code || req.body.username;
      const { password } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.login({
        identifier,
        password,
        ipAddress,
        userAgent
      });

      return ApiResponse.success(res, 'Login successful', result);
    } catch (error) {
      return next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken({ rawRefreshToken: refreshToken });
      return ApiResponse.success(res, 'Token refreshed successfully', result);
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout({ rawRefreshToken: refreshToken });
      return ApiResponse.success(res, 'Logged out successfully');
    } catch (error) {
      return next(error);
    }
  }

  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user.id);
      return ApiResponse.success(res, 'All active sessions have been terminated');
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return ApiResponse.success(res, 'User profile retrieved successfully', user);
    } catch (error) {
      return next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user.id, currentPassword, newPassword);
      return ApiResponse.success(res, 'Password changed successfully. Please log in with your new password.');
    } catch (error) {
      return next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { identifier } = req.body;
      const result = await authService.forgotPassword(identifier);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { identifier, otp, newPassword } = req.body;
      await authService.resetPassword({ identifier, otp, newPassword });
      return ApiResponse.success(res, 'Password reset successfully. You may now log in.');
    } catch (error) {
      return next(error);
    }
  }

  async sendEmailOtp(req, res, next) {
    try {
      const result = await authService.sendEmailVerificationOtp(req.user.id);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      return next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { otp } = req.body;
      const result = await authService.verifyEmail(req.user.id, otp);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      return next(error);
    }
  }

  async sendMobileOtp(req, res, next) {
    try {
      const result = await authService.sendMobileVerificationOtp(req.user.id);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      return next(error);
    }
  }

  async verifyMobile(req, res, next) {
    try {
      const { otp } = req.body;
      const result = await authService.verifyMobile(req.user.id, otp);
      return ApiResponse.success(res, result.message);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
