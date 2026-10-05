process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');

describe('Branches and Organisation ID Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let testOrgId;
  let branchId;
  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    // Admin login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@collectagent.com',
        password: 'Admin@SecurePass2026'
      });
    adminToken = adminLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Organisation Management & Linking', () => {
    it('Admin can create an organisation via /createOrganization', async () => {
      const res = await request(app)
        .post('/api/v1/organizations/createOrganization')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: `Apex Finance Group ${testSuffix}`,
          code: `ORG_${testSuffix}`,
          email: `apex_${testSuffix}@org.com`,
          phone: `9800${testSuffix}`,
          address: '42 Wall Street, Financial District'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.code).toBe(`ORG_${testSuffix}`);
      testOrgId = res.body.data.id;
    });

    it('Admin can retrieve all organisations via /getAllOrganizations', async () => {
      const res = await request(app)
        .get('/api/v1/organizations/getAllOrganizations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      const found = res.body.data.find(o => o.id === testOrgId);
      expect(found).toBeDefined();
    });

    it('Admin can retrieve organisation by ID via /getOrganizationById/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/getOrganizationById/${testOrgId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testOrgId);
      expect(res.body.data.name).toBe(`Apex Finance Group ${testSuffix}`);
    });
  });

  describe('Branch Creation Based on Organisation ID', () => {
    it('Fails to create branch without organisation_id (422 Validation Error)', async () => {
      const res = await request(app)
        .post('/api/v1/branches/createBranch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_code: `BR_NO_ORG_${testSuffix}`,
          branch_name: 'Branch Without Org'
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Fails to create branch with non-existent organisation_id (404 Not Found)', async () => {
      const dummyOrgId = '0000000000004000a000999999999999';
      const res = await request(app)
        .post('/api/v1/branches/createBranch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_code: `BR_BAD_ORG_${testSuffix}`,
          branch_name: 'Branch With Bad Org',
          organisation_id: dummyOrgId
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('Successfully creates branch based on organisation_id via /createBranch', async () => {
      const res = await request(app)
        .post('/api/v1/branches/createBranch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_code: `BR_ORG_${testSuffix}`,
          branch_name: `Apex Central Branch ${testSuffix}`,
          organisation_id: testOrgId,
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.organisation_id).toBe(testOrgId);
      branchId = res.body.data.id;
    });

    it('Successfully creates branch directly via organization route /createBranchForOrganization/:id', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/createBranchForOrganization/${testOrgId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_code: `BR_ORG_DIRECT_${testSuffix}`,
          branch_name: `Apex Suburban Branch ${testSuffix}`,
          city: 'Thane',
          state: 'Maharashtra'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organisation_id).toBe(testOrgId);
    });

    it('Retrieves branches filtered by organisation ID via /getAllBranches?organisation_id=...', async () => {
      const res = await request(app)
        .get(`/api/v1/branches/getAllBranches?organisation_id=${testOrgId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      res.body.data.forEach(branch => {
        expect(branch.organisation_id).toBe(testOrgId);
        expect(branch.organisation).toBeDefined();
        expect(branch.organisation.id).toBe(testOrgId);
      });
    });

    it('Retrieves branches for organisation via /getBranchesByOrganisation/:organisationId', async () => {
      const res = await request(app)
        .get(`/api/v1/branches/getBranchesByOrganisation/${testOrgId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data[0].organisation_id).toBe(testOrgId);
    });

    it('Retrieves branch details with organisation association via /getBranchById/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/branches/getBranchById/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(branchId);
      expect(res.body.data.organisation).toBeDefined();
      expect(res.body.data.organisation.id).toBe(testOrgId);
      expect(res.body.data.organisation.name).toBe(`Apex Finance Group ${testSuffix}`);
    });

    it('Updates branch details via /updateBranch/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/branches/updateBranch/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_name: `Apex Updated Branch ${testSuffix}`,
          city: 'Navi Mumbai'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.branch_name).toBe(`Apex Updated Branch ${testSuffix}`);
      expect(res.body.data.city).toBe('Navi Mumbai');
    });

    it('Updates branch status via /updateBranchStatus/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/branches/updateBranchStatus/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 0 // Inactive
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(0);
    });
  });

  describe('Function-Named Route Verification Across Modules', () => {
    it('GET /api/v1/getStatus returns active probe message', async () => {
      const res = await request(app).get('/api/v1/getStatus');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.version).toBe('1.1.0');
    });

    it('GET /api/v1/users/getAllUsers works with authentication and admin role', async () => {
      const res = await request(app)
        .get('/api/v1/users/getAllUsers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/supervisors/getAllSupervisors works with function name route', async () => {
      const res = await request(app)
        .get('/api/v1/supervisors/getAllSupervisors')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/agents/getAllAgents works with function name route', async () => {
      const res = await request(app)
        .get('/api/v1/agents/getAllAgents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/customers/getAllCustomers works with function name route', async () => {
      const res = await request(app)
        .get('/api/v1/customers/getAllCustomers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/collections/getAllCollections and /getCollectionSummary work with function name routes', async () => {
      const res1 = await request(app)
        .get('/api/v1/collections/getAllCollections')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .get('/api/v1/collections/getCollectionSummary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data.totalCollected).toBeDefined();
    });

    it('GET /api/v1/payments/getAllPayments works with function name route', async () => {
      const res = await request(app)
        .get('/api/v1/payments/getAllPayments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/dashboard/getAdminDashboard works with function name route', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/getAdminDashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toBeDefined();
    });
  });
});
