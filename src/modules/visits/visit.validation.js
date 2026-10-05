const { z } = require('zod');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');
const { VISIT_OUTCOME } = require('../../constants/statusCodes');

const validOutcomes = Object.values(VISIT_OUTCOME);

const createVisitSchema = z.object({
  customer_id: uuidSchema('Invalid customer ID format'),
  agent_id: optionalUuidSchema('Invalid agent ID format'),
  assignment_id: optionalUuidSchema('Invalid assignment ID format'),
  visit_date: z.coerce.date().optional(),
  visit_outcome: z.number({ required_error: 'visit_outcome is required' })
    .int()
    .refine((val) => validOutcomes.includes(val), {
      message: `Invalid visit_outcome. Must be one of: ${validOutcomes.join(', ')}`
    }),
  remarks: z.string().max(1000).optional().nullable(),
  next_follow_up_at: z.coerce.date().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createVisitSchema,
  uuidParamSchema
};
