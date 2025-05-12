const mongoose = require('mongoose');

const BatchCourseSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  custom_title: {
    type: String
  },
  custom_description: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound index to ensure a course is only offered once per batch
BatchCourseSchema.index({ batch: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('BatchCourse', BatchCourseSchema);