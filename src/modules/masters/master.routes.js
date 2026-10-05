const express = require('express');
const router = express.Router();
const masterController = require('./master.controller');
const authenticate = require('../../middlewares/authenticate');

router.use(authenticate);

// Dynamic Master Data APIs for UI dropdowns and client workflows
router.get(['/', '/getAllMasters'], masterController.getAllMasters);
router.get(['/branches', '/getActiveBranches'], masterController.getActiveBranches);
router.get(['/areas', '/getActiveAreas'], masterController.getActiveAreas);
router.get(['/payment-modes', '/getActivePaymentModes'], masterController.getActivePaymentModes);
router.get(['/organizations', '/getActiveOrganizations'], masterController.getActiveOrganizations);

module.exports = router;
