const express = require('express');
const { getReviewsByFile, 
    getReviewsAssignedToUser,
    streamFile,
    saveReviewDetails,
    getReviewDetails,
    getReviewStatus,
    updateReviewStatus
} = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all reviews for a file
router.get('/file/:fileId', authMiddleware, getReviewsByFile);

// Get reviews assigned to the logged-in user
router.get('/assigned', authMiddleware, getReviewsAssignedToUser);

// Stream file content
router.get('/stream/:fileId',streamFile);

router.post('/details/:reviewId', authMiddleware, saveReviewDetails);
router.get('/details/:reviewId', authMiddleware, getReviewDetails);

// Add these routes if not already present

router.get('/status/:reviewId', authMiddleware, getReviewStatus);
router.put('/status/:reviewId', authMiddleware, updateReviewStatus);


module.exports = router;