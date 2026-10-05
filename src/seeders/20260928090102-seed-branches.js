'use strict';

const BRANCH_TO_SEED = {
  id: 'c7e2b10458cc4372a5670e02b2c3d479',
  branch_code: 'BR-HO-001',
  branch_name: 'Head Office Central',
  address: '100 Financial District, Tech Park',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560001',
  status: 1,
  created_at: new Date(),
  updated_at: new Date()
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.rawSelect(
      'branches',
      { where: { branch_code: BRANCH_TO_SEED.branch_code } },
      ['id']
    );

    if (!existing) {
      await queryInterface.bulkInsert('branches', [BRANCH_TO_SEED]);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('branches', { branch_code: BRANCH_TO_SEED.branch_code });
  }
};
