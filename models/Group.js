const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true
  },
  description: {
    type: String
  },
  max_members: {
    type: Number,
    default: 15
  },
  class_days: {
    type: String,
    default: 'Tue - Thu'
  },
  class_start_time: {
    type: String
  },
  class_end_time: {
    type: String
  },
  ethio_start_time: {
    type: String
  },
  ethio_end_time: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Group', GroupSchema);