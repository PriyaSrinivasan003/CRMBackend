const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class PromiseToPay extends Model {
  static initModel(sequelize) {
    return PromiseToPay.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        collection_case_id: {
          type: DataTypes.UUID,
          allowNull: true,
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
        promised_amount: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false
        },
        promised_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'OPEN'
        },
        recorded_by: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        recorded_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        resolved_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        remarks: {
          type: DataTypes.STRING(1000),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'PromiseToPay',
        tableName: 'promises_to_pay',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    PromiseToPay.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    PromiseToPay.belongsTo(models.Collection, { foreignKey: 'collection_case_id', as: 'collectionCase' });
    PromiseToPay.belongsTo(models.User, { foreignKey: 'recorded_by', as: 'recordedByUser' });
    PromiseToPay.hasMany(models.FollowUpTask, { foreignKey: 'promise_id', as: 'followUpTasks' });
  }
}

module.exports = PromiseToPay;
