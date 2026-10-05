const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class LoginAudit extends Model {
  static initModel(sequelize) {
    return LoginAudit.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        login_identifier: {
          type: DataTypes.STRING(150),
          allowNull: true
        },
        ip_address: {
          type: DataTypes.STRING(45),
          allowNull: true
        },
        user_agent: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        success: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 0
        },
        failure_reason: {
          type: DataTypes.STRING(255),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'LoginAudit',
        tableName: 'login_audits',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
        underscored: true
      }
    );
  }

  static associate(models) {
    LoginAudit.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = LoginAudit;
