const express = require('express');
const router = express.Router();
const collectionController = require('./collection.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { ROLES } = require('../../constants/statusCodes');
const {
  createCollectionSchema,
  updateCollectionSchema,
  uuidParamSchema
} = require('./collection.validation');

router.use(authenticate);

router.post(['/', '/createCollection'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ body: createCollectionSchema }), collectionController.createCollection);
router.get(['/', '/getAllCollections'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), collectionController.getAllCollections);
router.get(['/summary', '/getCollectionSummary'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), collectionController.getCollectionSummary);
router.get(['/:id', '/getCollectionById/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema }), collectionController.getCollectionById);
router.patch(['/:id', '/updateCollection/:id'], authorize(ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.FIELD_AGENT), validateRequest({ params: uuidParamSchema, body: updateCollectionSchema }), collectionController.updateCollection);

module.exports = router;
