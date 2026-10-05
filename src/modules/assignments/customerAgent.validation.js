const { z } = require('zod');
const { ASSIGNMENT_STATUS } = require('../../constants/statusCodes');
const { uuidSchema } = require('../../utils/uuid');

const assignCustomerAgentSchema = z.object({
  customer_id: uuidSchema('Invalid UUID for customer_id'),
  agent_id: uuidSchema('Invalid UUID for agent_id'),
  effective_from: z.string().optional()
});

const updateCustomerAgentAssignmentSchema = z.object({
  status: z.nativeEnum(ASSIGNMENT_STATUS).optional(),
  effective_to: z.string().optional()
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  assignCustomerAgentSchema,
  updateCustomerAgentAssignmentSchema,
  uuidParamSchema
};
