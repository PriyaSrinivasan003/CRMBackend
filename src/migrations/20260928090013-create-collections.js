'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('collections', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      agent_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'agents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      assignment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customer_agent_assignments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      collection_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      amount_due: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      amount_collected: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      collection_status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Pending, 1: Partially Collected, 2: Fully Collected, 3: Failed, 4: Follow-up Required'
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    await queryInterface.addIndex('collections', ['customer_id'], { name: 'collections_customer_id_idx' });
    await queryInterface.addIndex('collections', ['agent_id'], { name: 'collections_agent_id_idx' });
    await queryInterface.addIndex('collections', ['collection_status'], { name: 'collections_status_idx' });
    await queryInterface.addIndex('collections', ['collection_date'], { name: 'collections_date_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('collections');
  }
};
