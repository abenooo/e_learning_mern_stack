const mongoose = require('mongoose');

const CourseInstructorSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['lead_instructor', 'assistant_instructor'],
    default: 'assistant_instructor'
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  removed_at: {
    type: Date
  },
  removed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound index to ensure an instructor is only assigned once to a course
CourseInstructorSchema.index({ course: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('CourseInstructor', CourseInstructorSchema);