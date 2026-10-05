const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class PaymentAllocation extends Model {
  static initModel(sequelize) {
    return PaymentAllocation.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        payment_id: {
          type: DataTypes.STRING(36),
          allowNull: false,
          references: {
            model: 'payments',
            key: 'id'
          }
        },
        installment_id: {
          type: DataTypes.STRING(36),
          allowNull: true
        },
        allocated_amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false
        }
      },
      {
        sequelize,
        modelName: 'PaymentAllocation',
        tableName: 'payment_allocations',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    PaymentAllocation.belongsTo(models.Payment, { foreignKey: 'payment_id', as: 'payment' });
  }
}

module.exports = PaymentAllocation;
