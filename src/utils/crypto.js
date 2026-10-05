const crypto = require('crypto');
const bcrypt = require('bcrypt');
const env = require('../config/env');

/**
 * Hash password with bcrypt
 */
const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
};

/**
 * Verify password with bcrypt
 */
const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * SHA-256 hash a token (e.g. for refresh tokens or OTPs)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a cryptographically secure random token (hex)
 */
const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Generate a 6-digit numeric OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = {
  hashPassword,
  comparePassword,
  hashToken,
  generateRandomToken,
  generateOtp
};
