const { Op } = require('sequelize');
const { Area, Branch, Organization } = require('../../models');
const { getPagination } = require('../../utils/pagination');
const ApiError = require('../../utils/apiError');

class AreaService {
  async createArea(data) {
    const { branch_id, area_code, name, status } = data;

    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      throw ApiError.notFound(`Branch with id '${branch_id}' not found`);
    }

    const existing = await Area.findOne({ where: { area_code } });
    if (existing) {
      throw ApiError.conflict(`Area with code '${area_code}' already exists`);
    }

    return Area.create({
      branch_id,
      area_code,
      name,
      status: status !== undefined ? status : 1
    });
  }

  async getAllAreas(query = {}) {
    const { page, limit, offset, order } = getPagination(
      query,
      ['area_code', 'name', 'status', 'created_at'],
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
        { area_code: { [Op.like]: `%${query.search}%` } },
        { name: { [Op.like]: `%${query.search}%` } }
      ];
    }

    const { count, rows } = await Area.findAndCountAll({
      where,
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'branch_code', 'branch_name', 'city']
        }
      ],
      limit,
      offset,
      order
    });

    return {
      areas: rows,
      pagination: {
        page,
        limit,
        totalRecords: count
      }
    };
  }

  async getAreaById(id) {
    const area = await Area.findByPk(id, {
      include: [
        {
          model: Branch,
          as: 'branch',
          include: [{ model: Organization, as: 'organisation', attributes: ['id', 'name', 'code'] }]
        }
      ]
    });

    if (!area) {
      throw ApiError.notFound(`Area with id '${id}' not found`);
    }

    return area;
  }

  async getAreasByBranch(branchId, query = {}) {
    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      throw ApiError.notFound(`Branch with id '${branchId}' not found`);
    }

    return this.getAllAreas({ ...query, branch_id: branchId });
  }

  async updateArea(id, data) {
    const area = await Area.findByPk(id);
    if (!area) {
      throw ApiError.notFound(`Area with id '${id}' not found`);
    }

    if (data.branch_id && data.branch_id !== area.branch_id) {
      const branch = await Branch.findByPk(data.branch_id);
      if (!branch) {
        throw ApiError.notFound(`Branch with id '${data.branch_id}' not found`);
      }
    }

    if (data.area_code && data.area_code !== area.area_code) {
      const existing = await Area.findOne({ where: { area_code: data.area_code } });
      if (existing) {
        throw ApiError.conflict(`Area with code '${data.area_code}' already exists`);
      }
    }

    return area.update(data);
  }

  async updateAreaStatus(id, status) {
    const area = await Area.findByPk(id);
    if (!area) {
      throw ApiError.notFound(`Area with id '${id}' not found`);
    }

    return area.update({ status });
  }
}

module.exports = new AreaService();
