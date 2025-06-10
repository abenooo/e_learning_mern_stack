const ChecklistItem = require('../models/ChecklistItem');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     ChecklistItem:
 *       type: object
 *       required:
 *         - checklist
 *         - title
 *         - order_number
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the checklist item
 *         checklist:
 *           type: string
 *           description: Reference to the checklist
 *         title:
 *           type: string
 *           description: Title of the checklist item
 *         html_content:
 *           type: string
 *           description: HTML content of the checklist item
 *         is_required:
 *           type: boolean
 *           description: Whether the item is required
 *           default: true
 *         order_number:
 *           type: integer
 *           description: Order number of the item
 *         is_active:
 *           type: boolean
 *           description: Whether the item is active
 *           default: true
 */

/**
 * @swagger
 * /checklist-items:
 *   get:
 *     summary: Get all checklist items with filtering and pagination
 *     tags: [Checklist Items]
 *     parameters:
 *       - in: query
 *         name: checklist
 *         schema:
 *           type: string
 *         description: Filter by checklist ID
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
 *         description: List of checklist items
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
 *                     $ref: '#/components/schemas/ChecklistItem'
 */
exports.getChecklistItems = async (req, res, next) => {
  try {
    console.log('Get all checklist items request received');
    
    const query = {};
    
    if (req.query.checklist) {
      query.checklist = req.query.checklist;
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
    
    const items = await ChecklistItem.find(query)
      .populate('checklist', 'title')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    const total = await ChecklistItem.countDocuments(query);
    
    console.log(`Found ${items.length} items out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: items.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: items
    });
  } catch (error) {
    console.error('Get checklist items error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklist-items/{id}:
 *   get:
 *     summary: Get a single checklist item
 *     tags: [Checklist Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Checklist item ID
 *     responses:
 *       200:
 *         description: Checklist item details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChecklistItem'
 *       404:
 *         description: Checklist item not found
 */
exports.getChecklistItem = async (req, res, next) => {
  try {
    console.log(`Get checklist item request received for ID: ${req.params.id}`);
    
    const item = await ChecklistItem.findById(req.params.id)
      .populate('checklist', 'title');
    
    if (!item) {
      console.log(`Checklist item not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }
    
    console.log(`Found checklist item: ${item.title}`);
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get checklist item error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklist-items:
 *   post:
 *     summary: Create a new checklist item
 *     tags: [Checklist Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - checklist
 *               - title
 *               - order_number
 *             properties:
 *               checklist:
 *                 type: string
 *                 description: ID of the checklist
 *               title:
 *                 type: string
 *                 description: Title of the checklist item
 *               html_content:
 *                 type: string
 *                 description: HTML content of the checklist item
 *               is_required:
 *                 type: boolean
 *                 description: Whether the item is required
 *               order_number:
 *                 type: integer
 *                 description: Order number of the item
 *               is_active:
 *                 type: boolean
 *                 description: Whether the item is active
 *     responses:
 *       201:
 *         description: Checklist item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChecklistItem'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
exports.createChecklistItem = async (req, res, next) => {
  try {
    console.log('Create checklist item request received');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.body.checklist) {
      return res.status(400).json({
        success: false,
        error: 'Checklist ID is required'
      });
    }
    
    const item = await ChecklistItem.create(req.body);
    const populatedItem = await ChecklistItem.findById(item._id)
      .populate('checklist', 'title');
    
    console.log(`Checklist item created with ID: ${item._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedItem
    });
  } catch (error) {
    console.error('Create checklist item error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklist-items/{id}:
 *   put:
 *     summary: Update a checklist item
 *     tags: [Checklist Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Checklist item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the checklist item
 *               html_content:
 *                 type: string
 *                 description: HTML content of the checklist item
 *               is_required:
 *                 type: boolean
 *                 description: Whether the item is required
 *               order_number:
 *                 type: integer
 *                 description: Order number of the item
 *               is_active:
 *                 type: boolean
 *                 description: Whether the item is active
 *     responses:
 *       200:
 *         description: Checklist item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ChecklistItem'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Checklist item not found
 */
exports.updateChecklistItem = async (req, res, next) => {
  try {
    console.log(`Update checklist item request received for ID: ${req.params.id}`);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    let item = await ChecklistItem.findById(req.params.id);
    
    if (!item) {
      console.log(`Checklist item not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }
    
    item = await ChecklistItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('checklist', 'title');
    
    console.log(`Checklist item updated: ${item.title}`);
    
    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Update checklist item error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /checklist-items/{id}:
 *   delete:
 *     summary: Delete a checklist item
 *     tags: [Checklist Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Checklist item ID
 *     responses:
 *       200:
 *         description: Checklist item deleted successfully
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
 *         description: Checklist item not found
 */
exports.deleteChecklistItem = async (req, res, next) => {
  try {
    console.log(`Delete checklist item request received for ID: ${req.params.id}`);
    
    const item = await ChecklistItem.findById(req.params.id);
    
    if (!item) {
      console.log(`Checklist item not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Checklist item not found'
      });
    }
    
    await ChecklistItem.findByIdAndDelete(req.params.id);
    console.log(`Checklist item deleted: ${item.title}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete checklist item error:', error);
    next(error);
  }
}; 