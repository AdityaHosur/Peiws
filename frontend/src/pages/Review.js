import React, { useState, useEffect } from 'react';
import { getAssignedReviews, getFileStreamUrl } from '../services/api';
import DocViewer from '../components/DocViewer';
import { useToast } from '../components/ToastContext'; // Import the toast hook
import './review.css';

const Review = () => {
  const [assignedReviews, setAssignedReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token'); // Retrieve token from localStorage
  const { showToast } = useToast(); // Use the toast hook

  // Fetch assigned reviews on component mount
  useEffect(() => {
    const fetchAssignedReviews = async () => {
      setLoading(true);
      try {
        const data = await getAssignedReviews(token);
        const validReviews = data.filter(review => 
          review && review.fileId && review.fileId.filename
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
          {assignedReviews.map((review) => (
            <li
              key={review._id}
              className={`document-item ${selectedReview?._id === review._id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedReview(review);
                showToast(`Viewing: ${review.fileId.filename}`, 'info');
              }}
            >
              <span className="document-title">{review.fileId.filename}</span>
              <span className="document-tags">
                Tags: {review.fileId.tags && review.fileId.tags.length > 0 
                  ? review.fileId.tags.join(', ') 
                  : 'None'}
              </span>
              <span className="document-deadline">
                Deadline: {review.fileId.deadline ? new Date(review.fileId.deadline).toLocaleDateString() : 'No deadline'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Card: Review Details */}
      <div className="review-card content-area">
        {selectedReview ? (
          <div>
            <h3 className="content-title">Review: {selectedReview.fileId.filename}</h3>
            <p className="document-info">
              <span className="info-label">Deadline:</span> 
              {selectedReview.fileId.deadline 
                ? new Date(selectedReview.fileId.deadline).toLocaleDateString() 
                : 'No deadline'}
            </p>
            <DocViewer 
              fileUrl={getFileStreamUrl(selectedReview.fileId.fileId)} 
              reviewId={selectedReview._id} 
            />
          </div>
        ) : (
          <p>Select a document to view details</p>
        )}
      </div>
    </div>
  );
};

export default Review;