'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create organizations table
    await queryInterface.createTable('organizations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('organizations', ['code'], { unique: true, name: 'organizations_code_unique_idx' });
    await queryInterface.addIndex('organizations', ['status'], { name: 'organizations_status_idx' });

    // 2. Insert default organization for existing seed data
    const defaultOrgId = '00000000-0000-4000-a000-000000000001';
    await queryInterface.bulkInsert('organizations', [
      {
        id: defaultOrgId,
        name: 'Default Organization',
        code: 'ORG-DEF-001',
        email: 'org@collectagent.com',
        phone: '9876543210',
        address: 'Central Headquarters',
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 3. Add organisation_id column to branches table
    await queryInterface.addColumn('branches', 'organisation_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // 4. Update existing branches to have default organisation_id
    await queryInterface.sequelize.query(
      `UPDATE branches SET organisation_id = '${defaultOrgId}' WHERE organisation_id IS NULL;`
    );

    await queryInterface.addIndex('branches', ['organisation_id'], { name: 'branches_organisation_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('branches', 'branches_organisation_id_idx');
    await queryInterface.removeColumn('branches', 'organisation_id');
    await queryInterface.dropTable('organizations');
  }
};
