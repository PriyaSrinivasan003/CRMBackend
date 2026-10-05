const { z } = require('zod');
const { uuidSchema } = require('../../utils/uuid');

const createOrganizationSchema = z.object({
  name: z.string({ required_error: 'Organization name is required' }).min(2).max(100),
  code: z.string({ required_error: 'Organization code is required' }).min(2).max(50),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.number().int().min(0).max(1).optional().default(1)
});

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.number().int().min(0).max(1).optional()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createOrganizationSchema,
  updateOrganizationSchema,
  uuidParamSchema
};
