const Group = require('../models/Group');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       required:
 *         - batch
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the group
 *         batch:
 *           type: string
 *           description: Reference to the batch
 *         name:
 *           type: string
 *           description: Name of the group
 *         description:
 *           type: string
 *           description: Description of the group
 *         max_members:
 *           type: integer
 *           description: Maximum number of members allowed
 *           default: 15
 *         class_days:
 *           type: string
 *           description: Days when classes are held
 *           default: "Tue - Thu"
 *         class_start_time:
 *           type: string
 *           description: Start time of classes
 *         class_end_time:
 *           type: string
 *           description: End time of classes
 *         ethio_start_time:
 *           type: string
 *           description: Ethiopian time start
 *         ethio_end_time:
 *           type: string
 *           description: Ethiopian time end
 *         is_active:
 *           type: boolean
 *           description: Whether the group is active
 *           default: true
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Current status of the group
 *           default: active
 */

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups with filtering and pagination
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: batch
 *         schema:
 *           type: string
 *         description: Filter by batch ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by group status
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
 *           enum: [name, created_at]
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 */
exports.getGroups = async (req, res, next) => {
  try {
    console.log('Get all groups request received');
    
    // Build query
    const query = {};
    
    // Filter by batch
    if (req.query.batch) {
      query.batch = req.query.batch;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by active status
    if (req.query.is_active !== undefined) {
      query.is_active = req.query.is_active === 'true';
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Sorting
    const sortField = req.query.sort || 'created_at';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };
    
    // Execute query with pagination
    const groups = await Group.find(query)
      .populate('batch', 'name batch_code')
      .sort(sort)
      .skip(startIndex)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Group.countDocuments(query);
    
    console.log(`Found ${groups.length} groups out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: groups.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get a single group
 *     tags: [Groups]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 */
exports.getGroup = async (req, res, next) => {
  try {
    console.log(`Get group request received for ID: ${req.params.id}`);
    
    const group = await Group.findById(req.params.id)
      .populate('batch', 'name batch_code');
    
    if (!group) {
      console.log(`Group not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    console.log(`Found group: ${group.name}`);
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batch
 *               - name
 *             properties:
 *               batch:
 *                 type: string
 *                 description: ID of the batch
 *               name:
 *                 type: string
 *                 description: Name of the group
 *               description:
 *                 type: string
 *                 description: Description of the group
 *               max_members:
 *                 type: integer
 *                 description: Maximum number of members
 *               class_days:
 *                 type: string
 *                 description: Days when classes are held
 *               class_start_time:
 *                 type: string
 *                 description: Start time of classes
 *               class_end_time:
 *                 type: string
 *                 description: End time of classes
 *               ethio_start_time:
 *                 type: string
 *                 description: Ethiopian time start
 *               ethio_end_time:
 *                 type: string
 *                 description: Ethiopian time end
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 */
exports.createGroup = async (req, res, next) => {
  try {
    console.log('Create group request received');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Create group
    const group = await Group.create(req.body);
    
    // Populate batch after creation
    const populatedGroup = await Group.findById(group._id)
      .populate('batch', 'name batch_code');
    
    console.log(`Group created with ID: ${group._id}`);
    
    res.status(201).json({
      success: true,
      data: populatedGroup
    });
  } catch (error) {
    console.error('Create group error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /groups/{id}:
 *   put:
 *     summary: Update a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 */
exports.updateGroup = async (req, res, next) => {
  try {
    console.log(`Update group request received for ID: ${req.params.id}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Find group
    let group = await Group.findById(req.params.id);
    
    if (!group) {
      console.log(`Group not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Update group
    group = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('batch', 'name batch_code');
    
    console.log(`Group updated: ${group.name}`);
    
    res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 */
exports.deleteGroup = async (req, res, next) => {
  try {
    console.log(`Delete group request received for ID: ${req.params.id}`);
    
    // Find group
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      console.log(`Group not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Delete group
    await Group.findByIdAndDelete(req.params.id);
    console.log(`Group deleted: ${group.name}`);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete group error:', error);
    next(error);
  }
};