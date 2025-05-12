const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Permission code is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Permission name is required']
  },
  description: {
    type: String
  },
  resource_type: {
    type: String,
    required: [true, 'Resource type is required']
  },
  action: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'manage'],
    required: [true, 'Action is required']
  },
  is_system_permission: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Permission', PermissionSchema);