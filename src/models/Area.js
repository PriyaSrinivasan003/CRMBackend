const { DataTypes, Model } = require('sequelize');
const { AREA_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class Area extends Model {
  static initModel(sequelize) {
    return Area.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        branch_id: {
          type: DataTypes.STRING(36),
          allowNull: false,
          references: {
            model: 'branches',
            key: 'id'
          }
        },
        area_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: AREA_STATUS.ACTIVE
        }
      },
      {
        sequelize,
        modelName: 'Area',
        tableName: 'areas',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    Area.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Area.hasMany(models.Customer, { foreignKey: 'area_id', as: 'customers' });
    Area.hasMany(models.Agent, { foreignKey: 'area_id', as: 'agents' });
  }
}

module.exports = Area;
