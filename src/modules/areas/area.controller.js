const areaService = require('./area.service');
const ApiResponse = require('../../utils/apiResponse');

class AreaController {
  async createArea(req, res, next) {
    try {
      const area = await areaService.createArea(req.body);
      return ApiResponse.created(res, 'Area created successfully', area);
    } catch (error) {
      return next(error);
    }
  }

  async getAllAreas(req, res, next) {
    try {
      const result = await areaService.getAllAreas(req.query);
      return ApiResponse.paginated(res, 'Areas retrieved successfully', result.areas, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getAreaById(req, res, next) {
    try {
      const area = await areaService.getAreaById(req.params.id);
      return ApiResponse.success(res, 'Area details retrieved successfully', area);
    } catch (error) {
      return next(error);
    }
  }

  async getAreasByBranch(req, res, next) {
    try {
      const result = await areaService.getAreasByBranch(req.params.branchId, req.query);
      return ApiResponse.paginated(res, 'Branch areas retrieved successfully', result.areas, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async updateArea(req, res, next) {
    try {
      const area = await areaService.updateArea(req.params.id, req.body);
      return ApiResponse.success(res, 'Area updated successfully', area);
    } catch (error) {
      return next(error);
    }
  }

  async updateAreaStatus(req, res, next) {
    try {
      const area = await areaService.updateAreaStatus(req.params.id, req.body.status);
      return ApiResponse.success(res, 'Area status updated successfully', area);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AreaController();
