require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default('agentcollection_v1_1'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('collect-agent-api'),
  JWT_AUDIENCE: z.string().default('collect-agent-client'),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  CORS_ORIGIN: z.string().default('*'),
  ENCRYPTION_KEY: z.string().optional().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),

  // Initial Admin
  INITIAL_ADMIN_NAME: z.string().default('Super Admin'),
  INITIAL_ADMIN_EMAIL: z.string().email().default('admin@collectagent.com'),
  INITIAL_ADMIN_MOBILE: z.string().default('9876543210'),
  INITIAL_ADMIN_PASSWORD: z.string().default('Admin@SecurePass2026'),

  // Email Configuration (optional in dev, required in prod if email flows active)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration validation failed.');
}

module.exports = parsed.data;
