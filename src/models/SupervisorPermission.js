const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class SupervisorPermission extends Model {
  static initModel(sequelize) {
    return SupervisorPermission.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        role_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: 'roles',
            key: 'id'
          }
        },
        permission_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'permissions',
            key: 'id'
          }
        },
        permission_code: {
          type: DataTypes.STRING(100),
          allowNull: false
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
        modelName: 'SupervisorPermission',
        tableName: 'supervisor_permissions',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    SupervisorPermission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    SupervisorPermission.belongsTo(models.Permission, { foreignKey: 'permission_id', as: 'permission' });
  }
}

module.exports = SupervisorPermission;
