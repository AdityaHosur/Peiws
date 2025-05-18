const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'uploads.files' }, // Reference to GridFS file
  fileGroupId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Group ID for file versions
  filename: { type: String, required: true }, // Original filename
  version: { type: Number, required: true }, // Version number
  uploader: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }, // Reference to the user who uploaded the file
  tags: { type: [String], default: [] }, // Array of tags
  reviewers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }, // Array of reviewer IDs
  visibility: { type: String, enum: ['private', 'organization'], default: 'private' }, // Visibility of the file
  organizationName: { type: String, required: false }, // Organization name if visibility is "organization"
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' }, // Status of the file
  deadline: { type: Date, required: false }, // Deadline for the file
  uploadedAt: { type: Date, default: Date.now }, // Timestamp of the upload
});

module.exports = mongoose.model('Upload', uploadSchema);