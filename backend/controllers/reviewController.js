const Review = require('../models/Review');

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