const mongoose = require('mongoose');

const BatchInstructorSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class_type: {
    type: String,
    enum: ['main_class', 'group'],
    default: 'main_class'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
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

// Compound index to ensure an instructor is only assigned once to a batch-group combination
BatchInstructorSchema.index({ batch: 1, user: 1, group: 1 }, { unique: true });

module.exports = mongoose.model('BatchInstructor', BatchInstructorSchema);