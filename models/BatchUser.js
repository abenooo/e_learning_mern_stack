const mongoose = require('mongoose');

const BatchUserSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ['student', 'instructor', 'group_instructor'],
    default: 'student'
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
  },
  notes: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Compound index to ensure a user is only assigned once to a batch
BatchUserSchema.index({ batch: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('BatchUser', BatchUserSchema);