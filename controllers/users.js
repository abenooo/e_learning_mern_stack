const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const { validationResult } = require('express-validator');

// @desc    Get all users
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
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
    
    const { name, email, password, phone, role } = req.body;
    
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
      phone
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
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

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
    
    const { name, email, phone, is_active } = req.body;
    
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
      { name, email, phone, is_active },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

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
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

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
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};