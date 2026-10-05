const visitService = require('./visit.service');
const ApiResponse = require('../../utils/apiResponse');

class VisitController {
  async createVisit(req, res, next) {
    try {
      const visit = await visitService.createVisit(req.body, req.user);
      return ApiResponse.created(res, 'Field visit recorded successfully', visit);
    } catch (error) {
      return next(error);
    }
  }

  async getAllVisits(req, res, next) {
    try {
      const result = await visitService.getAllVisits(req.query, req.user);
      return ApiResponse.paginated(res, 'Field visits retrieved successfully', result.visits, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getVisitById(req, res, next) {
    try {
      const visit = await visitService.getVisitById(req.params.id, req.user);
      return ApiResponse.success(res, 'Field visit details retrieved', visit);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new VisitController();
