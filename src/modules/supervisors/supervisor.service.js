const { Op } = require('sequelize');
const { Supervisor, User, Branch, Agent, AgentSupervisorAssignment } = require('../../models');
const { ROLES, SUPERVISOR_STATUS, ASSIGNMENT_STATUS } = require('../../constants/statusCodes');
const { getPagination } = require('../../utils/pagination');
const userService = require('../users/user.service');
const ApiError = require('../../utils/apiError');

class SupervisorService {
  async createSupervisor(data, creatorId) {
    return userService.createUser({
      ...data,
      role_code: ROLES.SUPERVISOR
    }, creatorId);
  }

  async getAllSupervisors(query) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['employee_code', 'joining_date', 'status', 'created_at'],
      'created_at',
      'DESC'
    );

    const where = {};
    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }
    if (query.branch_id) {
      where.branch_id = query.branch_id;
    }
    if (query.search) {
      where[Op.or] = [
        { employee_code: { [Op.like]: `%${query.search}%` } },
        { '$user.name$': { [Op.like]: `%${query.search}%` } },
        { '$user.email$': { [Op.like]: `%${query.search}%` } },
        { '$user.mobile$': { [Op.like]: `%${query.search}%` } }
      ];
    }

    const { count, rows } = await Supervisor.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'mobile', 'status', 'last_login_at']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'branch_code', 'branch_name']
        }
      ],
      limit,
      offset,
      order
    });

    return {
      supervisors: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getSupervisorById(id, requestingUser) {
    // Record-level ownership check: Supervisor can only view their own profile
    if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor || requestingUser.supervisor.id !== id) {
        throw ApiError.forbidden('Supervisors are only permitted to view their own profile');
      }
    }

    const supervisor = await Supervisor.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'mobile', 'status', 'last_login_at']
        },
        {
          model: Branch,
          as: 'branch'
        },
        {
          model: Agent,
          as: 'agents',
          attributes: ['id', 'employee_code', 'status', 'user_id'],
          include: [{ model: User, as: 'user', attributes: ['name', 'mobile'] }]
        }
      ]
    });

    if (!supervisor) {
      throw ApiError.notFound(`Supervisor with id '${id}' not found`);
    }

    return supervisor;
  }

  async updateSupervisor(id, data, updaterId) {
    const supervisor = await Supervisor.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!supervisor) {
      throw ApiError.notFound(`Supervisor with id '${id}' not found`);
    }

    const { name, ...supervisorFields } = data;
    if (name && supervisor.user) {
      await supervisor.user.update({ name, updated_by: updaterId });
    }

    return supervisor.update({ ...supervisorFields, updated_by: updaterId });
  }

  async updateSupervisorStatus(id, status, updaterId) {
    const supervisor = await Supervisor.findByPk(id);
    if (!supervisor) {
      throw ApiError.notFound(`Supervisor with id '${id}' not found`);
    }

    return supervisor.update({ status, updated_by: updaterId });
  }

  async getSupervisorAgents(supervisorId, requestingUser, query) {
    // Ownership check
    if (requestingUser.role.code === ROLES.SUPERVISOR) {
      if (!requestingUser.supervisor || requestingUser.supervisor.id !== supervisorId) {
        throw ApiError.forbidden('You are not authorized to view another supervisor\'s team');
      }
    }

    const { page, limit, offset, order } = getPagination(
      query,
      ['employee_code', 'status', 'created_at'],
      'created_at',
      'DESC'
    );

    const where = { supervisor_id: supervisorId };
    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }

    const { count, rows } = await Agent.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'mobile', 'status']
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'branch_code', 'branch_name']
        }
      ],
      limit,
      offset,
      order
    });

    return {
      agents: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }
}

module.exports = new SupervisorService();
