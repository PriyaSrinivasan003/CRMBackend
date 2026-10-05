const { DataTypes, Model } = require('sequelize');
const { BRANCH_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class Branch extends Model {
  static initModel(sequelize) {
    return Branch.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        branch_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        branch_name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        city: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        state: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        pincode: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: BRANCH_STATUS.ACTIVE
        },
        organisation_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'organizations',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'Branch',
        tableName: 'branches',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    Branch.belongsTo(models.Organization, { foreignKey: 'organisation_id', as: 'organisation' });
    Branch.hasMany(models.Supervisor, { foreignKey: 'branch_id', as: 'supervisors' });
    Branch.hasMany(models.Agent, { foreignKey: 'branch_id', as: 'agents' });
    Branch.hasMany(models.Customer, { foreignKey: 'branch_id', as: 'customers' });
    Branch.hasMany(models.Area, { foreignKey: 'branch_id', as: 'areas' });
  }
}

module.exports = Branch;
