const Week = require('../models/Week');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Week:
 *       type: object
 *       required:
 *         - course
 *         - phase
 *         - week_name
 *         - week_order
 *         - created_by
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the week
 *         course:
 *           type: string
 *           description: Reference to the Course ID
 *         phase:
 *           type: string
 *           description: Reference to the phase ID
 *         week_name:
 *           type: string
 *           description: Name of the week
 *         week_title:
 *           type: string
 *           description: Display title of the week
 *         group_sessions:
 *           type: string
 *           description: Text field for group sessions (e.g., JSON string or comma-separated IDs)
 *         live_sessions:
 *           type: string
 *           description: Text field for live sessions (e.g., JSON string or comma-separated IDs)
 *         week_order:
 *           type: integer
 *           description: Order number of the week
 *         created_by:
 *           type: string
 *           description: Reference to the User ID who created the week
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /weeks:
 *   get:
 *     summary: Get all weeks with filtering and pagination
 *     tags: [Weeks]
 *     parameters:
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *         description: Filter by phase ID
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by Course ID (weeks belong to phases which belong to courses)
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
 *           enum: [week_order, created_at]
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
 *         description: List of weeks
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
 *                     $ref: '#/components/schemas/Week'
 */
exports.getWeeks = async (req, res, next) => {
  try {
    console.log('Get all weeks request received');
    
    const query = {};
    
    if (req.query.phase) {
      query.phase = req.query.phase;
    }
    
    if (req.query.course) {
      const phasesInCourse = await Phase.find({ course: req.query.course }).select('_id');
      const phaseIds = phasesInCourse.map(phase => phase._id);
      query.phase = { $in: phaseIds };
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const sortField = req.query.sort || 'week_order';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    
    const weeks = await Week.find(query)
      .populate({
        path: 'phase_id',
        select: 'phase_name phase_description phase_order course_id',
        populate: {
          path: 'course_id',
          select: 'title description price duration_months difficulty_level status course_type delivery_method'
        }
      })
      .populate({
        path: 'created_by',
        select: 'name email'
      })
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await Week.countDocuments(query);
    
    console.log(`Found ${weeks.length} weeks out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: weeks.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: weeks
    });
  } catch (error) {
    console.error('Get weeks error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /weeks/{id}:
 *   get:
 *     summary: Get a single week
 *     tags: [Weeks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Week ID
 *     responses:
 *       200:
 *         description: Week details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Week'
 *       404:
 *         description: Week not found
 */
exports.getWeek = async (req, res, next) => {
  try {
    console.log(`Get week request received for ID: ${req.params.id}`);
    
    const week = await Week.findById(req.params.id)
      .populate({
        path: 'phase',
        select: 'phase_name phase_title course',
        populate: {
          path: 'course',
          select: 'title'
        }
      });
    
    if (!week) {
      console.log(`Week not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Week not found'
      });
    }
    
    console.log(`Found week: ${week.week_name}`);
    
    res.status(200).json({
      success: true,
      data: week
    });
  } catch (error) {
    console.error('Get week error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /weeks:
 *   post:
 *     summary: Create a new week
 *     tags: [Weeks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string, description: 'Course ID' }
 *               phase: { type: string, description: 'Phase ID' }
 *               week_name: { type: string, description: 'Name of the week' }
 *               week_title: { type: string, description: 'Display title of the week' }
 *               group_sessions: { type: string, description: 'JSON string or comma-separated IDs of group sessions' }
 *               live_sessions: { type: string, description: 'JSON string or comma-separated IDs of live sessions' }
 *               week_order: { type: integer, description: 'Order number of the week' }
 *             required:
 *               - course
 *               - phase
 *               - week_name
 *               - week_order
 *     responses:
 *       201:
 *         description: Week created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Week'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
exports.createWeek = async (req, res, next) => {
  try {
    console.log('Create week request received');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Add created_by to the request body
    req.body.created_by = req.user.id;

    const week = await Week.create(req.body);
    console.log(`Week created with ID: ${week._id}`);

    res.status(201).json({
      success: true,
      data: week
    });
  } catch (error) {
    console.error('Create week error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /weeks/{id}:
 *   put:
 *     summary: Update a week
 *     tags: [Weeks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Week ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               course: { type: string, description: 'Course ID' }
 *               phase: { type: string, description: 'Phase ID' }
 *               week_name: { type: string, description: 'Name of the week' }
 *               week_title: { type: string, description: 'Display title of the week' }
 *               group_sessions: { type: string, description: 'JSON string or comma-separated IDs of group sessions' }
 *               live_sessions: { type: string, description: 'JSON string or comma-separated IDs of live sessions' }
 *               week_order: { type: integer, description: 'Order number of the week' }
 *     responses:
 *       200:
 *         description: Week updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Week'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Week not found
 *       500:
 *         description: Server error
 */
exports.updateWeek = async (req, res, next) => {
  try {
    console.log(`Update week request received for ID: ${req.params.id}`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let week = await Week.findById(req.params.id);
    if (!week) {
      console.log(`Week not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Week not found'
      });
    }

    week = await Week.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    console.log(`Week with ID: ${week._id} updated successfully`);

    res.status(200).json({
      success: true,
      data: week
    });
  } catch (error) {
    console.error('Update week error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /weeks/{id}:
 *   delete:
 *     summary: Delete a week
 *     tags: [Weeks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Week ID
 *     responses:
 *       200:
 *         description: Week deleted successfully
 *       404:
 *         description: Week not found
 *       500:
 *         description: Server error
 */
exports.deleteWeek = async (req, res, next) => {
  try {
    console.log(`Delete week request received for ID: ${req.params.id}`);

    const week = await Week.findById(req.params.id);
    if (!week) {
      console.log(`Week not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Week not found'
      });
    }

    await week.deleteOne();
    console.log(`Week with ID: ${req.params.id} deleted successfully`);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete week error:', error);
    next(error);
  }
}; 