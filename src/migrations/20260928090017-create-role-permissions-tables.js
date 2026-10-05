'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ADMIN_ROLE_ID = 'e8b15d2a-43cf-46d2-a7d5-d0537248c8b1';
    const SUPERVISOR_ROLE_ID = 'a3f72e61-9c84-4e1a-8b3d-27f94e18d6a2';
    const AGENT_ROLE_ID = 'b6d49c83-1e57-4a02-9f2b-83c71a5e9d03';

    // 1. Create permissions table
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex('permissions', ['code'], { unique: true, name: 'permissions_code_unique_idx' });
    await queryInterface.addIndex('permissions', ['module'], { name: 'permissions_module_idx' });

    // 2. Create standard role_permissions junction table
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addIndex('role_permissions', ['role_id', 'permission_id'], {
      unique: true,
      name: 'role_permissions_role_permission_unique_idx'
    });

    // 3. Create dedicated admin_permissions table
    await queryInterface.createTable('admin_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_code: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex('admin_permissions', ['role_id', 'permission_id'], {
      unique: true,
      name: 'admin_permissions_role_perm_unique_idx'
    });

    // 4. Create dedicated supervisor_permissions table
    await queryInterface.createTable('supervisor_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_code: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex('supervisor_permissions', ['role_id', 'permission_id'], {
      unique: true,
      name: 'supervisor_permissions_role_perm_unique_idx'
    });

    // 5. Create dedicated agent_permissions table
    await queryInterface.createTable('agent_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_code: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      module: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
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

    await queryInterface.addIndex('agent_permissions', ['role_id', 'permission_id'], {
      unique: true,
      name: 'agent_permissions_role_perm_unique_idx'
    });

    // 6. Define and insert system permissions
    const rawPermissions = [
      // Users
      { id: '10000000-0000-4000-a000-000000000001', name: 'Create Users', code: 'users:create', module: 'users', description: 'Create new users across roles' },
      { id: '10000000-0000-4000-a000-000000000002', name: 'View Users', code: 'users:read', module: 'users', description: 'View system user accounts' },
      { id: '10000000-0000-4000-a000-000000000003', name: 'Update Users', code: 'users:update', module: 'users', description: 'Modify user account details' },
      { id: '10000000-0000-4000-a000-000000000004', name: 'Update User Status', code: 'users:status', module: 'users', description: 'Activate, lock or suspend users' },

      // Organizations
      { id: '10000000-0000-4000-a000-000000000005', name: 'Create Organization', code: 'organizations:create', module: 'organizations', description: 'Create new organizations' },
      { id: '10000000-0000-4000-a000-000000000006', name: 'View Organizations', code: 'organizations:read', module: 'organizations', description: 'View organization details' },
      { id: '10000000-0000-4000-a000-000000000007', name: 'Update Organization', code: 'organizations:update', module: 'organizations', description: 'Update organization settings' },

      // Branches
      { id: '10000000-0000-4000-a000-000000000008', name: 'Create Branch', code: 'branches:create', module: 'branches', description: 'Create new branches under an organization' },
      { id: '10000000-0000-4000-a000-000000000009', name: 'View Branches', code: 'branches:read', module: 'branches', description: 'List and view branch information' },
      { id: '10000000-0000-4000-a000-000000000010', name: 'Update Branch', code: 'branches:update', module: 'branches', description: 'Modify branch details' },
      { id: '10000000-0000-4000-a000-000000000011', name: 'Update Branch Status', code: 'branches:status', module: 'branches', description: 'Activate or deactivate branches' },

      // Supervisors
      { id: '10000000-0000-4000-a000-000000000012', name: 'Create Supervisor', code: 'supervisors:create', module: 'supervisors', description: 'Provision supervisor profiles' },
      { id: '10000000-0000-4000-a000-000000000013', name: 'View Supervisors', code: 'supervisors:read', module: 'supervisors', description: 'View supervisor records' },
      { id: '10000000-0000-4000-a000-000000000014', name: 'Update Supervisor', code: 'supervisors:update', module: 'supervisors', description: 'Update supervisor profiles' },
      { id: '10000000-0000-4000-a000-000000000015', name: 'View Supervisor Agents', code: 'supervisors:agents', module: 'supervisors', description: 'View agents belonging to a supervisor team' },

      // Agents
      { id: '10000000-0000-4000-a000-000000000016', name: 'Create Agent', code: 'agents:create', module: 'agents', description: 'Provision field agent profiles' },
      { id: '10000000-0000-4000-a000-000000000017', name: 'View Agents', code: 'agents:read', module: 'agents', description: 'View field agent profiles' },
      { id: '10000000-0000-4000-a000-000000000018', name: 'Update Agent', code: 'agents:update', module: 'agents', description: 'Update field agent profiles' },
      { id: '10000000-0000-4000-a000-000000000019', name: 'View Agent Customers', code: 'agents:customers', module: 'agents', description: 'View customers assigned to agent' },
      { id: '10000000-0000-4000-a000-000000000020', name: 'View Agent Collections', code: 'agents:collections', module: 'agents', description: 'View collection visits assigned to agent' },

      // Customers
      { id: '10000000-0000-4000-a000-000000000021', name: 'Create Customer', code: 'customers:create', module: 'customers', description: 'Create new customer records' },
      { id: '10000000-0000-4000-a000-000000000022', name: 'View Customers', code: 'customers:read', module: 'customers', description: 'View customer records' },
      { id: '10000000-0000-4000-a000-000000000023', name: 'Update Customer', code: 'customers:update', module: 'customers', description: 'Update customer details' },
      { id: '10000000-0000-4000-a000-000000000024', name: 'Assign Customer', code: 'customers:assign', module: 'customers', description: 'Assign customer to field agent' },
      { id: '10000000-0000-4000-a000-000000000025', name: 'View Customer Assignments', code: 'customers:assignments', module: 'customers', description: 'View assignment history for customers' },

      // Assignments
      { id: '10000000-0000-4000-a000-000000000026', name: 'Assign Agent to Supervisor', code: 'assignments:agent_supervisor_create', module: 'assignments', description: 'Assign field agent to supervisor' },
      { id: '10000000-0000-4000-a000-000000000027', name: 'View Agent Supervisor Assignments', code: 'assignments:agent_supervisor_read', module: 'assignments', description: 'View supervisor team assignments' },
      { id: '10000000-0000-4000-a000-000000000028', name: 'Assign Customer to Agent', code: 'assignments:customer_agent_create', module: 'assignments', description: 'Assign loan recovery accounts to agent' },
      { id: '10000000-0000-4000-a000-000000000029', name: 'View Customer Agent Assignments', code: 'assignments:customer_agent_read', module: 'assignments', description: 'View customer account assignments' },

      // Collections
      { id: '10000000-0000-4000-a000-000000000030', name: 'Create Collection', code: 'collections:create', module: 'collections', description: 'Record customer visit and collection progress' },
      { id: '10000000-0000-4000-a000-000000000031', name: 'View Collections', code: 'collections:read', module: 'collections', description: 'View collection visit records' },
      { id: '10000000-0000-4000-a000-000000000032', name: 'Update Collection', code: 'collections:update', module: 'collections', description: 'Update collection visit details' },
      { id: '10000000-0000-4000-a000-000000000033', name: 'View Collection Summary', code: 'collections:summary', module: 'collections', description: 'View aggregated collection metrics' },

      // Payments
      { id: '10000000-0000-4000-a000-000000000034', name: 'Record Payment', code: 'payments:create', module: 'payments', description: 'Record payment receipt from customer' },
      { id: '10000000-0000-4000-a000-000000000035', name: 'View Payments', code: 'payments:read', module: 'payments', description: 'View payment transaction history' },
      { id: '10000000-0000-4000-a000-000000000036', name: 'Confirm Payment', code: 'payments:confirm', module: 'payments', description: 'Verify and confirm recorded payment' },
      { id: '10000000-0000-4000-a000-000000000037', name: 'Reverse Payment', code: 'payments:reverse', module: 'payments', description: 'Reverse incorrect payment transaction' },

      // Dashboard
      { id: '10000000-0000-4000-a000-000000000038', name: 'View Admin Dashboard', code: 'dashboard:admin', module: 'dashboard', description: 'Access administrator analytics dashboard' },
      { id: '10000000-0000-4000-a000-000000000039', name: 'View Supervisor Dashboard', code: 'dashboard:supervisor', module: 'dashboard', description: 'Access supervisor team overview dashboard' },
      { id: '10000000-0000-4000-a000-000000000040', name: 'View Agent Dashboard', code: 'dashboard:agent', module: 'dashboard', description: 'Access field agent personal dashboard' }
    ];

    const permissionsToInsert = rawPermissions.map(p => ({
      ...p,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('permissions', permissionsToInsert);

    // 7. Map permissions for each role
    // ADMIN has all permissions
    const adminPerms = permissionsToInsert;

    // SUPERVISOR permissions
    const supervisorCodes = [
      'supervisors:read',
      'supervisors:agents',
      'agents:read',
      'agents:customers',
      'agents:collections',
      'customers:read',
      'customers:assign',
      'customers:assignments',
      'assignments:customer_agent_create',
      'assignments:customer_agent_read',
      'collections:create',
      'collections:read',
      'collections:update',
      'collections:summary',
      'payments:create',
      'payments:read',
      'payments:confirm',
      'dashboard:supervisor'
    ];
    const supervisorPerms = permissionsToInsert.filter(p => supervisorCodes.includes(p.code));

    // AGENT permissions
    const agentCodes = [
      'agents:read',
      'agents:customers',
      'agents:collections',
      'customers:read',
      'customers:assignments',
      'assignments:customer_agent_read',
      'collections:create',
      'collections:read',
      'collections:update',
      'payments:create',
      'payments:read',
      'dashboard:agent'
    ];
    const agentPerms = permissionsToInsert.filter(p => agentCodes.includes(p.code));

    // Helper to generate UUIDs
    let counter = 100;
    const generateId = () => {
      counter++;
      return `20000000-0000-4000-a000-${String(counter).padStart(12, '0')}`;
    };

    // Populate role_permissions
    const rolePermissions = [];
    adminPerms.forEach(p => {
      rolePermissions.push({
        id: generateId(),
        role_id: ADMIN_ROLE_ID,
        permission_id: p.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    });
    supervisorPerms.forEach(p => {
      rolePermissions.push({
        id: generateId(),
        role_id: SUPERVISOR_ROLE_ID,
        permission_id: p.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    });
    agentPerms.forEach(p => {
      rolePermissions.push({
        id: generateId(),
        role_id: AGENT_ROLE_ID,
        permission_id: p.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    });
    await queryInterface.bulkInsert('role_permissions', rolePermissions);

    // Populate admin_permissions
    const adminTableRecords = adminPerms.map(p => ({
      id: generateId(),
      role_id: ADMIN_ROLE_ID,
      permission_id: p.id,
      permission_code: p.code,
      module: p.module,
      description: p.description,
      created_at: new Date(),
      updated_at: new Date()
    }));
    await queryInterface.bulkInsert('admin_permissions', adminTableRecords);

    // Populate supervisor_permissions
    const supervisorTableRecords = supervisorPerms.map(p => ({
      id: generateId(),
      role_id: SUPERVISOR_ROLE_ID,
      permission_id: p.id,
      permission_code: p.code,
      module: p.module,
      description: p.description,
      created_at: new Date(),
      updated_at: new Date()
    }));
    await queryInterface.bulkInsert('supervisor_permissions', supervisorTableRecords);

    // Populate agent_permissions
    const agentTableRecords = agentPerms.map(p => ({
      id: generateId(),
      role_id: AGENT_ROLE_ID,
      permission_id: p.id,
      permission_code: p.code,
      module: p.module,
      description: p.description,
      created_at: new Date(),
      updated_at: new Date()
    }));
    await queryInterface.bulkInsert('agent_permissions', agentTableRecords);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agent_permissions');
    await queryInterface.dropTable('supervisor_permissions');
    await queryInterface.dropTable('admin_permissions');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
  }
};
