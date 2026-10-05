const { z } = require('zod');
const { SUPERVISOR_STATUS } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const createSupervisorSchema = z.object({
  name: z.string({ required_error: 'Supervisor name is required' }).min(2).max(100),
  email: z.string().email('Invalid email').max(150).optional().nullable(),
  mobile: z.string().min(10).max(20).optional().nullable(),
  password: z.string({ required_error: 'Password is required' }).min(8),
  employee_code: z.string({ required_error: 'Employee code is required' }).min(2).max(50),
  branch_id: optionalUuidSchema('Invalid branch_id UUID'),
  joining_date: z.string().optional().nullable(),
  address: z.string().optional().nullable()
}).refine(data => Boolean(data.email || data.mobile), {
  message: 'At least one valid contact identifier (email or mobile) must be provided',
  path: ['email']
});

const updateSupervisorSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  branch_id: optionalUuidSchema('Invalid branch_id UUID'),
  address: z.string().optional().nullable(),
  joining_date: z.string().optional().nullable()
});

const updateSupervisorStatusSchema = z.object({
  status: z.nativeEnum(SUPERVISOR_STATUS, { required_error: 'Valid status is required' })
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createSupervisorSchema,
  updateSupervisorSchema,
  updateSupervisorStatusSchema,
  uuidParamSchema
};
