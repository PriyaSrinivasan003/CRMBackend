'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tablesAndColumns = [
      { table: 'roles', cols: ['id'] },
      { table: 'organizations', cols: ['id'] },
      { table: 'branches', cols: ['id', 'organisation_id'] },
      { table: 'users', cols: ['id', 'role_id', 'created_by', 'updated_by'] },
      { table: 'supervisors', cols: ['id', 'user_id', 'branch_id', 'created_by', 'updated_by'] },
      { table: 'agents', cols: ['id', 'user_id', 'supervisor_id', 'branch_id', 'created_by', 'updated_by'] },
      { table: 'customers', cols: ['id', 'branch_id', 'created_by', 'updated_by'] },
      { table: 'agent_supervisor_assignments', cols: ['id', 'agent_id', 'supervisor_id', 'created_by'] },
      { table: 'customer_agent_assignments', cols: ['id', 'customer_id', 'agent_id', 'created_by'] },
      { table: 'collections', cols: ['id', 'customer_id', 'agent_id', 'assignment_id', 'created_by'] },
      { table: 'payments', cols: ['id', 'collection_id', 'customer_id', 'agent_id', 'recorded_by', 'confirmed_by', 'reversed_by'] },
      { table: 'refresh_tokens', cols: ['id', 'user_id'] },
      { table: 'login_audits', cols: ['id', 'user_id'] },
      { table: 'password_reset_otps', cols: ['id', 'user_id'] },
      { table: 'permissions', cols: ['id'] },
      { table: 'role_permissions', cols: ['id', 'role_id', 'permission_id'] },
      { table: 'admin_permissions', cols: ['id', 'role_id', 'permission_id'] },
      { table: 'supervisor_permissions', cols: ['id', 'role_id', 'permission_id'] },
      { table: 'agent_permissions', cols: ['id', 'role_id', 'permission_id'] }
    ];

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    for (const item of tablesAndColumns) {
      try {
        const setClauses = item.cols.map(c => `\`${c}\` = REPLACE(\`${c}\`, '-', '')`).join(', ');
        const whereClause = item.cols.map(c => `\`${c}\` LIKE '%-%'`).join(' OR ');
        await queryInterface.sequelize.query(
          `UPDATE \`${item.table}\` SET ${setClauses} WHERE ${whereClause};`
        );
      } catch (err) {
        // Table or column might not exist yet in some environments
        console.warn(`[Migration] Notice updating ${item.table}: ${err.message}`);
      }
    }

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  },

  async down(queryInterface, Sequelize) {
    // Reverting unhyphenated UUIDs back to hyphenated format is not necessary as unhyphenated is now standard
  }
};
