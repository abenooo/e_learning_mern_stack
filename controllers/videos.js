const Video = require('../models/Video');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       required:
 *         - class
 *         - title
 *         - url
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the video
 *         class:
 *           type: string
 *           description: Reference to the class
 *         title:
 *           type: string
 *           description: Title of the video
 *         url:
 *           type: string
 *           description: URL of the video
 *         duration_minutes:
 *           type: number
 *           description: Duration of the video in minutes
 *         is_live:
 *           type: boolean
 *           description: Whether the video is a live stream
 *           default: false
 *         min_watched_time:
 *           type: number
 *           description: Minimum time required to watch in minutes
 *         is_disabled:
 *           type: boolean
 *           description: Whether the video is disabled
 *           default: false
 *         notes:
 *           type: string
 *           description: Additional notes about the video
 */

/**
 * @swagger
 * /videos:
 *   get:
 *     summary: Get all videos with filtering and pagination
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Filter by class ID
 *       - in: query
 *         name: is_live
 *         schema:
 *           type: boolean
 *         description: Filter by live status
 *       - in: query
 *         name: is_disabled
 *         schema:
 *           type: boolean
 *         description: Filter by disabled status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, duration_minutes]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of videos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 */
exports.getVideos = async (req, res, next) => {
  try {
    console.log('Get all videos request received');
    
    const query = {};
    
    if (req.query.class) {
      query.class = req.query.class;
    }
    
    if (req.query.is_live !== undefined) {
      query.is_live = req.query.is_live === 'true';
    }
    
    if (req.query.is_disabled !== undefined) {
      query.is_disabled = req.query.is_disabled === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    
    const videos = await Video.find(query)
      .populate('class', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await Video.countDocuments(query);
    
    console.log(`Found ${videos.length} videos out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: videos.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: videos
    });
  } catch (error) {
    console.error('Get videos error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get a single video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 */
exports.getVideo = async (req, res, next) => {
  try {
    console.log(`Get video request received for ID: ${req.params.id}`);
    
    const video = await Video.findById(req.params.id)
      .populate('class', 'title');
    
    if (!video) {
      console.log(`Video not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    console.log(`Found video: ${video.title}`);
    
    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Get video error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /videos:
 *   post:
 *     summary: Create a new video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class
 *               - title
 *               - url
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID of the class
 *               title:
 *                 type: string
 *                 description: Title of the video
 *               url:
 *                 type: string
 *                 description: URL of the video
 *               duration_minutes:
 *                 type: number
 *                 description: Duration of the video in minutes
 *               is_live:
 *                 type: boolean
 *                 description: Whether the video is a live stream
 *               min_watched_time:
 *                 type: number
 *                 description: Minimum time required to watch in minutes
 *               is_disabled:
 *                 type: boolean
 *                 description: Whether the video is disabled
 *               notes:
 *                 type: string
 *                 description: Additional notes about the video
 *     responses:
 *       201:
 *         description: Video created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
exports.createVideo = async (req, res, next) => {
  try {
    console.log('Create video request received');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.body.class) {
      return res.status(400).json({
        success: false,
        error: 'Class ID is required'
      });
    }
    
    const video = await Video.create(req.body);
    const populatedVideo = await Video.findById(video._id)
      .populate('class', 'title');
    
    console.log(`Video created with ID: ${video._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedVideo
    });
  } catch (error) {
    console.error('Create video error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /videos/{id}:
 *   put:
 *     summary: Update a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the video
 *               url:
 *                 type: string
 *                 description: URL of the video
 *               duration_minutes:
 *                 type: number
 *                 description: Duration of the video in minutes
 *               is_live:
 *                 type: boolean
 *                 description: Whether the video is a live stream
 *               min_watched_time:
 *                 type: number
 *                 description: Minimum time required to watch in minutes
 *               is_disabled:
 *                 type: boolean
 *                 description: Whether the video is disabled
 *               notes:
 *                 type: string
 *                 description: Additional notes about the video
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 */
exports.updateVideo = async (req, res, next) => {
  try {
    console.log(`Update video request received for ID: ${req.params.id}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let video = await Video.findById(req.params.id);
    
    if (!video) {
      console.log(`Video not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    video = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('class', 'title');
    
    console.log(`Video updated: ${video.title}`);
    
    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Update video error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /videos/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Video not found
 */
exports.deleteVideo = async (req, res, next) => {
  try {
    console.log(`Delete video request received for ID: ${req.params.id}`);
    
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      console.log(`Video not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }
    
    await Video.findByIdAndDelete(req.params.id);
    console.log(`Video deleted: ${video.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete video error:', error);
    next(error);
  }
}; 