// Export all routes
const authRoutes = require('./auth');
const userRoutes = require('./users');
const courseRoutes = require('./courses');
const batchRoutes = require('./batches');
const phaseRoutes = require('./phases');
const groupRoutes = require('./groups');
const enrollmentRoutes = require('./enrollments');
const weekRoutes = require('./weeks');
const classRoutes = require('./classes');
const classComponentRoutes = require('./classComponents');
const videoRoutes = require('./videos');
const checklistRoutes = require('./checklists');
const checklistItemRoutes = require('./checklistItems');
const liveSessionRoutes = require('./liveSessions');
const groupSessionRoutes = require('./groupSessions');
const activityLogRoutes = require('./activityLogs');
const courseHierarchyRoutes = require('./courseHierarchy');

module.exports = {
  authRoutes,
  userRoutes,
  courseRoutes,
  batchRoutes,
  phaseRoutes,
  groupRoutes,
  enrollmentRoutes,
  weekRoutes,
  classRoutes,
  classComponentRoutes,
  videoRoutes,
  checklistRoutes,
  checklistItemRoutes,
  liveSessionRoutes,
  groupSessionRoutes,
  activityLogRoutes,
  courseHierarchyRoutes
};