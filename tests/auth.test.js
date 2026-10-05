process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');

describe('Authentication & Authorization Integration Tests', () => {
  let adminAccessToken;
  let adminRefreshToken;

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully log in with valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@collectagent.com',
          password: 'Admin@SecurePass2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@collectagent.com');
      expect(res.body.data.user.role.code).toBe('ADMIN');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      adminAccessToken = res.body.data.tokens.accessToken;
      adminRefreshToken = res.body.data.tokens.refreshToken;
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@collectagent.com',
          password: 'WrongPassword@123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with non-existent identifier (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'nonexistent@collectagent.com',
          password: 'SomePassword@123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 422 if identifier is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'SomePassword@123'
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should log in with email field directly', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@collectagent.com',
          password: 'Admin@SecurePass2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role_code).toBe('ADMIN');
    });

    it('should log in with mobile field directly', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          mobile: '9876543210',
          password: 'Admin@SecurePass2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.mobile).toBe('9876543210');
    });

    it('should log in via dual route POST /api/v1/auth/userLogin', async () => {
      const res = await request(app)
        .post('/api/v1/auth/userLogin')
        .send({
          identifier: 'admin@collectagent.com',
          password: 'Admin@SecurePass2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should return 401 when invalid token format is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid_garbage_token_value');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return user profile when valid token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Super Admin');
      expect(res.body.data.role.code).toBe('ADMIN');
      // Password hash must never be returned in API response
      expect(res.body.data.password_hash).toBeUndefined();
    });
  });

  describe('POST /api/v1/auth/refresh & Token Rotation', () => {
    let newRefreshToken;

    it('should successfully rotate refresh token and issue new access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: adminRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(adminRefreshToken);

      newRefreshToken = res.body.data.refreshToken;
    });

    it('should detect reuse of old refresh token and revoke all sessions (401)', async () => {
      // Attempting to use the old adminRefreshToken which was already rotated
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: adminRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_REUSE_DETECTED');
    });

    it('should reject refresh with random unknown token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'random_unknown_token_that_does_not_exist_in_db' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should successfully revoke token on logout', async () => {
      // Perform fresh login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'admin@collectagent.com',
          password: 'Admin@SecurePass2026'
        });

      const tokenToLogout = loginRes.body.data.tokens.refreshToken;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: tokenToLogout });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Attempting to refresh with the logged-out token should be detected as revoked
      const reuseRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: tokenToLogout });

      expect(reuseRes.status).toBe(401);
    });
  });

  describe('Email & Mobile Verification Direct on User Row', () => {
    it('should send email verification OTP and store directly in user row', async () => {
      const { User } = require('../src/models');
      await User.update({ email_verified_at: null }, { where: { email: 'admin@collectagent.com' } });

      const res = await request(app)
        .post('/api/v1/auth/send-email-otp')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ where: { email: 'admin@collectagent.com' } });
      expect(user.email_verification_otp).not.toBeNull();
      expect(user.email_verification_expires_at).not.toBeNull();
    });

    it('should reject email verification with incorrect OTP (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OTP');
    });

    it('should verify email successfully when correct OTP is provided', async () => {
      const { User } = require('../src/models');
      const { hashToken } = require('../src/utils/crypto');
      const testOtp = '654321';
      await User.update(
        {
          email_verification_otp: hashToken(testOtp),
          email_verification_expires_at: new Date(Date.now() + 15 * 60 * 1000)
        },
        { where: { email: 'admin@collectagent.com' } }
      );

      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ otp: testOtp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ where: { email: 'admin@collectagent.com' } });
      expect(user.email_verified_at).not.toBeNull();
      expect(user.email_verification_otp).toBeNull();
      expect(user.email_verification_expires_at).toBeNull();
    });

    it('should send mobile verification OTP and store directly in user row', async () => {
      const { User } = require('../src/models');
      await User.update({ mobile_verified_at: null }, { where: { email: 'admin@collectagent.com' } });

      const res = await request(app)
        .post('/api/v1/auth/send-mobile-otp')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ where: { email: 'admin@collectagent.com' } });
      expect(user.mobile_verification_otp).not.toBeNull();
      expect(user.mobile_verification_expires_at).not.toBeNull();
    });

    it('should verify mobile number successfully when correct OTP is provided', async () => {
      const { User } = require('../src/models');
      const { hashToken } = require('../src/utils/crypto');
      const testOtp = '889900';
      await User.update(
        {
          mobile_verification_otp: hashToken(testOtp),
          mobile_verification_expires_at: new Date(Date.now() + 15 * 60 * 1000)
        },
        { where: { email: 'admin@collectagent.com' } }
      );

      const res = await request(app)
        .post('/api/v1/auth/verify-mobile')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ otp: testOtp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const user = await User.findOne({ where: { email: 'admin@collectagent.com' } });
      expect(user.mobile_verified_at).not.toBeNull();
      expect(user.mobile_verification_otp).toBeNull();
      expect(user.mobile_verification_expires_at).toBeNull();
    });

    it('should not leak OTP hashes in GET /me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.password_hash).toBeUndefined();
      expect(res.body.data.email_verification_otp).toBeUndefined();
      expect(res.body.data.mobile_verification_otp).toBeUndefined();
    });
  });
});
