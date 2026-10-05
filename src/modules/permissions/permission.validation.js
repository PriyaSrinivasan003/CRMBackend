const { z } = require('zod');
const { uuidSchema } = require('../../utils/uuid');

const createPermissionSchema = z.object({
  name: z.string({ required_error: 'Permission name is required' }).min(2).max(100),
  code: z.string({ required_error: 'Permission code is required' }).min(2).max(100),
  module: z.string({ required_error: 'Module is required' }).min(2).max(50),
  description: z.string().max(255).optional().nullable()
});

const assignPermissionSchema = z.object({
  role_id: z.string({ required_error: 'Role ID is required' }).trim().min(1, 'Role ID cannot be empty').max(50),
  permission_id: uuidSchema('Invalid Permission ID format')
});

const roleCodeParamSchema = z.object({
  roleCode: z.string().min(2).max(50)
});

const uuidParamSchema = z.object({
  id: uuidSchema('Invalid UUID format')
});

module.exports = {
  createPermissionSchema,
  assignPermissionSchema,
  roleCodeParamSchema,
  uuidParamSchema
};
