const fs = require('fs');
const path = require('path');

// 1. Admin Module Folder
const adminModuleFolder = {
  name: '00 - Admin Module (Organization-Wide Control)',
  description: 'Consolidated organization summary, user governance, audit events, reconciliation, aging, and collection reports with strict ROLES.ADMIN authorization.',
  item: [
    {
      name: 'GET Organization Summary Dashboard',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/dashboard',
          host: ['{{baseUrl}}'],
          path: ['admin', 'dashboard']
        },
        description: 'Consolidates total receivables, aging buckets, verified collections, reconciliation exceptions, branch/supervisor/agent performance, unassigned cases, disputes, and security/audit activity.'
      },
      response: []
    },
    {
      name: 'GET Organization Summary Dashboard (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getAdminDashboard',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getAdminDashboard']
        },
        description: 'Dual-route alias for organization dashboard summary.'
      },
      response: []
    },
    {
      name: 'GET Admin Users (Search & Filter)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/users?role_code=FIELD_AGENT&status=1&search=&page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['admin', 'users'],
          query: [
            { key: 'role_code', value: 'FIELD_AGENT', description: 'Filter by role (ADMIN, SUPERVISOR, FIELD_AGENT)' },
            { key: 'status', value: '1', description: 'Filter by status (1=Active, 0=Inactive, 2=Suspended)' },
            { key: 'search', value: '', description: 'Search name, email, mobile, or employee code' },
            { key: 'branch_id', value: '', description: 'Filter by branch UUID' },
            { key: 'page', value: '1', description: 'Page number' },
            { key: 'limit', value: '10', description: 'Page size limit' }
          ]
        },
        description: 'User search and filtering across the organization with server-side pagination.'
      },
      response: []
    },
    {
      name: 'GET Admin Users (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getAllAdminUsers?page=1&limit=10',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getAllAdminUsers'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' }
          ]
        },
        description: 'Dual-route alias for user search and filtering.'
      },
      response: []
    },
    {
      name: 'POST Create Authorized User',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            name: 'Kavita Rao',
            email: 'kavita.supervisor@collectagent.com',
            mobile: '9876543222',
            password: 'Password@123',
            role_code: 'SUPERVISOR',
            employee_code: 'SUP-701',
            branch_id: '{{branchId}}'
          }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/admin/users',
          host: ['{{baseUrl}}'],
          path: ['admin', 'users']
        },
        description: 'Create an authorized user with supervisor or agent profile within a managed transaction.'
      },
      response: []
    },
    {
      name: 'POST Create Authorized User (Function Alias)',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            name: 'Pooja Nair',
            email: 'pooja.agent@collectagent.com',
            mobile: '9876543233',
            password: 'Password@123',
            role_code: 'FIELD_AGENT',
            employee_code: 'AGT-701',
            branch_id: '{{branchId}}',
            supervisor_id: '{{supervisorId}}'
          }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/admin/createAdminUser',
          host: ['{{baseUrl}}'],
          path: ['admin', 'createAdminUser']
        },
        description: 'Dual-route alias for user provisioning.'
      },
      response: []
    },
    {
      name: 'PATCH Update User Status (Activate/Deactivate/Suspend)',
      request: {
        method: 'PATCH',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ status: 2 }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/admin/users/{{userId}}/status',
          host: ['{{baseUrl}}'],
          path: ['admin', 'users', '{{userId}}', 'status']
        },
        description: 'Update user status: 1 = Active, 0 = Inactive, 2 = Suspended. Session token is revoked upon status update.'
      },
      response: []
    },
    {
      name: 'PATCH Update User Status (Function Alias)',
      request: {
        method: 'PATCH',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ status: 1 }, null, 2)
        },
        url: {
          raw: '{{baseUrl}}/admin/updateUserStatus/{{userId}}',
          host: ['{{baseUrl}}'],
          path: ['admin', 'updateUserStatus', '{{userId}}']
        },
        description: 'Dual-route alias for updating user status.'
      },
      response: []
    },
    {
      name: 'GET Admin Branch Management',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/branches?page=1&limit=10&status=1',
          host: ['{{baseUrl}}'],
          path: ['admin', 'branches'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' },
            { key: 'status', value: '1', description: 'Filter by active/inactive' },
            { key: 'search', value: '', description: 'Search branch name or code' }
          ]
        },
        description: 'Branch management with operational supervisor and agent counts.'
      },
      response: []
    },
    {
      name: 'GET Admin Branch Management (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getAllAdminBranches',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getAllAdminBranches']
        },
        description: 'Dual-route alias for branch management.'
      },
      response: []
    },
    {
      name: 'GET Admin Area Management',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/areas?page=1&limit=10&branch_id={{branchId}}',
          host: ['{{baseUrl}}'],
          path: ['admin', 'areas'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '10' },
            { key: 'branch_id', value: '{{branchId}}', description: 'Filter by branch' },
            { key: 'status', value: '1' },
            { key: 'search', value: '' }
          ]
        },
        description: 'Area management with associated customer portfolio counts and branch links.'
      },
      response: []
    },
    {
      name: 'GET Admin Area Management (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getAllAdminAreas',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getAllAdminAreas']
        },
        description: 'Dual-route alias for area management.'
      },
      response: []
    },
    {
      name: 'GET Audit Event Search',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/audit-logs?page=1&limit=20&success=0',
          host: ['{{baseUrl}}'],
          path: ['admin', 'audit-logs'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' },
            { key: 'success', value: '0', description: '1 for success, 0 for failed login attempts' },
            { key: 'identifier', value: '', description: 'Filter by email or mobile' },
            { key: 'user_id', value: '', description: 'Filter by user UUID' },
            { key: 'startDate', value: '' },
            { key: 'endDate', value: '' }
          ]
        },
        description: 'Search security audit events, login attempts, IP addresses, user agents, and security failures.'
      },
      response: []
    },
    {
      name: 'GET Audit Event Search (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getAuditLogs?page=1&limit=20',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getAuditLogs'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' }
          ]
        },
        description: 'Dual-route alias for audit event search.'
      },
      response: []
    },
    {
      name: 'GET Financial Reconciliation Exceptions',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/reconciliation?status=REVERSED',
          host: ['{{baseUrl}}'],
          path: ['admin', 'reconciliation'],
          query: [
            { key: 'status', value: 'REVERSED', description: 'Payment status (REVERSED, PENDING, UNDER_REVIEW)' },
            { key: 'branch_id', value: '' },
            { key: 'startDate', value: '' },
            { key: 'endDate', value: '' }
          ]
        },
        description: 'Consolidate financial exceptions, reversed payments, chargebacks, and reconciliation discrepancies.'
      },
      response: []
    },
    {
      name: 'GET Financial Reconciliation Exceptions (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getReconciliationExceptions',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getReconciliationExceptions']
        },
        description: 'Dual-route alias for financial reconciliation exceptions.'
      },
      response: []
    },
    {
      name: 'GET Aging Report',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/reports/aging?page=1&limit=20',
          host: ['{{baseUrl}}'],
          path: ['admin', 'reports', 'aging'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' },
            { key: 'branch_id', value: '', description: 'Filter by branch UUID' }
          ]
        },
        description: 'Organization-wide aging analysis categorized by 0-30, 31-60, 61-90, 91-120, and 120+ days past due.'
      },
      response: []
    },
    {
      name: 'GET Aging Report (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getAgingReport',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getAgingReport']
        },
        description: 'Dual-route alias for aging report.'
      },
      response: []
    },
    {
      name: 'GET Collection Performance Report',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/reports/collections?page=1&limit=20',
          host: ['{{baseUrl}}'],
          path: ['admin', 'reports', 'collections'],
          query: [
            { key: 'page', value: '1' },
            { key: 'limit', value: '20' },
            { key: 'branch_id', value: '', description: 'Filter by branch' },
            { key: 'agent_id', value: '', description: 'Filter by field agent' },
            { key: 'startDate', value: '' },
            { key: 'endDate', value: '' }
          ]
        },
        description: 'Evaluate collection performance, targeted vs realized amounts, efficiency rate, and payment mode breakdown.'
      },
      response: []
    },
    {
      name: 'GET Collection Performance Report (Function Alias)',
      request: {
        method: 'GET',
        header: [],
        url: {
          raw: '{{baseUrl}}/admin/getCollectionPerformanceReport',
          host: ['{{baseUrl}}'],
          path: ['admin', 'getCollectionPerformanceReport']
        },
        description: 'Dual-route alias for collection performance report.'
      },
      response: []
    }
  ]
};

// 2. Master Values Folder
const masterValuesFolder = {
  name: '07 - Master Values (Dynamic Master Data)',
  description: 'Controlled APIs to dynamically load active master tables without hardcoding.',
  item: [
    {
      name: 'Get All Active Masters',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/masters', host: ['{{baseUrl}}'], path: ['masters'] },
        description: 'Returns all active branches, areas, payment modes, and organizations in one payload.'
      },
      response: []
    },
    {
      name: 'Get Active Branches from Table',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/masters/branches', host: ['{{baseUrl}}'], path: ['masters', 'branches'] }
      },
      response: []
    },
    {
      name: 'Get Active Areas from Table',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/masters/areas?branch_id={{branchId}}', host: ['{{baseUrl}}'], path: ['masters', 'areas'] }
      },
      response: []
    },
    {
      name: 'Get Active Payment Modes from Table',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/masters/payment-modes', host: ['{{baseUrl}}'], path: ['masters', 'payment-modes'] }
      },
      response: []
    }
  ]
};

// 3. Areas & Payment Modes Folder
const areasAndPaymentModesFolder = {
  name: '08 - Areas & Payment Modes',
  description: 'Area hierarchy and payment mode configuration management.',
  item: [
    {
      name: 'Create Area',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            branch_id: '{{branchId}}',
            code: 'AREA-KOR-01',
            name: 'Koramangala 4th Block',
            status: 1
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/areas', host: ['{{baseUrl}}'], path: ['areas'] }
      },
      response: []
    },
    {
      name: 'List Areas',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/areas?page=1&limit=10', host: ['{{baseUrl}}'], path: ['areas'] }
      },
      response: []
    },
    {
      name: 'Get Areas by Branch',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/areas/branch/{{branchId}}', host: ['{{baseUrl}}'], path: ['areas', 'branch', '{{branchId}}'] }
      },
      response: []
    },
    {
      name: 'Create Payment Mode',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            code: 'QR_CODE',
            name: 'Dynamic QR Code Payment',
            status: 1
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/payment-modes', host: ['{{baseUrl}}'], path: ['payment-modes'] }
      },
      response: []
    },
    {
      name: 'List Payment Modes',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/payment-modes', host: ['{{baseUrl}}'], path: ['payment-modes'] }
      },
      response: []
    }
  ]
};

// 4. Promises to Pay (PTP) & Tasks Folder
const ptpFolder = {
  name: '09 - Promises to Pay (PTP) & Follow-up Tasks',
  description: 'Customer commitments tracking, scheduled follow-ups, and overdue commitment alerts.',
  item: [
    {
      name: 'Record Promise to Pay',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            collection_case_id: '{{collectionId}}',
            customer_id: '{{customerId}}',
            promised_amount: 3500.00,
            promised_date: '2026-10-15',
            remarks: 'Customer committed to pay post salary credit'
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/promises-to-pay', host: ['{{baseUrl}}'], path: ['promises-to-pay'] }
      },
      response: []
    },
    {
      name: 'List Promises to Pay',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/promises-to-pay?status=OPEN&page=1&limit=10', host: ['{{baseUrl}}'], path: ['promises-to-pay'] }
      },
      response: []
    },
    {
      name: 'Update Promise Status',
      request: {
        method: 'PATCH',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({ status: 'KEPT' }, null, 2)
        },
        url: { raw: '{{baseUrl}}/promises-to-pay/{{ptpId}}/status', host: ['{{baseUrl}}'], path: ['promises-to-pay', '{{ptpId}}', 'status'] }
      },
      response: []
    },
    {
      name: 'Create Follow-up Task',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            action_date: '2026-10-16',
            assigned_employee_id: '{{userId}}',
            task_type: 'CALL',
            customer_id: '{{customerId}}',
            notes: 'Follow up on salary clearance'
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/follow-up-tasks', host: ['{{baseUrl}}'], path: ['follow-up-tasks'] }
      },
      response: []
    },
    {
      name: 'List Follow-up Tasks',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/follow-up-tasks?completion_status=PENDING&page=1&limit=10', host: ['{{baseUrl}}'], path: ['follow-up-tasks'] }
      },
      response: []
    },
    {
      name: 'Evaluate Overdue Commitments (Policy Check)',
      request: {
        method: 'POST',
        url: { raw: '{{baseUrl}}/promises-to-pay/evaluate-commitments', host: ['{{baseUrl}}'], path: ['promises-to-pay', 'evaluate-commitments'] }
      },
      response: []
    },
    {
      name: 'Get Overdue Commitment Alerts (Supervisor)',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/promises-to-pay/alerts/overdue', host: ['{{baseUrl}}'], path: ['promises-to-pay', 'alerts', 'overdue'] }
      },
      response: []
    }
  ]
};

// 5. Field Visits & Follow-ups Folder
const visitsFolder = {
  name: '10 - Field Visits & Interactions',
  description: 'Track field interactions, visit outcomes, and follow-up activities.',
  item: [
    {
      name: 'Record Field Visit',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            customer_id: '{{customerId}}',
            visit_date: '2026-10-01T10:30:00Z',
            visit_outcome: 1,
            remarks: 'Customer met in person, agreed to pay on 5th',
            latitude: 12.9716,
            longitude: 77.5946
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/visits', host: ['{{baseUrl}}'], path: ['visits'] }
      },
      response: []
    },
    {
      name: 'List Field Visits',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/visits?page=1&limit=10', host: ['{{baseUrl}}'], path: ['visits'] }
      },
      response: []
    },
    {
      name: 'Create Follow-up',
      request: {
        method: 'POST',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            customer_id: '{{customerId}}',
            scheduled_at: '2026-10-05T11:00:00Z',
            follow_up_type: 'VISIT',
            notes: 'Follow up for second installment'
          }, null, 2)
        },
        url: { raw: '{{baseUrl}}/follow-ups', host: ['{{baseUrl}}'], path: ['follow-ups'] }
      },
      response: []
    },
    {
      name: 'List Follow-ups',
      request: {
        method: 'GET',
        url: { raw: '{{baseUrl}}/follow-ups?status=PENDING&page=1&limit=10', host: ['{{baseUrl}}'], path: ['follow-ups'] }
      },
      response: []
    }
  ]
};

// Target collection files
const collectionFiles = [
  path.resolve(__dirname, '../../docs/Collection Agent and Accountability System API v1.1.postman_collection.json'),
  path.resolve(__dirname, '../../docs/CollectionAgentSystem.postman_collection.json'),
  path.resolve(__dirname, '../../docs/crm 1.1')
];

for (const filePath of collectionFiles) {
  if (fs.existsSync(filePath)) {
    const col = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Remove existing admin / master / area / ptp / visit folders if re-running
    col.item = col.item.filter(f => 
      !f.name.includes('Admin Module') &&
      !f.name.includes('Master Values') &&
      !f.name.includes('Areas & Payment') &&
      !f.name.includes('Promises to Pay') &&
      !f.name.includes('Field Visits')
    );

    // Insert Admin Module at the front (index 0) or right after Auth
    col.item.unshift(adminModuleFolder);

    // Append remaining new modules at the end
    col.item.push(masterValuesFolder);
    col.item.push(areasAndPaymentModesFolder);
    col.item.push(ptpFolder);
    col.item.push(visitsFolder);

    fs.writeFileSync(filePath, JSON.stringify(col, null, 2), 'utf8');
    console.log(`Successfully updated ${path.basename(filePath)} (${col.item.length} folders)`);
  }
}

// Update Environment file
const envPath = path.resolve(__dirname, '../../docs/CollectionAgentSystem.postman_environment.json');
if (fs.existsSync(envPath)) {
  const envData = JSON.parse(fs.readFileSync(envPath, 'utf8'));
  const currentKeys = envData.values.map(v => v.key);
  
  const additionalKeys = [
    { key: 'userId', value: '', type: 'default', enabled: true },
    { key: 'branchId', value: '', type: 'default', enabled: true },
    { key: 'supervisorId', value: '', type: 'default', enabled: true },
    { key: 'agentId', value: '', type: 'default', enabled: true },
    { key: 'areaId', value: '', type: 'default', enabled: true },
    { key: 'paymentModeId', value: '', type: 'default', enabled: true },
    { key: 'customerId', value: '', type: 'default', enabled: true },
    { key: 'collectionId', value: '', type: 'default', enabled: true },
    { key: 'ptpId', value: '', type: 'default', enabled: true },
    { key: 'followUpTaskId', value: '', type: 'default', enabled: true }
  ];

  for (const item of additionalKeys) {
    if (!currentKeys.includes(item.key)) {
      envData.values.push(item);
    }
  }

  fs.writeFileSync(envPath, JSON.stringify(envData, null, 2), 'utf8');
  console.log(`Successfully updated ${path.basename(envPath)} (${envData.values.length} environment variables)`);
}
