const { z } = require('zod');
const { CUSTOMER_STATUS } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const createCustomerSchema = z.object({
  customer_code: z.string().min(2).max(50).optional(), // auto-generated if not supplied
  full_name: z.string({ required_error: 'Full name is required' }).min(2).max(100),
  mobile: z.string({ required_error: 'Mobile number is required' }).min(10).max(20),
  alternate_mobile: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email').max(150).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address_line1: z.string({ required_error: 'Address Line 1 is required' }).min(3).max(255),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(20).optional().nullable(),
  branch_id: uuidSchema('Invalid Branch UUID'),
  area_id: optionalUuidSchema('Invalid Area UUID'),
  notes: z.string().optional().nullable(),
  initial_agent_id: optionalUuidSchema('Invalid Agent UUID')
});

const updateCustomerSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  mobile: z.string().min(10).max(20).optional(),
  alternate_mobile: z.string().max(20).optional().nullable(),
  email: z.string().email().max(150).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address_line1: z.string().min(3).max(255).optional(),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(20).optional().nullable(),
  branch_id: optionalUuidSchema('Invalid Branch UUID'),
  area_id: optionalUuidSchema('Invalid Area UUID'),
  notes: z.string().optional().nullable()
});

const updateCustomerStatusSchema = z.object({
  status: z.nativeEnum(CUSTOMER_STATUS, { required_error: 'Valid status is required' })
});

const customerAssignmentBodySchema = z.object({
  agent_id: uuidSchema('Invalid agent_id UUID'),
  effective_from: z.string().optional()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
  customerAssignmentBodySchema,
  uuidParamSchema
};
