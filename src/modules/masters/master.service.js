const { Branch, Area, PaymentMode, Organization } = require('../../models');

class MasterService {
  /**
   * Load all active configurable master values directly from database tables
   */
  async getAllMasters(query = {}) {
    const [branches, areas, paymentModes, organizations] = await Promise.all([
      Branch.findAll({
        where: { status: 1 },
        attributes: ['id', 'branch_code', 'branch_name', 'city', 'state', 'pincode', 'organisation_id'],
        order: [['branch_name', 'ASC']]
      }),
      Area.findAll({
        where: { status: 1 },
        attributes: ['id', 'branch_id', 'area_code', 'name', 'status'],
        order: [['name', 'ASC']]
      }),
      PaymentMode.findAll({
        where: { status: 1 },
        attributes: ['id', 'code', 'name', 'status'],
        order: [['name', 'ASC']]
      }),
      Organization.findAll({
        where: { status: 1 },
        attributes: ['id', 'name', 'code', 'status'],
        order: [['name', 'ASC']]
      })
    ]);

    return {
      branches,
      areas,
      paymentModes,
      organizations
    };
  }

  async getActiveBranches(query = {}) {
    const where = { status: 1 };
    if (query.organisation_id) {
      where.organisation_id = query.organisation_id;
    }
    return Branch.findAll({
      where,
      attributes: ['id', 'branch_code', 'branch_name', 'city', 'state', 'pincode', 'organisation_id'],
      order: [['branch_name', 'ASC']]
    });
  }

  async getActiveAreas(query = {}) {
    const where = { status: 1 };
    if (query.branch_id) {
      where.branch_id = query.branch_id;
    }
    return Area.findAll({
      where,
      attributes: ['id', 'branch_id', 'area_code', 'name', 'status'],
      order: [['name', 'ASC']]
    });
  }

  async getActivePaymentModes() {
    return PaymentMode.findAll({
      where: { status: 1 },
      attributes: ['id', 'code', 'name', 'status'],
      order: [['name', 'ASC']]
    });
  }

  async getActiveOrganizations() {
    return Organization.findAll({
      where: { status: 1 },
      attributes: ['id', 'name', 'code', 'email', 'phone', 'status'],
      order: [['name', 'ASC']]
    });
  }
}

module.exports = new MasterService();
