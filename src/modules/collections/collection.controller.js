const collectionService = require('./collection.service');
const ApiResponse = require('../../utils/apiResponse');

class CollectionController {
  async createCollection(req, res, next) {
    try {
      const collection = await collectionService.createCollection(req.body, req.user);
      return ApiResponse.created(res, 'Collection record created successfully', collection);
    } catch (error) {
      return next(error);
    }
  }

  async getAllCollections(req, res, next) {
    try {
      const result = await collectionService.getAllCollections(req.query, req.user);
      return ApiResponse.paginated(res, 'Collections retrieved successfully', result.collections, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getCollectionSummary(req, res, next) {
    try {
      const summary = await collectionService.getCollectionSummary(req.query, req.user);
      return ApiResponse.success(res, 'Collection summary retrieved', summary);
    } catch (error) {
      return next(error);
    }
  }

  async getCollectionById(req, res, next) {
    try {
      const collection = await collectionService.getCollectionById(req.params.id, req.user);
      return ApiResponse.success(res, 'Collection details retrieved', collection);
    } catch (error) {
      return next(error);
    }
  }

  async updateCollection(req, res, next) {
    try {
      const updated = await collectionService.updateCollection(req.params.id, req.body, req.user);
      return ApiResponse.success(res, 'Collection updated successfully', updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new CollectionController();
