const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class FollowUpTask extends Model {
  static initModel(sequelize) {
    return FollowUpTask.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        promise_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'promises_to_pay',
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
        action_date: {
          type: DataTypes.DATE,
          allowNull: false
        },
        assigned_employee_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        task_type: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'PTP_FOLLOWUP'
        },
        completion_status: {
          type: DataTypes.STRING(30),
          allowNull: false,
          defaultValue: 'PENDING'
        },
        outcome: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        remarks: {
          type: DataTypes.STRING(1000),
          allowNull: true
        },
        completed_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'FollowUpTask',
        tableName: 'follow_up_tasks',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    FollowUpTask.belongsTo(models.PromiseToPay, { foreignKey: 'promise_id', as: 'promise' });
    FollowUpTask.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    FollowUpTask.belongsTo(models.User, { foreignKey: 'assigned_employee_id', as: 'assignedEmployee' });
  }
}

module.exports = FollowUpTask;
