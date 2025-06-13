const express = require('express');
const { getLiveSessions } = require('../controllers/liveSessions');
const router = express.Router();

// Get all live sessions
router.get('/', getLiveSessions);

module.exports = router; 