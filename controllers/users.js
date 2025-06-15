const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const { validationResult } = require('express-validator');
const logActivity = require('../utils/activityLogger');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user (must be unique)
 *         phone:
 *           type: string
 *           description: The phone number of the user
 *         user_id_number:
 *           type: string
 *           description: An identifier for the user
 *         address:
 *           type: string
 *           description: The physical address of the user
 *         is_active:
 *           type: boolean
 *           description: Whether the user account is active
 *         is_email_verified:
 *           type: boolean
 *           description: Whether the user's email has been verified
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: The date and time the user was created
 *         last_login:
 *           type: string
 *           format: date-time
 *           description: The date and time of the user's last login
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter users by role name
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name or email
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let query = {};
    let users;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        const userRoles = await UserRole.find({ role: roleDoc._id, is_active: true }).select('user');
        const userIds = userRoles.map(ur => ur.user);
        query._id = { $in: userIds };
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] }); // No matching role, so no users
      }
    }

    // Explicitly select fields for clarity and frontend needs
    users = await User.find(query).select('name email phone address is_active is_email_verified created_at');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    // Explicitly select fields for clarity and frontend needs
    const user = await User.findById(req.params.id).select('name email phone address is_active is_email_verified created_at');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the user
 *               phone:
 *                 type: string
 *                 description: Phone number of the user
 *               address:
 *                 type: string
 *                 description: Address of the user
 *               role:
 *                 type: string
 *                 description: Optional. Role name to assign (e.g., 'student', 'instructor', 'admin')
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request (validation error or email already registered)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, password, phone, address, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address
    });
    
    // Assign role if provided
    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        await UserRole.create({
          user: user._id,
          role: roleDoc._id,
          assigned_by: req.user.id
        });
      }
    } else {
      // Assign default student role
      const studentRole = await Role.findOne({ name: 'student' });
      if (studentRole) {
        await UserRole.create({
          user: user._id,
          role: studentRole._id,
          assigned_by: req.user.id
        });
      }
    }
    
    // Log the user creation activity
    await logActivity(req.user.id, 'create', 'User', user._id, `Created user: ${user.email}`, req);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update an existing user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated email of the user
 *               phone:
 *                 type: string
 *                 description: Updated phone number of the user
 *               address:
 *                 type: string
 *                 description: Updated address of the user
 *               is_active:
 *                 type: boolean
 *                 description: Whether the user account is active
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, email, phone, address, is_active } = req.body;
    
    // Find user
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update user
    user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address, is_active },
      { new: true, runValidators: true }
    ).select('name email phone address is_active is_email_verified created_at');
    
    // Log the user update activity
    await logActivity(req.user.id, 'update', 'User', user._id, `Updated user: ${user.email}`, req);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete user
    await User.findByIdAndDelete(req.params.id);
    
    // Log the user deletion activity
    await logActivity(req.user.id, 'delete', 'User', user._id, `Deleted user: ${user.email}`, req);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}/roles:
 *   get:
 *     summary: Get roles assigned to a specific user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string }
 *                       user: { type: string }
 *                       role:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           name: { type: string }
 *                           description: { type: string }
 *                       assigned_at: { type: string, format: date-time }
 *                       is_active: { type: boolean }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// @desc    Get user roles
// @route   GET /api/users/:id/roles
// @access  Private
exports.getUserRoles = async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get user roles
    const userRoles = await UserRole.find({
      user: user._id,
      is_active: true
    }).populate('role');
    
    res.status(200).json({
      success: true,
      count: userRoles.length,
      data: userRoles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /users/{id}/roles:
 *   post:
 *     summary: Assign a role to a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 description: ID of the role to assign
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     user: { type: string }
 *                     role: { type: string }
 *                     assigned_at: { type: string, format: date-time }
 *                     is_active: { type: boolean }
 *       400:
 *         description: Bad request (validation error or user already has role)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User or Role not found
 *       500:
 *         description: Server error
 */
// controllers/users.js - Updated assignRole function
exports.assignRole = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { role } = req.body;
    
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Find role
    const roleDoc = await Role.findById(role);
    
    if (!roleDoc) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    // Check if the current user is a super_admin
    const userRoles = await UserRole.find({ 
      user: req.user.id,
      is_active: true
    }).populate('role');
    
    const isSuperAdmin = userRoles.some(userRole => 
      userRole.role.name === 'super_admin'
    );
    
    if (!isSuperAdmin && roleDoc.name !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can assign non-student roles'
      });
    }
    
    // Check if user already has this role
    const existingUserRole = await UserRole.findOne({
      user: user._id,
      role: roleDoc._id
    });
    
    if (existingUserRole) {
      // If role exists but is inactive, reactivate it
      if (!existingUserRole.is_active) {
        existingUserRole.is_active = true;
        existingUserRole.assigned_by = req.user.id;
        existingUserRole.assigned_at = Date.now();
        await existingUserRole.save();
        
        return res.status(200).json({
          success: true,
          data: existingUserRole
        });
      }
      
      return res.status(400).json({
        success: false,
        error: 'User already has this role'
      });
    }
    
    // Assign role to user
    const userRole = await UserRole.create({
      user: user._id,
      role: roleDoc._id,
      assigned_by: req.user.id,
      assigned_at: Date.now()
    });
    
    // Log the role assignment activity
    await logActivity(req.user.id, 'role_assign', 'UserRole', userRole._id, `Assigned role ${roleDoc.name} to user ${user.email}`, req);
    
    res.status(201).json({
      success: true,
      data: userRole
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Remove role from user
// @route   DELETE /api/users/:id/roles/:roleId
// @access  Private/Admin
exports.removeRole = async (req, res, next) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Find user role
    const userRole = await UserRole.findOne({
      user: user._id,
      role: req.params.roleId,
      is_active: true
    });
    
    if (!userRole) {
      return res.status(404).json({
        success: false,
        error: 'User role not found'
      });
    }
    
    // Deactivate role
    userRole.is_active = false;
    userRole.removed_by = req.user.id;
    userRole.removed_at = Date.now();
    await userRole.save();
    
    // Log the role removal activity
    await logActivity(req.user.id, 'role_remove', 'UserRole', userRole._id, `Removed role from user ${user.email}`, req);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};