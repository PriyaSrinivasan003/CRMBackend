'use strict';
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const generateUuid = () => crypto.randomUUID().replace(/-/g, '');

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Update organizations with pseudo-numeric IDs (e.g. 0000000000004000a000000000000001)
    try {
      const orgRows = await queryInterface.sequelize.query(
        "SELECT id FROM `organizations` WHERE `id` LIKE '00000000%' OR `id` LIKE '10000000%' OR `id` LIKE '20000000%';",
        { type: Sequelize.QueryTypes.SELECT }
      );

      for (const org of orgRows) {
        const oldId = org.id;
        const newId = generateUuid();

        await queryInterface.sequelize.query(
          "UPDATE `organizations` SET `id` = :newId WHERE `id` = :oldId;",
          { replacements: { newId, oldId } }
        );

        await queryInterface.sequelize.query(
          "UPDATE `branches` SET `organisation_id` = :newId WHERE `organisation_id` = :oldId;",
          { replacements: { newId, oldId } }
        );
      }
    } catch (err) {
      console.warn(`[Migration 19] Notice updating organizations: ${err.message}`);
    }

    // 2. Update permissions with pseudo-numeric IDs (e.g. 1000000000004000a000000000000013)
    try {
      const permRows = await queryInterface.sequelize.query(
        "SELECT id FROM `permissions` WHERE `id` LIKE '10000000%' OR `id` LIKE '20000000%' OR `id` LIKE '00000000%';",
        { type: Sequelize.QueryTypes.SELECT }
      );

      for (const perm of permRows) {
        const oldId = perm.id;
        const newId = generateUuid();

        await queryInterface.sequelize.query(
          "UPDATE `permissions` SET `id` = :newId WHERE `id` = :oldId;",
          { replacements: { newId, oldId } }
        );

        const permTables = ['role_permissions', 'admin_permissions', 'supervisor_permissions', 'agent_permissions'];
        for (const tbl of permTables) {
          try {
            await queryInterface.sequelize.query(
              `UPDATE \`${tbl}\` SET \`permission_id\` = :newId WHERE \`permission_id\` = :oldId;`,
              { replacements: { newId, oldId } }
            );
          } catch (e) {
            // Ignore if table doesn't exist
          }
        }
      }
    } catch (err) {
      console.warn(`[Migration 19] Notice updating permissions: ${err.message}`);
    }

    // 3. Update junction / role permission table primary keys (e.g. 2000000000004000a000000000000211)
    const junctionTables = ['role_permissions', 'admin_permissions', 'supervisor_permissions', 'agent_permissions'];
    for (const tbl of junctionTables) {
      try {
        const rows = await queryInterface.sequelize.query(
          `SELECT id FROM \`${tbl}\` WHERE \`id\` LIKE '20000000%' OR \`id\` LIKE '10000000%' OR \`id\` LIKE '00000000%';`,
          { type: Sequelize.QueryTypes.SELECT }
        );

        for (const row of rows) {
          const oldId = row.id;
          const newId = generateUuid();
          await queryInterface.sequelize.query(
            `UPDATE \`${tbl}\` SET \`id\` = :newId WHERE \`id\` = :oldId;`,
            { replacements: { newId, oldId } }
          );
        }
      } catch (err) {
        console.warn(`[Migration 19] Notice updating ${tbl}: ${err.message}`);
      }
    }

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  },

  async down(queryInterface, Sequelize) {
    // Alphanumeric UUIDs are standard; no downgrade required
  }
};
