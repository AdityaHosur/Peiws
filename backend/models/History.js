const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: ['upload', 'review', 'assign_reviewer', 'update_version'],
    required: true
  },
  details: {
    filename: String,
    version: Number,
    reviewScore: Number,
    reviewStatus: String,
    assignedReviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('History', historySchema);