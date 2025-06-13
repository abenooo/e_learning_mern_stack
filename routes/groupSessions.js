const express = require('express');
const { getGroupSessions } = require('../controllers/groupSessions');
const router = express.Router();

// Get all group sessions
router.get('/', getGroupSessions);

module.exports = router; 