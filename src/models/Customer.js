const { DataTypes, Model } = require('sequelize');
const { CUSTOMER_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class Customer extends Model {
  static initModel(sequelize) {
    return Customer.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        customer_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        full_name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        mobile: {
          type: DataTypes.STRING(20),
          allowNull: false
        },
        alternate_mobile: {
          type: DataTypes.STRING(20),
          allowNull: true
        },
        email: {
          type: DataTypes.STRING(150),
          allowNull: true
        },
        date_of_birth: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        address_line1: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        address_line2: {
          type: DataTypes.STRING(255),
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
        branch_id: {
          type: DataTypes.UUID,
          allowNull: false,
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
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: CUSTOMER_STATUS.ACTIVE
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
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
        modelName: 'Customer',
        tableName: 'customers',
        timestamps: true,
        underscored: true,
        paranoid: true
      }
    );
  }

  static associate(models) {
    Customer.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    Customer.belongsTo(models.Area, { foreignKey: 'area_id', as: 'area' });
    Customer.hasMany(models.CustomerAgentAssignment, { foreignKey: 'customer_id', as: 'assignments' });
    Customer.hasMany(models.Collection, { foreignKey: 'customer_id', as: 'collections' });
    Customer.hasMany(models.Payment, { foreignKey: 'customer_id', as: 'payments' });
    Customer.hasMany(models.FieldVisit, { foreignKey: 'customer_id', as: 'fieldVisits' });
    Customer.hasMany(models.FollowUp, { foreignKey: 'customer_id', as: 'followUps' });
    Customer.hasMany(models.PromiseToPay, { foreignKey: 'customer_id', as: 'promisesToPay' });
    Customer.hasMany(models.FollowUpTask, { foreignKey: 'customer_id', as: 'followUpTasks' });
    Customer.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  }
}

module.exports = Customer;
