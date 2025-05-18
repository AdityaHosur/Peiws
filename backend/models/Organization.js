const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [
    {
      email: { type: String, required: true },
      role: { type: String, default: 'Member' }, // Default role is Member
    },
  ],
});

module.exports = mongoose.model('Organization', organizationSchema);