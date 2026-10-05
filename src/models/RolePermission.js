const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class RolePermission extends Model {
  static initModel(sequelize) {
    return RolePermission.init(
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
        }
      },
      {
        sequelize,
        modelName: 'RolePermission',
        tableName: 'role_permissions',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    RolePermission.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    RolePermission.belongsTo(models.Permission, { foreignKey: 'permission_id', as: 'permission' });
  }
}

module.exports = RolePermission;
