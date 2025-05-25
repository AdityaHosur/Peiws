import React, { useState, useEffect } from 'react';
import { getUserUploads, getFileStreamUrl, getDocumentById, getReviewsByFileId } from '../services/api';
import DocViewer from '../components/DocViewer';
import OverallScore from '../components/OverallScore';
import NewVersionModal from '../components/NewVersionModal';
import VersionCompare from '../components/VersionCompare';
import { useToast } from '../components/ToastContext'; // Import toast hook
import './view.css';

const View = () => {
  const [userDocuments, setUserDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState('v1');
  const [activeTab, setActiveTab] = useState('preview'); // Default to preview tab
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const { showToast } = useToast(); // Use the toast hook

  // Fetch user's uploaded documents
  const fetchUserUploads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await getUserUploads(token);
      
      // Format the documents with relevant details
      const formattedDocs = data.map(doc => ({
        id: doc._id,
        title: doc.filename,
        version: doc.version,
        status: doc.status,
        uploadDate: doc.uploadedAt,
        fileId: doc.fileId,
        fileGroupId: doc.fileGroupId,
        tags: doc.tags || [],
        reviewers: doc.reviewers || []
      }));
      
      setUserDocuments(formattedDocs);
    } catch (err) {
      console.error('Error fetching uploads:', err);
      setError('Failed to load your documents');
      showToast('Failed to load your documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserUploads();
  }, []);


  // Fetch reviews for the selected document
  // Update the fetchReviews function

useEffect(() => {
  const fetchReviews = async () => {
    if (!selectedDoc) return;
    
    setReviewsLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Get the reviews and set them
      const reviews = await getReviewsByFileId(token, selectedDoc.id);
      
      // Log the reviews to check the data
      console.log('Fetched reviews:', reviews);
      
      // Set the reviews in state
      setReviews(reviews);
      
      // Set first review as selected by default
      if (reviews && reviews.length > 0) {
        setSelectedReview(reviews[0]);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      showToast('Failed to load reviews', 'error');
    } finally {
      setReviewsLoading(false);
    }
  };
  
  fetchReviews();
}, [selectedDoc]);

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

  const handleSelectReview = (review) => {
    setSelectedReview(review);
    showToast(`Viewing review from ${review.reviewerName || 'Reviewer'}`, 'info');
  };

  const handleOpenModal = async () => {
  if (!selectedDoc) return;
  
  try {
    const token = localStorage.getItem('token');
    const completeDocData = await getDocumentById(token, selectedDoc.id);
    
    const completeDoc = {
      ...selectedDoc,
      tags: completeDocData.tags || [],
      reviewers: completeDocData.reviewers || [],
      visibility: completeDocData.visibility || 'private',
      organizationName: completeDocData.organizationName || null,
      status: completeDocData.status || 'draft',
      deadline: completeDocData.deadline
    };
    setSelectedDoc(completeDoc);
    console.log("Complete document data for new version:", completeDoc);
    setIsModalOpen(true);
  } catch (error) {
    console.error('Error fetching complete document data:', error);
    showToast('Failed to load document details', 'error');
  }
};

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleVersionUploadSuccess = (newDocData) => {
    fetchUserUploads();
    // Replace alert with toast
    showToast('New version uploaded successfully!', 'success');
  };

  return (
    <div className="view-container">
      {/* Left Card: User's Uploaded Documents */}
      <div className="view-card docs-list">
        <h2 className="view-title">My Uploaded Documents</h2>
        
        {loading && <p className="loading-message">Loading documents...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && userDocuments.length === 0 && !error && (
          <p className="empty-message">You haven't uploaded any documents yet.</p>
        )}
        
        <ul className="documents-list">
          {userDocuments.map((doc) => (
            <li 
              key={doc.id} 
              className={`document-item ${selectedDoc?.id === doc.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedDoc(doc);
                showToast(`Selected document: ${doc.title}`, 'info');
              }}
            >
              <div className="document-row">
              <span className="document-title">{doc.title}</span>
              <span className="document-version">Version: {doc.version}</span>
              <span className="document-date">
                Uploaded: {new Date(doc.uploadDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
              <div className="document-row">
                <div className="document-tags">
                {doc.tags.length > 0 ? (
                  doc.tags
                    .join(',')
                    .split(',')
                    .map((tag, index) => (
                      <span key={index} className="tag">
                        {tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="no-tags">No tags</span>
                  )}
                </div>
                <div className="reviewer-count">
                  <span>Reviewers: {doc.reviewers.length}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Card: Content Area */}
      <div className="view-card content-area">
        {/* Segmented Button */}
        <div className="controls-row">
          <div className="segmented-control">
            <button 
              className={`segment-button ${activeTab === 'overall' ? 'active' : ''}`}
              onClick={() => setActiveTab('overall')}
            >
              Overall Score
            </button>
            <button 
              className={`segment-button ${activeTab === 'compare' ? 'active' : ''}`}
              onClick={() => setActiveTab('compare')}
            >
              Compare Versions
            </button>
            <button 
              className={`segment-button ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview Document
            </button>
          </div>
          {selectedDoc && (
            <div className="document-actions">
              <button 
                className="upload-version-button" 
                onClick={handleOpenModal}
              >
                Upload New Version
              </button>
            </div>
          )}
        </div>
        {/* Content Display */}
        <div className="tab-content">
          {!selectedDoc ? (
            <div className="select-document-prompt">
              <p>Select a document from the list to view details</p>
            </div>
          ) : (
            <>
              {activeTab === 'overall' && (
                <OverallScore 
                  reviews={reviews} 
                  documentTitle={selectedDoc.title} 
                />
              )}

              {activeTab === 'compare' && (
                <VersionCompare 
                  fileGroupId={selectedDoc.fileGroupId}
                  documentTitle={selectedDoc.title}
                />
              )}
              
              {activeTab === 'preview' && (
                <div className="preview-section">
                  <h3 className="content-title">
                    Preview: {selectedDoc.title}
                  </h3>
                  
                  {selectedDoc.reviewers.length > 0 ? (
                    <div className="reviews-container">
                      <div className="review-selector">
                        <label>Select Reviewer:</label>
                        <div className="reviewer-buttons">
                          {reviewsLoading ? (
                            <span className="loading-spinner">Loading reviews...</span>
                          ) : reviews.length > 0 ? (
                            reviews.map(review => (
                              <button 
                                key={review._id}
                                className={`reviewer-button ${selectedReview?._id === review._id ? 'active' : ''}`}
                                onClick={() => handleSelectReview(review)}
                              >
                                {review.reviewerName || `Reviewer #${review._id.substring(0, 4)}`}
                              </button>
                            ))
                          ) : (
                            <span className="no-reviews">No reviews available yet</span>
                          )}
                        </div>
                      </div>
                      {selectedReview ? (
                        <div className='review-content'>
                          {console.log("Review data:", selectedReview)}
                          {selectedReview.scores && (
                            <div className="evaluation-summary">
                              <h4>Reviewer Evaluation</h4>
                              <div className="scores-container">
                                <h5>Scores</h5>
                                <div className="score-visual-grid">
                                  {[
                                    { key: 'structure', label: 'Structure', icon: '📝' },
                                    { key: 'grammar', label: 'Grammar', icon: '🔤' },
                                    { key: 'clarity', label: 'Clarity', icon: '💡' },
                                    { key: 'content', label: 'Content', icon: '📚' },
                                    { key: 'overall', label: 'Overall', icon: '⭐' }
                                  ].map(({ key, label, icon }) => {
                                    const score = Number(selectedReview.scores[key] || 0);
                                    const color = score <= 2 ? '#ff5252' : score <= 3 ? '#ffca28' : score <= 4 ? '#66bb6a' : '#42a5f5';
                                    return (
                                      <div key={key} className="score-card">
                                        <div className="score-card-header">
                                          <span className="score-icon">{icon}</span>
                                          <span className="score-label">{label}</span>
                                        </div>
                                        <div className="score-value-display">{score}/5</div>
                                        <div className="score-bar-container">
                                          <div 
                                            className="score-bar" 
                                            style={{
                                              width: `${(score / 5) * 100}%`,
                                              backgroundColor: color
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              {(selectedReview.scores.summary || selectedReview.scores.feedback) && (
                                <div className="review-text-container">
                                  {selectedReview.scores.summary && (
                                    <div className="review-summary">
                                      <h5><span className="review-icon">📋</span> Summary</h5>
                                      <div className="review-content-box">
                                        <p>{selectedReview.scores.summary}</p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedReview.scores.feedback && (
                                    <div className="review-feedback">
                                      <h5><span className="review-icon">💬</span> Detailed Feedback</h5>
                                      <div className="review-content-box">
                                        <p>{selectedReview.scores.feedback}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="document-preview">
                            <DocViewer 
                              fileUrl={getFileStreamUrl(selectedDoc.fileId)} 
                              reviewId={selectedReview._id}
                              readOnly={true}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="no-selection">
                          <p>Select a reviewer to see their annotations</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="document-preview">
                      <iframe 
                        src={getFileStreamUrl(selectedDoc.fileId)}
                        title={selectedDoc.title}
                        width="100%"
                        height="600px"
                        className="pdf-preview"
                      />
                      <div className="no-reviewers-message">
                        <p>This document has no reviewers assigned.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {selectedDoc && (
        <NewVersionModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          originalDoc={selectedDoc}
          onSuccess={handleVersionUploadSuccess}
        />
      )}
    </div>
  );
};

export default View;