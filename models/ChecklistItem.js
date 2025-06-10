const mongoose = require('mongoose');

const ChecklistItemSchema = new mongoose.Schema({
  checklist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Checklist',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true
  },
  html_content: {
    type: String
  },
  is_required: {
    type: Boolean,
    default: true
  },
  order_number: {
    type: Number,
    required: [true, 'Order number is required']
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

module.exports = mongoose.model('ChecklistItem', ChecklistItemSchema); 