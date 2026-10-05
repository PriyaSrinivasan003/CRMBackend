const { z } = require('zod');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');
const { ROLES } = require('../../constants/statusCodes');

const validRoles = Object.values(ROLES);

const createUserSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(2).max(100),
  email: z.string({ required_error: 'Email is required' }).email('Invalid email address').max(150),
  mobile: z.string({ required_error: 'Mobile number is required' }).min(10).max(20),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
  role_code: z.enum(validRoles, {
    errorMap: () => ({ message: `Invalid role_code. Must be one of: ${validRoles.join(', ')}` })
  }),
  employee_code: z.string({ required_error: 'Employee code is required' }).min(2).max(50),
  branch_id: optionalUuidSchema('Invalid branch UUID'),
  supervisor_id: optionalUuidSchema('Invalid supervisor UUID'),
  joining_date: z.string().optional().nullable()
});

const updateUserStatusSchema = z.object({
  status: z.union([
    z.coerce.number().int().min(0).max(2),
    z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', '0', '1', '2'])
  ], { required_error: 'Status is required (0: Inactive, 1: Active, 2: Suspended)' })
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createUserSchema,
  updateUserStatusSchema,
  uuidParamSchema
};
