process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize, Customer, Collection, PromiseToPay, FollowUpTask, Payment } = require('../src/models');

describe('Promise-to-Pay (PTP) and Follow-Up Module Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let supervisorId;
  let supervisorUserId;
  let agentToken;
  let agentId;
  let agentUserId;
  let otherAgentToken;
  let otherAgentId;
  let branchId;
  let testCustomer;
  let testCollection;

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

    // 2. Fetch a branch
    const branchRes = await request(app)
      .get('/api/v1/branches')
      .set('Authorization', `Bearer ${adminToken}`);
    branchId = branchRes.body.data[0].id;

    // 3. Create Supervisor
    const supRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `PTP Sup ${testId}`,
        email: `ptp_sup_${testId}@test.com`,
        mobile: `9844${testId}`,
        password: 'Password@123',
        role_code: 'SUPERVISOR',
        employee_code: `SUPPTP_${testId}`,
        branch_id: branchId
      });
    supervisorId = supRes.body.data.supervisor.id;
    supervisorUserId = supRes.body.data.id;

    const supLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `ptp_sup_${testId}@test.com`,
        password: 'Password@123'
      });
    supervisorToken = supLogin.body.data.tokens.accessToken;

    // 4. Create Assigned Agent
    const agentRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `PTP Agent ${testId}`,
        email: `ptp_agent_${testId}@test.com`,
        mobile: `9845${testId}`,
        password: 'Password@123',
        role_code: 'FIELD_AGENT',
        employee_code: `AGTPTP_${testId}`,
        supervisor_id: supervisorId,
        branch_id: branchId
      });
    agentId = agentRes.body.data.agent.id;
    agentUserId = agentRes.body.data.id;

    const agentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `ptp_agent_${testId}@test.com`,
        password: 'Password@123'
      });
    agentToken = agentLogin.body.data.tokens.accessToken;

    // 5. Create Other Agent (unassigned)
    const otherAgentRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Other Agent ${testId}`,
        email: `other_agent_${testId}@test.com`,
        mobile: `9846${testId}`,
        password: 'Password@123',
        role_code: 'FIELD_AGENT',
        employee_code: `OTHAGT_${testId}`,
        supervisor_id: supervisorId,
        branch_id: branchId
      });
    otherAgentId = otherAgentRes.body.data.agent.id;

    const otherAgentLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `other_agent_${testId}@test.com`,
        password: 'Password@123'
      });
    otherAgentToken = otherAgentLogin.body.data.tokens.accessToken;

    // 6. Create Customer & Assign to primary Agent
    const custRes = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        full_name: `Vikram Malhotra ${testId}`,
        customer_code: `CUSTPTP_${testId}`,
        mobile: `91234${testId}`,
        address_line1: '456 MG Road',
        branch_id: branchId,
        initial_agent_id: agentId
      });
    testCustomer = custRes.body.data.customer;

    // 7. Create Collection case
    testCollection = await Collection.create({
      customer_id: testCustomer.id,
      agent_id: agentId,
      collection_date: new Date().toISOString().split('T')[0],
      amount_due: 50000.00,
      amount_collected: 0.00,
      created_by: supervisorUserId
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('PTP Creation & Balance Invariance Workflow', () => {
    let createdPtpId;

    it('Agent records Promise to Pay: automatically schedules a follow-up task and does NOT alter collection balance', async () => {
      const initialCollection = await Collection.findByPk(testCollection.id);
      const initialDue = Number(initialCollection.amount_due);
      const initialCollected = Number(initialCollection.amount_collected);
      expect(initialDue).toBe(50000.00);
      expect(initialCollected).toBe(0.00);

      const promisedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/ptp')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: testCustomer.id,
          collection_case_id: testCollection.id,
          promised_amount: 15000.00,
          promised_date: promisedDate,
          remarks: 'Customer promised partial EMI payment on salary day'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Promise to pay recorded');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('OPEN');
      expect(Number(res.body.data.promised_amount)).toBe(15000.00);
      expect(res.body.data.recorded_by).toBe(agentUserId);

      // Verify automatic follow-up task was scheduled
      expect(res.body.data.follow_up_task).toBeDefined();
      expect(res.body.data.follow_up_task.promise_id).toBe(res.body.data.id);
      expect(res.body.data.follow_up_task.task_type).toBe('PTP_FOLLOWUP');
      expect(res.body.data.follow_up_task.completion_status).toBe('PENDING');

      createdPtpId = res.body.data.id;

      // CRITICAL REQUIREMENT VERIFICATION:
      // "A promise to pay (PTP) is a commitment made by the customer. It is not a payment and must not reduce the outstanding balance."
      const collectionAfterPtp = await Collection.findByPk(testCollection.id);
      expect(Number(collectionAfterPtp.amount_due)).toBe(initialDue);
      expect(Number(collectionAfterPtp.amount_collected)).toBe(initialCollected);
    });

    it('Unassigned agent is forbidden from recording PTP for unassigned customer (403)', async () => {
      const res = await request(app)
        .post('/api/v1/ptp')
        .set('Authorization', `Bearer ${otherAgentToken}`)
        .send({
          customer_id: testCustomer.id,
          promised_amount: 10000.00,
          promised_date: '2026-10-15'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Retrieves PTP details by ID with customer, creator, and scheduled follow-up tasks', async () => {
      const res = await request(app)
        .get(`/api/v1/ptp/${createdPtpId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Promise to pay details retrieved');
      expect(res.body.data.id).toBe(createdPtpId);
      expect(res.body.data.customer.id).toBe(testCustomer.id);
      expect(res.body.data.followUpTasks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Verified Payment Fulfillment & Policy Enforcement', () => {
    it('Full payment fulfillment: verified payment >= promised_amount marks PTP as KEPT and completes follow-up task', async () => {
      const promisedDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Create PTP for 10,000
      const ptpRes = await request(app)
        .post('/api/v1/ptp')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: testCustomer.id,
          promised_amount: 10000.00,
          promised_date: promisedDate,
          remarks: 'Full installment commitment'
        });
      const ptpId = ptpRes.body.data.id;

      // 2. Record matching verified payment of 10,000
      await Payment.create({
        collection_id: testCollection.id,
        customer_id: testCustomer.id,
        agent_id: agentId,
        amount: 10000.00,
        payment_status: 1, // Confirmed
        receipt_number: `RCPT-FULFILL-${Date.now()}`,
        created_by: agentUserId
      });

      // 3. Verify payment against commitment
      const evalRes = await request(app)
        .post(`/api/v1/ptp/${ptpId}/verify-payment`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ allow_partial: false });

      expect(evalRes.status).toBe(200);
      expect(evalRes.body.data.is_kept).toBe(true);
      expect(evalRes.body.data.ptp.status).toBe('KEPT');
      expect(evalRes.body.data.ptp.resolved_at).toBeDefined();

      // Check follow-up task is marked completed
      const updatedTask = await FollowUpTask.findOne({ where: { promise_id: ptpId } });
      expect(updatedTask.completion_status).toBe('COMPLETED');
      expect(updatedTask.outcome).toBe('PTP_KEPT');
    });

    it('Partial payment policy: partial payment does NOT mark promise KEPT unless policy explicitly permits it', async () => {
      const promisedDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Create PTP for 25,000
      const ptpRes = await request(app)
        .post('/api/v1/ptp')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: testCustomer.id,
          promised_amount: 25000.00,
          promised_date: promisedDate,
          remarks: 'Target 25k commitment'
        });
      const ptpId = ptpRes.body.data.id;

      // 2. Record partial payment of 5,000
      await Payment.create({
        collection_id: testCollection.id,
        customer_id: testCustomer.id,
        agent_id: agentId,
        amount: 5000.00,
        payment_status: 1,
        receipt_number: `RCPT-PARTIAL-${Date.now()}`,
        created_by: agentUserId
      });

      // 3. Evaluate without allow_partial policy (default policy)
      const strictEval = await request(app)
        .post(`/api/v1/ptp/${ptpId}/verify-payment`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ allow_partial: false });

      expect(strictEval.status).toBe(200);
      expect(strictEval.body.data.is_kept).toBe(false);
      expect(strictEval.body.data.partial_payment).toBe(true);
      expect(strictEval.body.data.ptp.status).toBe('OPEN');

      const taskStrict = await FollowUpTask.findOne({ where: { promise_id: ptpId } });
      expect(taskStrict.completion_status).toBe('PENDING');

      // 4. Now evaluate with allow_partial: true (explicit policy permit)
      const permittedEval = await request(app)
        .post(`/api/v1/ptp/${ptpId}/verify-payment`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ allow_partial: true });

      expect(permittedEval.status).toBe(200);
      expect(permittedEval.body.data.is_kept).toBe(true);
      expect(permittedEval.body.data.ptp.status).toBe('KEPT');

      const taskPermitted = await FollowUpTask.findOne({ where: { promise_id: ptpId } });
      expect(taskPermitted.completion_status).toBe('COMPLETED');
      expect(taskPermitted.outcome).toBe('PTP_KEPT_PARTIAL');
    });
  });

  describe('Overdue Commitment Detection & Supervisor Alerts', () => {
    let overduePtpId;

    it('Marks commitment BROKEN when commitment date passes without expected payment', async () => {
      // Create a PTP with past date (yesterday)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const ptp = await PromiseToPay.create({
        customer_id: testCustomer.id,
        promised_amount: 30000.00,
        promised_date: yesterday,
        status: 'OPEN',
        recorded_by: agentUserId,
        recorded_at: new Date(Date.now() - 48 * 60 * 60 * 1000)
      });
      overduePtpId = ptp.id;

      await FollowUpTask.create({
        promise_id: ptp.id,
        customer_id: testCustomer.id,
        action_date: yesterday,
        assigned_employee_id: agentUserId,
        task_type: 'PTP_FOLLOWUP',
        completion_status: 'PENDING'
      });

      // Run overdue check endpoint
      const checkRes = await request(app)
        .post('/api/v1/ptp/check-overdue')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data.broken_count).toBeGreaterThanOrEqual(1);

      const refreshedPtp = await PromiseToPay.findByPk(overduePtpId);
      expect(refreshedPtp.status).toBe('BROKEN');
      expect(refreshedPtp.resolved_at).toBeDefined();

      const refreshedTask = await FollowUpTask.findOne({ where: { promise_id: overduePtpId } });
      expect(refreshedTask.completion_status).toBe('OVERDUE');
      expect(refreshedTask.outcome).toBe('PTP_BROKEN');
    });

    it('Supervisor receives overdue commitment alert for broken commitments in team', async () => {
      const alertRes = await request(app)
        .get('/api/v1/ptp/alerts')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(alertRes.status).toBe(200);
      expect(alertRes.body.success).toBe(true);
      expect(Array.isArray(alertRes.body.data)).toBe(true);

      const matchedAlert = alertRes.body.data.find(a => a.id === overduePtpId);
      expect(matchedAlert).toBeDefined();
      expect(matchedAlert.status).toBe('BROKEN');
      expect(matchedAlert.days_overdue).toBeGreaterThanOrEqual(1);
      expect(matchedAlert.alert_severity).toBeDefined();
      expect(matchedAlert.customer_name).toContain('Vikram Malhotra');
    });
  });

  describe('Follow-Up Task Continuation & Escalation Workflow', () => {
    it('Agent requests escalation to supervisor on unfulfilled commitment', async () => {
      const promisedDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const ptpRes = await request(app)
        .post('/api/v1/ptp')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: testCustomer.id,
          promised_amount: 18000.00,
          promised_date: promisedDate,
          remarks: 'Needs close monitoring'
        });
      const ptpId = ptpRes.body.data.id;

      // Agent escalates
      const escRes = await request(app)
        .post(`/api/v1/ptp/${ptpId}/escalate`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          reason: 'Customer phone switched off and address visited twice with no response'
        });

      expect(escRes.status).toBe(200);
      expect(escRes.body.success).toBe(true);
      expect(escRes.body.data.escalation_reason).toContain('Customer phone switched off');
      expect(escRes.body.data.ptp.remarks).toContain('Escalated: Customer phone switched off');

      const task = await FollowUpTask.findOne({ where: { promise_id: ptpId } });
      expect(task.outcome).toBe('ESCALATED');
      expect(task.completion_status).toBe('OVERDUE');
    });

    it('Agent continues follow-up by updating task outcome and action date', async () => {
      const tasksRes = await request(app)
        .get('/api/v1/ptp/tasks')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(tasksRes.status).toBe(200);
      expect(tasksRes.body.data.length).toBeGreaterThan(0);

      const taskId = tasksRes.body.data[0].id;

      const updateRes = await request(app)
        .patch(`/api/v1/ptp/tasks/${taskId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          completion_status: 'COMPLETED',
          outcome: 'CUSTOMER_CONTACTED_RESCHEDULED',
          remarks: 'Customer requested 2 more days due to bank holiday'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.outcome).toBe('CUSTOMER_CONTACTED_RESCHEDULED');
      expect(updateRes.body.data.completion_status).toBe('COMPLETED');
    });
  });

  describe('Function-Named Route Aliases & Alternative Route Paths', () => {
    it('POST /api/v1/ptp/createPromiseToPay works identically', async () => {
      const res = await request(app)
        .post('/api/v1/ptp/createPromiseToPay')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          customer_id: testCustomer.id,
          promised_amount: 8000.00,
          promised_date: '2026-10-25',
          remarks: 'Aliased creation test'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OPEN');
    });

    it('GET /api/v1/ptp/getAllPromisesToPay works identically', async () => {
      const res = await request(app)
        .get('/api/v1/ptp/getAllPromisesToPay')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/v1/ptp/getOverdueAlerts works identically', async () => {
      const res = await request(app)
        .get('/api/v1/ptp/getOverdueAlerts')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Alternative mount path /api/v1/promises-to-pay and /api/v1/follow-up-tasks work seamlessly', async () => {
      const pRes = await request(app)
        .get('/api/v1/promises-to-pay')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(pRes.status).toBe(200);

      const fRes = await request(app)
        .get('/api/v1/follow-up-tasks/tasks')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(fRes.status).toBe(200);
    });
  });
});
