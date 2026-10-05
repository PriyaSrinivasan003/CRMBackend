const { z } = require('zod');
const { PAYMENT_METHOD, PAYMENT_STATUS } = require('../../constants/statusCodes');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const paymentAllocationSchema = z.object({
  installment_id: optionalUuidSchema('Invalid installment UUID'),
  allocated_amount: z.coerce.number().positive('Allocated amount must be greater than zero')
});

const createPaymentSchema = z.object({
  collection_id: uuidSchema('Invalid Collection UUID'),
  receipt_number: z.string().min(2).max(50).optional(), // auto-generated if omitted
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  payment_method: z.union([z.number(), z.string(), z.nativeEnum(PAYMENT_METHOD)]).optional().default(PAYMENT_METHOD.CASH),
  payment_mode_id: optionalUuidSchema('Invalid payment_mode UUID'),
  payment_mode: z.string().max(50).optional(),
  transaction_reference: z.string().max(100).optional().nullable(),
  payment_date: z.string().optional(),
  collected_at: z.string().optional(),
  installment_id: optionalUuidSchema('Invalid installment UUID'),
  allocations: z.array(paymentAllocationSchema).optional(),
  payment_status: z.nativeEnum(PAYMENT_STATUS).optional().default(PAYMENT_STATUS.CONFIRMED),
  notes: z.string().optional().nullable()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  paymentAllocationSchema,
  createPaymentSchema,
  uuidParamSchema
};
