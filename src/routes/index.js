const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const branchRoutes = require('../modules/branches/branch.routes');
const organizationRoutes = require('../modules/organizations/organization.routes');
const userRoutes = require('../modules/users/user.routes');
const supervisorRoutes = require('../modules/supervisors/supervisor.routes');
const agentRoutes = require('../modules/agents/agent.routes');
const customerRoutes = require('../modules/customers/customer.routes');
const assignmentRoutes = require('../modules/assignments/assignment.routes');
const collectionRoutes = require('../modules/collections/collection.routes');
const paymentRoutes = require('../modules/payments/payment.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const permissionRoutes = require('../modules/permissions/permission.routes');
const visitRoutes = require('../modules/visits/visit.routes');
const followUpRoutes = require('../modules/followups/followup.routes');
const areaRoutes = require('../modules/areas/area.routes');
const paymentModeRoutes = require('../modules/paymentModes/paymentMode.routes');
const masterRoutes = require('../modules/masters/master.routes');
const ptpRoutes = require('../modules/ptp/ptp.routes');
const adminRoutes = require('../modules/admin/admin.routes');

// API status probe
const statusHandler = (req, res) => {
  res.json({
    success: true,
    message: 'Collection Agent and Accountability System API v1.1 is active',
    version: '1.1.0'
  });
};

router.get('/getStatus', statusHandler);
router.get('/', statusHandler);

// Mount modules
router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/masters', masterRoutes);
router.use('/branches', branchRoutes);
router.use('/organizations', organizationRoutes);
router.use('/organisations', organizationRoutes);
router.use('/areas', areaRoutes);
router.use('/payment-modes', paymentModeRoutes);
router.use('/payment_modes', paymentModeRoutes);
router.use('/users', userRoutes);
router.use('/supervisors', supervisorRoutes);
router.use('/agents', agentRoutes);
router.use('/customers', customerRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/collections', collectionRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/permissions', permissionRoutes);
router.use('/visits', visitRoutes);
router.use('/follow-ups', followUpRoutes);
router.use('/followups', followUpRoutes);
router.use('/ptp', ptpRoutes);
router.use('/promises-to-pay', ptpRoutes);
router.use('/follow-up-tasks', ptpRoutes);

module.exports = router;
