const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class PasswordResetOtp extends Model {
  static initModel(sequelize) {
    return PasswordResetOtp.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        otp_hash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        is_used: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      },
      {
        sequelize,
        modelName: 'PasswordResetOtp',
        tableName: 'password_reset_otps',
        timestamps: true,
        updatedAt: false,
        createdAt: 'created_at',
        underscored: true
      }
    );
  }

  static associate(models) {
    PasswordResetOtp.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = PasswordResetOtp;
