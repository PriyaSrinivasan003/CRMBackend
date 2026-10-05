const { z } = require('zod');
const { PAYMENT_MODE_STATUS } = require('../../constants/statusCodes');
const { uuidSchema } = require('../../utils/uuid');

const createPaymentModeSchema = z.object({
  code: z.string({ required_error: 'Payment mode code is required' }).min(2).max(50).transform(val => val.trim().toUpperCase()),
  name: z.string({ required_error: 'Payment mode name is required' }).min(2).max(100),
  status: z.nativeEnum(PAYMENT_MODE_STATUS).optional().default(PAYMENT_MODE_STATUS.ACTIVE)
});

const updatePaymentModeSchema = z.object({
  code: z.string().min(2).max(50).transform(val => val.trim().toUpperCase()).optional(),
  name: z.string().min(2).max(100).optional(),
  status: z.nativeEnum(PAYMENT_MODE_STATUS).optional()
});

const updatePaymentModeStatusSchema = z.object({
  status: z.nativeEnum(PAYMENT_MODE_STATUS, { required_error: 'Valid status is required' })
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createPaymentModeSchema,
  updatePaymentModeSchema,
  updatePaymentModeStatusSchema,
  uuidParamSchema
};
