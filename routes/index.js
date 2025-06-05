// Export all routes
const authRoutes = require('./auth');
const userRoutes = require('./users');
const courseRoutes = require('./courses');
const batchRoutes = require('./batches');
const phaseRoutes = require('./phases');
const groupRoutes = require('./groups');
 
module.exports = {
  authRoutes,
  userRoutes,
  courseRoutes,
  batchRoutes,
  phaseRoutes,
  groupRoutes
};