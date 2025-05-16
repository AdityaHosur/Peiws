const Organization = require('../models/Organization');
const User = require('../models/User');

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
      admin: req.user.id, // Assuming `req.user` contains the authenticated user's ID
      members: [req.user.id],
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
    if (organization.joinRequests.some((req) => req.user.toString() === req.user.id)) {
      return res.status(400).json({ message: 'You have already requested to join this organization' });
    }

    // Add the join request
    organization.joinRequests.push({ user: req.user.id });
    await organization.save();

    res.status(200).json({ message: 'Join request sent successfully', organization });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Handle invitations (accept/reject)
exports.handleInvitation = async (req, res) => {
  try {
    const { organizationId, userId, action } = req.body;

    // Find the organization
    const organization = await Organization.findOne({name:organizationId});
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Check if the requester is an admin
    if (organization.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admins can handle invitations' });
    }

    // Find the join request
    const joinRequestIndex = organization.joinRequests.findIndex(
      (req) => req.user.toString() === userId
    );

    if (joinRequestIndex === -1) {
      return res.status(404).json({ message: 'Join request not found' });
    }

    if (action === 'accept') {
      // Add the user to members
      organization.members.push(userId);
    }

    // Remove the join request
    organization.joinRequests.splice(joinRequestIndex, 1);
    await organization.save();

    res.status(200).json({ message: `Invitation ${action}ed successfully`, organization });
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

    // Map the organizations to include the user's role
    const userOrganizations = organizations.map((org) => {
      const role = org.admin.toString() === req.user.id ? 'Admin' : 'Member';
      return {
        id: org._id,
        name: org.name,
        role,
      };
    });

    res.status(200).json({ organizations: userOrganizations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};