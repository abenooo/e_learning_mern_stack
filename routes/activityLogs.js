const express = require('express');
const { protect, authorize } = require('../middleware/auth'); // Assuming you have these
const { getActivityLogs, getActivityLog } = require('../controllers/activityLogs');

const router = express.Router();

// Only super_admin or admin should be able to view activity logs
router.get('/', protect, authorize('super_admin', 'admin'), getActivityLogs);
router.get('/:id', protect, authorize('super_admin', 'admin'), getActivityLog);

module.exports = router; 