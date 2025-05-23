const express = require('express');
const {  
    getReviewsAssignedToUser,
    streamFile,
    saveReviewDetails,
    getReviewDetails,
    getReviewStatus,
    updateReviewStatus,
    getReviewsByFileId
} = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Get reviews assigned to the logged-in user
router.get('/assigned', authMiddleware, getReviewsAssignedToUser);

// Stream file content
router.get('/stream/:fileId',streamFile);

router.post('/details/:reviewId', authMiddleware, saveReviewDetails);
router.get('/details/:reviewId', authMiddleware, getReviewDetails);

// Add these routes if not already present

router.get('/status/:reviewId', authMiddleware, getReviewStatus);
router.put('/status/:reviewId', authMiddleware, updateReviewStatus);

router.get('/file/:fileId', authMiddleware, getReviewsByFileId);

module.exports = router;