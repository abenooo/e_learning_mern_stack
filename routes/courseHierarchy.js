const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Import controller
const { getCourseHierarchy } = require('../controllers/courseHierarchy');

// Get course hierarchy
router.get('/', protect, getCourseHierarchy);

module.exports = router;
