import React, { useState, useEffect } from 'react';
import { getAssignedReviews, getFileStreamUrl } from '../services/api';
import DocViewer from '../components/DocViewer';
import { useToast } from '../components/ToastContext';
import './review.css';

const Review = () => {
  const [assignedReviews, setAssignedReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const { showToast } = useToast();

  // Fetch assigned reviews on component mount
  useEffect(() => {
    const fetchAssignedReviews = async () => {
      setLoading(true);
      try {
        const data = await getAssignedReviews(token);
        const validReviews = data.filter(
          (review) => review && review.fileId && review.fileId.filename
        );

        if (validReviews.length === 0) {
          setError('No valid reviews found.');
          showToast('No valid reviews found.', 'info');
        }

        setAssignedReviews(validReviews);
      } catch (err) {
        const errorMessage = err.message || 'Failed to fetch assigned reviews';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedReviews();
  }, [token, showToast]);

  // Helper to determine deadline proximity class
  const getDeadlineClass = (deadlineDate) => {
    if (!deadlineDate) return '';

    const deadline = new Date(deadlineDate);
    const today = new Date();
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'deadline-passed';
    if (diffDays <= 2) return 'deadline-close';
    if (diffDays <= 7) return 'deadline-upcoming';
    return '';
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="review-container">
      {/* Left Card: Assigned Reviews */}
      <div className="review-card docs-list">
        <h2 className="review-title">Assigned Reviews</h2>
        {loading && <p className="loading-message">Loading reviews...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && assignedReviews.length === 0 && !error && (
          <p className="empty-message">No reviews assigned yet.</p>
        )}
        <ul className="documents-list">
          {assignedReviews.map((review) => {
            // Determine review status
            let status = review.status || 'pending';
            let tags = review.fileId.tags || [];

            return (
              <li
                key={review._id}
                className={`document-item ${
                  selectedReview?._id === review._id ? 'selected' : ''
                }`}
                onClick={() => {
                  setSelectedReview(review);
                  showToast(`Viewing: ${review.fileId.filename}`, 'info');
                }}
              >
                {/* First row: Filename and Status */}
                <div className="document-row">
                  <span className="document-title">{review.fileId.filename}</span>
                  <span
                    className={`document-status status-${status.toLowerCase()}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>

                {/* Second row: Tags and Deadline */}
                <div className="document-row">
                  <div className="document-tags">
                    <div className="tag-container">
                      {tags && tags.length > 0 ? (
                        tags.map((tag, index) => (
                          <span key={index} className="tag">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="no-tags">No tags</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`document-deadline ${getDeadlineClass(
                      review.fileId.deadline
                    )}`}
                  >
                    {formatDate(review.fileId.deadline)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right Card: Review Details */}
      <div className="review-card content-area">
        {selectedReview ? (
          <div>
            <h3 className="content-title">Review: {selectedReview.fileId.filename}</h3>
            <div className="document-info">
              <div>
                <span className="info-label">Deadline: </span>
                <span className={getDeadlineClass(selectedReview.fileId.deadline)}>
                  {formatDate(selectedReview.fileId.deadline)}
                </span>
              </div>
              <div>
                <span className={`status-${(selectedReview.status || 'pending').toLowerCase()}`}>
                  {(selectedReview.status || 'Pending').charAt(0).toUpperCase() +
                    (selectedReview.status || 'pending').slice(1)}
                </span>
              </div>
            </div>
            <DocViewer
              fileUrl={getFileStreamUrl(selectedReview.fileId.fileId)}
              reviewId={selectedReview._id}
            />
          </div>
        ) : (
          <div className="empty-selection">
            <p>Select a document from the list to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Review;