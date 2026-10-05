const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class AdminPermission extends Model {
  static initModel(sequelize) {
    return AdminPermission.init(
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
        modelName: 'AdminPermission',
        tableName: 'admin_permissions',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    AdminPermission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    AdminPermission.belongsTo(models.Permission, { foreignKey: 'permission_id', as: 'permission' });
  }
}

module.exports = AdminPermission;
