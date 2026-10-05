'use strict';

const ROLES_TO_SEED = [
  {
    id: 'ADMIN',
    name: 'Administrator',
    code: 'ADMIN',
    description: 'System Administrator with full access',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'SUPERVISOR',
    name: 'Supervisor',
    code: 'SUPERVISOR',
    description: 'Supervisor managing team of collection agents',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'FIELD_AGENT',
    name: 'Field Agent',
    code: 'FIELD_AGENT',
    description: 'Field Agent performing field collections and customer visits',
    created_at: new Date(),
    updated_at: new Date()
  }
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const referencingTables = [
      'users',
      'role_permissions',
      'admin_permissions',
      'supervisor_permissions',
      'agent_permissions'
    ];

    for (const role of ROLES_TO_SEED) {
      const existingId = await queryInterface.rawSelect('roles', { where: { code: role.code } }, ['id']);

      if (!existingId) {
        await queryInterface.bulkInsert('roles', [role]);
      } else if (existingId !== role.id) {
        for (const table of referencingTables) {
          try {
            await queryInterface.bulkUpdate(table, { role_id: role.id }, { role_id: existingId });
          } catch (e) {}
        }
        await queryInterface.bulkUpdate('roles', { id: role.id }, { id: existingId });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      code: { [Sequelize.Op.in]: ['ADMIN', 'SUPERVISOR', 'FIELD_AGENT'] }
    });
  }
};
