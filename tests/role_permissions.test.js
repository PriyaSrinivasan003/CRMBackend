process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'agentcollection_v1_1_test';

const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');
const { Role, Permission, AdminPermission, SupervisorPermission, AgentPermission } = require('../src/models');

describe('Role & Permission Management Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let agentToken;

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

    // 2. Create Supervisor to get token
    const supRes = await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Perm Supervisor',
        email: `permsup_${testSuffix}@test.com`,
        mobile: `9511${testSuffix}`,
        password: 'Supervisor@Pass2026',
        role_code: 'SUPERVISOR',
        employee_code: `SUP_PERM_${testSuffix}`,
        joining_date: '2026-03-01'
      });

    const supLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `permsup_${testSuffix}@test.com`,
        password: 'Supervisor@Pass2026'
      });
    supervisorToken = supLogin.body.data.tokens.accessToken;

    // 3. Create Agent to get token
    await request(app)
      .post('/api/v1/users/createUser')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Perm Agent',
        email: `permagt_${testSuffix}@test.com`,
        mobile: `9522${testSuffix}`,
        password: 'Agent@Pass2026',
        role_code: 'FIELD_AGENT',
        employee_code: `AGT_PERM_${testSuffix}`,
        supervisor_id: supRes.body.data.supervisor.id,
        joining_date: '2026-03-01'
      });

    const agtLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: `permagt_${testSuffix}@test.com`,
        password: 'Agent@Pass2026'
      });
    agentToken = agtLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Permission Retrieval Across Roles & Role-Specific Tables', () => {
    it('GET /api/v1/permissions/getAllPermissions returns list of all system permissions', async () => {
      const res = await request(app)
        .get('/api/v1/permissions/getAllPermissions?limit=50')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(30);
    });

    it('GET /api/v1/permissions/getAdminPermissions queries dedicated admin_permissions table', async () => {
      const res = await request(app)
        .get('/api/v1/permissions/getAdminPermissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('ADMIN');
      expect(res.body.data.table).toBe('admin_permissions');
      expect(res.body.data.count).toBeGreaterThanOrEqual(30);
      expect(Array.isArray(res.body.data.permissions)).toBe(true);
      expect(res.body.data.permissions[0].permission_code).toBeDefined();
    });

    it('GET /api/v1/permissions/getSupervisorPermissions queries dedicated supervisor_permissions table', async () => {
      const res = await request(app)
        .get('/api/v1/permissions/getSupervisorPermissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('SUPERVISOR');
      expect(res.body.data.table).toBe('supervisor_permissions');
      expect(res.body.data.count).toBeGreaterThanOrEqual(15);
      expect(Array.isArray(res.body.data.permissions)).toBe(true);

      const codes = res.body.data.permissions.map(p => p.permission_code);
      expect(codes).toContain('collections:summary');
      expect(codes).toContain('payments:confirm');
      expect(codes).toContain('dashboard:supervisor');
    });

    it('GET /api/v1/permissions/getAgentPermissions queries dedicated agent_permissions table', async () => {
      const res = await request(app)
        .get('/api/v1/permissions/getAgentPermissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('FIELD_AGENT');
      expect(res.body.data.table).toBe('agent_permissions');
      expect(res.body.data.count).toBeGreaterThanOrEqual(10);
      expect(Array.isArray(res.body.data.permissions)).toBe(true);

      const codes = res.body.data.permissions.map(p => p.permission_code);
      expect(codes).toContain('collections:create');
      expect(codes).toContain('payments:create');
      expect(codes).toContain('dashboard:agent');
      // Agent should not have reverse payment permission
      expect(codes).not.toContain('payments:reverse');
    });

    it('GET /api/v1/permissions/getRolePermissions/:roleCode returns permissions mapped to role', async () => {
      const res = await request(app)
        .get('/api/v1/permissions/getRolePermissions/SUPERVISOR')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role.code).toBe('SUPERVISOR');
      expect(res.body.data.permissions.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Permission Management & Dynamic Assignment', () => {
    let newPermissionId;
    let agentRoleId;

    it('Admin creates a new custom permission via /createPermission', async () => {
      const res = await request(app)
        .post('/api/v1/permissions/createPermission')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Export Custom Reports',
          code: `reports:export_${testSuffix}`,
          module: 'reports',
          description: 'Permission to export analytical reports'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe(`reports:export_${testSuffix}`);
      newPermissionId = res.body.data.id;
    });

    it('Non-admin user is forbidden from creating permissions (403)', async () => {
      const res = await request(app)
        .post('/api/v1/permissions/createPermission')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          name: 'Unauthorized Perm',
          code: `unauth:${testSuffix}`,
          module: 'reports'
        });

      expect(res.status).toBe(403);
    });

    it('Admin assigns the permission to Agent role via /assignPermissionToRole', async () => {
      const agentRole = await Role.findOne({ where: { code: 'FIELD_AGENT' } });
      agentRoleId = agentRole.id;

      const res = await request(app)
        .post('/api/v1/permissions/assignPermissionToRole')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role_id: agentRoleId,
          permission_id: newPermissionId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify it appears in agent_permissions table
      const inAgentTable = await AgentPermission.findOne({
        where: { role_id: agentRoleId, permission_id: newPermissionId }
      });
      expect(inAgentTable).not.toBeNull();
      expect(inAgentTable.permission_code).toBe(`reports:export_${testSuffix}`);
    });

    it('Admin revokes the permission from Agent role via /revokePermissionFromRole', async () => {
      const res = await request(app)
        .post('/api/v1/permissions/revokePermissionFromRole')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role_id: agentRoleId,
          permission_id: newPermissionId
        });

      expect(res.status).toBe(200);
      expect(res.body.data.revoked).toBe(true);

      // Verify removed from agent_permissions table
      const inAgentTable = await AgentPermission.findOne({
        where: { role_id: agentRoleId, permission_id: newPermissionId }
      });
      expect(inAgentTable).toBeNull();
    });
  });

  describe('Role ID Auto-Generation & Relationship Establishment', () => {
    it('Seeded roles have IDs established based on role name and code', async () => {
      const adminRole = await Role.findOne({ where: { code: 'ADMIN' } });
      const supRole = await Role.findOne({ where: { code: 'SUPERVISOR' } });
      const agtRole = await Role.findOne({ where: { code: 'FIELD_AGENT' } });

      expect(adminRole.id).toBe('ADMIN');
      expect(supRole.id).toBe('SUPERVISOR');
      expect(agtRole.id).toBe('FIELD_AGENT');
    });

    it('Automatically generates role id from role name when created without an explicit id', async () => {
      const customRoleName = `Risk Analyst ${testSuffix}`;
      const newRole = await Role.create({
        name: customRoleName,
        description: 'Analyzes collection credit risks'
      });

      const expectedId = `RISK_ANALYST_${testSuffix}`;
      expect(newRole.id).toBe(expectedId);
      expect(newRole.code).toBe(expectedId);

      // Clean up
      await newRole.destroy();
    });

    it('Establishes User -> Role relationship based on name-derived role ID', async () => {
      const { User } = require('../src/models');
      const adminUser = await User.findOne({
        where: { role_id: 'ADMIN' },
        include: [{ model: Role, as: 'role' }]
      });

      expect(adminUser).not.toBeNull();
      expect(adminUser.role_id).toBe('ADMIN');
      expect(adminUser.role).toBeDefined();
      expect(adminUser.role.id).toBe('ADMIN');
      expect(adminUser.role.code).toBe('ADMIN');
    });
  });
});

