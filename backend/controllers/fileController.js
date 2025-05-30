const { getGridFSBucket } = require('../config/gridfs');
const {generatePdfDiff} = require('../utils/pdfdiff');
const User = require('../models/User');
const Upload = require('../models/Upload');
const Review = require('../models/Review');
const {trackHistory} = require('../controllers/organizationController'); 
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

        let tags = [];
        if (req.body.tags) {
          try {
            tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            console.log('Parsed tags:', tags);
          } catch (error) {
            console.error('Error parsing tags:', error);
            // If parsing fails, use as-is or empty array
            tags = req.body.tags || [];
          }
        }

        // Convert reviewers string to array if it exists
        let reviewerIds = [];
        console.log('Reviewers before:', req.body.reviewers);
        if (req.body.reviewers) {
          try {
            // Parse the JSON string if it exists
            const parsedReviewers = JSON.parse(req.body.reviewers);
            if (Array.isArray(parsedReviewers)) {
              // Find user IDs by email addresses
              const reviewerPromises = parsedReviewers.map(async (email) => {
                const user = await User.findOne({ email: email.trim() });
                return user ? user._id : null;
              });
              const resolvedReviewerIds = (await Promise.all(reviewerPromises))
                .filter(id => id !== null)
                .map(id => new mongoose.Types.ObjectId(id));
              
              reviewerIds = resolvedReviewerIds;
              console.log('Parsed reviewerIds:', reviewerIds);
            }
          } catch (error) {
            console.error('Error parsing reviewers:', error);
          }
        }
        
        // Get the latest version number for the fileGroupId
        const latestVersion = await Upload.find({ fileGroupId })
          .sort({ version: -1 })
          .limit(1);

        const newVersion = latestVersion.length > 0 ? latestVersion[0].version + 1 : 1;

        // Save file metadata in the uploads collection
        const uploadDetails = new Upload({
          _id: uploadStream.id, 
          fileId: uploadStream.id, // GridFS file ID
          fileGroupId, // Group ID for file versions
          filename: req.file.originalname, // Original filename
          version: newVersion, // Increment version number
          uploader: req.user.id, // Authenticated user ID
          tags: tags || [], // Tags from the request body
          reviewers: reviewerIds || [], // Reviewers from the request body
          visibility: req.body.visibility || 'private', // Visibility from the request body
          organizationName: req.body.visibility === 'organization' ? req.body.organizationName : null, // Add organization name if visibility is "organization"
          status: req.body.status || 'draft', // Status from the request body
          deadline: req.body.deadline ? new Date(req.body.deadline) : null, // Deadline from the request body
        });
        
        await uploadDetails.save();

        // Create review records for each reviewer
        console.log('Reviewers after:', reviewerIds);
        console.log('Upload Details:', uploadDetails.fileId);

        if (reviewerIds.length > 0) {
          const reviewRecords = reviewerIds.map((reviewerId) => ({
            fileId: uploadDetails.fileId,
            reviewerId,
          }));

          try {
            const insertedReviews = await Review.insertMany(reviewRecords);
            console.log('Inserted Reviews:', insertedReviews);
          } catch (error) {
            console.error('Error inserting reviews:', error);
            return res.status(500).json({ message: 'Failed to create review records', error });
          }
        } else {
          console.log('No reviewers provided');
        }
        try{
        if(req.body.organizationName){
          await trackHistory(
            req.body.organizationName,
            uploadDetails._id,
            req.user.id,
            'upload',
            {
              filename: req.file.originalname,
              version: newVersion
            }
          );
        }
      } catch (error) {
        console.error('Error tracking upload history:', error);
      }
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

exports.getUserUploads = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all files uploaded by the user
    const uploads = await Upload.find({ uploader: userId })
      .sort({ createdAt: -1 }) // Sort by upload date, newest first
      .lean();
    
    
    
    res.status(200).json(uploads);
  } catch (error) {
    console.error('Error fetching user uploads:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all files
exports.getAllFiles = async (req, res) => {
  try {
    const gfsBucket = getGridFSBucket();
    const files = await gfsBucket.find().toArray();

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

exports.getDocumentById = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Find the document
    const document = await Upload.findById(fileId)
      .populate('reviewers', 'name email')
      .lean();
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if the user has permission to view this document
    if (document.uploader.toString() !== req.user.id && 
        document.visibility === 'private' &&
        !document.reviewers.some(r => r._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'You do not have permission to view this document' });
    }
    
    res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getDocumentVersions = async (req, res) => {
  try {
    const { fileGroupId } = req.params;
    
    // Find all versions of the document
    const versions = await Upload.find({ fileGroupId })
      .sort({ version: -1 })
      .lean();
    
    if (!versions || versions.length === 0) {
      return res.status(404).json({ message: 'No versions found for this document' });
    }
    
    res.status(200).json(versions);
  } catch (error) {
    console.error('Error fetching document versions:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getFilesByOrganization = async (req, res) => {
  try {
    const { organizationName } = req.params;

    // Find files with the given organization name
    const files = await Upload.find({ organizationName });

    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No files found for this organization' });
    }

    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.assignReviewers = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { reviewers } = req.body;

    // Validate reviewers
    if (!Array.isArray(reviewers) || reviewers.length === 0) {
      return res.status(400).json({ message: 'Reviewers list cannot be empty' });
    }

    // Find the file
    const file = await Upload.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Assign reviewers
    file.reviewers = reviewers;
    await file.save();

    // Create review records for each reviewer
    const reviewRecords = reviewers.map((reviewerId) => ({
      fileId: fileId,
      reviewerId,
    }));

    try {
      const insertedReviews = await Review.insertMany(reviewRecords);
      console.log('Inserted Reviews:', insertedReviews);
    } catch (error) {
      console.error('Error inserting reviews:', error);
      return res.status(500).json({ message: 'Failed to create review records', error });
    }
    await trackHistory(
      file.organizationName,
      file._id,
      req.user.id,
      'assign_reviewer',
      {
        filename: file.filename,
        version: file.version,
        assignedReviewers: reviewers
      }
    );
    res.status(200).json({ message: 'Reviewers assigned successfully and review records created', file });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getDocumentDiff = async (req, res) => {
  // Declare the timeout variable at the function scope level
  let pdfGenerationTimeout;
  
  try {
    const { leftId, rightId, highlight = 'true' } = req.query;
    const showHighlights = highlight !== 'false';
    
    console.log(`Diff request for leftId=${leftId}, rightId=${rightId}, highlight=${highlight}`);
    
    if (!leftId || !rightId) {
      return res.status(400).json({ message: 'Both document IDs are required' });
    }
  
    // Set the timeout
    pdfGenerationTimeout = setTimeout(() => {
      console.error('PDF generation timed out after 30 seconds');
      res.status(500).json({
        message: 'PDF generation timed out',
        error: 'The operation took too long to complete. Please try with smaller documents.'
      });
    }, 30000); // 30 second timeout

    // Generate the PDF diff using our utility
    const diffPdfBuffer = await generatePdfDiff(leftId, rightId, showHighlights);
    
    // Clear the timeout since we completed successfully
    clearTimeout(pdfGenerationTimeout);
  
    // Send the diff PDF as a response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="document_diff.pdf"');
    res.send(diffPdfBuffer);
  } catch (diffError) {
    console.error('Error in diff generation:', diffError.message);
    
    // Clear the timeout since we have an answer (even if it's an error)
    if (pdfGenerationTimeout) {
      clearTimeout(pdfGenerationTimeout);
    }
    
    // Return a proper error response
    res.status(500).json({ 
      message: 'Error generating document comparison', 
      error: diffError.message,
      details: 'The system was unable to compare these documents. This could be due to file format issues or document structure.'
    });
  }
};