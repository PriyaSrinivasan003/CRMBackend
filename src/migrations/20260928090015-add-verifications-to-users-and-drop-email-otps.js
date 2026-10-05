'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add email verification OTP columns to users
    await queryInterface.addColumn('users', 'email_verification_otp', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'email_verification_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 2. Add mobile verification columns to users
    await queryInterface.addColumn('users', 'mobile_verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'mobile_verification_otp', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'mobile_verification_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 3. Drop separate email_verification_otps table
    await queryInterface.dropTable('email_verification_otps');
  },

  async down(queryInterface, Sequelize) {
    // 1. Recreate email_verification_otps table
    await queryInterface.createTable('email_verification_otps', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      otp_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('email_verification_otps', ['user_id'], { name: 'email_verif_user_id_idx' });

    // 2. Remove columns from users
    await queryInterface.removeColumn('users', 'email_verification_otp');
    await queryInterface.removeColumn('users', 'email_verification_expires_at');
    await queryInterface.removeColumn('users', 'mobile_verified_at');
    await queryInterface.removeColumn('users', 'mobile_verification_otp');
    await queryInterface.removeColumn('users', 'mobile_verification_expires_at');
  }
};
