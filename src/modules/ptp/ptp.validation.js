const { z } = require('zod');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');

const createPromiseToPaySchema = z.object({
  customer_id: uuidSchema('Invalid customer ID format'),
  promised_amount: z.coerce.number({ required_error: 'Promised amount is required' })
    .positive('Promised amount must be greater than zero'),
  promised_date: z.string({ required_error: 'Promised date is required' }),
  collection_case_id: optionalUuidSchema('Invalid collection case ID format'),
  action_date: z.string().optional().nullable(),
  assigned_employee_id: optionalUuidSchema('Invalid assigned employee ID format'),
  remarks: z.string().max(1000).optional().nullable()
});

const updatePromiseToPaySchema = z.object({
  status: z.enum(['OPEN', 'KEPT', 'BROKEN', 'CANCELLED']).optional(),
  promised_amount: z.coerce.number().positive('Promised amount must be greater than zero').optional(),
  promised_date: z.string().optional(),
  remarks: z.string().max(1000).optional().nullable()
});

const escalatePromiseSchema = z.object({
  reason: z.string({ required_error: 'Escalation reason is required' })
    .min(3, 'Escalation reason must be at least 3 characters')
    .max(1000)
});

const verifyPaymentSchema = z.object({
  allow_partial: z.boolean().optional().default(false)
});

const updateFollowUpTaskSchema = z.object({
  completion_status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
  outcome: z.string().max(255).optional().nullable(),
  remarks: z.string().max(1000).optional().nullable(),
  action_date: z.string().optional().nullable()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createPromiseToPaySchema,
  updatePromiseToPaySchema,
  escalatePromiseSchema,
  verifyPaymentSchema,
  updateFollowUpTaskSchema,
  uuidParamSchema
};
