const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  type: { type: String, enum: ['highlight', 'underline', 'strikethrough'] },
  color: String,
  content: String,
  position: [{
    left: Number,
    top: Number,
    width: Number,
    height: Number
  }],
  timestamp: Number
});

const commentSchema = new mongoose.Schema({
  id: Number,
  text: String,
  position: {
    left: Number,
    top: Number
  },
  pageNumber: Number
});

const stickyNoteSchema = new mongoose.Schema({
  id: Number,
  text: String,
  position: {
    x: Number,
    y: Number
  },
  pageNumber: Number
});

const reviewSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'uploads.files' },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  annotations: [annotationSchema],
  comments: [commentSchema],
  stickyNotes: [stickyNoteSchema],
  reviewedAt: { type: Date },
  lastModified: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);