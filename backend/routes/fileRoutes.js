const express = require('express');
const multer = require('multer');
const { uploadFile, 
    getAllFiles, 
    downloadFile, 
    assignReviewers, 
    getFilesByOrganization, 
    getUserUploads, 
    getDocumentById,
    getDocumentVersions,
    getDocumentDiff
 } = require('../controllers/fileController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory temporarily

// Upload a file
router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

// Get all files
router.get('/files', authMiddleware, getAllFiles);
router.get('/uploads', authMiddleware, getUserUploads);

// Download a file by filename
router.get('/diff', authMiddleware, getDocumentDiff);
router.get('/organization/:organizationName', authMiddleware, getFilesByOrganization);
router.get('/versions/:fileGroupId', authMiddleware, getDocumentVersions);

router.get('/files/:filename', authMiddleware, downloadFile);
router.get('/:fileId', authMiddleware, getDocumentById);
router.put('/:fileId/reviewers', authMiddleware, assignReviewers);

module.exports = router;