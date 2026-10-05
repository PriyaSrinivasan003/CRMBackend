const agentSupervisorService = require('./agentSupervisor.service');
const customerAgentService = require('./customerAgent.service');
const ApiResponse = require('../../utils/apiResponse');

class AssignmentController {
  // --- Agent-Supervisor assignments ---
  async assignAgentToSupervisor(req, res, next) {
    try {
      const assignment = await agentSupervisorService.assignAgentToSupervisor(req.body, req.user.id);
      return ApiResponse.created(res, 'Agent assigned to supervisor successfully', assignment);
    } catch (error) {
      return next(error);
    }
  }

  async getAgentSupervisorAssignments(req, res, next) {
    try {
      const result = await agentSupervisorService.getAgentSupervisorAssignments(req.query);
      return ApiResponse.paginated(res, 'Agent supervisor assignments retrieved', result.assignments, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async updateAgentSupervisorAssignment(req, res, next) {
    try {
      const updated = await agentSupervisorService.updateAgentSupervisorAssignment(req.params.id, req.body);
      return ApiResponse.success(res, 'Assignment updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  // --- Customer-Agent assignments ---
  async assignCustomerToAgent(req, res, next) {
    try {
      const assignment = await customerAgentService.assignCustomerToAgent(req.body, req.user.id);
      return ApiResponse.created(res, 'Customer assigned to agent successfully', assignment);
    } catch (error) {
      return next(error);
    }
  }

  async getCustomerAgentAssignments(req, res, next) {
    try {
      const result = await customerAgentService.getCustomerAgentAssignments(req.query, req.user);
      return ApiResponse.paginated(res, 'Customer agent assignments retrieved', result.assignments, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async updateCustomerAgentAssignment(req, res, next) {
    try {
      const updated = await customerAgentService.updateCustomerAgentAssignment(req.params.id, req.body);
      return ApiResponse.success(res, 'Assignment updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AssignmentController();
