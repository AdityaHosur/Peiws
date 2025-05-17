const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'uploads.files' }, // Reference to the GridFS file
  reviewerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Reference to the reviewer
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }, // Review status
  comments: { type: String, default: '' }, // Comments from the reviewer
  reviewedAt: { type: Date, required: false }, // Timestamp when the review was completed
});

module.exports = mongoose.model('Review', reviewSchema);