const followUpService = require('./followup.service');
const ApiResponse = require('../../utils/apiResponse');

class FollowUpController {
  async createFollowUp(req, res, next) {
    try {
      const followUp = await followUpService.createFollowUp(req.body, req.user);
      return ApiResponse.created(res, 'Follow-up action scheduled successfully', followUp);
    } catch (error) {
      return next(error);
    }
  }

  async getAllFollowUps(req, res, next) {
    try {
      const result = await followUpService.getAllFollowUps(req.query, req.user);
      return ApiResponse.paginated(res, 'Follow-ups retrieved successfully', result.follow_ups, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getFollowUpById(req, res, next) {
    try {
      const followUp = await followUpService.getFollowUpById(req.params.id, req.user);
      return ApiResponse.success(res, 'Follow-up details retrieved', followUp);
    } catch (error) {
      return next(error);
    }
  }

  async completeFollowUp(req, res, next) {
    try {
      const updated = await followUpService.completeFollowUp(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Follow-up marked as completed', updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new FollowUpController();
