'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create field_visits table
    await queryInterface.createTable('field_visits', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
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
      visit_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      visit_outcome: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Contacted, 1: Unavailable, 2: Address Not Found, 3: Requested More Time, 4: Payment Promise, 5: Dispute Raised, 6: Refused, 7: Follow-up Required'
      },
      remarks: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      next_follow_up_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('field_visits', ['customer_id'], { name: 'field_visits_customer_id_idx' });
    await queryInterface.addIndex('field_visits', ['agent_id'], { name: 'field_visits_agent_id_idx' });
    await queryInterface.addIndex('field_visits', ['assignment_id'], { name: 'field_visits_assignment_id_idx' });
    await queryInterface.addIndex('field_visits', ['visit_date'], { name: 'field_visits_date_idx' });
    await queryInterface.addIndex('field_visits', ['visit_outcome'], { name: 'field_visits_outcome_idx' });

    // 2. Create follow_ups table
    await queryInterface.createTable('follow_ups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
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
      visit_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'field_visits',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      follow_up_type: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Call, 1: Visit, 2: Document Request'
      },
      status: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0,
        comment: '0: Pending, 1: Completed, 2: Cancelled'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      remarks: {
        type: Sequelize.STRING(1000),
        allowNull: true
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

    await queryInterface.addIndex('follow_ups', ['customer_id'], { name: 'follow_ups_customer_id_idx' });
    await queryInterface.addIndex('follow_ups', ['agent_id'], { name: 'follow_ups_agent_id_idx' });
    await queryInterface.addIndex('follow_ups', ['assignment_id'], { name: 'follow_ups_assignment_id_idx' });
    await queryInterface.addIndex('follow_ups', ['visit_id'], { name: 'follow_ups_visit_id_idx' });
    await queryInterface.addIndex('follow_ups', ['scheduled_at'], { name: 'follow_ups_scheduled_at_idx' });
    await queryInterface.addIndex('follow_ups', ['status'], { name: 'follow_ups_status_idx' });
    await queryInterface.addIndex('follow_ups', ['follow_up_type'], { name: 'follow_ups_type_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('follow_ups');
    await queryInterface.dropTable('field_visits');
  }
};
