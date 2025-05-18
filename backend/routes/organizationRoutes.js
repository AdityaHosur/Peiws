const express = require('express');
const {
  createOrganization,
  requestToJoin,
  handleInvitation,
  listUserOrganizations,
  inviteUsers,
  listUsers,
  updateRole
} = require('../controllers/organizationController');
const authMiddleware = require('../middlewares/authMiddleware'); // Middleware to verify user authentication

const router = express.Router();

// Create an organization
router.post('/create', authMiddleware, createOrganization);

// Request to join an organization
router.post('/join', authMiddleware, requestToJoin);

// Handle invitations (accept/reject)
router.post('/invitation', authMiddleware, handleInvitation);

// Invite users to an organization
router.post('/invite', authMiddleware, inviteUsers);

// Get all organizations
router.get('/list', authMiddleware, listUserOrganizations);

router.get('/:organizationId/members', authMiddleware, listUsers);

router.put('/:organizationId/members/:memberId/role', authMiddleware, updateRole);

module.exports = router;