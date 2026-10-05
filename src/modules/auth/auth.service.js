const { Op } = require('sequelize');
const {
  User,
  Role,
  Supervisor,
  Agent,
  Branch,
  RefreshToken,
  LoginAudit,
  PasswordResetOtp,
  sequelize
} = require('../../models');
const { USER_STATUS } = require('../../constants/statusCodes');
const { hashPassword, comparePassword, hashToken, generateOtp, generateRandomToken } = require('../../utils/crypto');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const { sendEmail } = require('../../utils/email');
const ApiError = require('../../utils/apiError');

class AuthService {
  /**
   * User login with email, mobile, or employee code
   */
  async login({ identifier, password, ipAddress = null, userAgent = null }) {
    const trimmedIdentifier = typeof identifier === 'string' ? identifier.trim() : '';

    // 1. Search for user by email or mobile
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: trimmedIdentifier },
          { mobile: trimmedIdentifier }
        ]
      },
      include: [
        { model: Role, as: 'role' },
        { model: Supervisor, as: 'supervisor' },
        { model: Agent, as: 'agent' }
      ]
    });

    // 2. Allow agents to log in via employee code or agent mobile
    if (!user) {
      const agent = await Agent.findOne({
        where: {
          [Op.or]: [
            { employee_code: trimmedIdentifier },
            { mobile: trimmedIdentifier }
          ]
        }
      });
      if (agent) {
        user = await User.findByPk(agent.user_id, {
          include: [
            { model: Role, as: 'role' },
            { model: Supervisor, as: 'supervisor' },
            { model: Agent, as: 'agent' }
          ]
        });
      }
    }

    // 3. Allow supervisors to log in via employee code
    if (!user) {
      const supervisor = await Supervisor.findOne({
        where: { employee_code: trimmedIdentifier }
      });
      if (supervisor) {
        user = await User.findByPk(supervisor.user_id, {
          include: [
            { model: Role, as: 'role' },
            { model: Supervisor, as: 'supervisor' },
            { model: Agent, as: 'agent' }
          ]
        });
      }
    }

    // 2. Validate existence and password
    if (!user) {
      await LoginAudit.create({
        user_id: null,
        login_identifier: identifier,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: 0,
        failure_reason: 'User not found'
      });
      throw ApiError.unauthorized('Invalid login credentials', [], 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      await LoginAudit.create({
        user_id: user.id,
        login_identifier: identifier,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: 0,
        failure_reason: 'Incorrect password'
      });
      throw ApiError.unauthorized('Invalid login credentials', [], 'INVALID_CREDENTIALS');
    }

    // 3. Check user account status
    if (user.status !== USER_STATUS.ACTIVE) {
      let reason = 'Account inactive';
      if (user.status === USER_STATUS.SUSPENDED) reason = 'Account suspended';
      if (user.status === USER_STATUS.LOCKED) reason = 'Account locked';

      await LoginAudit.create({
        user_id: user.id,
        login_identifier: identifier,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: 0,
        failure_reason: reason
      });

      throw ApiError.unauthorized(`Your account is ${reason.toLowerCase().replace('account ', '')}. Please contact your administrator.`, [], 'ACCOUNT_INACTIVE');
    }

    // 4. Update last_login_at and audit log
    await user.update({ last_login_at: new Date() });
    await LoginAudit.create({
      user_id: user.id,
      login_identifier: identifier,
      ip_address: ipAddress,
      user_agent: userAgent,
      success: 1,
      failure_reason: null
    });

    // 5. Generate tokens
    const tokenPayload = {
      id: user.id,
      role: user.role ? user.role.code : null,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    };

    const accessToken = generateAccessToken(tokenPayload);
    const rawRefreshToken = generateRandomToken(40);
    const refreshTokenHash = hashToken(rawRefreshToken);

    // Refresh token expiry: 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: expiresAt
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role ? { id: user.role.id, code: user.role.code, name: user.role.name } : null,
        role_code: user.role ? user.role.code : null,
        supervisorProfile: user.supervisor || null,
        agentProfile: user.agent || null,
        status: user.status
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenType: 'Bearer',
        expiresIn: '15m'
      }
    };
  }

  /**
   * Refresh Token rotation with reuse detection
   */
  async refreshToken({ rawRefreshToken }) {
    const tokenHash = hashToken(rawRefreshToken);

    const storedToken = await RefreshToken.findOne({
      where: { token_hash: tokenHash }
    });

    if (!storedToken) {
      throw ApiError.unauthorized('Invalid or unrecognised refresh token', [], 'INVALID_REFRESH_TOKEN');
    }

    // Reuse detection: If token was already revoked, revoke all tokens for this user!
    if (storedToken.revoked_at !== null) {
      console.warn(`[Security Alert] Refresh token reuse detected for user ${storedToken.user_id}! Revoking all active tokens.`);
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: storedToken.user_id, revoked_at: null } }
      );
      throw ApiError.unauthorized('Security violation: Refresh token reuse detected. All sessions revoked.', [], 'TOKEN_REUSE_DETECTED');
    }

    // Check expiry
    if (new Date() > new Date(storedToken.expires_at)) {
      await storedToken.update({ revoked_at: new Date() });
      throw ApiError.unauthorized('Refresh token has expired. Please log in again.', [], 'TOKEN_EXPIRED');
    }

    // Find associated user
    const user = await User.findByPk(storedToken.user_id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.unauthorized('User account is no longer active', [], 'ACCOUNT_INACTIVE');
    }

    // Rotate: Revoke current token
    await storedToken.update({ revoked_at: new Date() });

    // Issue new pair
    const tokenPayload = {
      id: user.id,
      role: user.role ? user.role.code : null,
      name: user.name,
      email: user.email,
      mobile: user.mobile
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRawRefreshToken = generateRandomToken(40);
    const newRefreshTokenHash = hashToken(newRawRefreshToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      user_id: user.id,
      token_hash: newRefreshTokenHash,
      expires_at: expiresAt
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: '15m'
    };
  }

  /**
   * Single session logout
   */
  async logout({ rawRefreshToken }) {
    if (!rawRefreshToken) return true;
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { token_hash: tokenHash, revoked_at: null } }
    );
    return true;
  }

  /**
   * Invalidate all sessions for a user
   */
  async logoutAll(userId) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: userId, revoked_at: null } }
    );
    return true;
  }

  /**
   * Get current authenticated user profile
   */
  async getMe(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'role' },
        {
          model: Supervisor,
          as: 'supervisor',
          include: [{ model: Branch, as: 'branch' }]
        },
        {
          model: Agent,
          as: 'agent',
          include: [{ model: Branch, as: 'branch' }]
        }
      ]
    });

    if (!user) {
      throw ApiError.notFound('User profile not found');
    }

    return user;
  }

  /**
   * Change Password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      throw ApiError.badRequest('Current password is incorrect', [], 'INVALID_CURRENT_PASSWORD');
    }

    const newHash = await hashPassword(newPassword);
    await user.update({ password_hash: newHash });

    // Invalidate existing sessions after password change
    await this.logoutAll(userId);

    return true;
  }

  /**
   * Forgot Password request: generate OTP
   */
  async forgotPassword(identifier) {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { mobile: identifier }
        ]
      }
    });

    // Protect against user enumeration by returning generic success even if user not found
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      return { message: 'If the provided account exists, a password reset code has been sent.' };
    }

    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await PasswordResetOtp.create({
      user_id: user.id,
      otp_hash: otpHash,
      expires_at: expiresAt,
      is_used: false
    });

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - Collection Agent System',
        text: `Your password reset code is ${otp}. It will expire in 15 minutes. If you did not request this, please ignore this email.`,
        html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It will expire in 15 minutes.</p>`
      });
    }

    return { message: 'If the provided account exists, a password reset code has been sent.' };
  }

  /**
   * Reset Password with OTP
   */
  async resetPassword({ identifier, otp, newPassword }) {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { mobile: identifier }
        ]
      }
    });

    if (!user) {
      throw ApiError.badRequest('Invalid reset request or code expired', [], 'INVALID_OTP');
    }

    const otpHash = hashToken(otp);

    const validOtp = await PasswordResetOtp.findOne({
      where: {
        user_id: user.id,
        otp_hash: otpHash,
        is_used: false,
        expires_at: { [Op.gt]: new Date() }
      },
      order: [['created_at', 'DESC']]
    });

    if (!validOtp) {
      throw ApiError.badRequest('Invalid or expired password reset code', [], 'INVALID_OTP');
    }

    const newHash = await hashPassword(newPassword);

    await sequelize.transaction(async (t) => {
      await user.update({ password_hash: newHash }, { transaction: t });
      await validOtp.update({ is_used: true }, { transaction: t });
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: user.id, revoked_at: null }, transaction: t }
      );
    });

    return true;
  }

  /**
   * Send Email Verification OTP to user's registered email
   */
  async sendEmailVerificationOtp(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.email_verified_at) {
      return { message: 'Email is already verified.' };
    }

    if (!user.email) {
      throw ApiError.badRequest('No email registered on this account');
    }

    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await user.update({
      email_verification_otp: otpHash,
      email_verification_expires_at: expiresAt
    });

    await sendEmail({
      to: user.email,
      subject: 'Email Verification OTP - Collection Agent System',
      text: `Your email verification code is ${otp}. It will expire in 15 minutes.`,
      html: `<p>Your email verification code is <strong>${otp}</strong>.</p><p>It will expire in 15 minutes.</p>`
    });

    return { message: 'Verification OTP sent to your registered email address.' };
  }

  /**
   * Verify Email with OTP stored directly in user row
   */
  async verifyEmail(userId, otp) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.email_verified_at) {
      return { message: 'Email is already verified.' };
    }

    if (!user.email_verification_otp || !user.email_verification_expires_at) {
      throw ApiError.badRequest('No pending email verification OTP found. Please request a new code.');
    }

    if (new Date() > new Date(user.email_verification_expires_at)) {
      throw ApiError.badRequest('Email verification code has expired. Please request a new code.', [], 'OTP_EXPIRED');
    }

    const otpHash = hashToken(otp);
    if (user.email_verification_otp !== otpHash) {
      throw ApiError.badRequest('Invalid verification code', [], 'INVALID_OTP');
    }

    await user.update({
      email_verified_at: new Date(),
      email_verification_otp: null,
      email_verification_expires_at: null
    });

    return { message: 'Email verified successfully.' };
  }

  /**
   * Send Mobile Verification OTP
   */
  async sendMobileVerificationOtp(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.mobile_verified_at) {
      return { message: 'Mobile number is already verified.' };
    }

    if (!user.mobile) {
      throw ApiError.badRequest('No mobile number registered on this account');
    }

    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.update({
      mobile_verification_otp: otpHash,
      mobile_verification_expires_at: expiresAt
    });

    console.log(`[SMS Service] Simulated SMS to ${user.mobile}: Your mobile verification code is ${otp}`);

    return { message: 'Verification OTP sent to your registered mobile number.' };
  }

  /**
   * Verify Mobile number with OTP stored directly in user row
   */
  async verifyMobile(userId, otp) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.mobile_verified_at) {
      return { message: 'Mobile number is already verified.' };
    }

    if (!user.mobile_verification_otp || !user.mobile_verification_expires_at) {
      throw ApiError.badRequest('No pending mobile verification OTP found. Please request a new code.');
    }

    if (new Date() > new Date(user.mobile_verification_expires_at)) {
      throw ApiError.badRequest('Mobile verification code has expired. Please request a new code.', [], 'OTP_EXPIRED');
    }

    const otpHash = hashToken(otp);
    if (user.mobile_verification_otp !== otpHash) {
      throw ApiError.badRequest('Invalid verification code', [], 'INVALID_OTP');
    }

    await user.update({
      mobile_verified_at: new Date(),
      mobile_verification_otp: null,
      mobile_verification_expires_at: null
    });

    return { message: 'Mobile number verified successfully.' };
  }
}

module.exports = new AuthService();
