const { DataTypes, Model } = require('sequelize');
const { AGENT_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class Agent extends Model {
  static initModel(sequelize) {
    return Agent.init(
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
          unique: true,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        supervisor_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'supervisors',
            key: 'id'
          }
        },
        employee_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        mobile: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        branch_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'branches',
            key: 'id'
          }
        },
        area_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'areas',
            key: 'id'
          }
        },
        joining_date: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        date_of_birth: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        emergency_contact: {
          type: DataTypes.STRING(50),
          allowNull: true
        },
        government_id_reference: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: AGENT_STATUS.ACTIVE
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: true
        },
        updated_by: {
          type: DataTypes.UUID,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'Agent',
        tableName: 'agents',
        timestamps: true,
        underscored: true,
        paranoid: true
      }
    );
  }

  static associate(models) {
    Agent.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Agent.belongsTo(models.Supervisor, { foreignKey: 'supervisor_id', as: 'supervisor' });
    Agent.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Agent.belongsTo(models.Area, { foreignKey: 'area_id', as: 'area' });
    Agent.hasMany(models.AgentSupervisorAssignment, { foreignKey: 'agent_id', as: 'supervisorAssignments' });
    Agent.hasMany(models.CustomerAgentAssignment, { foreignKey: 'agent_id', as: 'customerAssignments' });
    Agent.hasMany(models.Collection, { foreignKey: 'agent_id', as: 'collections' });
    Agent.hasMany(models.Payment, { foreignKey: 'agent_id', as: 'payments' });
    Agent.hasMany(models.FieldVisit, { foreignKey: 'agent_id', as: 'fieldVisits' });
    Agent.hasMany(models.FollowUp, { foreignKey: 'agent_id', as: 'followUps' });
  }
}

module.exports = Agent;
