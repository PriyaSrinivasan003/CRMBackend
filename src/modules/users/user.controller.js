const userService = require('./user.service');
const ApiResponse = require('../../utils/apiResponse');

class UserController {
  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body, req.user.id);
      return ApiResponse.created(res, 'User created successfully', user);
    } catch (error) {
      return next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const result = await userService.getAllUsers(req.query);
      return ApiResponse.paginated(res, 'Users retrieved successfully', result.users, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return ApiResponse.success(res, 'User retrieved successfully', user);
    } catch (error) {
      return next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const updated = await userService.updateUser(req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, 'User updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const updated = await userService.updateUserStatus(req.params.id, req.body.status, req.user.id);
      return ApiResponse.success(res, 'User status updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
