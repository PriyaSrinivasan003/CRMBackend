const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class Permission extends Model {
  static initModel(sequelize) {
    return Permission.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        code: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        module: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        description: {
          type: DataTypes.STRING(255),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Permission',
        tableName: 'permissions',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles'
    });
    Permission.hasMany(models.RolePermission, { foreignKey: 'permission_id', as: 'rolePermissions' });
    Permission.hasMany(models.AdminPermission, { foreignKey: 'permission_id', as: 'adminPermissions' });
    Permission.hasMany(models.SupervisorPermission, { foreignKey: 'permission_id', as: 'supervisorPermissions' });
    Permission.hasMany(models.AgentPermission, { foreignKey: 'permission_id', as: 'agentPermissions' });
  }
}

module.exports = Permission;
