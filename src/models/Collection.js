const { DataTypes, Model } = require('sequelize');
const { COLLECTION_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class Collection extends Model {
  static initModel(sequelize) {
    return Collection.init(
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
        assignment_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'customer_agent_assignments',
            key: 'id'
          }
        },
        collection_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        amount_due: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false
        },
        amount_collected: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0.00
        },
        collection_status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: COLLECTION_STATUS.PENDING
        },
        remarks: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: true
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: true
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'Collection',
        tableName: 'collections',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    Collection.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
    Collection.belongsTo(models.Agent, { foreignKey: 'agent_id', as: 'agent' });
    Collection.belongsTo(models.CustomerAgentAssignment, { foreignKey: 'assignment_id', as: 'assignment' });
    Collection.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Collection.hasMany(models.Payment, { foreignKey: 'collection_id', as: 'payments' });
  }
}

module.exports = Collection;
