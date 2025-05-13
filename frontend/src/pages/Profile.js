import React, { useState } from 'react';
import './profile.css';

const Profile = () => {
  const [name, setName] = useState('John Doe');
  const [email] = useState('johndoe@example.com'); // Email is not editable
  const [activeTab, setActiveTab] = useState('create');
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [role, setRole] = useState('member');
  const [organizations, setOrganizations] = useState([
    { name: 'Organization A', role: 'Admin' },
    { name: 'Organization B', role: 'Member' },
  ]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    console.log('Updated Profile:', { name });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    console.log('Joining Organization:', orgName);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    console.log('Creating Organization:', orgName);
    console.log('Description:', description);
    console.log('Invite Member:', inviteEmail, 'with role:', role);
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
              
              <div className="invite-section">
                <h4>Invite Members</h4>
                <div className="form-group">
                  <label htmlFor="inviteEmail">Email</label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter member's email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="member">Member</option>
                  </select>
                </div>
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