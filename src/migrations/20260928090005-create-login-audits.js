'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('login_audits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      login_identifier: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      success: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Failed, 1: Success'
      },
      failure_reason: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('login_audits', ['user_id'], { name: 'login_audits_user_id_idx' });
    await queryInterface.addIndex('login_audits', ['created_at'], { name: 'login_audits_created_at_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('login_audits');
  }
};
