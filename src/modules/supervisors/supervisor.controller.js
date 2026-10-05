const supervisorService = require('./supervisor.service');
const ApiResponse = require('../../utils/apiResponse');

class SupervisorController {
  async createSupervisor(req, res, next) {
    try {
      const supervisor = await supervisorService.createSupervisor(req.body, req.user.id);
      return ApiResponse.created(res, 'Supervisor created successfully', supervisor);
    } catch (error) {
      return next(error);
    }
  }

  async getAllSupervisors(req, res, next) {
    try {
      const result = await supervisorService.getAllSupervisors(req.query);
      return ApiResponse.paginated(res, 'Supervisors retrieved successfully', result.supervisors, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getSupervisorById(req, res, next) {
    try {
      const supervisor = await supervisorService.getSupervisorById(req.params.id, req.user);
      return ApiResponse.success(res, 'Supervisor details retrieved', supervisor);
    } catch (error) {
      return next(error);
    }
  }

  async updateSupervisor(req, res, next) {
    try {
      const updated = await supervisorService.updateSupervisor(req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, 'Supervisor updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async updateSupervisorStatus(req, res, next) {
    try {
      const updated = await supervisorService.updateSupervisorStatus(req.params.id, req.body.status, req.user.id);
      return ApiResponse.success(res, 'Supervisor status updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async getSupervisorAgents(req, res, next) {
    try {
      const result = await supervisorService.getSupervisorAgents(req.params.id, req.user, req.query);
      return ApiResponse.paginated(res, 'Supervisor agents retrieved successfully', result.agents, result.pagination);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new SupervisorController();
