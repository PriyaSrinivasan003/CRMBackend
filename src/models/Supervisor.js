const { DataTypes, Model } = require('sequelize');
const { SUPERVISOR_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class Supervisor extends Model {
  static initModel(sequelize) {
    return Supervisor.init(
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
        employee_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        branch_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'branches',
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
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: SUPERVISOR_STATUS.ACTIVE
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
        modelName: 'Supervisor',
        tableName: 'supervisors',
        timestamps: true,
        underscored: true,
        paranoid: true
      }
    );
  }

  static associate(models) {
    Supervisor.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Supervisor.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Supervisor.hasMany(models.Agent, { foreignKey: 'supervisor_id', as: 'agents' });
    Supervisor.hasMany(models.AgentSupervisorAssignment, { foreignKey: 'supervisor_id', as: 'assignments' });
  }
}

module.exports = Supervisor;
