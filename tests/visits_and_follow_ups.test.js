process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');
const {
  VISIT_OUTCOME,
  FOLLOW_UP_TYPE,
  FOLLOW_UP_STATUS
} = require('../src/constants/statusCodes');

describe('Field Visits and Follow-ups Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let agentToken;
  let otherAgentToken;
  let supervisorId;
  let agentId;
  let customerId;
  let assignmentId;

  const testSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    // 1. Admin login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'admin@collectagent.com',
        password: 'Admin@SecurePass2026'
      });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Create Supervisor
    const supRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Visit Supervisor',
        email: `vis_sup_${testSuffix}@test.com`,
        mobile: `9311${testSuffix}`,
        password: 'Supervisor@Pass2026',
        role_code: 'SUPERVISOR',
        employee_code: `SUP_VIS_${testSuffix}`,
        joining_date: '2026-03-01'
      });
    supervisorId = supRes.body.data.supervisor.id;

    const supLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `vis_sup_${testSuffix}@test.com`,
        password: 'Supervisor@Pass2026'
      });
    supervisorToken = supLogin.body.data.tokens.accessToken;

    // 3. Create Primary Field Agent under Supervisor
    const agtRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Visit Field Agent',
        email: `vis_agt_${testSuffix}@test.com`,
        mobile: `9322${testSuffix}`,
        password: 'Agent@Pass2026',
        role_code: 'FIELD_AGENT',
        employee_code: `AGT_VIS_${testSuffix}`,
        supervisor_id: supervisorId,
        joining_date: '2026-03-01'
      });
    agentId = agtRes.body.data.agent.id;

    const agtLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `vis_agt_${testSuffix}@test.com`,
        password: 'Agent@Pass2026'
      });
    agentToken = agtLogin.body.data.tokens.accessToken;

    // 4. Create Secondary Field Agent (for scoping test)
    await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Other Field Agent',
        email: `other_agt_${testSuffix}@test.com`,
        mobile: `9333${testSuffix}`,
        password: 'Agent@Pass2026',
        role_code: 'FIELD_AGENT',
        employee_code: `AGT_OTH_${testSuffix}`,
        supervisor_id: supervisorId,
        joining_date: '2026-03-01'
      });

    const otherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `other_agt_${testSuffix}@test.com`,
        password: 'Agent@Pass2026'
      });
    otherAgentToken = otherLogin.body.data.tokens.accessToken;

    // 5. Create Customer assigned to Primary Agent
    const custRes = await request(app)
      .post('/api/v1/customers/createCustomer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customer_code: `CUST_VIS_${testSuffix}`,
        full_name: `Visit Customer ${testSuffix}`,
        mobile: `9344${testSuffix}`,
        address_line1: '123 Recovery Lane',
        city: 'Mumbai',
        branch_id: 'c7e2b10458cc4372a5670e02b2c3d479',
        initial_agent_id: agentId
      });
    customerId = custRes.body.data.customer.id;
    if (custRes.body.data.assignment) {
      assignmentId = custRes.body.data.assignment.id;
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Field Visit Tracking & Outcomes', () => {
    let recordedVisitId;

    it('Assigned Agent records successful contact visit via POST /api/v1/visits', async () => {
      const res = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: customerId,
          visit_outcome: VISIT_OUTCOME.CUSTOMER_CONTACTED,
          remarks: 'Met customer in person; discussed outstanding loan EMI',
          latitude: 19.0760,
          longitude: 72.8777
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.customer_id).toBe(customerId);
      expect(res.body.data.agent_id).toBe(agentId);
      expect(res.body.data.visit_outcome).toBe(VISIT_OUTCOME.CUSTOMER_CONTACTED);
      recordedVisitId = res.body.data.id;
    });

    it('Agent records unsuccessful attempt (customer unavailable) via /createVisit', async () => {
      const res = await request(app)
        .post('/api/v1/visits/createVisit')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: customerId,
          visit_outcome: VISIT_OUTCOME.CUSTOMER_UNAVAILABLE,
          remarks: 'Premises locked; neighbor stated customer is out of town until Friday'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.visit_outcome).toBe(VISIT_OUTCOME.CUSTOMER_UNAVAILABLE);
    });

    it('Recording visit with next_follow_up_at automatically schedules a follow-up', async () => {
      const followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: customerId,
          visit_outcome: VISIT_OUTCOME.PAYMENT_PROMISE_RECORDED,
          remarks: 'Customer promised payment by Friday afternoon',
          next_follow_up_at: followUpDate
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.next_follow_up_at).toBeDefined();
      expect(res.body.data.scheduled_follow_up).toBeDefined();
      expect(res.body.data.scheduled_follow_up.status).toBe(FOLLOW_UP_STATUS.PENDING);
      expect(res.body.data.scheduled_follow_up.follow_up_type).toBe(FOLLOW_UP_TYPE.VISIT);
    });

    it('Rejects invalid visit outcome with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: customerId,
          visit_outcome: 99 // Invalid outcome
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('Unassigned agent is forbidden from recording visit for unassigned customer (403)', async () => {
      const res = await request(app)
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${otherAgentToken}`)
        .send({
          customer_id: customerId,
          visit_outcome: VISIT_OUTCOME.CUSTOMER_CONTACTED,
          remarks: 'Attempt by unassigned agent'
        });

      expect(res.status).toBe(403);
    });

    it('Agent retrieves their list of visits via GET /api/v1/visits', async () => {
      const res = await request(app)
        .get('/api/v1/visits')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('Retrieves specific visit by ID via GET /api/v1/visits/:id and /getVisitById/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/visits/${recordedVisitId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(recordedVisitId);
      expect(res.body.data.customer).toBeDefined();
      expect(res.body.data.customer.full_name).toContain('Visit Customer');

      // Test dual route
      const dualRes = await request(app)
        .get(`/api/v1/visits/getVisitById/${recordedVisitId}`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect(dualRes.status).toBe(200);
    });

    it('Other agent cannot view visit recorded by primary agent (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/visits/${recordedVisitId}`)
        .set('Authorization', `Bearer ${otherAgentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Follow-up Planning & Completion Workflow', () => {
    let createdFollowUpId;

    it('Agent schedules a planned call follow-up via POST /api/v1/follow-ups', async () => {
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/follow-ups')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: customerId,
          scheduled_at: scheduledDate,
          follow_up_type: FOLLOW_UP_TYPE.CALL,
          remarks: 'Planned reminder phone call for installment payment'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe(FOLLOW_UP_STATUS.PENDING);
      expect(res.body.data.follow_up_type).toBe(FOLLOW_UP_TYPE.CALL);
      createdFollowUpId = res.body.data.id;
    });

    it('Supervisor schedules a document request follow-up via /createFollowUp', async () => {
      const scheduledDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/v1/follow-ups/createFollowUp')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          customer_id: customerId,
          agent_id: agentId,
          scheduled_at: scheduledDate,
          follow_up_type: FOLLOW_UP_TYPE.DOCUMENT_REQUEST,
          remarks: 'Request bank statement copy from customer'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.follow_up_type).toBe(FOLLOW_UP_TYPE.DOCUMENT_REQUEST);
    });

    it('Lists follow-ups filtered by status via GET /api/v1/follow-ups?status=0', async () => {
      const res = await request(app)
        .get('/api/v1/follow-ups?status=0')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every(f => f.status === FOLLOW_UP_STATUS.PENDING)).toBe(true);
    });

    it('Retrieves follow-up details by ID via /getFollowUpById/:id', async () => {
      const res = await request(app)
        .get(`/api/v1/follow-ups/getFollowUpById/${createdFollowUpId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdFollowUpId);
      expect(res.body.data.customer).toBeDefined();
    });

    it('Agent completes follow-up via PATCH /api/v1/follow-ups/:id/complete', async () => {
      const res = await request(app)
        .patch(`/api/v1/follow-ups/${createdFollowUpId}/complete`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          remarks: 'Customer confirmed payment will be initiated today via UPI'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(FOLLOW_UP_STATUS.COMPLETED);
      expect(res.body.data.completed_at).toBeDefined();
      expect(res.body.data.remarks).toContain('Customer confirmed payment');
    });

    it('Dual route PATCH /api/v1/follow-ups/completeFollowUp/:id works identically', async () => {
      // Create another follow up to complete
      const createRes = await request(app)
        .post('/api/v1/follow-ups')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: customerId,
          scheduled_at: new Date().toISOString(),
          follow_up_type: FOLLOW_UP_TYPE.CALL,
          remarks: 'Follow up to test dual route'
        });

      const res = await request(app)
        .patch(`/api/v1/follow-ups/completeFollowUp/${createRes.body.data.id}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ remarks: 'Completed via function-name route' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(FOLLOW_UP_STATUS.COMPLETED);
    });
  });
});
