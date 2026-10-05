const { Op } = require('sequelize');
const {
  Permission,
  Role,
  RolePermission,
  AdminPermission,
  SupervisorPermission,
  AgentPermission
} = require('../../models');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class PermissionService {
  async getAllPermissions(query = {}) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['name', 'code', 'module', 'created_at'],
      'module',
      'ASC'
    );

    const where = {};
    if (query.module) {
      where.module = query.module;
    }
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query.search}%` } },
        { code: { [Op.like]: `%${query.search}%` } },
        { module: { [Op.like]: `%${query.search}%` } }
      ];
    }

    const { count, rows } = await Permission.findAndCountAll({
      where,
      limit,
      offset,
      order
    });

    return {
      permissions: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getRolePermissions(roleCode) {
    const role = await Role.findOne({
      where: { code: roleCode.toUpperCase() },
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });

    if (!role) {
      throw ApiError.notFound(`Role with code '${roleCode}' not found`);
    }

    return {
      role: {
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description
      },
      totalPermissions: role.permissions.length,
      permissions: role.permissions
    };
  }

  async getAdminPermissions() {
    const permissions = await AdminPermission.findAll({
      include: [
        { model: Permission, as: 'permission' }
      ],
      order: [['module', 'ASC'], ['permission_code', 'ASC']]
    });

    return {
      role: 'ADMIN',
      count: permissions.length,
      table: 'admin_permissions',
      permissions
    };
  }

  async getSupervisorPermissions() {
    const permissions = await SupervisorPermission.findAll({
      include: [
        { model: Permission, as: 'permission' }
      ],
      order: [['module', 'ASC'], ['permission_code', 'ASC']]
    });

    return {
      role: 'SUPERVISOR',
      count: permissions.length,
      table: 'supervisor_permissions',
      permissions
    };
  }

  async getAgentPermissions() {
    const permissions = await AgentPermission.findAll({
      include: [
        { model: Permission, as: 'permission' }
      ],
      order: [['module', 'ASC'], ['permission_code', 'ASC']]
    });

    return {
      role: 'FIELD_AGENT',
      count: permissions.length,
      table: 'agent_permissions',
      permissions
    };
  }

  async createPermission(data) {
    const existing = await Permission.findOne({ where: { code: data.code } });
    if (existing) {
      throw ApiError.conflict(`Permission with code '${data.code}' already exists`);
    }

    return Permission.create(data);
  }

  async assignPermissionToRole(roleId, permissionId) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw ApiError.notFound(`Role with id '${roleId}' not found`);
    }

    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      throw ApiError.notFound(`Permission with id '${permissionId}' not found`);
    }

    const existing = await RolePermission.findOne({
      where: { role_id: roleId, permission_id: permissionId }
    });

    if (existing) {
      throw ApiError.conflict(`Permission '${permission.code}' is already assigned to role '${role.code}'`);
    }

    const assignment = await RolePermission.create({
      role_id: roleId,
      permission_id: permissionId
    });

    // Also sync to the dedicated role table
    const roleTableData = {
      role_id: roleId,
      permission_id: permissionId,
      permission_code: permission.code,
      module: permission.module,
      description: permission.description
    };

    if (role.code === 'ADMIN') {
      await AdminPermission.create(roleTableData);
    } else if (role.code === 'SUPERVISOR') {
      await SupervisorPermission.create(roleTableData);
    } else if (role.code === 'FIELD_AGENT') {
      await AgentPermission.create(roleTableData);
    }

    return assignment;
  }

  async revokePermissionFromRole(roleId, permissionId) {
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw ApiError.notFound(`Role with id '${roleId}' not found`);
    }

    const deleted = await RolePermission.destroy({
      where: { role_id: roleId, permission_id: permissionId }
    });

    if (role.code === 'ADMIN') {
      await AdminPermission.destroy({ where: { role_id: roleId, permission_id: permissionId } });
    } else if (role.code === 'SUPERVISOR') {
      await SupervisorPermission.destroy({ where: { role_id: roleId, permission_id: permissionId } });
    } else if (role.code === 'FIELD_AGENT') {
      await AgentPermission.destroy({ where: { role_id: roleId, permission_id: permissionId } });
    }

    return { revoked: deleted > 0 };
  }
}

module.exports = new PermissionService();
