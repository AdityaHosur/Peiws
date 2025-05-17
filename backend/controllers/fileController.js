const { getGridFSBucket } = require('../config/gridfs');
const Upload = require('../models/Upload');
const Review = require('../models/Review');
const mongoose = require('mongoose');

// Upload a file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const gfsBucket = getGridFSBucket();

    // Create a writable stream to GridFS
    const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    // Write the file buffer to GridFS
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async() => {
      try {
        let fileGroupId = req.body.fileGroupId;

        // If no fileGroupId is provided, create a new one
        if (!fileGroupId) {
          fileGroupId = new mongoose.Types.ObjectId();
        }

        // Get the latest version number for the fileGroupId
        const latestVersion = await Upload.find({ fileGroupId })
          .sort({ version: -1 })
          .limit(1);

        const newVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

        // Save file metadata in the uploads collection
        const uploadDetails = new Upload({
          fileId: uploadStream.id, // GridFS file ID
          fileGroupId, // Group ID for file versions
          version: newVersion, // Increment version number
          uploader: req.user.id, // Authenticated user ID
          tags: req.body.tags || [], // Tags from the request body
          reviewers: req.body.reviewers || [], // Reviewers from the request body
          visibility: req.body.visibility || 'private', // Visibility from the request body
          status: req.body.status || 'draft', // Status from the request body
          deadline: req.body.deadline ? new Date(req.body.deadline) : null, // Deadline from the request body
        });
        
        await uploadDetails.save();

        // Create review records for each reviewer
        const reviewers = req.body.reviewers || [];
        const reviewRecords = reviewers.map((reviewerId) => ({
          fileId: uploadStream.id,
          reviewerId,
        }));

        await Review.insertMany(reviewRecords);

        res.status(201).json({
          message: 'File uploaded successfully',
          fileId: uploadStream.id,
          uploadDetails,
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to save upload details', error });
      }
    });

    uploadStream.on('error', (error) => {
      res.status(500).json({ message: 'File upload failed', error });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all files
exports.getAllFiles = async (req, res) => {
  try {
    const gfsBucket = getGridFSBucket();
    const files = await gfsBucket.find().toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No files found' });
    }

    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Download a file by filename
exports.downloadFile = (req, res) => {
  try {
    const gfsBucket = getGridFSBucket();
    const { filename } = req.params;

    gfsBucket.find({ filename }).toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({ message: 'File not found' });
      }

      const readStream = gfsBucket.openDownloadStreamByName(filename);
      readStream.pipe(res);
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};