const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

/**
 * Generate access token with 1-hour expiration
 * @param {string} userId - User ID to include in the token
 * @returns {string} JWT access token
 */
const generateAccessToken = (userId) => {
  try {
    console.log(`Generating access token for user ID: ${userId}`);
    const secret = process.env.JWT_SECRET || 'your_secure_jwt_secret_key';
    
    const token = jwt.sign({ id: userId }, secret, {
      expiresIn: process.env.JWT_EXPIRE || '1h' // 1 hour expiration
    });
    
    console.log('Access token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate refresh token with 7-day expiration
 * @param {string} userId - User ID to include in the token
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  try {
    console.log(`Generating refresh token for user ID: ${userId}`);
    const secret = process.env.REFRESH_TOKEN_SECRET || 'your_secure_refresh_token_secret';
    
    const token = jwt.sign({ id: userId }, secret, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' // 7 days expiration
    });
    
    console.log('Refresh token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    console.log('Register request received');
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User already exists with email: ${email}`);
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

   // Find student role or create it if it doesn't exist
let studentRole = await Role.findOne({ name: 'student' });
if (!studentRole) {
  console.log('Student role not found, creating it now');
  try {
    studentRole = await Role.create({
      name: 'student',
      description: 'Student enrolled in courses',
      is_system_role: true,
      permission_level: 10
    });
    console.log(`Created student role with ID: ${studentRole._id}`);
  } catch (roleError) {
    console.error('Error creating student role:', roleError);
    return res.status(500).json({
      success: false,
      error: 'Failed to create student role. Please contact administrator.'
    });
  }
}

    // Assign student role to user
    await UserRole.create({
      user: user._id,
      role: studentRole._id,
      is_active: true,
      assigned_at: Date.now()
    });
    console.log(`Student role assigned to user: ${user._id}`);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Store refresh token in database
    user.refresh_token = refreshToken;
    user.refresh_token_expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    // Set secure cookie with refresh token if in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken: process.env.NODE_ENV === 'production' ? undefined : refreshToken,
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

/**
 * Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
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
      
      // Increment failed login attempts
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      
      // If too many failed attempts, lock the account temporarily
      if (user.failed_login_attempts >= 5) {
        user.account_locked_until = Date.now() + (15 * 60 * 1000); // 15 minutes
        console.log(`Account locked until: ${new Date(user.account_locked_until)}`);
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        locked: user.account_locked_until > Date.now()
      });
    }

    // Check if account is locked
    if (user.account_locked_until && user.account_locked_until > Date.now()) {
      const unlockTime = new Date(user.account_locked_until);
      console.log(`Account is locked until: ${unlockTime}`);
      return res.status(403).json({
        success: false,
        error: `Account is locked due to too many failed attempts. Try again after ${unlockTime.toLocaleString()}`
      });
    }

    console.log('Login successful, generating tokens');
    
    // Reset failed login attempts
    user.failed_login_attempts = 0;
    
    // Update last login
    user.last_login = Date.now();
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Store refresh token in database
    user.refresh_token = refreshToken;
    user.refresh_token_expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    // Get user roles
    const userRoles = await UserRole.find({ 
      user: user._id,
      is_active: true
    }).populate('role');
    
    const roles = userRoles.map(ur => ur.role.name);
    console.log(`User roles: ${roles.join(', ')}`);

    // Set secure cookie with refresh token if in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: process.env.NODE_ENV === 'production' ? undefined : refreshToken,
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
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during login'
    });
  }
};

/**
 * Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res, next) => {
  try {
    console.log('Refresh token request received');
    
    // Get refresh token from request body or cookie
    let refreshToken = req.body.refreshToken;
    
    if (!refreshToken && req.cookies && req.cookies.refreshToken) {
      refreshToken = req.cookies.refreshToken;
    }
    
    if (!refreshToken) {
      console.log('No refresh token provided');
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      const secret = process.env.REFRESH_TOKEN_SECRET || 'your_secure_refresh_token_secret';
      decoded = jwt.verify(refreshToken, secret);
      console.log(`Refresh token verified for user ID: ${decoded.id}`);
    } catch (error) {
      console.error('Invalid refresh token:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }
    
    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.id,
      refresh_token: refreshToken,
      refresh_token_expires: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log('User not found or refresh token expired');
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    
    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    // Update refresh token in database (token rotation for security)
    user.refresh_token = newRefreshToken;
    user.refresh_token_expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();
    
    // Set secure cookie with new refresh token if in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }
    
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: process.env.NODE_ENV === 'production' ? undefined : newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during token refresh'
    });
  }
};

/**
 * Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res, next) => {
  try {
    console.log(`Logout request received for user ID: ${req.user.id}`);
    
    // Invalidate refresh token
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.refresh_token = null;
      user.refresh_token_expires = null;
      await user.save();
      console.log(`Refresh token invalidated for user ID: ${user._id}`);
    }
    
    // Clear cookie if in production
    if (process.env.NODE_ENV === 'production') {
      res.clearCookie('refreshToken');
    }
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during logout'
    });
  }
};

/**
 * Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    console.log(`Get current user request for ID: ${req.user.id}`);
    
    const user = await User.findById(req.user.id);
    
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
    
    const roles = userRoles.map(ur => ur.role.name);
    console.log(`User roles: ${roles.join(', ')}`);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        initials: user.initials,
        user_id_number: user.user_id_number,
        last_login: user.last_login,
        roles
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};

/**
 * Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    console.log(`Change password request for user ID: ${req.user.id}`);
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    
    // Invalidate all refresh tokens when password changes
    user.refresh_token = null;
    user.refresh_token_expires = null;
    
    await user.save();
    console.log(`Password changed successfully for user ID: ${user._id}`);
    
    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Store new refresh token
    user.refresh_token = refreshToken;
    user.refresh_token_expires = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();
    
    // Set secure cookie with refresh token if in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      accessToken,
      refreshToken: process.env.NODE_ENV === 'production' ? undefined : refreshToken
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during password change'
    });
  }
};

/**
 * Forgot password - send reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    console.log('Forgot password request received');
    
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry
    user.reset_password_token = hashedToken;
    user.reset_password_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();
    console.log(`Reset token generated for user ID: ${user._id}`);
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    // In a real application, you would send an email with the reset URL
    // For this example, we'll just return the URL in the response
    console.log(`Reset URL (would be sent via email): ${resetUrl}`);
    
    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // If there's an error, remove reset token fields
    if (user) {
      user.reset_password_token = undefined;
      user.reset_password_expires = undefined;
      await user.save();
    }
    
    res.status(500).json({
      success: false,
      error: 'Email could not be sent'
    });
  }
};

/**
 * Reset password
 * @route   PUT /api/auth/reset-password/:resetToken
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    console.log('Reset password request received');
    
    // Get hashed token
    const resetToken = req.params.resetToken;
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Find user by token
    const user = await User.findOne({
      reset_password_token: hashedToken,
      reset_password_expires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Set new password
    user.password = req.body.password;
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    
    // Invalidate all refresh tokens when password changes
    user.refresh_token = null;
    user.refresh_token_expires = null;
    
    await user.save();
    console.log(`Password reset successful for user ID: ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during password reset'
    });
  }
};

/**
 * Verify email with token
 * @route   GET /api/auth/verify-email/:verificationToken
 * @access  Public
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    console.log('Verify email request received');
    
    const { verificationToken } = req.params;
    
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    // Find user by token
    const user = await User.findOne({
      email_verification_token: hashedToken,
      email_verification_expires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
    
    // Set email as verified
    user.is_email_verified = true;
    user.email_verification_token = undefined;
    user.email_verification_expires = undefined;
    
    await user.save();
    console.log(`Email verified for user ID: ${user._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during email verification'
    });
  }
};

/**
 * Send verification email
 * @route   POST /api/auth/send-verification-email
 * @access  Private
 */
exports.sendVerificationEmail = async (req, res, next) => {
  try {
    console.log(`Send verification email request for user ID: ${req.user.id}`);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if email is already verified
    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Email is already verified'
      });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and set to emailVerificationToken field
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    // Set token expiry
    user.email_verification_token = hashedToken;
    user.email_verification_expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    await user.save();
    console.log(`Verification token generated for user ID: ${user._id}`);
    
    // Create verification URL
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    
    // In a real application, you would send an email with the verification URL
    // For this example, we'll just return the URL in the response
    console.log(`Verification URL (would be sent via email): ${verificationUrl}`);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error during sending verification email'
    });
  }
};