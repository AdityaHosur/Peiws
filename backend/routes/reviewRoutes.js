const express = require('express');
const { getReviewsByFile, updateReviewStatus, getReviewsAssignedToUser,streamFile } = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all reviews for a file
router.get('/file/:fileId', authMiddleware, getReviewsByFile);

// Update review status
router.patch('/:reviewId', authMiddleware, updateReviewStatus);

// Get reviews assigned to the logged-in user
router.get('/assigned', authMiddleware, getReviewsAssignedToUser);

// Stream file content
router.get('/stream/:fileId',streamFile);

module.exports = router;