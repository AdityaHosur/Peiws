const express = require('express');
const {
  createOrganization,
  requestToJoin,
  handleInvitation,
  listUserOrganizations
} = require('../controllers/organizationController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware to verify user authentication

const router = express.Router();

// Create an organization
router.post('/create', authMiddleware, createOrganization);

// Request to join an organization
router.post('/join', authMiddleware, requestToJoin);

// Handle invitations (accept/reject)
router.post('/invitation', authMiddleware, handleInvitation);

// Get all organizations
router.get('/list', authMiddleware, listUserOrganizations);

module.exports = router;