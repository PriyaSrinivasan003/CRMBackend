const { z } = require('zod');
const { BRANCH_STATUS } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const createBranchSchema = z.object({
  branch_code: z.string({ required_error: 'Branch code is required' }).min(2).max(50),
  branch_name: z.string({ required_error: 'Branch name is required' }).min(2).max(100),
  organisation_id: optionalUuidSchema('Invalid Organisation ID format'),
  organization_id: optionalUuidSchema('Invalid Organization ID format'),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(20).optional().nullable(),
  status: z.nativeEnum(BRANCH_STATUS).optional().default(BRANCH_STATUS.ACTIVE)
}).refine(data => Boolean(data.organisation_id || data.organization_id), {
  message: 'organisation_id (or organization_id) is required to create a branch',
  path: ['organisation_id']
});

const updateBranchSchema = z.object({
  branch_name: z.string().min(2).max(100).optional(),
  organisation_id: optionalUuidSchema('Invalid Organisation ID format'),
  organization_id: optionalUuidSchema('Invalid Organization ID format'),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(20).optional().nullable()
});

const updateBranchStatusSchema = z.object({
  status: z.nativeEnum(BRANCH_STATUS, { required_error: 'Valid status is required' })
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

const organisationParamSchema = z.object({
  organisationId: uuidSchema('Invalid Organisation ID format')
});

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  updateBranchStatusSchema,
  uuidParamSchema,
  organisationParamSchema
};
