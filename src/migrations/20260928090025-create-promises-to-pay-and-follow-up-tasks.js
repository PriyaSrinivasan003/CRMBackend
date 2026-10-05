'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create promises_to_pay table
    await queryInterface.createTable('promises_to_pay', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      collection_case_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'collections',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      promised_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      promised_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'OPEN',
        comment: 'OPEN, KEPT, BROKEN, CANCELLED'
      },
      recorded_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      remarks: {
        type: Sequelize.STRING(1000),
        allowNull: true
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

    await queryInterface.addIndex('promises_to_pay', ['customer_id'], { name: 'promises_to_pay_customer_id_idx' });
    await queryInterface.addIndex('promises_to_pay', ['collection_case_id'], { name: 'promises_to_pay_case_id_idx' });
    await queryInterface.addIndex('promises_to_pay', ['recorded_by'], { name: 'promises_to_pay_recorded_by_idx' });
    await queryInterface.addIndex('promises_to_pay', ['status'], { name: 'promises_to_pay_status_idx' });
    await queryInterface.addIndex('promises_to_pay', ['promised_date'], { name: 'promises_to_pay_promised_date_idx' });

    // 2. Create follow_up_tasks table
    await queryInterface.createTable('follow_up_tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      promise_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'promises_to_pay',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      action_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      assigned_employee_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      task_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'PTP_FOLLOWUP'
      },
      completion_status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'PENDING',
        comment: 'PENDING, COMPLETED, CANCELLED, OVERDUE'
      },
      outcome: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      remarks: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('follow_up_tasks', ['promise_id'], { name: 'follow_up_tasks_promise_id_idx' });
    await queryInterface.addIndex('follow_up_tasks', ['customer_id'], { name: 'follow_up_tasks_customer_id_idx' });
    await queryInterface.addIndex('follow_up_tasks', ['assigned_employee_id'], { name: 'follow_up_tasks_employee_idx' });
    await queryInterface.addIndex('follow_up_tasks', ['action_date'], { name: 'follow_up_tasks_action_date_idx' });
    await queryInterface.addIndex('follow_up_tasks', ['completion_status'], { name: 'follow_up_tasks_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('follow_up_tasks');
    await queryInterface.dropTable('promises_to_pay');
  }
};
