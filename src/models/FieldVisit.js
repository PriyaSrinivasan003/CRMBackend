const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');
const { VISIT_OUTCOME } = require('../constants/statusCodes');

class FieldVisit extends Model {
  static initModel(sequelize) {
    return FieldVisit.init(
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
        visit_date: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        visit_outcome: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: VISIT_OUTCOME.CUSTOMER_CONTACTED
        },
        remarks: {
          type: DataTypes.STRING(1000),
          allowNull: true
        },
        next_follow_up_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'FieldVisit',
        tableName: 'field_visits',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    FieldVisit.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    FieldVisit.belongsTo(models.Agent, { foreignKey: 'agent_id', as: 'agent' });
    FieldVisit.belongsTo(models.CustomerAgentAssignment, { foreignKey: 'assignment_id', as: 'assignment' });
    FieldVisit.hasMany(models.FollowUp, { foreignKey: 'visit_id', as: 'followUps' });
  }
}

module.exports = FieldVisit;
