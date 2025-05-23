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

    const validReviews = reviews.filter(review => review.fileId !== null);
    console.log('Valid Reviews:', reviews);
    if (!validReviews || validReviews.length === 0) {
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

// Add or update the status endpoint

exports.getReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({
      status: review.status,
      lastModified: review.lastModified,
      reviewedAt: review.reviewedAt
    });
  } catch (error) {
    console.error('Error fetching review status:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update the updateReviewStatus function in controllers/reviewController.js
exports.updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the reviewer is authorized
    if (review.reviewerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to modify this review' });
    }

    // Update the status
    review.status = status;
    
    // If the status is 'completed', set the reviewedAt timestamp
    if (status === 'completed') {
      review.reviewedAt = new Date();
    }
    
    review.lastModified = new Date();
    await review.save();

    res.status(200).json({ 
      message: 'Review status updated successfully',
      review 
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add these new methods to the existing controller

exports.saveReviewDetails = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { annotations, comments, stickyNotes, scores } = req.body;
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
    if (scores) {
      review.scores = {
        structure: Number(scores.structure) || 0,
        grammar: Number(scores.grammar) || 0,
        clarity: Number(scores.clarity) || 0,
        content: Number(scores.content) || 0,
        overall: Number(scores.overall) || 0,
        feedback: scores.feedback || '',
        summary: scores.summary || '',
        timestamp: Date.now()
      };
      
      console.log('Saving scores to review:', review.scores); // Debug log
    }
    review.lastModified = new Date();
    
    // If there are annotations/comments/notes, set status to in-progress
    if (annotations?.length > 0 || comments?.length > 0 || stickyNotes?.length > 0 || (review.scores && (
        Number(review.scores.structure) > 0 || 
        Number(review.scores.grammar) > 0 || 
        Number(review.scores.clarity) > 0 || 
        Number(review.scores.content) > 0 || 
        Number(review.scores.overall) > 0
      ))) {
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

    res.status(200).json({
      annotations: review.annotations || [],
      comments: review.comments || [],
      stickyNotes: review.stickyNotes || [],
      scores: review.scores || {},
      status: review.status 
    });
  } catch (error) {
    console.error('Error fetching review details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add to reviewController.js
exports.getReviewsByFileId = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Find all reviews for this file
    const reviews = await Review.find({ fileId })
      .populate('reviewerId', 'name email') // Get reviewer details
      .lean();
    
    if (!reviews || reviews.length === 0) {
      return res.status(404).json({ message: 'No reviews found for this file' });
    }
    
    // Format the review data with explicit numeric scores
    const formattedReviews = reviews.map(review => {
      // Ensure scores are properly converted to numbers
      const formattedScores = review.scores ? {
        structure: Number(review.scores.structure || 0),
        grammar: Number(review.scores.grammar || 0),
        clarity: Number(review.scores.clarity || 0),
        content: Number(review.scores.content || 0),
        overall: Number(review.scores.overall || 0),
        feedback: review.scores.feedback || '',
        summary: review.scores.summary || '',
        timestamp: review.scores.timestamp
      } : {};
      
      return {
        ...review,
        reviewerName: review.reviewerId ? `${review.reviewerId.name || review.reviewerId.email}` : 'Unknown',
        scores: formattedScores
      };
    });
    
    console.log('Formatted reviews with scores:', formattedReviews.map(r => ({
      id: r._id.toString().substring(0, 4),
      scores: r.scores
    })));
    
    res.status(200).json(formattedReviews);
  } catch (error) {
    console.error('Error fetching reviews by file ID:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};