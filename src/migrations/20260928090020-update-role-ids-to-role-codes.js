'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const generateRoleId = (name) => {
      if (!name) return '';
      const trimmed = name.trim();
      if (/^admin(istrator)?$/i.test(trimmed)) return 'ADMIN';
      if (/^supervisor$/i.test(trimmed)) return 'SUPERVISOR';
      if (/^field[ _-]?agent$/i.test(trimmed)) return 'FIELD_AGENT';
      return trimmed
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    };

    const referencingTables = [
      'users',
      'role_permissions',
      'admin_permissions',
      'supervisor_permissions',
      'agent_permissions'
    ];

    // 1. Identify and temporarily drop foreign key constraints using queryInterface
    const droppedConstraints = {};
    for (const table of referencingTables) {
      try {
        const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(table);
        const roleFk = foreignKeys.find((fk) => fk.columnName === 'role_id');
        if (roleFk && roleFk.constraintName) {
          await queryInterface.removeConstraint(table, roleFk.constraintName);
          droppedConstraints[table] = roleFk.constraintName;
        }
      } catch (err) {
        console.warn(`[Migration 20] Remove constraint on ${table}: ${err.message}`);
      }
    }

    // 2. Change column definitions to STRING(50) using queryInterface.changeColumn
    await queryInterface.changeColumn('roles', 'id', {
      type: Sequelize.STRING(50),
      allowNull: false
    });

    for (const table of referencingTables) {
      try {
        await queryInterface.changeColumn(table, 'role_id', {
          type: Sequelize.STRING(50),
          allowNull: false
        });
      } catch (err) {
        console.warn(`[Migration 20] Change column ${table}.role_id: ${err.message}`);
      }
    }

    // 3. Retrieve all roles using queryInterface.select
    const existingRoles = await queryInterface.select(null, 'roles');

    // 4. Update role IDs and referencing tables using queryInterface.bulkUpdate
    for (const role of existingRoles) {
      const oldId = role.id;
      let newId = role.code ? role.code.toUpperCase() : generateRoleId(role.name);
      if (role.name && /^admin(istrator)?$/i.test(role.name.trim())) {
        newId = 'ADMIN';
      }

      if (!newId || oldId === newId) {
        continue;
      }

      // Update primary key in roles table
      await queryInterface.bulkUpdate('roles', { id: newId }, { id: oldId });

      // Update foreign key in all referencing tables
      for (const table of referencingTables) {
        try {
          await queryInterface.bulkUpdate(table, { role_id: newId }, { role_id: oldId });
        } catch (err) {
          console.warn(`[Migration 20] Bulk update ${table}.role_id: ${err.message}`);
        }
      }
    }

    // 5. Update any known standard UUIDs using queryInterface.bulkUpdate
    const standardRoleMappings = [
      {
        newId: 'ADMIN',
        oldIds: ['e8b15d2a43cf46d2a7d5d0537248c8b1', 'e8b15d2a-43cf-46d2-a7d5-d0537248c8b1']
      },
      {
        newId: 'SUPERVISOR',
        oldIds: ['a3f72e619c844e1a8b3d27f94e18d6a2', 'a3f72e61-9c84-4e1a-8b3d-27f94e18d6a2']
      },
      {
        newId: 'FIELD_AGENT',
        oldIds: ['b6d49c831e574a029f2b83c71a5e9d03', 'b6d49c83-1e57-4a02-9f2b-83c71a5e9d03']
      }
    ];

    for (const mapping of standardRoleMappings) {
      for (const oldId of mapping.oldIds) {
        await queryInterface.bulkUpdate('roles', { id: mapping.newId }, { id: oldId });
        for (const table of referencingTables) {
          try {
            await queryInterface.bulkUpdate(table, { role_id: mapping.newId }, { role_id: oldId });
          } catch (e) {}
        }
      }
    }

    // 6. Re-add foreign key constraints using queryInterface.addConstraint
    for (const table of referencingTables) {
      const constraintName = droppedConstraints[table] || `${table}_role_id_roles_fk`;
      try {
        await queryInterface.addConstraint(table, {
          fields: ['role_id'],
          type: 'foreign key',
          name: constraintName,
          references: {
            table: 'roles',
            field: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      } catch (err) {
        console.warn(`[Migration 20] Re-add constraint on ${table}: ${err.message}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const referencingTables = [
      'users',
      'role_permissions',
      'admin_permissions',
      'supervisor_permissions',
      'agent_permissions'
    ];

    // 1. Temporarily remove constraints
    for (const table of referencingTables) {
      try {
        const foreignKeys = await queryInterface.getForeignKeyReferencesForTable(table);
        const roleFk = foreignKeys.find((fk) => fk.columnName === 'role_id');
        if (roleFk && roleFk.constraintName) {
          await queryInterface.removeConstraint(table, roleFk.constraintName);
        }
      } catch (e) {}
    }

    // 2. Revert role IDs using queryInterface.bulkUpdate
    const reverseRoleMappings = [
      { newId: 'ADMIN', oldId: 'e8b15d2a43cf46d2a7d5d0537248c8b1' },
      { newId: 'SUPERVISOR', oldId: 'a3f72e619c844e1a8b3d27f94e18d6a2' },
      { newId: 'FIELD_AGENT', oldId: 'b6d49c831e574a029f2b83c71a5e9d03' }
    ];

    for (const mapping of reverseRoleMappings) {
      await queryInterface.bulkUpdate('roles', { id: mapping.oldId }, { id: mapping.newId });
      for (const table of referencingTables) {
        try {
          await queryInterface.bulkUpdate(table, { role_id: mapping.oldId }, { role_id: mapping.newId });
        } catch (e) {}
      }
    }

    // 3. Re-add foreign key constraints
    for (const table of referencingTables) {
      try {
        await queryInterface.addConstraint(table, {
          fields: ['role_id'],
          type: 'foreign key',
          name: `${table}_role_id_roles_fk`,
          references: {
            table: 'roles',
            field: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      } catch (e) {}
    }
  }
};
