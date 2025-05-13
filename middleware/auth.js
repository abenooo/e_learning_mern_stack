const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserRole = require('../models/UserRole');
const Role = require('../models/Role');
const RolePermission = require('../models/RolePermission');
const Permission = require('../models/Permission');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const secret = process.env.JWT_SECRET || 'your_secure_jwt_secret_key';
      const decoded = jwt.verify(token, secret);
      
      // Get user from the token
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Check if user is active
      if (!req.user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }
      
      next();
    } catch (error) {
      console.error('JWT verification error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          isExpired: true
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      // Get user roles
      const userRoles = await UserRole.find({ 
        user: req.user.id,
        is_active: true
      }).populate('role');
      
      // Check if user has any of the required roles
      const hasRole = userRoles.some(userRole => 
        roles.includes(userRole.role.name)
      );
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required roles: ${roles.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check permission
exports.checkPermission = (resourceType, action) => {
  return async (req, res, next) => {
    try {
      // Get user roles
      const userRoles = await UserRole.find({ 
        user: req.user.id,
        is_active: true
      });
      
      if (userRoles.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'User has no active roles'
        });
      }
      
      const roleIds = userRoles.map(userRole => userRole.role);
      
      // Get permissions for these roles
      const rolePermissions = await RolePermission.find({
        role: { $in: roleIds },
        is_granted: true
      }).populate({
        path: 'permission',
        match: { 
          resource_type: resourceType,
          action: action
        }
      });
      
      // Check if user has the required permission
      const hasPermission = rolePermissions.some(rp => rp.permission !== null);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Not authorized to ${action} ${resourceType}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      next(error);
    }
  };
};

// Require email verification
exports.requireVerifiedEmail = async (req, res, next) => {
  try {
    if (!req.user.is_email_verified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required',
        requiresVerification: true
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};