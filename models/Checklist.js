const mongoose = require('mongoose');

const ChecklistSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Checklist title is required'],
    trim: true
  },
  description: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Checklist', ChecklistSchema); 