const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

/**
 * Automatically creates a role ID based on the role name.
 * e.g., 'Administrator' -> 'ADMIN', 'Supervisor' -> 'SUPERVISOR', 'Field Agent' -> 'FIELD_AGENT'
 */
const generateRoleId = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  if (/^admin(istrator)?$/i.test(trimmed)) return 'ADMIN';
  if (/^supervisor$/i.test(trimmed)) return 'SUPERVISOR';
  if (/^field[ _-]?agent$/i.test(trimmed)) return 'FIELD_AGENT';
  return trimmed
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

class Role extends Model {
  static initModel(sequelize) {
    return Role.init(
      {
        id: {
          type: DataTypes.STRING(50),
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        code: {
          type: DataTypes.STRING(30),
          allowNull: false,
          unique: true
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        timestamps: true,
        underscored: true,
        hooks: {
          beforeValidate: (role) => {
            if (role.name && !role.id) {
              role.id = generateRoleId(role.name);
            }
            if (role.id && !role.code) {
              role.code = role.id;
            }
          },
          beforeCreate: (role) => {
            if (role.name && !role.id) {
              role.id = generateRoleId(role.name);
            }
            if (role.id && !role.code) {
              role.code = role.id;
            }
          }
        }
      }
    );
  }

  static associate(models) {
    Role.hasMany(models.User, { foreignKey: 'role_id', as: 'users' });
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions'
    });
    Role.hasMany(models.RolePermission, { foreignKey: 'role_id', as: 'rolePermissions' });
    Role.hasMany(models.AdminPermission, { foreignKey: 'role_id', as: 'adminPermissions' });
    Role.hasMany(models.SupervisorPermission, { foreignKey: 'role_id', as: 'supervisorPermissions' });
    Role.hasMany(models.AgentPermission, { foreignKey: 'role_id', as: 'agentPermissions' });
  }
}

module.exports = Role;
