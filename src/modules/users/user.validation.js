const { z } = require('zod');
const { USER_STATUS, ROLES } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const createUserSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(2).max(100),
  email: z.string().email('Invalid email address').max(150).optional().nullable(),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits').max(20).optional().nullable(),
  password: z.string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordPattern, 'Password must include uppercase, lowercase, number, and special character'),
  role_code: z.enum([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT], {
    required_error: 'Valid role code is required'
  }),
  
  // Specific profile fields for SUPERVISOR or FIELD_AGENT
  employee_code: z.string().min(2).max(50).optional(),
  branch_id: optionalUuidSchema('Invalid branch_id UUID'),
  joining_date: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  government_id_reference: z.string().optional().nullable(),
  supervisor_id: optionalUuidSchema('Invalid supervisor_id UUID')
}).refine(data => Boolean(data.email || data.mobile), {
  message: 'At least one valid contact identifier (email or mobile) must be provided',
  path: ['email']
}).refine(data => {
  if (data.role_code === ROLES.SUPERVISOR || data.role_code === ROLES.FIELD_AGENT) {
    return Boolean(data.employee_code);
  }
  return true;
}, {
  message: 'Employee code is required for Supervisors and Field Agents',
  path: ['employee_code']
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(150).optional().nullable(),
  mobile: z.string().min(10).max(20).optional().nullable(),
  password: z.string().min(8).regex(passwordPattern).optional(),
  role_code: z.enum([ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT]).optional()
});

const updateUserStatusSchema = z.object({
  status: z.nativeEnum(USER_STATUS, { required_error: 'Valid status is required' })
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  uuidParamSchema
};
