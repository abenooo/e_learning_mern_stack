const Checklist = require('../models/Checklist');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Checklist:
 *       type: object
 *       required:
 *         - class
 *         - title
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the checklist
 *         class:
 *           type: string
 *           description: Reference to the class
 *         title:
 *           type: string
 *           description: Title of the checklist
 *         description:
 *           type: string
 *           description: Description of the checklist
 *         is_active:
 *           type: boolean
 *           description: Whether the checklist is active
 *           default: true
 */

/**
 * @swagger
 * /checklists:
 *   get:
 *     summary: Get all checklists with filtering and pagination
 *     tags: [Checklists]
 *     parameters:
 *       - in: query
 *         name: class
 *         schema:
 *           type: string
 *         description: Filter by class ID
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
 *           enum: [created_at, title]
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
 *         description: List of checklists
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
 *                     $ref: '#/components/schemas/Checklist'
 */
exports.getChecklists = async (req, res, next) => {
  try {
    console.log('Get all checklists request received');
    
    const query = {};
    
    if (req.query.class) {
      query.class = req.query.class;
    }
    
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    const sort = { [sortField]: sortOrder };
    
    const checklists = await Checklist.find(query)
      .populate('class', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await Checklist.countDocuments(query);
    
    console.log(`Found ${checklists.length} checklists out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: checklists.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: checklists
    });
  } catch (error) {
    console.error('Get checklists error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklists/{id}:
 *   get:
 *     summary: Get a single checklist
 *     tags: [Checklists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Checklist ID
 *     responses:
 *       200:
 *         description: Checklist details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Checklist'
 *       404:
 *         description: Checklist not found
 */
exports.getChecklist = async (req, res, next) => {
  try {
    console.log(`Get checklist request received for ID: ${req.params.id}`);
    
    const checklist = await Checklist.findById(req.params.id)
      .populate('class', 'title');
    
    if (!checklist) {
      console.log(`Checklist not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Checklist not found'
      });
    }
    
    console.log(`Found checklist: ${checklist.title}`);
    
    res.status(200).json({
      success: true,
      data: checklist
    });
  } catch (error) {
    console.error('Get checklist error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklists:
 *   post:
 *     summary: Create a new checklist
 *     tags: [Checklists]
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
 *             properties:
 *               class:
 *                 type: string
 *                 description: ID of the class
 *               title:
 *                 type: string
 *                 description: Title of the checklist
 *               description:
 *                 type: string
 *                 description: Description of the checklist
 *               is_active:
 *                 type: boolean
 *                 description: Whether the checklist is active
 *     responses:
 *       201:
 *         description: Checklist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Checklist'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
exports.createChecklist = async (req, res, next) => {
  try {
    console.log('Create checklist request received');
    
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
    
    const checklist = await Checklist.create(req.body);
    const populatedChecklist = await Checklist.findById(checklist._id)
      .populate('class', 'title');
    
    console.log(`Checklist created with ID: ${checklist._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedChecklist
    });
  } catch (error) {
    console.error('Create checklist error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklists/{id}:
 *   put:
 *     summary: Update a checklist
 *     tags: [Checklists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Checklist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the checklist
 *               description:
 *                 type: string
 *                 description: Description of the checklist
 *               is_active:
 *                 type: boolean
 *                 description: Whether the checklist is active
 *     responses:
 *       200:
 *         description: Checklist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Checklist'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Checklist not found
 */
exports.updateChecklist = async (req, res, next) => {
  try {
    console.log(`Update checklist request received for ID: ${req.params.id}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let checklist = await Checklist.findById(req.params.id);
    
    if (!checklist) {
      console.log(`Checklist not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Checklist not found'
      });
    }
    
    checklist = await Checklist.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('class', 'title');
    
    console.log(`Checklist updated: ${checklist.title}`);
    
    res.status(200).json({
      success: true,
      data: checklist
    });
  } catch (error) {
    console.error('Update checklist error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklists/{id}:
 *   delete:
 *     summary: Delete a checklist
 *     tags: [Checklists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Checklist ID
 *     responses:
 *       200:
 *         description: Checklist deleted successfully
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
 *         description: Checklist not found
 */
exports.deleteChecklist = async (req, res, next) => {
  try {
    console.log(`Delete checklist request received for ID: ${req.params.id}`);
    
    const checklist = await Checklist.findById(req.params.id);
    
    if (!checklist) {
      console.log(`Checklist not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Checklist not found'
      });
    }
    
    await Checklist.findByIdAndDelete(req.params.id);
    console.log(`Checklist deleted: ${checklist.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete checklist error:', error);
    next(error);
  }
}; 