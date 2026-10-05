const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class Organization extends Model {
  static initModel(sequelize) {
    return Organization.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        email: {
          type: DataTypes.STRING(150),
          allowNull: true
        },
        phone: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 1
        }
      },
      {
        sequelize,
        modelName: 'Organization',
        tableName: 'organizations',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    Organization.hasMany(models.Branch, { foreignKey: 'organisation_id', as: 'branches' });
  }
}

module.exports = Organization;
