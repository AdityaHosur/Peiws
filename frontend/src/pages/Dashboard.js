import React, { useState, useEffect } from 'react';
import { getUserUploads, getAssignedReviews, getOrganizations } from '../services/api';
import { useToast } from '../components/ToastContext';
import './dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [userUploads, setUserUploads] = useState([]);
  const [reviewedDocs, setReviewedDocs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Always fetch uploads and reviews for both tabs
        const uploads = await getUserUploads(token);
        setUserUploads(uploads || []);
        
        const reviews = await getAssignedReviews(token);
        // Filter for completed reviews only
        const completedReviews = reviews ? reviews.filter(review => review.status === 'completed') : [];
        setReviewedDocs(completedReviews);
        
        if (activeTab === 'stats') {
          const orgs = await getOrganizations(token);
          setOrganizations(orgs?.organizations || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, showToast]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate stats
  const stats = {
    totalUploaded: userUploads.length,
    totalReviewed: reviewedDocs.length,
    totalOrganizations: organizations.length,
    pendingReviews: userUploads.filter(doc => 
      doc.reviewers?.length > 0 && doc.status !== 'completed'
    ).length,
    adminOrgs: organizations.filter(org => org.role === 'Admin').length,
    memberOrgs: organizations.filter(org => org.role === 'Member').length
  };

  return (
    <div className="dashboard-container">
      {/* Single card with integrated segmented buttons */}
      <div className="dashboard-card">
        {/* Segmented control directly in card */}
        <div className="segmented-control">
          <button
            className={`segment-button ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button
            className={`segment-button ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {loading ? (
            <p className="loading-message">Loading dashboard data...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : (
            <>
              {/* Stats Tab - Three cards per row */}
              {activeTab === 'stats' && (
                <>
                  <h2 className="dashboard-title">Your Statistics</h2>
                  <div className="stats-container">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-icon">📄</span>
                        <span className="stat-value">{stats.totalUploaded}</span>
                        <span className="stat-label">Uploads</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">✅</span>
                        <span className="stat-value">{stats.totalReviewed}</span>
                        <span className="stat-label">Reviews</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">🔄</span>
                        <span className="stat-value">{stats.pendingReviews}</span>
                        <span className="stat-label">Pending</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">🏢</span>
                        <span className="stat-value">{stats.totalOrganizations}</span>
                        <span className="stat-label">Organizations</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">👑</span>
                        <span className="stat-value">{stats.adminOrgs}</span>
                        <span className="stat-label">Admin Roles</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-icon">👤</span>
                        <span className="stat-value">{stats.memberOrgs}</span>
                        <span className="stat-label">Member Roles</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Files Tab - Uploaded and Reviewed side by side */}
              {activeTab === 'files' && (
                <>
                  <h2 className="dashboard-title">Your Files</h2>
                  <div className="files-container">
                    <div className="files-columns">
                      {/* Uploaded Files Column */}
                      <div className="files-column">
                        <h3 className="column-title">Uploaded Documents</h3>
                        <div className="column-content">
                          {userUploads.length === 0 ? (
                            <p className="empty-message">You haven't uploaded any documents yet.</p>
                          ) : (
                            <ul className="dashboard-list">
                              {userUploads.map((doc) => (
                                <li 
                                  key={doc._id || doc.id} 
                                  className={`document-item status-${(doc.status || 'draft').toLowerCase()}`}
                                >
                                  <div className="document-row">
                                    <div className="document-info">
                                      <span className="document-title">{doc.filename || doc.title}</span>
                                      <span className="document-date">Uploaded: {formatDate(doc.uploadedAt || doc.uploadDate)}</span>
                                    </div>
                                    <div className="document-right">
                                      <span className="document-version">V{doc.version || '1'}</span>
                                      <span className="document-meta">Reviewers: {doc.reviewers?.length || 0}</span>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Reviewed Files Column */}
                      <div className="files-column">
                        <h3 className="column-title">Reviewed Documents</h3>
                        <div className="column-content">
                          {reviewedDocs.length === 0 ? (
                            <p className="empty-message">You haven't completed any reviews yet.</p>
                          ) : (
                            <ul className="dashboard-list">
                              {reviewedDocs.map((review) => (
                                <li key={review._id} className="document-item status-completed">
                                  <div className="document-row">
                                    <div className="document-info">
                                      <span className="document-title">
                                        {review.fileId?.filename || 'Unknown Document'}
                                      </span>
                                      <span className="document-date">Completed: {formatDate(review.lastModified)}</span>
                                    </div>
                                    <div className="document-right">
                                      <span className="document-status status-completed">Completed</span>
                                      {review.scores?.overall && (
                                        <span className="document-meta">Score: {review.scores.overall}/5</span>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;