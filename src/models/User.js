const { DataTypes, Model } = require('sequelize');
const { USER_STATUS } = require('../constants/statusCodes');
const { generateUuid } = require('../utils/uuid');

class User extends Model {
  static initModel(sequelize) {
    return User.init(
      {
        id: {
          type: DataTypes.STRING(36),
          defaultValue: () => generateUuid(),
          primaryKey: true,
          allowNull: false
        },
        role_id: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: {
            model: 'roles',
            key: 'id'
          }
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        email: {
          type: DataTypes.STRING(150),
          allowNull: true,
          unique: true
        },
        mobile: {
          type: DataTypes.STRING(20),
          allowNull: true,
          unique: true
        },
        password_hash: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        status: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: USER_STATUS.ACTIVE
        },
        email_verified_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        email_verification_otp: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        email_verification_expires_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        mobile_verified_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        mobile_verification_otp: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        mobile_verification_expires_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        last_login_at: {
          type: DataTypes.DATE,
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
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        underscored: true,
        paranoid: true
      }
    );
  }

  static associate(models) {
    User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    User.hasOne(models.Supervisor, { foreignKey: 'user_id', as: 'supervisor' });
    User.hasOne(models.Agent, { foreignKey: 'user_id', as: 'agent' });
    User.hasMany(models.RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });
    User.hasMany(models.LoginAudit, { foreignKey: 'user_id', as: 'loginAudits' });
    User.hasMany(models.Customer, { foreignKey: 'created_by', as: 'createdCustomers' });
  }

  // Safe JSON serialization omitting password_hash and internal OTP hashes
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.email_verification_otp;
    delete values.mobile_verification_otp;
    return values;
  }
}

module.exports = User;
