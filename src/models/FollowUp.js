const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');
const { FOLLOW_UP_TYPE, FOLLOW_UP_STATUS } = require('../constants/statusCodes');

class FollowUp extends Model {
  static initModel(sequelize) {
    return FollowUp.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        assignment_id: {
          type: DataTypes.STRING(36),
          allowNull: true,
          references: {
            model: 'customer_agent_assignments',
            key: 'id'
          }
        },
        customer_id: {
          type: DataTypes.STRING(36),
          allowNull: false,
          references: {
            model: 'customers',
            key: 'id'
          }
        },
        agent_id: {
          type: DataTypes.STRING(36),
          allowNull: false,
          references: {
            model: 'agents',
            key: 'id'
          }
        },
        visit_id: {
          type: DataTypes.STRING(36),
          allowNull: true,
          references: {
            model: 'field_visits',
            key: 'id'
          }
        },
        scheduled_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        follow_up_type: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: FOLLOW_UP_TYPE.CALL
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: FOLLOW_UP_STATUS.PENDING
        },
        completed_at: {
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
        modelName: 'FollowUp',
        tableName: 'follow_ups',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    FollowUp.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    FollowUp.belongsTo(models.Agent, { foreignKey: 'agent_id', as: 'agent' });
    FollowUp.belongsTo(models.CustomerAgentAssignment, { foreignKey: 'assignment_id', as: 'assignment' });
    FollowUp.belongsTo(models.FieldVisit, { foreignKey: 'visit_id', as: 'visit' });
  }
}

module.exports = FollowUp;
