const { z } = require('zod');
const { uuidSchema, optionalUuidSchema } = require('../../utils/uuid');
const { FOLLOW_UP_TYPE, FOLLOW_UP_STATUS } = require('../../constants/statusCodes');

const validTypes = Object.values(FOLLOW_UP_TYPE);
const validStatuses = Object.values(FOLLOW_UP_STATUS);

const createFollowUpSchema = z.object({
  customer_id: uuidSchema('Invalid customer ID format'),
  agent_id: optionalUuidSchema('Invalid agent ID format'),
  assignment_id: optionalUuidSchema('Invalid assignment ID format'),
  visit_id: optionalUuidSchema('Invalid visit ID format'),
  scheduled_at: z.coerce.date({ required_error: 'scheduled_at is required' }),
  follow_up_type: z.number({ required_error: 'follow_up_type is required' })
    .int()
    .refine((val) => validTypes.includes(val), {
      message: `Invalid follow_up_type. Must be one of: ${validTypes.join(', ')}`
    }),
  status: z.number()
    .int()
    .refine((val) => validStatuses.includes(val), {
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    })
    .optional(),
  remarks: z.string().max(1000).optional().nullable()
});

const completeFollowUpSchema = z.object({
  completed_at: z.coerce.date().optional(),
  remarks: z.string().max(1000).optional().nullable()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createFollowUpSchema,
  completeFollowUpSchema,
  uuidParamSchema
};
