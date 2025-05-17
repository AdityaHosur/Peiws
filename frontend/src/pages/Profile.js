import React, { useState, useEffect } from 'react';
import {
  getProfile,
  updateProfile,
  getOrganizations,
  joinOrganization,
  createOrganization,
} from '../services/api';
import './profile.css';

const Profile = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token'); // Retrieve token from localStorage

  // Fetch profile and organizations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await getProfile(token);
        setName(profile.name);
        setEmail(profile.email);

        const orgs = await getOrganizations(token);
        setOrganizations(orgs.organizations);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      }
    };

    fetchData();
  }, [token]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(token, name);
      alert('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  // Handle organization creation
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createOrganization(token, orgName, description);
      alert('Organization created successfully!');
      setOrgName('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to create organization');
    }
  };

  // Handle joining an organization
  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await joinOrganization(token, orgName);
      alert('Join request sent successfully!');
      setOrgName('');
    } catch (err) {
      setError(err.message || 'Failed to join organization');
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
      </div>
    </div>
  );
};

export default Profile;