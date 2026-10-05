const branchService = require('./branch.service');
const ApiResponse = require('../../utils/apiResponse');

class BranchController {
  async createBranch(req, res, next) {
    try {
      const branch = await branchService.createBranch(req.body);
      return ApiResponse.created(res, 'Branch created successfully', branch);
    } catch (error) {
      return next(error);
    }
  }

  async getAllBranches(req, res, next) {
    try {
      const result = await branchService.getAllBranches(req.query);
      return ApiResponse.paginated(res, 'Branches retrieved successfully', result.branches, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getBranchById(req, res, next) {
    try {
      const branch = await branchService.getBranchById(req.params.id);
      return ApiResponse.success(res, 'Branch details retrieved', branch);
    } catch (error) {
      return next(error);
    }
  }

  async getBranchesByOrganisation(req, res, next) {
    try {
      const orgId = req.params.organisationId || req.params.id;
      const result = await branchService.getBranchesByOrganisation(orgId, req.query);
      return ApiResponse.paginated(res, 'Organisation branches retrieved successfully', result.branches, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async updateBranch(req, res, next) {
    try {
      const updated = await branchService.updateBranch(req.params.id, req.body);
      return ApiResponse.success(res, 'Branch updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async updateBranchStatus(req, res, next) {
    try {
      const updated = await branchService.updateBranchStatus(req.params.id, req.body.status);
      return ApiResponse.success(res, 'Branch status updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new BranchController();
