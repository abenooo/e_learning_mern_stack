const express = require('express');
const { 
  getLiveSessions,
  getLiveSession,
  createLiveSession,
  updateLiveSession,
  deleteLiveSession
} = require('../controllers/liveSessions');
const router = express.Router();

// Get all live sessions
router.get('/', getLiveSessions);

// Get single live session
router.get('/:id', getLiveSession);

// Create new live session
router.post('/', createLiveSession);

// Update live session
router.put('/:id', updateLiveSession);

// Delete live session
router.delete('/:id', deleteLiveSession);

module.exports = router; 