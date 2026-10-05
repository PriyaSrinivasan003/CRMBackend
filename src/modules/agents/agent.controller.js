const agentService = require('./agent.service');
const ApiResponse = require('../../utils/apiResponse');

class AgentController {
  async createAgent(req, res, next) {
    try {
      const agent = await agentService.createAgent(req.body, req.user.id);
      return ApiResponse.created(res, 'Field Agent created successfully', agent);
    } catch (error) {
      return next(error);
    }
  }

  async getAllAgents(req, res, next) {
    try {
      const result = await agentService.getAllAgents(req.query, req.user);
      return ApiResponse.paginated(res, 'Agents retrieved successfully', result.agents, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getAgentById(req, res, next) {
    try {
      const agent = await agentService.getAgentById(req.params.id, req.user);
      return ApiResponse.success(res, 'Agent details retrieved', agent);
    } catch (error) {
      return next(error);
    }
  }

  async updateAgent(req, res, next) {
    try {
      const updated = await agentService.updateAgent(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Agent updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async updateAgentStatus(req, res, next) {
    try {
      const updated = await agentService.updateAgentStatus(req.params.id, req.body.status, req.user.id);
      return ApiResponse.success(res, 'Agent status updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async getAgentCustomers(req, res, next) {
    try {
      const result = await agentService.getAgentCustomers(req.params.id, req.user, req.query);
      return ApiResponse.paginated(res, 'Agent customers retrieved', result.customers, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getAgentCollections(req, res, next) {
    try {
      const result = await agentService.getAgentCollections(req.params.id, req.user, req.query);
      return ApiResponse.paginated(res, 'Agent collections retrieved', result.collections, result.pagination);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AgentController();
