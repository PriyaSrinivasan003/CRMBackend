const { z } = require('zod');
const { COLLECTION_STATUS } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const createCollectionSchema = z.object({
  customer_id: uuidSchema('Invalid Customer UUID'),
  agent_id: optionalUuidSchema('Invalid Agent UUID'), // If Field Agent calling, defaults to self
  collection_date: z.string({ required_error: 'Collection date is required' }),
  amount_due: z.coerce.number().positive('Amount due must be a positive number'),
  remarks: z.string().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable()
});

const updateCollectionSchema = z.object({
  collection_date: z.string().optional(),
  amount_due: z.coerce.number().positive().optional(),
  collection_status: z.nativeEnum(COLLECTION_STATUS).optional(),
  remarks: z.string().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createCollectionSchema,
  updateCollectionSchema,
  uuidParamSchema
};
