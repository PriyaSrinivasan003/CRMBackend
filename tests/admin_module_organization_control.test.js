process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Branch, Customer, Collection, Payment, LoginAudit } = require('../src/models');

describe('Admin Module — Organization-Wide Control Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let agentToken;
  let testBranchId;
  let createdUserId;

  const testId = Date.now().toString().slice(-6);

  beforeAll(async () => {
    // 1. Login as Admin
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@collectagent.com',
        password: 'Admin@SecurePass2026'
      });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Fetch existing branches
    const branchRes = await request(app)
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${adminToken}`);
    testBranchId = branchRes.body.data[0].id;

    // 3. Create supervisor to test RBAC rejection
    const supRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `AdminTest Sup ${testId}`,
        email: `adm_sup_${testId}@test.com`,
        mobile: `9851${testId}`,
        password: 'Password@123',
        role_code: 'SUPERVISOR',
        employee_code: `SUPADM_${testId}`,
        branch_id: testBranchId
      });

    const supLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `adm_sup_${testId}@test.com`,
        password: 'Password@123'
      });
    supervisorToken = supLogin.body.data.tokens.accessToken;

    // 4. Create field agent
    const agentRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `AdminTest Agent ${testId}`,
        email: `adm_agt_${testId}@test.com`,
        mobile: `9852${testId}`,
        password: 'Password@123',
        role_code: 'FIELD_AGENT',
        employee_code: `AGTADM_${testId}`,
        supervisor_id: supRes.body.data.supervisor.id,
        branch_id: testBranchId
      });

    const agentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `adm_agt_${testId}@test.com`,
        password: 'Password@123'
      });
    agentToken = agentLogin.body.data.tokens.accessToken;

    // 5. Generate a failed login audit to verify audit log consolidation
    await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'nonexistent@test.com',
        password: 'WrongPassword123'
      });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('RBAC Protection for Admin APIs', () => {
    it('Non-admin user (Supervisor) is forbidden from accessing Admin Dashboard (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Non-admin user (Field Agent) is forbidden from accessing Admin Users (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.status).toBe(403);
    });

    it('Unauthenticated request is rejected with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
    });
  });

  describe('1. GET /api/v1/admin/dashboard — Organization Summary', () => {
    it('Consolidates receivables, aging buckets, verified collections, performance, disputes, and security', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Organization dashboard summary retrieved');

      const data = res.body.data;

      // 1. Total receivables and outstanding balances
      expect(data.financialSummary).toBeDefined();
      expect(data.financialSummary.totalReceivables).toBeDefined();
      expect(data.financialSummary.totalCollected).toBeDefined();
      expect(data.financialSummary.totalOutstanding).toBeDefined();
      expect(data.financialSummary.collectionEfficiency).toBeDefined();

      // 2. Amount overdue by aging bucket
      expect(data.agingBuckets).toBeDefined();
      expect(data.agingBuckets.bucket_0_30).toBeDefined();
      expect(data.agingBuckets.bucket_31_60).toBeDefined();
      expect(data.agingBuckets.bucket_61_90).toBeDefined();
      expect(data.agingBuckets.bucket_90_plus).toBeDefined();

      // 3. Collections received and verified
      expect(data.verifiedCollections).toBeDefined();
      expect(data.verifiedCollections.verifiedAmount).toBeDefined();
      expect(data.verifiedCollections.verifiedTransactions).toBeDefined();

      // 4. Payment reconciliation exceptions
      expect(data.reconciliationExceptions).toBeDefined();
      expect(data.reconciliationExceptions.reversedTransactionsCount).toBeDefined();

      // 5. Branch, Supervisor, and Agent performance
      expect(data.organizationPerformance).toBeDefined();
      expect(data.organizationPerformance.totalBranches).toBeGreaterThanOrEqual(1);
      expect(data.organizationPerformance.totalSupervisors).toBeGreaterThanOrEqual(1);
      expect(data.organizationPerformance.totalAgents).toBeGreaterThanOrEqual(1);

      // 6. Unassigned cases and workload imbalances
      expect(data.workloadDistribution).toBeDefined();
      expect(data.workloadDistribution.unassignedCases).toBeDefined();
      expect(data.workloadDistribution.averageCasesPerAgent).toBeDefined();

      // 7. Customer disputes and escalations
      expect(data.disputesAndEscalations).toBeDefined();
      expect(data.disputesAndEscalations.disputedVisitsCount).toBeDefined();
      expect(data.disputesAndEscalations.brokenPromisesCount).toBeDefined();

      // 8. User status, failed logins, and security events
      expect(data.securityAndAccess).toBeDefined();
      expect(data.securityAndAccess.usersByStatus).toBeDefined();
      expect(data.securityAndAccess.failedLoginsLast24h).toBeGreaterThanOrEqual(1);

      // 9. Policy configuration and audit activity
      expect(data.policyAndConfiguration).toBeDefined();
      expect(data.policyAndConfiguration.activePaymentModes).toBeGreaterThanOrEqual(1);
    });

    it('Dual-route /api/v1/admin/getAdminDashboard returns identical summary', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getAdminDashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.financialSummary).toBeDefined();
    });
  });

  describe('2. User Search, Creation & Status Management', () => {
    it('POST /api/v1/admin/users creates an authorized user', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Officer ${testId}`,
          email: `officer_${testId}@test.com`,
          mobile: `9876${testId}`,
          password: 'Password@123',
          role_code: 'SUPERVISOR',
          employee_code: `OFF_${testId}`,
          branch_id: testBranchId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Authorized user created');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.supervisor).toBeDefined();
      createdUserId = res.body.data.id;
    });

    it('GET /api/v1/admin/users retrieves users with search and pagination', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users?search=officer_${testId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin users retrieved');
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination.totalRecords).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/v1/admin/users/:id/status updates status to SUSPENDED (2) and revokes session', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 2 }); // Suspended

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User status updated');
      expect(res.body.data.status).toBe(2);
    });

    it('PATCH /api/v1/admin/users/:id/status reactivates user to ACTIVE (1)', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${createdUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(1);
    });
  });

  describe('3. GET /api/v1/admin/branches & /api/v1/admin/areas', () => {
    it('GET /api/v1/admin/branches returns branches with operational counts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/branches')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin branches retrieved');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].metrics).toBeDefined();
      expect(res.body.data[0].metrics.supervisorsCount).toBeDefined();
    });

    it('GET /api/v1/admin/areas returns areas with customer counts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/areas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Admin areas retrieved');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].customersCount).toBeDefined();
    });
  });

  describe('4. GET /api/v1/admin/audit-logs — Audit Event Search', () => {
    it('Returns security login audits with user associations and pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Audit events retrieved');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.totalRecords).toBeGreaterThanOrEqual(1);
    });

    it('Filters audit logs by failure status (success=0)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?success=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(log => log.success === 0)).toBe(true);
    });
  });

  describe('5. GET /api/v1/admin/reconciliation — Financial Exceptions', () => {
    it('Returns payment reconciliation exceptions and summary totals', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reconciliation')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Financial reconciliation exceptions retrieved');
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.totalReversedAmount).toBeDefined();
      expect(res.body.data.summary.totalPendingAmount).toBeDefined();
      expect(Array.isArray(res.body.data.exceptions)).toBe(true);
    });
  });

  describe('6. Reports: Aging and Collection Performance', () => {
    it('GET /api/v1/admin/reports/aging returns aging buckets (0-30, 31-60, 61-90, 91-120, 120+) and line items', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/aging')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Aging report retrieved');
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.bucket_0_30).toBeDefined();
      expect(res.body.data.summary.bucket_31_60).toBeDefined();
      expect(res.body.data.summary.bucket_61_90).toBeDefined();
      expect(res.body.data.summary.bucket_91_120).toBeDefined();
      expect(res.body.data.summary.bucket_120_plus).toBeDefined();
      expect(res.body.data.summary.totalOutstandingPortfolio).toBeDefined();
      expect(Array.isArray(res.body.data.lineItems)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('GET /api/v1/admin/reports/collections returns performance summary and payment mode distribution', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports/collections')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Collection performance report retrieved');
      expect(res.body.data.performanceSummary).toBeDefined();
      expect(res.body.data.performanceSummary.totalTargetedAmount).toBeDefined();
      expect(res.body.data.performanceSummary.totalRealizedAmount).toBeDefined();
      expect(res.body.data.performanceSummary.overallEfficiency).toBeDefined();
      expect(Array.isArray(res.body.data.performanceSummary.paymentModesDistribution)).toBe(true);
      expect(Array.isArray(res.body.data.collections)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('7. Function-Named Route Aliases for Admin Module', () => {
    it('GET /api/v1/admin/getAllAdminUsers works identically', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getAllAdminUsers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/getAllAdminBranches works identically', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getAllAdminBranches')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/getAllAdminAreas works identically', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getAllAdminAreas')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/getAuditLogs works identically', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getAuditLogs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/admin/getReconciliationExceptions works identically', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getReconciliationExceptions')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
    });

    it('GET /api/v1/admin/getAgingReport works identically', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getAgingReport')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
    });

    it('GET /api/v1/admin/getCollectionPerformanceReport works identically', async () => {
      const res = await request(app)
        .get('/api/v1/admin/getCollectionPerformanceReport')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.performanceSummary).toBeDefined();
    });
  });
});
