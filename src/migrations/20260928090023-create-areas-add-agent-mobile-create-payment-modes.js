'use strict';
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create areas table
    await queryInterface.createTable('areas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      area_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
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

    await queryInterface.addIndex('areas', ['branch_id'], { name: 'areas_branch_id_idx' });
    await queryInterface.addIndex('areas', ['area_code'], { unique: true, name: 'areas_area_code_unique_idx' });
    await queryInterface.addIndex('areas', ['status'], { name: 'areas_status_idx' });

    // 2. Add mobile column to agents table
    await queryInterface.addColumn('agents', 'mobile', {
      type: Sequelize.STRING(20),
      allowNull: true
    });

    // 3. Create payment_modes table
    await queryInterface.createTable('payment_modes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
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

    await queryInterface.addIndex('payment_modes', ['code'], { unique: true, name: 'payment_modes_code_unique_idx' });
    await queryInterface.addIndex('payment_modes', ['status'], { name: 'payment_modes_status_idx' });

    // Seed standard payment modes using queryInterface.bulkInsert (no direct SQL queries)
    const now = new Date();
    const defaultModes = [
      {
        id: crypto.randomUUID().replace(/-/g, ''),
        code: 'CASH',
        name: 'Cash',
        status: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: crypto.randomUUID().replace(/-/g, ''),
        code: 'UPI',
        name: 'UPI',
        status: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: crypto.randomUUID().replace(/-/g, ''),
        code: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        status: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: crypto.randomUUID().replace(/-/g, ''),
        code: 'CHEQUE',
        name: 'Cheque',
        status: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: crypto.randomUUID().replace(/-/g, ''),
        code: 'OTHER',
        name: 'Other',
        status: 1,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('payment_modes', defaultModes);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payment_modes');
    await queryInterface.removeColumn('agents', 'mobile');
    await queryInterface.dropTable('areas');
  }
};
