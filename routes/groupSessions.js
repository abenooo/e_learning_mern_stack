const express = require('express');
const { 
  getGroupSessions,
  getGroupSession,
  createGroupSession,
  updateGroupSession,
  deleteGroupSession
} = require('../controllers/groupSessions');
const router = express.Router();

// Get all group sessions
router.get('/', getGroupSessions);

// Get single group session
router.get('/:id', getGroupSession);

// Create new group session
router.post('/', createGroupSession);

// Update group session
router.put('/:id', updateGroupSession);

// Delete group session
router.delete('/:id', deleteGroupSession);

module.exports = router; 