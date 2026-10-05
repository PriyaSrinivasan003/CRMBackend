'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@collectagent.com';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@SecurePass2026';
    const adminName = process.env.INITIAL_ADMIN_NAME || 'Super Administrator';
    const adminMobile = process.env.INITIAL_ADMIN_MOBILE || '9876543210';
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

    // Look up ADMIN role
    const adminRoleId = await queryInterface.rawSelect('roles', { where: { code: 'ADMIN' } }, ['id']);

    if (!adminRoleId) {
      throw new Error("Admin role not found. Please ensure roles are seeded first.");
    }

    // Check if user already exists
    const existing = await queryInterface.rawSelect('users', {
      where: {
        [Sequelize.Op.or]: [{ email: adminEmail }, { mobile: adminMobile }]
      }
    }, ['id']);

    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPassword, rounds);
      const adminId = 'd1f84b6537294e81b5a09c48f2e71d36';

      await queryInterface.bulkInsert('users', [
        {
          id: adminId,
          role_id: adminRoleId,
          name: adminName,
          email: adminEmail,
          mobile: adminMobile,
          password_hash: passwordHash,
          status: 1, // Active
          email_verified_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ]);
      console.log(`[Seeder] Seeded default administrator: ${adminEmail}`);
    } else {
      console.log(`[Seeder] Administrator account (${adminEmail}) already exists. Skipping.`);
    }
  },

  async down(queryInterface) {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@collectagent.com';
    await queryInterface.bulkDelete('users', { email: adminEmail });
  }
};
