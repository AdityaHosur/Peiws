import React, { useState, useEffect } from 'react';
import { getAssignedReviews,getFileStreamUrl } from '../services/api';
import './review.css';

const Review = () => {
  const [assignedReviews, setAssignedReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token'); // Retrieve token from localStorage

  // Fetch assigned reviews on component mount
  useEffect(() => {
    const fetchAssignedReviews = async () => {
      try {
        const data = await getAssignedReviews(token);
        setAssignedReviews(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch assigned reviews');
      }
    };
    fetchAssignedReviews();
  }, [token]);

  return (
    <div className="review-container">
      {/* Left Card: Assigned Reviews */}
      <div className="review-card docs-list">
        <h2 className="review-title">Assigned Reviews</h2>
        {error && <p className="error-message">{error}</p>}
        <ul className="documents-list">
          {assignedReviews.map((review) => (
            <li
              key={review._id}
              className={`document-item ${selectedReview?._id === review._id ? 'selected' : ''}`}
              onClick={() => setSelectedReview(review)}
            >
              <span className="document-title">{review.fileId.filename}</span>
              <span className="document-tags">Tags: {review.fileId.tags.join(', ')}</span>
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
            {/* Display the file */}
            <iframe
              src={getFileStreamUrl(selectedReview.fileId.fileId)}
              title="File Preview"
              width="100%"
              height="430px"
              style={{ border: 'none'}}
            ></iframe>
          </div>
        ) : (
          <p>Select a document to view details</p>
        )}
      </div>
    </div>
  );
};

export default Review;