const organizationService = require('./organization.service');
const branchService = require('../branches/branch.service');
const ApiResponse = require('../../utils/apiResponse');

class OrganizationController {
  async createOrganization(req, res, next) {
    try {
      const organization = await organizationService.createOrganization(req.body);
      return ApiResponse.created(res, 'Organization created successfully', organization);
    } catch (error) {
      return next(error);
    }
  }

  async getAllOrganizations(req, res, next) {
    try {
      const result = await organizationService.getAllOrganizations(req.query);
      return ApiResponse.paginated(res, 'Organizations retrieved successfully', result.organizations, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getOrganizationById(req, res, next) {
    try {
      const organization = await organizationService.getOrganizationById(req.params.id);
      return ApiResponse.success(res, 'Organization details retrieved', organization);
    } catch (error) {
      return next(error);
    }
  }

  async updateOrganization(req, res, next) {
    try {
      const updated = await organizationService.updateOrganization(req.params.id, req.body);
      return ApiResponse.success(res, 'Organization updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async createBranchForOrganization(req, res, next) {
    try {
      const branchPayload = {
        ...req.body,
        organisation_id: req.params.id
      };
      const branch = await branchService.createBranch(branchPayload);
      return ApiResponse.created(res, 'Branch created for organization successfully', branch);
    } catch (error) {
      return next(error);
    }
  }

  async getBranchesForOrganization(req, res, next) {
    try {
      const result = await branchService.getBranchesByOrganisation(req.params.id, req.query);
      return ApiResponse.paginated(res, 'Organization branches retrieved successfully', result.branches, result.pagination);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new OrganizationController();
