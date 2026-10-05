'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add payment_mode_id to payments table
    await queryInterface.addColumn('payments', 'payment_mode_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'payment_modes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('payments', ['payment_mode_id'], {
      name: 'payments_payment_mode_id_idx'
    });

    // 2. Add area_id to customers table
    await queryInterface.addColumn('customers', 'area_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'areas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('customers', ['area_id'], {
      name: 'customers_area_id_idx'
    });

    // 3. Add area_id to agents table
    await queryInterface.addColumn('agents', 'area_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'areas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('agents', ['area_id'], {
      name: 'agents_area_id_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('agents', 'area_id');
    await queryInterface.removeColumn('customers', 'area_id');
    await queryInterface.removeColumn('payments', 'payment_mode_id');
  }
};
