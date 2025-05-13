const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT Token
// controllers/auth.js - Update the generateToken function
const generateToken = (id) => {
  console.log(`Generating token for user ID: ${id}`);
  const secret = process.env.JWT_SECRET || 'your_default_secret_key_for_development';
  console.log(`Using JWT secret: ${secret.substring(0, 3)}...`); // Log first few chars for security
  
  try {
    const token = jwt.sign({ id }, secret, {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    });
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// controllers/auth.js - Updated register function
exports.register = async (req, res, next) => {
  try {
    console.log('Register request received');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, email, password, phone } = req.body;

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
    console.log(`User created with ID: ${user._id}`);

    // Find student role
    const studentRole = await Role.findOne({ name: 'student' });
    if (!studentRole) {
      console.error('Student role not found in database');
      return res.status(500).json({
        success: false,
        error: 'Student role not found. Please contact administrator.'
      });
    }

    // Assign student role to user
    await UserRole.create({
      user: user._id,
      role: studentRole._id,
      is_active: true,
      assigned_at: Date.now()
    });
    console.log(`Student role assigned to user: ${user._id}`);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        initials: user.initials,
        roles: ['student']
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration'
    });
  }
};
// controllers/auth.js - Update the login function
exports.login = async (req, res, next) => {
  try {
    console.log('Login request received');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(`Attempting login for email: ${email}`);

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    let isMatch = false;
    
    try {
      isMatch = await user.comparePassword(password);
      console.log(`Password match result: ${isMatch}`);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return res.status(500).json({
        success: false,
        error: 'Error verifying credentials'
      });
    }
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('Password matched, generating token');
    
    // Update last login
    user.last_login = Date.now();
    await user.save();

    // Get user roles
    const userRoles = await UserRole.find({ 
      user: user._id,
      is_active: true
    }).populate('role');
    
    const roles = userRoles.map(ur => ur.role.name);
    console.log(`User roles: ${roles.join(', ')}`);

    // Generate token
    let token;
    try {
      token = generateToken(user._id);
      console.log('Token length:', token.length);
    } catch (error) {
      console.error('Failed to generate token:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }

    // Send response with token
    console.log('Sending successful login response');
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        initials: user.initials,
        roles
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during login'
    });
  }
};
// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Get user roles
    const userRoles = await UserRole.find({ 
      user: user._id,
      is_active: true
    }).populate('role');
    
    const roles = userRoles.map(ur => ur.role.name);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        initials: user.initials,
        user_id_number: user.user_id_number,
        roles
      }
    });
  } catch (error) {
    next(error);
  }
};