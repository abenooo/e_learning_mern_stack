const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: { // Renamed from user_id to user to make it a direct reference
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    enum: [
      'login', 'logout', 'create', 'update', 'delete', 'view', 'enroll', 'unenroll',
      // Add more specific actions as needed
      'password_change', 'email_verification', 'account_lock', 'role_assign', 'role_remove',
      'course_create', 'course_update', 'course_delete',
      'batch_create', 'batch_update', 'batch_delete',
      'phase_create', 'phase_update', 'phase_delete',
      'week_create', 'week_update', 'week_delete',
      'live_session_create', 'live_session_update', 'live_session_delete',
      'group_session_create', 'group_session_update', 'group_session_delete'
    ]
  },
  entity_type: {
    type: String,
    enum: ['User', 'Course', 'Batch', 'Phase', 'Week', 'LiveSession', 'GroupSession', 'Role', 'UserRole', 'System'],
    required: [true, 'Entity type is required']
  },
  entity_id: { // The ID of the entity acted upon (e.g., user ID, course ID)
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entity_type' // Dynamically reference based on entity_type
  },
  ip_address: {
    type: String,
    match: [
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^((?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|::(?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?|([0-9A-Fa-f]{1,4}:){1,6}:|([0-9A-Fa-f]{1,4}:){1,5}:[0-9A-Fa-f]{1,4}|([0-9A-Fa-f]{1,4}:){1,4}(:[0-9A-Fa-f]{1,4}){1,2}|([0-9A-Fa-f]{1,4}:){1,3}(:[0-9A-Fa-f]{1,4}){1,3}|([0-9A-Fa-f]{1,4}:){1,2}(:[0-9A-Fa-f]{1,4}){1,4}|([0-9A-Fa-f]{1,4}:){1}(:[0-9A-Fa-f]{1,4}){1,5}|:((:[0-9A-Fa-f]{1,4}){1,6})$|^\[((?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|::(?:[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4})*)?|([0-9A-Fa-f]{1,4}:){1,6}:|([0-9A-Fa-f]{1,4}:){1,5}:[0-9A-Fa-f]{1,4}|([0-9A-Fa-f]{1,4}:){1,4}(:[0-9A-Fa-f]{1,4}){1,2}|([0-9A-Fa-f]{1,4}:){1,3}(:[0-9A-Fa-f]{1,4}){1,3}|([0-9A-Fa-f]{1,4}:){1,2}(:[0-9A-Fa-f]{1,4}){1,4}|([0-9A-Fa-f]{1,4}:){1}(:[0-9A-Fa-f]{1,4}){1,5}|:((:[0-9A-Fa-f]{1,4}){1,6})\]$|^::ffff:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      'Please add a valid IP address'
    ]
  },
  details: { // Additional descriptive details about the action
    type: String
  },
  user_agent: { // User-Agent header from the request
    type: String
  }
}, {
  timestamps: {
    createdAt: 'timestamp', // Maps 'timestamp' to createdAt
    updatedAt: false // We only care about creation time for activity logs
  }
});

// Index for faster querying
ActivityLogSchema.index({ user: 1, timestamp: -1 });
ActivityLogSchema.index({ entity_type: 1, entity_id: 1 });
ActivityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema); 