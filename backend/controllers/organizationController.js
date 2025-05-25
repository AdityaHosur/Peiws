const Organization = require('../models/Organization');
const History = require('../models/History');
const User = require('../models/User');

exports.getOrganizationHistory = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Find all history entries for this organization
    const history = await History.find({ organizationId })
      .populate('userId', 'name email')
      .populate('documentId', 'filename version')
      .sort({ timestamp: -1 })
      .lean();

    // Format the history data
    const formattedHistory = history.map(entry => ({
      id: entry._id,
      documentName: entry.documentId?.filename || 'Deleted Document',
      version: entry.documentId?.version || entry.details.version,
      action: entry.actionType,
      performedBy: entry.userId.name,
      performerEmail: entry.userId.email,
      timestamp: entry.timestamp,
      details: {
        ...entry.details,
        reviewers: entry.details.assignedReviewers?.length || 0
      }
    }));

    res.status(200).json({ history: formattedHistory });
  } catch (error) {
    console.error('Error fetching organization history:', error);
    res.status(500).json({ message: 'Failed to fetch history', error });
  }
};

exports.trackHistory = async (organizationId, documentId, userId, actionType, details) => {
  try {
    const historyEntry = new History({
      organizationId,
      documentId,
      userId,
      actionType,
      details
    });
    await historyEntry.save();
  } catch (error) {
    console.error('Error tracking history:', error);
  }
};
// Create a new organization
exports.createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if the organization already exists
    const existingOrg = await Organization.findOne({ name });
    if (existingOrg) {
      return res.status(400).json({ message: 'Organization already exists' });
    }

    // Create a new organization
    const organization = new Organization({
      name,
      description,
      admin: [req.user.id], // Assuming `req.user` contains the authenticated user's ID
      members: [],
    });

    await organization.save();

    res.status(201).json({ message: 'Organization created successfully', organization });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Request to join an organization
exports.requestToJoin = async (req, res) => {
  try {
    const { organizationId } = req.body;

    // Find the organization
    const organization = await Organization.findOne({name:organizationId});
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if the user is already a member
    if (organization.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this organization' });
    }

    // Check if the user has already sent a join request
    if (organization.pendingRequests.some((req) => req.email === req.user.email)) {
      return res.status(400).json({ message: 'You have already requested to join this organization' });
    }

    // Add the join request
    organization.pendingRequests.push({ email: req.user.email });
    await organization.save();

    res.status(200).json({ message: 'Join request sent successfully', organization });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Handle invitations (accept/reject)
exports.handleInvitation = async (req, res) => {
  try {
    const { organizationId, email, action } = req.body;

    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if the requester is an admin
    if (organization.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admins can handle invitations' });
    }

    // Find the pending request
    const requestIndex = organization.pendingRequests.findIndex((req) => req.email === email);

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (action === 'accept') {
      // Add the user to members
      const user = await User.findOne({ email });
      if (user) {
        organization.members.push(user._id);
      }
    }

    // Remove the request
    organization.pendingRequests.splice(requestIndex, 1);
    await organization.save();

    res.status(200).json({ message: `Request ${action}ed successfully`, organization });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Invite users to an organization
exports.inviteUsers = async (req, res) => {
  try {
    const { organizationId, emails } = req.body;

    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if the requester is an admin
    if (organization.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admins can invite users' });
    }

    // Add invitations
    emails.forEach((email) => {
      if (!organization.pendingRequests.some((req) => req.email === email)) {
        organization.pendingRequests.push({ email, role: 'Member' }); // Default role is Member
      }
    });

    await organization.save();

    res.status(200).json({ message: 'Invitations sent successfully', organization });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// List all organizations the user belongs to along with their role
exports.listUserOrganizations = async (req, res) => {
  try {
    // Find all organizations where the user is a member or admin
    const organizations = await Organization.find({
      $or: [{ admin: req.user.id }, { members: req.user.id }],
    });

    // Map the organizations to include the user's role and pending requests (if admin)
    const userOrganizations = organizations.map((org) => {
      const role = org.admin.toString() === req.user.id ? 'Admin' : 'Member';
      return {
        id: org._id,
        name: org.name,
        role,
        pendingRequests: role === 'Admin' ? org.pendingRequests : [], // Include pending requests for admins
      };
    });

    res.status(200).json({ organizations: userOrganizations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.listUsers= async (req, res) => {
  try {
    const { organizationId } = req.params;

    // Find the organization
    const organization = await Organization.findById(organizationId).populate('members', 'name email');
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Return the members along with their roles
    const members = organization.members.map((member) => ({
      id: member._id,
      name: member.name,
      email: member.email,
      role: member._id.toString() === organization.admin.toString() ? 'Admin' : 'Member',
    }));

    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { organizationId, memberId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if the requester is an admin
    if (organization.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admins can update roles' });
    }

    // Update the admin role if necessary
    if (role === 'Admin') {
      organization.admin = memberId;
    }

    await organization.save();

    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};