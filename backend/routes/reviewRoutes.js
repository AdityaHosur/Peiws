const express = require('express');
const { getReviewsByFile, updateReviewStatus } = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all reviews for a file
router.get('/file/:fileId', authMiddleware, getReviewsByFile);

// Update review status
router.patch('/:reviewId', authMiddleware, updateReviewStatus);

module.exports = router;