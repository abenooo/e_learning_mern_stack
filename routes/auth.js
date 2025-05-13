const express = require('express');
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendVerificationEmail
} = require('../controllers/auth');

// Register user (public route)
router.post('/register', [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], register);

// Login user (public route)
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], login);

// Refresh token (public route)
router.post('/refresh-token', refreshToken);

// Get current user (protected route)
router.get('/me', protect, getMe);

// Logout user (protected route)
router.post('/logout', protect, logout);

// Change password (protected route)
router.put('/change-password', [
  protect,
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], changePassword);

// Forgot password (public route)
router.post('/forgot-password', [
  check('email', 'Please include a valid email').isEmail()
], forgotPassword);

// Reset password (public route)
router.put('/reset-password/:resetToken', [
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], resetPassword);

// Verify email (public route)
router.get('/verify-email/:verificationToken', verifyEmail);

// Send verification email (protected route)
router.post('/send-verification-email', protect, sendVerificationEmail);

module.exports = router;