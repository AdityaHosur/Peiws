import React, { useState } from 'react';
import './view.css';

const View = () => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('v1');
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([
    { id: 1, version: 'v1', text: 'Improve the introduction.', status: 'pending' },
    { id: 2, version: 'v1', text: 'Fix grammar in section 2.', status: 'pending' },
    { id: 3, version: 'v2', text: 'Add more examples in section 3.', status: 'pending' },
  ]);

  // Sample document list
  const documents = [
    { id: 1, title: 'Research Paper', status: 'Reviewed' },
    { id: 2, title: 'Technical Report', status: 'Reviewed' },
    { id: 3, title: 'Case Study', status: 'Reviewed' },
    { id: 4, title: 'Academic Essay', status: 'Reviewed' },
    { id: 5, title: 'Project Proposal', status: 'Reviewed' },
  ];

  const handleVersionChange = (e) => {
    setSelectedVersion(e.target.value);
  };

  const handleFeedbackAction = (id, action) => {
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === id ? { ...comment, status: action } : comment
      )
    );
  };

  return (
    <div className="view-container">
      {/* Left Card: Documents List */}
      <div className="view-card docs-list">
        <h2 className="view-title">Reviewed Documents</h2>
        <ul className="documents-list">
          {documents.map((doc) => (
            <li 
              key={doc.id} 
              className={`document-item ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
              onClick={() => setSelectedDoc(doc)}
            >
              <span className="document-title">{doc.title}</span>
              <span className="document-status">{doc.status}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Card: Content Area */}
      <div className="view-card content-area">
        {/* Segmented Button */}
        <div className="segmented-control">
          <button 
            className={`segment-button ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
          <button 
            className={`segment-button ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            Compare Versions
          </button>
        </div>

        {/* Content Display */}
        <div className="tab-content">
          {activeTab === 'comments' && (
            <div className="comments-section">
              <h3 className="content-title">
                {selectedDoc ? `Comments for ${selectedDoc.title}` : 'Select a document to view comments'}
              </h3>
              <div className="form-group">
                <label htmlFor="version">Select Version</label>
                <select id="version" value={selectedVersion} onChange={handleVersionChange}>
                  <option value="v1">Version 1</option>
                  <option value="v2">Version 2</option>
                </select>
              </div>
              <ul className="comment-list">
                {comments
                  .filter((comment) => comment.version === selectedVersion)
                  .map((comment) => (
                    <li key={comment.id} className="comment-item">
                      <p>{comment.text}</p>
                      <div className="comment-actions">
                        <button
                          className="accept-button"
                          onClick={() => handleFeedbackAction(comment.id, 'accepted')}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-button"
                          onClick={() => handleFeedbackAction(comment.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                      <span className={`status ${comment.status}`}>{comment.status}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="compare-section">
              <h3 className="content-title">
                {selectedDoc ? `Compare Versions for ${selectedDoc.title}` : 'Select a document to compare versions'}
              </h3>
              <div className="versions-container">
                <div className="version">
                  <h3>Version 1</h3>
                  <p>This is the content of Version 1.</p>
                </div>
                <div className="version">
                  <h3>Version 2</h3>
                  <p>This is the content of Version 2 with additional examples.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default View;