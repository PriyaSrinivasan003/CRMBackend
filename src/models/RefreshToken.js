const { DataTypes, Model } = require('sequelize');
const { generateUuid } = require('../utils/uuid');

class RefreshToken extends Model {
  static initModel(sequelize) {
    return RefreshToken.init(
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
          references: {
            model: 'users',
            key: 'id'
          }
        },
        token_hash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        revoked_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        modelName: 'RefreshToken',
        tableName: 'refresh_tokens',
        timestamps: true,
        underscored: true
      }
    );
  }

  static associate(models) {
    RefreshToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

module.exports = RefreshToken;
