const { Op } = require('sequelize');
const { Branch, Organization, Supervisor, Agent, Customer } = require('../../models');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class BranchService {
  async createBranch(data) {
    const organisation_id = data.organisation_id || data.organization_id;
    if (!organisation_id) {
      throw ApiError.badRequest('Organisation ID is required');
    }

    const org = await Organization.findByPk(organisation_id);
    if (!org) {
      throw ApiError.notFound(`Organisation with id '${organisation_id}' not found`);
    }

    const existing = await Branch.findOne({ where: { branch_code: data.branch_code } });
    if (existing) {
      throw ApiError.conflict(`Branch with code '${data.branch_code}' already exists`);
    }

    const branchPayload = { ...data, organisation_id };
    delete branchPayload.organization_id;

    return Branch.create(branchPayload);
  }

  async getAllBranches(query = {}) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['branch_code', 'branch_name', 'city', 'state', 'status', 'created_at'],
      'created_at',
      'DESC'
    );

    const where = {};
    if (query.status !== undefined) {
      where.status = parseInt(query.status, 10);
    }
    const orgId = query.organisation_id || query.organization_id;
    if (orgId) {
      where.organisation_id = orgId;
    }

    if (query.search) {
      where[Op.or] = [
        { branch_code: { [Op.like]: `%${query.search}%` } },
        { branch_name: { [Op.like]: `%${query.search}%` } },
        { city: { [Op.like]: `%${query.search}%` } },
        { state: { [Op.like]: `%${query.search}%` } }
      ];
    }

    const { count, rows } = await Branch.findAndCountAll({
      where,
      include: [
        { model: Organization, as: 'organisation', attributes: ['id', 'name', 'code'] }
      ],
      limit,
      offset,
      order
    });

    return {
      branches: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getBranchesByOrganisation(organisationId, query = {}) {
    const org = await Organization.findByPk(organisationId);
    if (!org) {
      throw ApiError.notFound(`Organisation with id '${organisationId}' not found`);
    }

    return this.getAllBranches({ ...query, organisation_id: organisationId });
  }

  async getBranchById(id) {
    const branch = await Branch.findByPk(id, {
      include: [
        { model: Organization, as: 'organisation', attributes: ['id', 'name', 'code', 'email', 'phone'] },
        { model: Supervisor, as: 'supervisors', attributes: ['id', 'employee_code', 'status'] },
        { model: Agent, as: 'agents', attributes: ['id', 'employee_code', 'status'] },
        { model: Customer, as: 'customers', attributes: ['id', 'customer_code', 'full_name', 'status'] }
      ]
    });
    if (!branch) {
      throw ApiError.notFound(`Branch with id '${id}' not found`);
    }
    return branch;
  }

  async updateBranch(id, updateData) {
    const branch = await Branch.findByPk(id);
    if (!branch) {
      throw ApiError.notFound(`Branch with id '${id}' not found`);
    }

    const payload = { ...updateData };
    if (payload.organization_id && !payload.organisation_id) {
      payload.organisation_id = payload.organization_id;
    }
    delete payload.organization_id;

    if (payload.organisation_id) {
      const org = await Organization.findByPk(payload.organisation_id);
      if (!org) {
        throw ApiError.notFound(`Organisation with id '${payload.organisation_id}' not found`);
      }
    }

    return branch.update(payload);
  }

  async updateBranchStatus(id, status) {
    const branch = await Branch.findByPk(id);
    if (!branch) {
      throw ApiError.notFound(`Branch with id '${id}' not found`);
    }
    return branch.update({ status });
  }
}

module.exports = new BranchService();
