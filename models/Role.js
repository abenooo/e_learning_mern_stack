const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    enum: ['super_admin', 'admin', 'instructor', 'group_instructor', 'team_member', 'student']
  },
  description: {
    type: String,
    required: [true, 'Role description is required']
  },
  is_system_role: {
    type: Boolean,
    default: true
  },
  permission_level: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Role', RoleSchema);