const { z } = require('zod');
const { AREA_STATUS } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const createAreaSchema = z.object({
  branch_id: uuidSchema('Invalid branch_id UUID'),
  area_code: z.string({ required_error: 'Area code is required' }).min(2).max(50),
  name: z.string({ required_error: 'Area name is required' }).min(2).max(100),
  status: z.nativeEnum(AREA_STATUS).optional().default(AREA_STATUS.ACTIVE)
});

const updateAreaSchema = z.object({
  branch_id: optionalUuidSchema('Invalid branch_id UUID'),
  area_code: z.string().min(2).max(50).optional(),
  name: z.string().min(2).max(100).optional()
});

const updateAreaStatusSchema = z.object({
  status: z.nativeEnum(AREA_STATUS, { required_error: 'Valid status is required' })
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

const branchParamSchema = z.object({
  branchId: uuidSchema('Invalid branch UUID format')
});

module.exports = {
  createAreaSchema,
  updateAreaSchema,
  updateAreaStatusSchema,
  uuidParamSchema,
  branchParamSchema
};
