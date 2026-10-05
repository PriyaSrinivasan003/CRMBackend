const { DataTypes, Model } = require('sequelize');
const { ASSIGNMENT_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class CustomerAgentAssignment extends Model {
  static initModel(sequelize) {
    return CustomerAgentAssignment.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
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
        assigned_by: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        assigned_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        effective_from: {
          type: DataTypes.DATE,
          allowNull: false
        },
        effective_to: {
          type: DataTypes.DATE,
          allowNull: true
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: ASSIGNMENT_STATUS.ACTIVE
        }
      },
      {
        sequelize,
        modelName: 'CustomerAgentAssignment',
        tableName: 'customer_agent_assignments',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    CustomerAgentAssignment.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    CustomerAgentAssignment.belongsTo(models.Agent, { foreignKey: 'agent_id', as: 'agent' });
    CustomerAgentAssignment.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'assigner' });
  }
}

module.exports = CustomerAgentAssignment;
