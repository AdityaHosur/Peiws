import React, { useState, useEffect } from 'react';
import {
  getOrganizations,
  handleInvitation,
  inviteUsersToOrganization,
  getOrganizationMembers,
  updateMemberRole,
  getFilesByOrganization,
  assignReviewersToFile,
} from '../services/api'; // Import API functions
import './organization.css';

const Organization = () => {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [managementTab, setManagementTab] = useState('invitations');
  const [expandedSections, setExpandedSections] = useState({
    admin: true,
    reviewer: true,
    member: true,
  });
  const [organizations, setOrganizations] = useState([]);
  const [inviteEmails, setInviteEmails] = useState('');
  const [members, setMembers] = useState([]); // State to store members
  const [loadingMembers, setLoadingMembers] = useState(false); // Loading state for members
  const [files, setFiles] = useState([]); // State to store files
  const [loadingFiles, setLoadingFiles] = useState(false); // Loading state for files
  const [selectedReviewers, setSelectedReviewers] = useState({}); // State to store selected reviewers for each file
  const [selectedFile, setSelectedFile] = useState(null); // State to track the selected file
  const [error, setError] = useState('');
  const token = localStorage.getItem('token'); // Retrieve token from localStorage

  // Fetch organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await getOrganizations(token);
        setOrganizations(data.organizations);
      } catch (err) {
        setError(err.message || 'Failed to fetch organizations');
      }
    };
    fetchOrganizations();
    if (managementTab === 'members' && selectedOrg) {
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const data = await getOrganizationMembers(token, selectedOrg.id);
        setMembers(data.members);
      } catch (err) {
        setError(err.message || 'Failed to fetch members');
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }
  if (managementTab === 'assign' && selectedOrg) {
    const fetchFiles = async () => {
      try {
        setLoadingFiles(true);
        const data = await getFilesByOrganization(token, selectedOrg.name);
        setFiles(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch files');
      } finally {
        setLoadingFiles(false);
      }
    };
    fetchFiles();
  }
  }, [managementTab, selectedOrg, token]);

  // Filter organizations by role
  const adminOrgs = organizations.filter((org) => org.role === 'Admin');
  const reviewerOrgs = organizations.filter((org) => org.role === 'Reviewer');
  const memberOrgs = organizations.filter((org) => org.role === 'Member');

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
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

  const handleInvitationAction = async (email, action) => {
  try {
    await handleInvitation(token, selectedOrg.id, email, action);
    alert(`Request ${action}ed successfully!`);

    // Update the selected organization's pending requests
    setSelectedOrg((prevOrg) => ({
      ...prevOrg,
      pendingRequests: prevOrg.pendingRequests.filter((req) => req.email !== email),
    }));
  } catch (err) {
    setError(err.message || `Failed to ${action} request`);
  }
};
const handleInviteUsers = async () => {
  try {
    const emails = inviteEmails.split(',').map((email) => email.trim());
    if (emails.length === 0) {
      alert('Please enter at least one email address');
      return;
    }

    // Call the backend API to send invitations
    await inviteUsersToOrganization(token, selectedOrg.id, emails);
    alert('Invitations sent successfully!');
    setInviteEmails(''); // Clear the input field
  } catch (err) {
    setError(err.message || 'Failed to send invitations');
  }
};

const handleRoleUpdate = async (memberId, newRole) => {
  try {
    await updateMemberRole(token, selectedOrg.id, memberId, newRole);
    alert('Role updated successfully!');

    // Update the members list
    setMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.id === memberId ? { ...member, role: newRole } : member
      )
    );
  } catch (err) {
    setError(err.message || 'Failed to update role');
  }
};

// Handle reviewer selection
const handleReviewerSelection = (fileId, reviewerId) => {
  setSelectedReviewers((prev) => ({
    ...prev,
    [fileId]: prev[fileId]
      ? prev[fileId].includes(reviewerId)
        ? prev[fileId].filter((id) => id !== reviewerId)
        : [...prev[fileId], reviewerId]
      : [reviewerId],
  }));
};

// Handle assigning reviewers
const handleAssignReviewers = async (fileId) => {
  try {
    const reviewers = selectedReviewers[fileId] || [];
    if (reviewers.length === 0) {
      alert('Please select at least one reviewer');
      return;
    }

    await assignReviewersToFile(token, fileId, reviewers);
    alert('Reviewers assigned successfully!');
  } catch (err) {
    setError(err.message || 'Failed to assign reviewers');
  }
};

  return (
    <div className="organization-container">
      {/* Left Card: Organizations List */}
      <div className="organization-card org-list">
        <h2 className="organization-title">My Organizations</h2>

        {/* Admin Organizations */}
        <div className="role-section">
          <div className="role-header" onClick={() => toggleSection('admin')}>
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
              {adminOrgs.length === 0 && <li className="no-orgs">No admin roles</li>}
            </ul>
          )}
        </div>

        {/* Reviewer Organizations */}
        <div className="role-section">
          <div className="role-header" onClick={() => toggleSection('reviewer')}>
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
              {reviewerOrgs.length === 0 && <li className="no-orgs">No reviewer roles</li>}
            </ul>
          )}
        </div>

        {/* Member Organizations */}
        <div className="role-section">
          <div className="role-header" onClick={() => toggleSection('member')}>
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
              {memberOrgs.length === 0 && <li className="no-orgs">No member roles</li>}
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
                      {/* Pending Invitations */}
                      <h4 className="section-title">Pending Requestss</h4>
                      <ul className="requests-list">
                        {selectedOrg.pendingRequests?.map((request) => (
                          <li key={request.email} className="request-item">
                            <span>{request.email}</span>
                            <span>{request.role}</span>
                            <div className="request-actions">
                              <button
                                className="small-action accept"
                                onClick={() => handleInvitationAction(request.email, 'accept')}
                              >
                                Accept
                              </button>
                              <button
                                className="small-action reject"
                                onClick={() => handleInvitationAction(request.email, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          </li>
                        ))}
                        {selectedOrg.pendingRequests?.length === 0 && (
                          <li className="no-invites">No pending invitations</li>
                        )}
                      </ul>

                      {/* Invite Users */}
                      <h4 className="section-title">Invite Users</h4>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleInviteUsers();
                        }}
                      >
                        <div className="form-group">
                          <label htmlFor="inviteEmails">Enter Emails (comma-separated)</label>
                          <textarea
                            id="inviteEmails"
                            value={inviteEmails}
                            onChange={(e) => setInviteEmails(e.target.value)}
                            placeholder="e.g., user1@example.com, user2@example.com"
                            required
                          />
                        </div>
                        <button type="submit" className="action-button">
                          Send Invitations
                        </button>
                      </form>
                    </div>
                  )}
                  {managementTab === 'members' && (
                    <div className="members-tab">
                      <h4 className="section-title">Organization Members</h4>
                      {loadingMembers ? (
                        <p>Loading members...</p>
                      ) : (
                        <ul className="members-list">
                          {members.map((member) => (
                            <li key={member.id} className="member-item">
                              <span>{member.name} ({member.email})</span>
                              <span className="member-role">
                                Role: 
                                <select
                                  value={member.role}
                                  onChange={(e) => handleRoleUpdate(member.id, e.target.value)}
                                  disabled={member.id === selectedOrg.admin} // Disable role change for the current admin
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Member">Member</option>
                                </select>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {managementTab === 'assign' && (
                    <div className="assign-tab">
                      <h4 className="section-title">Assign Reviewers</h4>
                      {loadingFiles ? (
                        <p>Loading files...</p>
                      ) : (
                        <ul className="files-list">
                          {files.map((file) => (
                            <li key={file._id} className="file-item">
                              <div className="file-header">
                                <span className="file-name">{file.filename}</span>
                                <span className="file-deadline">
                                  {file.deadline ? new Date(file.deadline).toLocaleDateString() : 'No deadline'}
                                </span>
                              </div>
                              <div className="file-footer">
                                <span className="file-tags">Tags: {file.tags.join(', ')}</span>
                                <span className="file-status">
                                  Status: {file.reviewers.length === 0 ? 'Not Assigned' : 'Assigned'}
                                </span>
                                <button
                                  className="assign-button"
                                  onClick={() => setSelectedFile(file)}
                                >
                                  Assign
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Reviewer Selection Modal */}
                      {selectedFile && (
                        <div className="reviewer-modal">
                          <div className="modal-content">
                            <h4>Select Reviewers for {selectedFile.filename}</h4>
                            <ul className="reviewers-list">
                              {members.map((member) => (
                                <li key={member.id} className="reviewer-item">
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={selectedReviewers[selectedFile._id]?.includes(member.id) || false}
                                      onChange={() => handleReviewerSelection(selectedFile._id, member.id)}
                                    />
                                    {member.name} ({member.email})
                                  </label>
                                </li>
                              ))}
                            </ul>
                            <div className="modal-actions">
                              <button
                                className="action-button"
                                onClick={() => handleAssignReviewers(selectedFile._id)}
                              >
                                Assign Reviewers
                              </button>
                              <button
                                className="cancel-button"
                                onClick={() => setSelectedFile(null)}
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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