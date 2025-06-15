const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, entityType, entityId = null, details = null, req = null) => {
  try {
    const logData = {
      user: userId,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      details: details
    };

    if (req) {
      logData.ip_address = req.ip || req.connection.remoteAddress;
      logData.user_agent = req.headers['user-agent'];
    }

    await ActivityLog.create(logData);
    console.log(`Activity logged: User ${userId} ${action} ${entityType} ${entityId || ''}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = logActivity; 