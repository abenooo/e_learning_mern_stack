const express = require('express');
const { check } = require('express-validator');
const { protect, checkPermission } = require('../middleware/auth');

const router = express.Router();

// Import controllers
const {
  getVideos,
  getVideo,
  createVideo,
  updateVideo,
  deleteVideo
} = require('../controllers/videos');

// Get all videos
router.get('/', getVideos);

// Get single video
router.get('/:id', getVideo);

// Create video
router.post(
  '/',
  [
    protect,
    checkPermission('videos', 'create'),
    check('class', 'Class ID is required').not().isEmpty(),
    check('title', 'Title is required').not().isEmpty(),
    check('url', 'Video URL is required').not().isEmpty(),
    check('duration_minutes', 'Duration is required').isNumeric()
  ],
  createVideo
);

// Update video
router.put(
  '/:id',
  [
    protect,
    checkPermission('videos', 'update'),
    check('title', 'Title is required').optional().not().isEmpty(),
    check('url', 'Video URL is required').optional().not().isEmpty(),
    check('duration_minutes', 'Duration must be numeric').optional().isNumeric()
  ],
  updateVideo
);

// Delete video
router.delete(
  '/:id',
  [
    protect,
    checkPermission('videos', 'delete')
  ],
  deleteVideo
);

module.exports = router; 