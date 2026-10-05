const { DataTypes, Model } = require('sequelize');
const { ASSIGNMENT_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class AgentSupervisorAssignment extends Model {
  static initModel(sequelize) {
    return AgentSupervisorAssignment.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        supervisor_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'supervisors',
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
        modelName: 'AgentSupervisorAssignment',
        tableName: 'agent_supervisor_assignments',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    AgentSupervisorAssignment.belongsTo(models.Supervisor, { foreignKey: 'supervisor_id', as: 'supervisor' });
    AgentSupervisorAssignment.belongsTo(models.Agent, { foreignKey: 'agent_id', as: 'agent' });
    AgentSupervisorAssignment.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'assigner' });
  }
}

module.exports = AgentSupervisorAssignment;
