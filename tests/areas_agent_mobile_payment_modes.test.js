process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize, Branch, Area, PaymentMode, Agent } = require('../src/models');

describe('Areas, Agent Mobile & Payment Modes Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let agentToken;
  let testBranchId;
  let testAreaId;
  let testPaymentModeId;
  let testAgentId;

  const testId = Date.now().toString().slice(-6);

  beforeAll(async () => {
    // 1. Admin login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@collectagent.com',
        password: 'Admin@SecurePass2026'
      });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Fetch or create a test branch
    const branchRes = await request(app)
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${adminToken}`);

    if (branchRes.body.data && branchRes.body.data.length > 0) {
      testBranchId = branchRes.body.data[0].id;
    } else {
      const orgRes = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${adminToken}`);
      const orgId = orgRes.body.data[0].id;

      const newBranch = await request(app)
        .post('/api/v1/branches/createBranch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_code: `BR_TEST_${testId}`,
          branch_name: 'Test Area Branch',
          organisation_id: orgId
        });
      testBranchId = newBranch.body.data.id;
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Area Management', () => {
    it('Admin creates an area linked to a branch via /createArea', async () => {
      const res = await request(app)
        .post('/api/v1/areas/createArea')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_id: testBranchId,
          area_code: `AREA_${testId}`,
          name: 'Indiranagar Sector 1',
          status: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.area_code).toBe(`AREA_${testId}`);
      expect(res.body.data.branch_id).toBe(testBranchId);
      testAreaId = res.body.data.id;
    });

    it('Rejects duplicate area code (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_id: testBranchId,
          area_code: `AREA_${testId}`,
          name: 'Duplicate Area'
        });

      expect(res.status).toBe(409);
    });

    it('Rejects area creation with non-existent branch_id (404)', async () => {
      const res = await request(app)
        .post('/api/v1/areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          branch_id: '11111111222233334444555566667777',
          area_code: `AREA_INVALID_${testId}`,
          name: 'Invalid Branch Area'
        });

      expect(res.status).toBe(404);
    });

    it('Lists all areas with search and pagination via /getAllAreas', async () => {
      const res = await request(app)
        .get(`/api/v1/areas/getAllAreas?search=Indiranagar`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].branch).toBeDefined();
    });

    it('Retrieves area by ID with branch and organization hierarchy', async () => {
      const res = await request(app)
        .get(`/api/v1/areas/${testAreaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testAreaId);
      expect(res.body.data.branch).toBeDefined();
      expect(res.body.data.branch.id).toBe(testBranchId);
    });

    it('Retrieves areas for a specific branch via /getAreasByBranch/:branchId', async () => {
      const res = await request(app)
        .get(`/api/v1/areas/getAreasByBranch/${testBranchId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(a => a.id === testAreaId)).toBe(true);
    });

    it('Updates area details via /updateArea/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/areas/updateArea/${testAreaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Indiranagar Sector 1 - Updated'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Indiranagar Sector 1 - Updated');
    });

    it('Updates area status via /updateAreaStatus/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/areas/updateAreaStatus/${testAreaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(0);
    });
  });

  describe('Agent Mobile Column', () => {
    it('Admin provisions agent and populates mobile in agents table', async () => {
      const agentMobile = `9811${testId}`;
      const res = await request(app)
        .post('/api/v1/users/createUser')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Mobile Test Agent',
          email: `agent_mobile_${testId}@test.com`,
          mobile: agentMobile,
          password: 'Agent@Pass2026',
          role_code: 'FIELD_AGENT',
          employee_code: `AGT_MOB_${testId}`,
          branch_id: testBranchId
        });

      expect(res.status).toBe(201);
      expect(res.body.data.agent).toBeDefined();
      expect(res.body.data.agent.mobile).toBe(agentMobile);
      testAgentId = res.body.data.agent.id;

      // Direct DB verification of mobile in agents table
      const agentInDb = await Agent.findByPk(testAgentId);
      expect(agentInDb.mobile).toBe(agentMobile);
    });

    it('Admin can update agent mobile via /agents/updateAgent/:id', async () => {
      const updatedMobile = `9822${testId}`;
      const res = await request(app)
        .patch(`/api/v1/agents/updateAgent/${testAgentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          mobile: updatedMobile
        });

      expect(res.status).toBe(200);
      expect(res.body.data.mobile).toBe(updatedMobile);

      const agentInDb = await Agent.findByPk(testAgentId);
      expect(agentInDb.mobile).toBe(updatedMobile);
    });
  });

  describe('Payment Mode Management', () => {
    it('Verifies pre-seeded payment modes exist in database', async () => {
      const res = await request(app)
        .get('/api/v1/payment-modes/getAllPaymentModes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      const codes = res.body.data.map(m => m.code);
      expect(codes).toContain('CASH');
      expect(codes).toContain('UPI');
      expect(codes).toContain('BANK_TRANSFER');
    });

    it('Admin creates new payment mode via /createPaymentMode', async () => {
      const res = await request(app)
        .post('/api/v1/payment-modes/createPaymentMode')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `QR_PAY_${testId}`,
          name: 'QR Code Instant Pay',
          status: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.code).toBe(`QR_PAY_${testId}`);
      expect(res.body.data.name).toBe('QR Code Instant Pay');
      testPaymentModeId = res.body.data.id;
    });

    it('Rejects duplicate payment mode code (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/payment-modes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `QR_PAY_${testId}`,
          name: 'Duplicate QR Pay'
        });

      expect(res.status).toBe(409);
    });

    it('Retrieves payment mode by ID via /getPaymentModeById/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/payment-modes/getPaymentModeById/${testPaymentModeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testPaymentModeId);
      expect(res.body.data.code).toBe(`QR_PAY_${testId}`);
    });

    it('Updates payment mode details via /updatePaymentMode/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/payment-modes/updatePaymentMode/${testPaymentModeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'QR Code Dynamic & Static Pay'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('QR Code Dynamic & Static Pay');
    });

    it('Updates payment mode status via /updatePaymentModeStatus/:id', async () => {
      const res = await request(app)
        .patch(`/api/v1/payment-modes/updatePaymentModeStatus/${testPaymentModeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(0);
    });
  });

  describe('Master Values Dynamic Loading from Tables & Administration APIs', () => {
    it('Loads all active master values (branches, areas, payment modes, organizations) from tables via GET /api/v1/masters', async () => {
      const res = await request(app)
        .get('/api/v1/masters')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.branches).toBeDefined();
      expect(res.body.data.areas).toBeDefined();
      expect(res.body.data.paymentModes).toBeDefined();
      expect(res.body.data.organizations).toBeDefined();
      expect(Array.isArray(res.body.data.branches)).toBe(true);
      expect(Array.isArray(res.body.data.areas)).toBe(true);
      expect(Array.isArray(res.body.data.paymentModes)).toBe(true);
      expect(Array.isArray(res.body.data.organizations)).toBe(true);
    });

    it('Loads active branches dynamically via GET /api/v1/masters/branches', async () => {
      const res = await request(app)
        .get('/api/v1/masters/branches')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Loads active areas dynamically via GET /api/v1/masters/areas', async () => {
      const res = await request(app)
        .get(`/api/v1/masters/areas?branch_id=${testBranchId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Loads active payment modes dynamically via GET /api/v1/masters/payment-modes', async () => {
      const res = await request(app)
        .get('/api/v1/masters/payment-modes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('Creates customer linked to dynamically loaded branch and area from tables', async () => {
      // Ensure area is active
      await request(app)
        .patch(`/api/v1/areas/updateAreaStatus/${testAreaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 1 });

      const res = await request(app)
        .post('/api/v1/customers/createCustomer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_code: `CUST_DYN_${testId}`,
          full_name: 'Dynamic Master Customer',
          mobile: `9833${testId}`,
          address_line1: '12 Dynamic Boulevard',
          branch_id: testBranchId,
          area_id: testAreaId
        });

      expect(res.status).toBe(201);
      expect(res.body.data.customer.branch_id).toBe(testBranchId);
      expect(res.body.data.customer.area_id).toBe(testAreaId);
    });
  });
});
