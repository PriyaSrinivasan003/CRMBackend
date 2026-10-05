process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');

describe('Customer, Collection & Payment Workflow Tests', () => {
  let adminToken;
  let agentToken;
  let otherAgentToken;
  let assignedAgentId;
  let customerId;
  let collectionId;
  let paymentId;

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

    // 2. Create Assigned Agent
    const ag1 = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Assigned Agent',
        email: `assigned_${testId}@test.com`,
        mobile: `9611${testId}`,
        password: 'Agent@Pass2026',
        role_code: 'FIELD_AGENT',
        employee_code: `AGT_WF1_${testId}`
      });
    assignedAgentId = ag1.body.data.agent.id;

    const ag1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: `assigned_${testId}@test.com`, password: 'Agent@Pass2026' });
    agentToken = ag1Login.body.data.tokens.accessToken;

    // 3. Create Other Agent (unassigned)
    await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Unassigned Agent',
        email: `unassigned_${testId}@test.com`,
        mobile: `9622${testId}`,
        password: 'Agent@Pass2026',
        role_code: 'FIELD_AGENT',
        employee_code: `AGT_WF2_${testId}`
      });

    const ag2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: `unassigned_${testId}@test.com`, password: 'Agent@Pass2026' });
    otherAgentToken = ag2Login.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Customer Creation & Assignment Scoping', () => {
    it('Admin creates customer and assigns to assigned agent', async () => {
      const res = await request(app)
        .post('/api/v1/customers/createCustomer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_code: `CUST_${testId}`,
          full_name: 'Rajesh Sharma',
          mobile: `9877${testId}`,
          address_line1: '45 Lake View Residency',
          city: 'Bangalore',
          branch_id: 'c7e2b10458cc4372a5670e02b2c3d479',
          initial_agent_id: assignedAgentId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.id).toBeDefined();
      customerId = res.body.data.customer.id;
    });

    it('Assigned agent can view assigned customer', async () => {
      const res = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.full_name).toBe('Rajesh Sharma');
    });

    it('Unassigned agent is forbidden from viewing this customer (403)', async () => {
      const res = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${otherAgentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Collection Visits & Amount Rules', () => {
    it('Unassigned agent cannot create collection visit for this customer (403)', async () => {
      const res = await request(app)
        .post('/api/v1/collections/createCollection')
        .set('Authorization', `Bearer ${otherAgentToken}`)
        .send({
          customer_id: customerId,
          collection_date: '2026-09-28',
          amount_due: 3500.00,
          remarks: 'Unauthorized collection attempt'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Assigned agent can create collection visit', async () => {
      const res = await request(app)
        .post('/api/v1/collections/createCollection')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: customerId,
          collection_date: '2026-09-28',
          amount_due: 3500.00,
          remarks: 'Scheduled monthly loan installment'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(parseFloat(res.body.data.amount_due)).toBe(3500);
      expect(parseFloat(res.body.data.amount_collected)).toBe(0);
      expect(res.body.data.collection_status).toBe(0); // Pending

      collectionId = res.body.data.id;
    });
  });

  describe('Payments, Atomic Balance Sync & Duplicate Protection', () => {
    it('Assigned agent records payment against collection visit', async () => {
      const res = await request(app)
        .post('/api/v1/payments/createPayment')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          collection_id: collectionId,
          receipt_number: `RCP_${testId}`,
          amount: 3500.00,
          payment_method: 0, // Cash
          notes: 'Customer paid in cash'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receipt_number).toBe(`RCP_${testId}`);
      expect(res.body.data.collected_at).toBeDefined();
      expect(res.body.data.allocations).toBeDefined();
      expect(res.body.data.allocations.length).toBe(1);
      expect(parseFloat(res.body.data.allocations[0].allocated_amount)).toBe(3500);
      paymentId = res.body.data.id;

      // Verify that collection amount_collected and collection_status were updated atomically
      const colRes = await request(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(parseFloat(colRes.body.data.amount_collected)).toBe(3500);
      expect(colRes.body.data.collection_status).toBe(2); // Fully Collected (since 3500 == 3500)
    });

    it('Assigned agent records payment with explicit collected_at and single installment_id', async () => {
      const installmentId = '11111111222233334444555566667777';
      const collectedTime = '2026-09-28T10:30:00.000Z';
      const res = await request(app)
        .post('/api/v1/payments/createPayment')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          collection_id: collectionId,
          receipt_number: `RCP_INST_${testId}`,
          amount: 1000.00,
          payment_method: 1, // UPI
          collected_at: collectedTime,
          installment_id: installmentId,
          notes: 'Single installment payment'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.collected_at).toBeDefined();
      expect(new Date(res.body.data.collected_at).toISOString()).toBe(new Date(collectedTime).toISOString());
      expect(res.body.data.allocations).toBeDefined();
      expect(res.body.data.allocations.length).toBe(1);
      expect(res.body.data.allocations[0].installment_id).toBe(installmentId);
      expect(parseFloat(res.body.data.allocations[0].allocated_amount)).toBe(1000);
    });

    it('Rejects payment when allocations sum does not match payment amount (400)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/createPayment')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          collection_id: collectionId,
          receipt_number: `RCP_MISMATCH_${testId}`,
          amount: 2000.00,
          payment_method: 0,
          allocations: [
            { installment_id: '11111111222233334444555566667777', allocated_amount: 1000.00 },
            { installment_id: '8888888899990000aaaabbbbccccdddd', allocated_amount: 500.00 } // Total 1500 != 2000
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Total allocated amount');
    });

    it('Records payment distributed across multiple installments', async () => {
      const inst1 = '11111111222233334444555566667777';
      const inst2 = '8888888899990000aaaabbbbccccdddd';
      const res = await request(app)
        .post('/api/v1/payments/createPayment')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          collection_id: collectionId,
          receipt_number: `RCP_MULTI_${testId}`,
          amount: 2500.00,
          payment_method: 2, // Bank Transfer
          collected_at: '2026-09-28T11:00:00.000Z',
          allocations: [
            { installment_id: inst1, allocated_amount: 1500.00 },
            { installment_id: inst2, allocated_amount: 1000.00 }
          ],
          notes: 'Split payment across two installments'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.allocations).toHaveLength(2);
      const amounts = res.body.data.allocations.map(a => parseFloat(a.allocated_amount)).sort();
      expect(amounts).toEqual([1000, 1500]);

      // Check getPaymentById returns allocations
      const getRes = await request(app)
        .get(`/api/v1/payments/${res.body.data.id}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.collected_at).toBeDefined();
      expect(getRes.body.data.allocations).toHaveLength(2);
    });

    it('Duplicate payment submission with identical receipt number is rejected (409)', async () => {
      const res = await request(app)
        .post('/api/v1/payments/createPayment')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          collection_id: collectionId,
          receipt_number: `RCP_${testId}`, // Duplicate receipt!
          amount: 3500.00,
          payment_method: 0
        });

      expect(res.status).toBe(409);
      expect(['CONFLICT', 'DUPLICATE_ENTRY']).toContain(res.body.error.code);
    });

    it('Admin reverses payment: collection totals and status are recalculated', async () => {
      const revRes = await request(app)
        .post(`/api/v1/payments/${paymentId}/reverse`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(revRes.status).toBe(200);
      expect(revRes.body.data.payment_status).toBe(3); // Reversed

      // Verify collection amount_collected is recalculated
      const colRes = await request(app)
        .get(`/api/v1/collections/${collectionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(colRes.status).toBe(200);
      expect(colRes.body.data.collection_status).toBeDefined();
    });
  });
});
