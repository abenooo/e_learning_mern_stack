const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  live_session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveSession'
  },
  group_session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupSession'
  },
  is_present: {
    type: Boolean,
    default: false
  },
  class_date: {
    type: Date,
    required: [true, 'Class date is required']
  },
  check_in_time: {
    type: String
  },
  check_out_time: {
    type: String
  },
  attendance_notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'absent'
  },
  recorded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound index to ensure a user has only one attendance record per session
AttendanceSchema.index({ 
  user: 1, 
  batch: 1, 
  class_date: 1, 
  live_session: 1, 
  group_session: 1 
}, { 
  unique: true,
  partialFilterExpression: {
    $or: [
      { live_session: { $exists: true } },
      { group_session: { $exists: true } }
    ]
  }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);