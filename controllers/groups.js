const Group = require('../models/Group');
const GroupUser = require('../models/GroupUser');
const { validationResult } = require('express-validator');

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Get all groups with filtering and pagination
 *     tags: [Groups]
 */
exports.getGroups = async (req, res, next) => {
  try {
    console.log('Get all groups request received');
    
    // Build query
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter active groups by default
    query.is_active = true;
    
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
      .populate('batch', 'name')
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
 * /api/groups/{id}:
 *   get:
 *     summary: Get a single group with detailed information
 *     tags: [Groups]
 */
exports.getGroup = async (req, res, next) => {
  try {
    console.log(`Get group request received for ID: ${req.params.id}`);
    
    const group = await Group.findById(req.params.id)
      .populate('batch', 'name');
    
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
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
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
    
    // Set default values if not provided
    if (!req.body.status) {
      req.body.status = 'active';
    }
    
    // Create group
    const group = await Group.create(req.body);
    console.log(`Group created with ID: ${group._id}`);
    
    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/groups/{id}:
 *   put:
 *     summary: Update a group
 *     tags: [Groups]
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
    );
    
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
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
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

/**
 * @swagger
 * /api/groups/{id}/users:
 *   get:
 *     summary: Get all users in a group
 *     tags: [Groups]
 */
exports.getGroupUsers = async (req, res, next) => {
  try {
    console.log(`Get group users request received for group ID: ${req.params.id}`);
    
    // Check if group exists
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      console.log(`Group not found with ID: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Get active users
    const groupUsers = await GroupUser.find({
      group: req.params.id,
      is_active: true
    }).populate('user', 'name email phone initials');
    
    console.log(`Found ${groupUsers.length} users in group: ${group.name}`);
    
    res.status(200).json({
      success: true,
      count: groupUsers.length,
      data: groupUsers
    });
  } catch (error) {
    console.error('Get group users error:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/groups/{id}/users:
 *   post:
 *     summary: Add a user to a group
 *     tags: [Groups]
 */
exports.addUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { user, role } = req.body;
    
    // Check if group exists
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Check if user is already in the group
    const existingUser = await GroupUser.findOne({
      group: group._id,
      user
    });
    
    if (existingUser) {
      // If user exists but is inactive, reactivate
      if (!existingUser.is_active) {
        existingUser.is_active = true;
        existingUser.role = role;
        existingUser.assigned_by = req.user.id;
        existingUser.assigned_at = Date.now();
        await existingUser.save();
        
        return res.status(200).json({
          success: true,
          data: existingUser
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'User already in this group'
      });
    }
    
    // Add user to group
    const groupUser = await GroupUser.create({
      group: group._id,
      user,
      role,
      assigned_by: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: groupUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/groups/{id}/users/{userId}:
 *   delete:
 *     summary: Remove a user from a group
 *     tags: [Groups]
 */
exports.removeUser = async (req, res, next) => {
  try {
    // Check if group exists
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    // Find group user
    const groupUser = await GroupUser.findOne({
      group: group._id,
      user: req.params.userId,
      is_active: true
    });
    
    if (!groupUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found in group'
      });
    }
    
    // Deactivate user
    groupUser.is_active = false;
    groupUser.removed_by = req.user.id;
    groupUser.removed_at = Date.now();
    await groupUser.save();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
