const { getGridFSBucket } = require('../config/gridfs');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Upload = require('../models/Upload');

// Get reviews assigned to the logged-in user
exports.getReviewsAssignedToUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find reviews assigned to the user and populate file details from the Upload collection
    const reviews = await Review.find({ reviewerId: userId })
      .populate({
        path: 'fileId', // Populate the fileId field
        model: 'Upload', // Reference the Upload model
        select: 'fileId filename tags deadline', // Select specific fields from the Upload collection
      })
      .exec();

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews assigned to this user' });
    }

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.streamFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const gfsBucket = getGridFSBucket();
    const downloadStream = gfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    downloadStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(404).json({ message: 'File not found', error });
    });

    res.set('Content-Type', 'application/pdf'); // Set the content type for PDF
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all reviews for a file
exports.getReviewsByFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const reviews = await Review.find({ fileId }).populate('reviewerId', 'name email');

    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this file' });
    }

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update review status
exports.updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, comments } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.status = status || review.status;
    review.comments = comments || review.comments;
    review.reviewedAt = status === 'completed' ? new Date() : review.reviewedAt;

    await review.save();

    res.status(200).json({ message: 'Review updated successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add these new methods to the existing controller

exports.saveReviewDetails = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { annotations, comments, stickyNotes } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the reviewer is authorized
    if (review.reviewerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to modify this review' });
    }

    // Update review details
    review.annotations = annotations || review.annotations;
    review.comments = comments || review.comments;
    review.stickyNotes = stickyNotes || review.stickyNotes;
    review.lastModified = new Date();
    
    // If there are annotations/comments/notes, set status to in-progress
    if (annotations?.length > 0 || comments?.length > 0 || stickyNotes?.length > 0) {
      review.status = 'in-progress';
    }

    await review.save();

    res.status(200).json({ 
      message: 'Review details saved successfully',
      review 
    });
  } catch (error) {
    console.error('Error saving review details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.getReviewDetails = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the reviewer is authorized
    if (review.reviewerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this review' });
    }

    res.status(200).json({
      annotations: review.annotations || [],
      comments: review.comments || [],
      stickyNotes: review.stickyNotes || []
    });
  } catch (error) {
    console.error('Error fetching review details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};