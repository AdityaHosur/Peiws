const express = require('express');
const multer = require('multer');
const { uploadFile, getAllFiles, downloadFile, assignReviewers, getFilesByOrganization, getUserUploads } = require('../controllers/fileController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory temporarily

// Upload a file
router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

// Get all files
router.get('/files', authMiddleware, getAllFiles);
router.get('/user-uploads', authMiddleware, getUserUploads);

// Download a file by filename
router.get('/files/:filename', authMiddleware, downloadFile);

router.get('/organization/:organizationName', authMiddleware, getFilesByOrganization);

router.put('/:fileId/reviewers', authMiddleware, assignReviewers);

module.exports = router;