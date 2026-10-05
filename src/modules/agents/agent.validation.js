const { z } = require('zod');
const { AGENT_STATUS } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const createAgentSchema = z.object({
  name: z.string({ required_error: 'Agent name is required' }).min(2).max(100),
  email: z.string().email('Invalid email').max(150).optional().nullable(),
  mobile: z.string().min(10).max(20).optional().nullable(),
  password: z.string({ required_error: 'Password is required' }).min(8),
  employee_code: z.string({ required_error: 'Employee code is required' }).min(2).max(50),
  supervisor_id: optionalUuidSchema('Invalid supervisor_id UUID'),
  branch_id: optionalUuidSchema('Invalid branch_id UUID'),
  joining_date: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  government_id_reference: z.string().optional().nullable()
}).refine(data => Boolean(data.email || data.mobile), {
  message: 'At least one valid contact identifier (email or mobile) must be provided',
  path: ['email']
});

const updateAgentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  mobile: z.string().min(10).max(20).optional().nullable(),
  supervisor_id: optionalUuidSchema('Invalid supervisor_id UUID'),
  branch_id: optionalUuidSchema('Invalid branch_id UUID'),
  address: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  government_id_reference: z.string().optional().nullable(),
  joining_date: z.string().optional().nullable()
});

const updateAgentStatusSchema = z.object({
  status: z.nativeEnum(AGENT_STATUS, { required_error: 'Valid status is required' })
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createAgentSchema,
  updateAgentSchema,
  updateAgentStatusSchema,
  uuidParamSchema
};
