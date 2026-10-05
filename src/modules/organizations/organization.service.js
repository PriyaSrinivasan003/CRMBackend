const { Op } = require('sequelize');
const { Organization, Branch } = require('../../models');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class OrganizationService {
  async createOrganization(data) {
    const existingCode = await Organization.findOne({ where: { code: data.code } });
    if (existingCode) {
      throw ApiError.conflict(`Organization with code '${data.code}' already exists`);
    }

    const existingName = await Organization.findOne({ where: { name: data.name } });
    if (existingName) {
      throw ApiError.conflict(`Organization with name '${data.name}' already exists`);
    }

    return Organization.create(data);
  }

  async getAllOrganizations(query = {}) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['name', 'code', 'status', 'created_at'],
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
        { code: { [Op.like]: `%${query.search}%` } }
      ];
    }

    const { count, rows } = await Organization.findAndCountAll({
      where,
      limit,
      offset,
      order
    });

    return {
      organizations: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getOrganizationById(id) {
    const organization = await Organization.findByPk(id, {
      include: [
        { model: Branch, as: 'branches' }
      ]
    });
    if (!organization) {
      throw ApiError.notFound(`Organization with id '${id}' not found`);
    }
    return organization;
  }

  async updateOrganization(id, updateData) {
    const organization = await Organization.findByPk(id);
    if (!organization) {
      throw ApiError.notFound(`Organization with id '${id}' not found`);
    }

    if (updateData.name && updateData.name !== organization.name) {
      const existing = await Organization.findOne({ where: { name: updateData.name } });
      if (existing) {
        throw ApiError.conflict(`Organization with name '${updateData.name}' already exists`);
      }
    }

    return organization.update(updateData);
  }
}

module.exports = new OrganizationService();
