const Week = require('../models/Week');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Week:
 *       type: object
 *       required:
 *         - phase
 *         - title
 *         - order_number
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the week
 *         phase:
 *           type: string
 *           description: Reference to the phase
 *         title:
 *           type: string
 *           description: Title of the week
 *         description:
 *           type: string
 *           description: Description of the week
 *         order_number:
 *           type: integer
 *           description: Order number of the week
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Start date of the week
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: End date of the week
 *         is_active:
 *           type: boolean
 *           description: Whether the week is active
 *           default: true
 *         is_required:
 *           type: boolean
 *           description: Whether the week is required
 *           default: true
 *         icon_url:
 *           type: string
 *           description: URL of the week icon
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
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *           enum: [order_number, start_date, end_date, created_at]
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
    
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const sortField = req.query.sort || 'order_number';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    
    const weeks = await Week.find(query)
      .populate('phase', 'title')
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
      .populate('phase', 'title');
    
    if (!week) {
      console.log(`Week not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Week not found'
      });
    }
    
    console.log(`Found week: ${week.title}`);
    
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
 *             required:
 *               - phase
 *               - title
 *               - order_number
 *             properties:
 *               phase:
 *                 type: string
 *                 description: ID of the phase
 *               title:
 *                 type: string
 *                 description: Title of the week
 *               description:
 *                 type: string
 *                 description: Description of the week
 *               order_number:
 *                 type: integer
 *                 description: Order number of the week
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the week
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the week
 *               is_active:
 *                 type: boolean
 *                 description: Whether the week is active
 *               is_required:
 *                 type: boolean
 *                 description: Whether the week is required
 *               icon_url:
 *                 type: string
 *                 description: URL of the week icon
 *     responses:
 *       201:
 *         description: Week created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Week'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
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

    if (!req.body.phase) {
      return res.status(400).json({
        success: false,
        error: 'Phase ID is required'
      });
    }
    
    const week = await Week.create(req.body);
    const populatedWeek = await Week.findById(week._id)
      .populate('phase', 'title');
    
    console.log(`Week created with ID: ${week._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedWeek
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
 *               title:
 *                 type: string
 *                 description: Title of the week
 *               description:
 *                 type: string
 *                 description: Description of the week
 *               order_number:
 *                 type: integer
 *                 description: Order number of the week
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: Start date of the week
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: End date of the week
 *               is_active:
 *                 type: boolean
 *                 description: Whether the week is active
 *               is_required:
 *                 type: boolean
 *                 description: Whether the week is required
 *               icon_url:
 *                 type: string
 *                 description: URL of the week icon
 *     responses:
 *       200:
 *         description: Week updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Week'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Week not found
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
    
    week = await Week.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('phase', 'title');
    
    console.log(`Week updated: ${week.title}`);
    
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
 *         description: Week not found
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
    
    await Week.findByIdAndDelete(req.params.id);
    console.log(`Week deleted: ${week.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete week error:', error);
    next(error);
  }
}; 