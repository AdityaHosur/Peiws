import React, { useState } from 'react';
import './organization.css';

const Organization = () => {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [managementTab, setManagementTab] = useState('invitations');
  const [expandedSections, setExpandedSections] = useState({
    admin: true,
    reviewer: true,
    member: true
  });
  
  // Sample organizations that user belongs to
  const organizations = [
    { id: 1, name: 'Research Group Alpha', role: 'Admin' },
    { id: 2, name: 'Technology Forum', role: 'Member' },
    { id: 3, name: 'Science Lab Committee', role: 'Reviewer' },
    { id: 4, name: 'Engineering Network', role: 'Member' },
    { id: 5, name: 'Academic Research', role: 'Admin' },
    { id: 6, name: 'Data Science Hub', role: 'Reviewer' }
  ];

  // Filter organizations by role
  const adminOrgs = organizations.filter(org => org.role === 'Admin');
  const reviewerOrgs = organizations.filter(org => org.role === 'Reviewer');
  const memberOrgs = organizations.filter(org => org.role === 'Member');

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleOrgSelect = (org) => {
    setSelectedOrg(org);
    
    // Set default tab based on role
    if (org.role === 'Admin') {
      setManagementTab('invitations');
    } else if (org.role === 'Reviewer') {
      setManagementTab('uploads');
    } else {
      setManagementTab('history');
    }
  };

  return (
    <div className="organization-container">
      {/* Left Card: Organizations List */}
      <div className="organization-card org-list">
        <h2 className="organization-title">My Organizations</h2>
        
        {/* Admin Organizations */}
        <div className="role-section">
          <div 
            className="role-header" 
            onClick={() => toggleSection('admin')}
          >
            <h3>Admin</h3>
            <span className={`toggle-icon ${expandedSections.admin ? 'expanded' : ''}`}>
              {expandedSections.admin ? '▼' : '►'}
            </span>
          </div>
          {expandedSections.admin && (
            <ul className="role-organizations-list">
              {adminOrgs.map((org) => (
                <li 
                  key={org.id} 
                  className={`organization-item ${selectedOrg?.id === org.id ? 'selected' : ''}`}
                  onClick={() => handleOrgSelect(org)}
                >
                  <span className="organization-name">{org.name}</span>
                </li>
              ))}
              {adminOrgs.length === 0 && (
                <li className="no-orgs">No admin roles</li>
              )}
            </ul>
          )}
        </div>
        
        {/* Reviewer Organizations */}
        <div className="role-section">
          <div 
            className="role-header" 
            onClick={() => toggleSection('reviewer')}
          >
            <h3>Reviewer</h3>
            <span className={`toggle-icon ${expandedSections.reviewer ? 'expanded' : ''}`}>
              {expandedSections.reviewer ? '▼' : '►'}
            </span>
          </div>
          {expandedSections.reviewer && (
            <ul className="role-organizations-list">
              {reviewerOrgs.map((org) => (
                <li 
                  key={org.id} 
                  className={`organization-item ${selectedOrg?.id === org.id ? 'selected' : ''}`}
                  onClick={() => handleOrgSelect(org)}
                >
                  <span className="organization-name">{org.name}</span>
                </li>
              ))}
              {reviewerOrgs.length === 0 && (
                <li className="no-orgs">No reviewer roles</li>
              )}
            </ul>
          )}
        </div>
        
        {/* Member Organizations */}
        <div className="role-section">
          <div 
            className="role-header" 
            onClick={() => toggleSection('member')}
          >
            <h3>Member</h3>
            <span className={`toggle-icon ${expandedSections.member ? 'expanded' : ''}`}>
              {expandedSections.member ? '▼' : '►'}
            </span>
          </div>
          {expandedSections.member && (
            <ul className="role-organizations-list">
              {memberOrgs.map((org) => (
                <li 
                  key={org.id} 
                  className={`organization-item ${selectedOrg?.id === org.id ? 'selected' : ''}`}
                  onClick={() => handleOrgSelect(org)}
                >
                  <span className="organization-name">{org.name}</span>
                </li>
              ))}
              {memberOrgs.length === 0 && (
                <li className="no-orgs">No member roles</li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Right Card: Organization Management */}
      <div className="organization-card org-content">
        {!selectedOrg ? (
          <div className="select-prompt">
            <h3>Select an organization from the list</h3>
            <p>Organization details and management options will appear here</p>
          </div>
        ) : (
          <div className="manage-organization">
            {/* Organization Header */}
            <div className="org-header">
              <h3 className="content-title">{selectedOrg.name}</h3>
              <span className="org-role">{selectedOrg.role}</span>
            </div>

            {/* Admin Management Tabs */}
            {selectedOrg.role === 'Admin' && (
              <>
                <div className="management-tabs">
                  <button 
                    className={`tab-button ${managementTab === 'invitations' ? 'active' : ''}`}
                    onClick={() => setManagementTab('invitations')}
                  >
                    Invitations
                  </button>
                  <button 
                    className={`tab-button ${managementTab === 'assign' ? 'active' : ''}`}
                    onClick={() => setManagementTab('assign')}
                  >
                    Assign
                  </button>
                  <button 
                    className={`tab-button ${managementTab === 'members' ? 'active' : ''}`}
                    onClick={() => setManagementTab('members')}
                  >
                    Members
                  </button>
                  <button 
                    className={`tab-button ${managementTab === 'history' ? 'active' : ''}`}
                    onClick={() => setManagementTab('history')}
                  >
                    History
                  </button>
                </div>

                <div className="tab-content">
                  {/* Invitations Tab */}
                  {managementTab === 'invitations' && (
                    <div className="invitations-tab">
                      <h4 className="section-title">Pending Invitations</h4>
                      <ul className="invites-list">
                        <li className="invite-item">
                          <span>john@example.com</span>
                          <span>Reviewer</span>
                          <button className="small-action cancel">Cancel</button>
                        </li>
                        <li className="invite-item">
                          <span>alice@example.com</span>
                          <span>Member</span>
                          <button className="small-action cancel">Cancel</button>
                        </li>
                      </ul>
                      
                      <h4 className="section-title">Invite New Member</h4>
                      <div className="invite-form">
                        <div className="form-group">
                          <label>Email</label>
                          <input type="email" placeholder="Enter email to invite" />
                        </div>
                        <div className="form-group">
                          <label>Role</label>
                          <select defaultValue="reviewer">
                            <option value="admin">Admin</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="member">Member</option>
                          </select>
                        </div>
                        <button className="action-button">Send Invitation</button>
                      </div>
                    </div>
                  )}

                  {/* Assign Tab */}
                  {managementTab === 'assign' && (
                    <div className="assign-tab">
                      <h4 className="section-title">Assign Documents</h4>
                      <div className="assign-form">
                        <div className="form-group">
                          <label>Document</label>
                          <select>
                            <option value="">Select document</option>
                            <option value="1">Research Paper</option>
                            <option value="2">Technical Report</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Reviewer</label>
                          <select>
                            <option value="">Select reviewer</option>
                            <option value="1">John Doe</option>
                            <option value="2">Jane Smith</option>
                          </select>
                        </div>
                        <button className="action-button">Assign</button>
                      </div>
                      
                      <h4 className="section-title">Current Assignments</h4>
                      <ul className="assignments-list">
                        <li className="assignment-item">
                          <span>Research Paper</span>
                          <span>→</span>
                          <span>John Doe</span>
                          <button className="small-action cancel">Remove</button>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Members Tab */}
                  {managementTab === 'members' && (
                    <div className="members-tab">
                      <h4 className="section-title">Organization Members</h4>
                      <ul className="members-list">
                        <li className="member-item">
                          <span>John Doe</span>
                          <span>Admin</span>
                          <div className="member-actions">
                            <select className="role-select">
                              <option value="admin">Admin</option>
                              <option value="reviewer">Reviewer</option>
                              <option value="member">Member</option>
                            </select>
                            <button className="small-action">Update</button>
                            <button className="small-action remove">Remove</button>
                          </div>
                        </li>
                        <li className="member-item">
                          <span>Jane Smith</span>
                          <span>Reviewer</span>
                          <div className="member-actions">
                            <select className="role-select">
                              <option value="admin">Admin</option>
                              <option value="reviewer" selected>Reviewer</option>
                              <option value="member">Member</option>
                            </select>
                            <button className="small-action">Update</button>
                            <button className="small-action remove">Remove</button>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* History Tab */}
                  {managementTab === 'history' && (
                    <div className="history-tab">
                      <h4 className="section-title">Organization Activity History</h4>
                      <ul className="history-list">
                        <li className="history-item">
                          <span className="history-date">2025-05-10</span>
                          <span className="history-event">New member joined: Jane Smith</span>
                        </li>
                        <li className="history-item">
                          <span className="history-date">2025-05-08</span>
                          <span className="history-event">Document "Research Paper" assigned to John Doe</span>
                        </li>
                        <li className="history-item">
                          <span className="history-date">2025-05-05</span>
                          <span className="history-event">Organization created</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Reviewer Management Tabs */}
            {selectedOrg.role === 'Reviewer' && (
              <>
                <div className="management-tabs">
                  <button 
                    className={`tab-button ${managementTab === 'uploads' ? 'active' : ''}`}
                    onClick={() => setManagementTab('uploads')}
                  >
                    Uploads
                  </button>
                  <button 
                    className={`tab-button ${managementTab === 'history' ? 'active' : ''}`}
                    onClick={() => setManagementTab('history')}
                  >
                    History
                  </button>
                </div>

                <div className="tab-content">
                  {/* Uploads Tab */}
                  {managementTab === 'uploads' && (
                    <div className="uploads-tab">
                      <h4 className="section-title">Documents to Review</h4>
                      <ul className="uploads-list">
                        <li className="upload-item">
                          <div className="upload-details">
                            <span className="upload-title">Research Paper</span>
                            <span className="upload-info">Assigned: 2025-05-05</span>
                            <span className="upload-deadline">Due: 2025-05-15</span>
                          </div>
                          <button className="action-button">Review</button>
                        </li>
                        <li className="upload-item">
                          <div className="upload-details">
                            <span className="upload-title">Technical Report</span>
                            <span className="upload-info">Assigned: 2025-05-08</span>
                            <span className="upload-deadline">Due: 2025-05-18</span>
                          </div>
                          <button className="action-button">Review</button>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* History Tab */}
                  {managementTab === 'history' && (
                    <div className="history-tab">
                      <h4 className="section-title">Your Review Activity</h4>
                      <ul className="history-list">
                        <li className="history-item">
                          <span className="history-date">2025-05-03</span>
                          <span className="history-event">Completed review of "Case Study"</span>
                        </li>
                        <li className="history-item">
                          <span className="history-date">2025-04-28</span>
                          <span className="history-event">Assigned as reviewer for "Technical Report"</span>
                        </li>
                        <li className="history-item">
                          <span className="history-date">2025-04-20</span>
                          <span className="history-event">Joined organization</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Member Management Tabs */}
            {selectedOrg.role === 'Member' && (
              <>
                <div className="management-tabs">
                  <button 
                    className={`tab-button ${managementTab === 'history' ? 'active' : ''}`}
                    onClick={() => setManagementTab('history')}
                  >
                    History
                  </button>
                </div>

                <div className="tab-content">
                  {/* History Tab */}
                  {managementTab === 'history' && (
                    <div className="history-tab">
                      <h4 className="section-title">Your Activity History</h4>
                      <ul className="history-list">
                        <li className="history-item">
                          <span className="history-date">2025-05-01</span>
                          <span className="history-event">Submitted "Project Proposal"</span>
                        </li>
                        <li className="history-item">
                          <span className="history-date">2025-04-25</span>
                          <span className="history-event">Received feedback on "Academic Essay"</span>
                        </li>
                        <li className="history-item">
                          <span className="history-date">2025-04-15</span>
                          <span className="history-event">Joined organization</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Organization;