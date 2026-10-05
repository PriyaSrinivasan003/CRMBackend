const customerService = require('./customer.service');
const ApiResponse = require('../../utils/apiResponse');

class CustomerController {
  async createCustomer(req, res, next) {
    try {
      const result = await customerService.createCustomer(req.body, req.user.id);
      return ApiResponse.created(res, 'Customer created successfully', result);
    } catch (error) {
      return next(error);
    }
  }

  async getAllCustomers(req, res, next) {
    try {
      const result = await customerService.getAllCustomers(req.query, req.user);
      return ApiResponse.paginated(res, 'Customers retrieved successfully', result.customers, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id, req.user);
      return ApiResponse.success(res, 'Customer details retrieved', customer);
    } catch (error) {
      return next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const updated = await customerService.updateCustomer(req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, 'Customer updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async updateCustomerStatus(req, res, next) {
    try {
      const updated = await customerService.updateCustomerStatus(req.params.id, req.body.status, req.user.id);
      return ApiResponse.success(res, 'Customer status updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async getCustomerAssignments(req, res, next) {
    try {
      const assignments = await customerService.getCustomerAssignments(req.params.id, req.user);
      return ApiResponse.success(res, 'Customer assignment history retrieved', assignments);
    } catch (error) {
      return next(error);
    }
  }

  async assignCustomer(req, res, next) {
    try {
      const assignment = await customerService.assignCustomer(req.params.id, req.body.agent_id, req.user.id);
      return ApiResponse.created(res, 'Customer assigned to agent successfully', assignment);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new CustomerController();
