const { Op } = require('sequelize');
const {
  User,
  Role,
  Supervisor,
  Agent,
  Branch,
  AgentSupervisorAssignment,
  RefreshToken,
  sequelize
} = require('../../models');
const { ROLES, USER_STATUS, SUPERVISOR_STATUS, AGENT_STATUS, ASSIGNMENT_STATUS } = require('../../constants/statusCodes');
const { hashPassword } = require('../../utils/crypto');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class UserService {
  /**
   * Create user and automatically provision related Supervisor or Field Agent profile
   */
  async createUser(data, creatorId = null) {
    const {
      name,
      email,
      mobile,
      password,
      role_code,
      employee_code,
      branch_id,
      joining_date,
      address,
      date_of_birth,
      emergency_contact,
      government_id_reference,
      supervisor_id
    } = data;

    // Check unique email / mobile
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          ...(email ? [{ email }] : []),
          ...(mobile ? [{ mobile }] : [])
        ]
      }
    });

    if (existing) {
      if (email && existing.email === email) {
        throw ApiError.conflict(`A user with email '${email}' already exists`);
      }
      if (mobile && existing.mobile === mobile) {
        throw ApiError.conflict(`A user with mobile '${mobile}' already exists`);
      }
    }

    // Resolve Role
    const role = await Role.findOne({ where: { code: role_code } });
    if (!role) {
      throw ApiError.badRequest(`Role '${role_code}' does not exist`);
    }

    // Check branch if provided
    if (branch_id) {
      const branch = await Branch.findByPk(branch_id);
      if (!branch) {
        throw ApiError.badRequest(`Branch with id '${branch_id}' does not exist`);
      }
    }

    const password_hash = await hashPassword(password);

    // Run transaction
    return sequelize.transaction(async (t) => {
      // 1. Create base user
      const user = await User.create(
        {
          name,
          email: email || null,
          mobile: mobile || null,
          password_hash,
          role_id: role.id,
          status: USER_STATUS.ACTIVE,
          created_by: creatorId
        },
        { transaction: t }
      );

      let supervisorProfile = null;
      let agentProfile = null;

      // 2. Provision Supervisor Profile
      if (role_code === ROLES.SUPERVISOR) {
        const existingEmp = await Supervisor.findOne({ where: { employee_code } });
        if (existingEmp) {
          throw ApiError.conflict(`Supervisor employee code '${employee_code}' already exists`);
        }

        supervisorProfile = await Supervisor.create(
          {
            user_id: user.id,
            employee_code,
            branch_id: branch_id || null,
            joining_date: joining_date || new Date(),
            address: address || null,
            status: SUPERVISOR_STATUS.ACTIVE,
            created_by: creatorId
          },
          { transaction: t }
        );
      }

      // 3. Provision Field Agent Profile
      if (role_code === ROLES.FIELD_AGENT) {
        const existingEmp = await Agent.findOne({ where: { employee_code } });
        if (existingEmp) {
          throw ApiError.conflict(`Agent employee code '${employee_code}' already exists`);
        }

        if (supervisor_id) {
          const supervisor = await Supervisor.findByPk(supervisor_id);
          if (!supervisor || supervisor.status !== SUPERVISOR_STATUS.ACTIVE) {
            throw ApiError.badRequest('Assigned supervisor does not exist or is not active');
          }
        }

        agentProfile = await Agent.create(
          {
            user_id: user.id,
            supervisor_id: supervisor_id || null,
            employee_code,
            mobile: mobile || data.mobile || null,
            branch_id: branch_id || null,
            joining_date: joining_date || new Date(),
            address: address || null,
            date_of_birth: date_of_birth || null,
            emergency_contact: emergency_contact || null,
            government_id_reference: government_id_reference || null,
            status: AGENT_STATUS.ACTIVE,
            created_by: creatorId
          },
          { transaction: t }
        );

        // If supervisor was assigned, create assignment record
        if (supervisor_id) {
          await AgentSupervisorAssignment.create(
            {
              supervisor_id,
              agent_id: agentProfile.id,
              assigned_by: creatorId || user.id,
              assigned_at: new Date(),
              effective_from: new Date(),
              status: ASSIGNMENT_STATUS.ACTIVE
            },
            { transaction: t }
          );
        }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        status: user.status,
        role: { id: role.id, code: role.code, name: role.name },
        supervisor: supervisorProfile,
        agent: agentProfile,
        created_at: user.created_at
      };
    });
  }

  /**
   * Get all users with search, filtering, and pagination
   */
  async getAllUsers(query) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['name', 'email', 'mobile', 'status', 'created_at', 'last_login_at'],
      'created_at',
      'DESC'
    );

    const where = {};
    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }
    if (query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${query.search}%` } },
        { email: { [Op.like]: `%${query.search}%` } },
        { mobile: { [Op.like]: `%${query.search}%` } }
      ];
    }

    const roleInclude = {
      model: Role,
      as: 'role'
    };

    if (query.role) {
      roleInclude.where = { code: query.role.toUpperCase() };
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        roleInclude,
        { model: Supervisor, as: 'supervisor' },
        { model: Agent, as: 'agent' }
      ],
      limit,
      offset,
      order
    });

    return {
      users: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await User.findByPk(id, {
      include: [
        { model: Role, as: 'role' },
        {
          model: Supervisor,
          as: 'supervisor',
          include: [{ model: Branch, as: 'branch' }]
        },
        {
          model: Agent,
          as: 'agent',
          include: [
            { model: Branch, as: 'branch' },
            { model: Supervisor, as: 'supervisor' }
          ]
        }
      ]
    });

    if (!user) {
      throw ApiError.notFound(`User with id '${id}' not found`);
    }

    return user;
  }

  /**
   * Update user details
   */
  async updateUser(id, updateData, updaterId = null) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      throw ApiError.notFound(`User with id '${id}' not found`);
    }

    const updates = { ...updateData, updated_by: updaterId };
    if (updates.password) {
      updates.password_hash = await hashPassword(updates.password);
      delete updates.password;
    }

    if (updates.role_code && updates.role_code !== user.role.code) {
      const newRole = await Role.findOne({ where: { code: updates.role_code } });
      if (!newRole) {
        throw ApiError.badRequest(`Role '${updates.role_code}' does not exist`);
      }
      updates.role_id = newRole.id;
      delete updates.role_code;
    }

    return user.update(updates);
  }

  /**
   * Update user account status
   */
  async updateUserStatus(id, status, updaterId = null) {
    const user = await User.findByPk(id);
    if (!user) {
      throw ApiError.notFound(`User with id '${id}' not found`);
    }

    await user.update({ status, updated_by: updaterId });

    // If deactivated or suspended, revoke all active refresh tokens
    if (status !== USER_STATUS.ACTIVE) {
      await RefreshToken.update(
        { revoked_at: new Date() },
        { where: { user_id: id, revoked_at: null } }
      );
    }

    return user;
  }
}

module.exports = new UserService();
