'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add collected_at column to payments table
    await queryInterface.addColumn('payments', 'collected_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    });

    // 2. Create payment_allocations table
    await queryInterface.createTable('payment_allocations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      payment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'payments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      installment_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      allocated_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
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

    await queryInterface.addIndex('payment_allocations', ['payment_id'], {
      name: 'payment_allocations_payment_id_idx'
    });
    await queryInterface.addIndex('payment_allocations', ['installment_id'], {
      name: 'payment_allocations_installment_id_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_allocations');
    await queryInterface.removeColumn('payments', 'collected_at');
  }
};
