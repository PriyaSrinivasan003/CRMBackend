const { DataTypes, Model } = require('sequelize');
const { PAYMENT_MODE_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class PaymentMode extends Model {
  static initModel(sequelize) {
    return PaymentMode.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: PAYMENT_MODE_STATUS.ACTIVE
        }
      },
      {
        sequelize,
        modelName: 'PaymentMode',
        tableName: 'payment_modes',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    PaymentMode.hasMany(models.Payment, { foreignKey: 'payment_mode_id', as: 'payments' });
  }
}

module.exports = PaymentMode;
