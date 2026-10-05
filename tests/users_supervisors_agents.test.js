process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');

describe('User, Supervisor & Agent Management Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let supervisorId;
  let agentToken;
  let agentId;

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
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Provisioning with Dual Profile Transactions', () => {
    it('Admin creates SUPERVISOR: creates user and supervisor profile in one transaction', async () => {
      const res = await request(app)
        .post('/api/v1/users/createUser')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Priya Sharma',
          email: `priya_${testId}@test.com`,
          mobile: `9811${testId}`,
          password: 'Supervisor@Pass2026',
          role_code: 'SUPERVISOR',
          employee_code: `SUP_${testId}`,
          joining_date: '2026-03-01'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.role.code).toBe('SUPERVISOR');
      expect(res.body.data.supervisor).toBeDefined();
      expect(res.body.data.supervisor.employee_code).toBe(`SUP_${testId}`);

      supervisorId = res.body.data.supervisor.id;

      // Log in as the newly created Supervisor to get supervisor token
      const supLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: `priya_${testId}@test.com`,
          password: 'Supervisor@Pass2026'
        });
      expect(supLogin.status).toBe(200);
      supervisorToken = supLogin.body.data.tokens.accessToken;
    });

    it('Admin creates FIELD_AGENT: creates user and agent profile linked to supervisor', async () => {
      const res = await request(app)
        .post('/api/v1/users/createUser')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Karan Dave',
          email: `karan_${testId}@test.com`,
          mobile: `9822${testId}`,
          password: 'Agent@Pass2026',
          role_code: 'FIELD_AGENT',
          employee_code: `AGT_${testId}`,
          supervisor_id: supervisorId,
          joining_date: '2026-03-05'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.role.code).toBe('FIELD_AGENT');
      expect(res.body.data.agent).toBeDefined();
      expect(res.body.data.agent.employee_code).toBe(`AGT_${testId}`);
      expect(res.body.data.agent.supervisor_id).toBe(supervisorId);

      agentId = res.body.data.agent.id;

      // Log in as Field Agent to get agent token
      const agtLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: `karan_${testId}@test.com`,
          password: 'Agent@Pass2026'
        });
      expect(agtLogin.status).toBe(200);
      agentToken = agtLogin.body.data.tokens.accessToken;
    });

    it('should reject creating duplicate employee code (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/users/createUser')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Agent',
          email: `dup_${testId}@test.com`,
          mobile: `9899${testId}`,
          password: 'Agent@Pass2026',
          role_code: 'FIELD_AGENT',
          employee_code: `AGT_${testId}` // Duplicate!
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(['CONFLICT', 'DUPLICATE_ENTRY']).toContain(res.body.error.code);
    });

    it('Non-admin user (Supervisor) should be forbidden from creating users (403)', async () => {
      const res = await request(app)
        .post('/api/v1/users/createUser')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          name: 'Unauthorized User',
          email: `unauth_${testId}@test.com`,
          password: 'User@Pass2026',
          role_code: 'FIELD_AGENT',
          employee_code: `AGT_UNAUTH_${testId}`
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('RBAC & Record-Level Ownership Scoping', () => {
    it('Supervisor should be allowed to view agents in their own team', async () => {
      const res = await request(app)
        .get(`/api/v1/supervisors/${supervisorId}/agents`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].employee_code).toBe(`AGT_${testId}`);
    });

    it('Supervisor should NOT be allowed to view unrelated supervisor details (403)', async () => {
      const dummySupervisorUuid = '0000000000004000a000999999999999';
      const res = await request(app)
        .get(`/api/v1/supervisors/${dummySupervisorUuid}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Field Agent can view their own profile', async () => {
      const res = await request(app)
        .get(`/api/v1/agents/${agentId}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employee_code).toBe(`AGT_${testId}`);
    });

    it('Field Agent is forbidden from viewing other agents (403)', async () => {
      const otherAgentUuid = '0000000000004000a000888888888888';
      const res = await request(app)
        .get(`/api/v1/agents/${otherAgentUuid}`)
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(403);
    });

    it('Invalid UUID format in URL parameter should return 422 Validation Error', async () => {
      const res = await request(app)
        .get('/api/v1/users/not-a-valid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
