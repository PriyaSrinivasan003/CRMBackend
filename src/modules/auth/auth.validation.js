const { z } = require('zod');

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const loginSchema = z.object({
  identifier: z.string().min(2).max(150).optional(),
  email: z.string().min(3).max(150).optional(),
  mobile: z.string().min(3).max(50).optional(),
  employee_code: z.string().min(2).max(50).optional(),
  username: z.string().min(2).max(100).optional(),
  password: z.string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
}).refine(data => Boolean(data.identifier || data.email || data.mobile || data.employee_code || data.username), {
  message: 'Email, mobile number, employee code, or identifier is required',
  path: ['identifier']
});

const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'Refresh token is required' })
    .min(10, 'Refresh token must be valid')
});

const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }),
  newPassword: z.string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .regex(
      passwordPattern,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    )
});

const forgotPasswordSchema = z.object({
  identifier: z.string({ required_error: 'Email or mobile number is required' })
    .min(3, 'Identifier must be at least 3 characters')
});

const resetPasswordSchema = z.object({
  identifier: z.string({ required_error: 'Identifier is required' }),
  otp: z.string({ required_error: 'OTP is required' }).min(4).max(10),
  newPassword: z.string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .regex(
      passwordPattern,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    )
});

const verifyEmailSchema = z.object({
  otp: z.string({ required_error: 'OTP is required' }).min(4).max(10)
});

const verifyMobileSchema = z.object({
  otp: z.string({ required_error: 'OTP is required' }).min(4).max(10)
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyMobileSchema
};
