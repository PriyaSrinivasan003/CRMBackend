'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      supervisor_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'supervisors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      employee_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      joining_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      emergency_contact: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      government_id_reference: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 1,
        comment: '0: Inactive, 1: Active, 2: Suspended, 3: Terminated'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex('agents', ['user_id'], { unique: true, name: 'agents_user_id_unique_idx' });
    await queryInterface.addIndex('agents', ['employee_code'], { unique: true, name: 'agents_employee_code_unique_idx' });
    await queryInterface.addIndex('agents', ['supervisor_id'], { name: 'agents_supervisor_id_idx' });
    await queryInterface.addIndex('agents', ['branch_id'], { name: 'agents_branch_id_idx' });
    await queryInterface.addIndex('agents', ['status'], { name: 'agents_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agents');
  }
};
