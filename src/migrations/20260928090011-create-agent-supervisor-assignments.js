'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agent_supervisor_assignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      supervisor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'supervisors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      agent_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'agents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      assigned_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      effective_from: {
        type: Sequelize.DATE,
        allowNull: false
      },
      effective_to: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '0: Inactive, 1: Active'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('agent_supervisor_assignments', ['supervisor_id'], { name: 'asa_supervisor_id_idx' });
    await queryInterface.addIndex('agent_supervisor_assignments', ['agent_id'], { name: 'asa_agent_id_idx' });
    await queryInterface.addIndex('agent_supervisor_assignments', ['status'], { name: 'asa_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agent_supervisor_assignments');
  }
};
