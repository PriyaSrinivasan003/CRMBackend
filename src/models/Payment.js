const { DataTypes, Model } = require('sequelize');
const { PAYMENT_STATUS, PAYMENT_METHOD } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class Payment extends Model {
  static initModel(sequelize) {
    return Payment.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        collection_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'collections',
            key: 'id'
          }
        },
        customer_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'customers',
            key: 'id'
          }
        },
        agent_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'agents',
            key: 'id'
          }
        },
        receipt_number: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        amount: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false
        },
        payment_method: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: PAYMENT_METHOD.CASH
        },
        payment_mode_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'payment_modes',
            key: 'id'
          }
        },
        transaction_reference: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        payment_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        collected_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        },
        payment_status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: PAYMENT_STATUS.CONFIRMED
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'Payment',
        tableName: 'payments',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    Payment.belongsTo(models.Collection, { foreignKey: 'collection_id', as: 'collection' });
    Payment.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    Payment.belongsTo(models.Agent, { foreignKey: 'agent_id', as: 'agent' });
    Payment.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Payment.hasMany(models.PaymentAllocation, { foreignKey: 'payment_id', as: 'allocations' });
    Payment.belongsTo(models.PaymentMode, { foreignKey: 'payment_mode_id', as: 'paymentMode' });
  }
}

module.exports = Payment;
