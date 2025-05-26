import React, { useState, useEffect } from 'react';
import {
  getProfile,
  updateProfile,
  getOrganizations,
  joinOrganization,
  createOrganization,
  getUserInvitations,
  handleInvitation
} from '../services/api';
import { useToast } from '../components/ToastContext'; // Import toast hook
import './profile.css';

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const token = localStorage.getItem('token'); // Retrieve token from localStorage
  const { showToast } = useToast(); // Use the toast hook

  // Fetch profile and organizations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getProfile(token);
        setName(profile.name);
        setEmail(profile.email);

        const orgs = await getOrganizations(token);
        setOrganizations(orgs.organizations);

        setLoadingInvitations(true);
        const userInvitations = await getUserInvitations(token);
        setInvitations(userInvitations.invitations || []);
        setLoadingInvitations(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        showToast(err.message || 'Failed to fetch data', 'error');
      }
    };

    fetchData();
  }, [token]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(token, name);
      // Replace alert with toast
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  // Handle organization creation
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createOrganization(token, orgName, description);
      // Replace alert with toast
      showToast('Organization created successfully!', 'success');
      setOrgName('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to create organization');
      showToast(err.message || 'Failed to create organization', 'error');
    }
  };

  // Handle joining an organization
  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await joinOrganization(token, orgName);
      // Replace alert with toast
      showToast('Join request sent successfully!', 'success');
      setOrgName('');
    } catch (err) {
      setError(err.message || 'Failed to join organization');
      showToast(err.message || 'Failed to join organization', 'error');
    }
  };

  const handleInvitationResponse = async (organizationId, action) => {
    try {
      await handleInvitation(token, organizationId, email, action);
      showToast(`Invitation ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`, 'success');
      
      // Update invitations list by removing the one that was acted upon
      setInvitations(invitations.filter(inv => inv.organizationId !== organizationId));
      
      // If accepted, refresh organizations list
      if (action === 'accept') {
        const orgs = await getOrganizations(token);
        setOrganizations(orgs.organizations);
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} invitation`);
      showToast(err.message || `Failed to ${action} invitation`, 'error');
    }
  };

  return (
    <div className="profile-container">
      {/* Left Card: Profile Details */}
      <div className="profile-card profile-left">
        <h2 className="profile-title">Profile Details</h2>
        <form className="profile-form" onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              readOnly // Make the email field read-only
            />
          </div>
          <button type="submit" className="profile-button">
            Update Profile
          </button>
        </form>

        <div className="organizations-section">
          <h3 className="section-title">My Organizations</h3>
          <ul className="organization-list">
            {organizations.map((org, index) => (
              <li key={index} className="organization-item">
                <span className="organization-name">{org.name}</span>
                <span className="organization-role">({org.role})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Card: Organization Actions */}
      <div className="profile-card org-content">
        {/* Segmented Button */}
        <div className="segmented-control">
          <button
            className={`segment-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create
          </button>
          <button
            className={`segment-button ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join
          </button>
          <button
            className={`segment-button ${activeTab === 'invitations' ? 'active' : ''}`}
            onClick={() => setActiveTab('invitations')}
          >
            Invitations
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'join' && (
          <div className="join-organization">
            <h3 className="content-title">Join an Organization</h3>
            <form className="organization-form" onSubmit={handleJoin}>
              <div className="form-group">
                <label htmlFor="joinOrgName">Organization Name</label>
                <input
                  type="text"
                  id="joinOrgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              <button type="submit" className="profile-button">
                Join
              </button>
            </form>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-organization">
            <h3 className="content-title">Create an Organization</h3>
            <form className="organization-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="createOrgName">Organization Name</label>
                <input
                  type="text"
                  id="createOrgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your organization"
                  required
                />
              </div>
              <button type="submit" className="profile-button">
                Create
              </button>
            </form>
          </div>
        )}
        {activeTab === 'invitations' && (
          <div className="invitations-organization">
            <h3 className="content-title">Organization Invitations</h3>
            {loadingInvitations ? (
              <p className="loading-text">Loading invitations...</p>
            ) : invitations.length > 0 ? (
              <ul className="invitations-list">
                {invitations.map((invitation) => (
                  <li key={invitation.organizationId} className="invitation-item">
                    <div className="invitation-details">
                      <span className="organization-name">{invitation.organizationName}</span>
                      <span className="invitation-role">Role: {invitation.role}</span>
                    </div>
                    <div className="invitation-actions">
                      <button 
                        className="accept-button"
                        onClick={() => handleInvitationResponse(invitation.organizationId, 'accept')}
                      >
                        Accept
                      </button>
                      <button 
                        className="reject-button"
                        onClick={() => handleInvitationResponse(invitation.organizationId, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-invitations">You don't have any pending invitations</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;