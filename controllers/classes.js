const Class = require('../models/Class');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       required:
 *         - week
 *         - title
 *         - order_number
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the class
 *         week:
 *           type: string
 *           description: Reference to the week
 *         title:
 *           type: string
 *           description: Title of the class
 *         description:
 *           type: string
 *           description: Description of the class
 *         order_number:
 *           type: integer
 *           description: Order number of the class
 *         type:
 *           type: string
 *           enum: [lecture, workshop, assessment]
 *           description: Type of the class
 *           default: lecture
 *         is_active:
 *           type: boolean
 *           description: Whether the class is active
 *           default: true
 *         is_required:
 *           type: boolean
 *           description: Whether the class is required
 *           default: true
 *         icon_url:
 *           type: string
 *           description: URL of the class icon
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes with filtering and pagination
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *         description: Filter by week ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [lecture, workshop, assessment]
 *         description: Filter by class type
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
 *           enum: [order_number, created_at]
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
 *         description: List of classes
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
 *                     $ref: '#/components/schemas/Class'
 */
exports.getClasses = async (req, res, next) => {
  try {
    console.log('Get all classes request received');
    
    const query = {};
    
    if (req.query.week) {
      query.week = req.query.week;
    }
    
    if (req.query.type) {
      query.type = req.query.type;
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
    
    const classes = await Class.find(query)
      .populate('week', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await Class.countDocuments(query);
    
    console.log(`Found ${classes.length} classes out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: classes.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get a single class
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       404:
 *         description: Class not found
 */
exports.getClass = async (req, res, next) => {
  try {
    console.log(`Get class request received for ID: ${req.params.id}`);
    
    const classDoc = await Class.findById(req.params.id)
      .populate('week', 'title');
    
    if (!classDoc) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }
    
    console.log(`Found class: ${classDoc.title}`);
    
    res.status(200).json({
      success: true,
      data: classDoc
    });
  } catch (error) {
    console.error('Get class error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - week
 *               - title
 *               - order_number
 *             properties:
 *               week:
 *                 type: string
 *                 description: ID of the week
 *               title:
 *                 type: string
 *                 description: Title of the class
 *               description:
 *                 type: string
 *                 description: Description of the class
 *               order_number:
 *                 type: integer
 *                 description: Order number of the class
 *               type:
 *                 type: string
 *                 enum: [lecture, workshop, assessment]
 *                 description: Type of the class
 *               is_active:
 *                 type: boolean
 *                 description: Whether the class is active
 *               is_required:
 *                 type: boolean
 *                 description: Whether the class is required
 *               icon_url:
 *                 type: string
 *                 description: URL of the class icon
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
exports.createClass = async (req, res, next) => {
  try {
    console.log('Create class request received');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.body.week) {
      return res.status(400).json({
        success: false,
        error: 'Week ID is required'
      });
    }
    
    const classDoc = await Class.create(req.body);
    const populatedClass = await Class.findById(classDoc._id)
      .populate('week', 'title');
    
    console.log(`Class created with ID: ${classDoc._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedClass
    });
  } catch (error) {
    console.error('Create class error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the class
 *               description:
 *                 type: string
 *                 description: Description of the class
 *               order_number:
 *                 type: integer
 *                 description: Order number of the class
 *               type:
 *                 type: string
 *                 enum: [lecture, workshop, assessment]
 *                 description: Type of the class
 *               is_active:
 *                 type: boolean
 *                 description: Whether the class is active
 *               is_required:
 *                 type: boolean
 *                 description: Whether the class is required
 *               icon_url:
 *                 type: string
 *                 description: URL of the class icon
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Class not found
 */
exports.updateClass = async (req, res, next) => {
  try {
    console.log(`Update class request received for ID: ${req.params.id}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let classDoc = await Class.findById(req.params.id);
    
    if (!classDoc) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }
    
    classDoc = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('week', 'title');
    
    console.log(`Class updated: ${classDoc.title}`);
    
    res.status(200).json({
      success: true,
      data: classDoc
    });
  } catch (error) {
    console.error('Update class error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
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
 *         description: Class not found
 */
exports.deleteClass = async (req, res, next) => {
  try {
    console.log(`Delete class request received for ID: ${req.params.id}`);
    
    const classDoc = await Class.findById(req.params.id);
    
    if (!classDoc) {
      console.log(`Class not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Class not found'
      });
    }
    
    await Class.findByIdAndDelete(req.params.id);
    console.log(`Class deleted: ${classDoc.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete class error:', error);
    next(error);
  }
}; 