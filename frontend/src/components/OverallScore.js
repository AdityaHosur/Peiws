import React, { useState } from 'react';
import './OverallScore.css';

const OverallScore = ({ reviews, documentTitle }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews-message">
        <div className="empty-state-icon">📊</div>
        <p>No reviews available for this document yet.</p>
        <p className="sub-message">Assign reviewers to see evaluation scores.</p>
      </div>
    );
  }

  // Handle card click to expand/collapse detail view
  const toggleCategoryExpand = (category) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
    }
  };

  // Close popup when clicking outside
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('score-detail-overlay')) {
      setExpandedCategory(null);
    }
  };

  return (
    <div className="overall-score-section">
      <h3 className="content-title">
        Overall Evaluation for {documentTitle}
      </h3>
      
      <div className="combined-scores">
        {/* Score cards in visual grid layout */}
        <div className="score-visual-grid">
          {['structure', 'grammar', 'clarity', 'content', 'overall'].map(category => {
            // Calculate average score for this category
            const scores = reviews.map(review => 
              Number(review.scores?.[category] || 0)
            ).filter(score => score > 0);
              
            const average = scores.length 
              ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) 
              : 0;
              
            // Determine color based on average score
            const color = average <= 2 ? '#ff5252' : average <= 3 ? '#ffca28' : average <= 4 ? '#66bb6a' : '#42a5f5';
              
            // Get icon for category
            const icon = category === 'structure' ? '📝' : 
              category === 'grammar' ? '🔤' : 
              category === 'clarity' ? '💡' : 
              category === 'content' ? '📚' : '⭐';
                
            return (
              <div key={category} 
                className="score-card" 
                onClick={() => toggleCategoryExpand(category)}
              >
                <div className="score-card-header">
                  <span className="score-icon">{icon}</span>
                  <span className="score-label">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </div>
                <div className="score-value-display">{average}/5</div>
                <div className="score-bar-container">
                  <div 
                    className="score-bar" 
                    style={{
                      width: `${(average / 5) * 100}%`,
                      backgroundColor: color
                    }}
                  ></div>
                </div>
                <div className="score-card-footer">
                  <div className="click-hint">Click for details</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Score details popup */}
        {expandedCategory && (
          <div className="score-detail-overlay" onClick={handleOverlayClick}>
            <div className="score-detail-popup">
              <button className="close-popup" onClick={() => setExpandedCategory(null)}>×</button>
              <h3>{expandedCategory.charAt(0).toUpperCase() + expandedCategory.slice(1)} Score Breakdown</h3>
              
              {(() => {
                const scores = reviews.map(review => 
                  Number(review.scores?.[expandedCategory] || 0)
                ).filter(score => score > 0);
                
                const average = scores.length 
                  ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) 
                  : 0;

                return (
                  <div className="score-detail-content">
                    <div className="average-score-display">
                      <div className="big-score">{average}</div>
                      <div className="out-of">out of 5</div>
                      <div className="reviewer-count">
                        Based on {scores.length} reviewer{scores.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="score-distribution-detail">
                      <h4>Score Distribution</h4>
                      
                      {[5, 4, 3, 2, 1].map(value => {
                        const count = scores.filter(score => Math.round(score) === value).length;
                        const percentage = scores.length ? Math.round((count / scores.length) * 100) : 0;
                        
                        return (
                          <div key={value} className="distribution-bar-item">
                            <div className="distribution-label">{value} star{value !== 1 ? 's' : ''}</div>
                            <div className="distribution-detail-bar-container">
                              <div 
                                className="distribution-detail-bar" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: 
                                    value <= 2 ? '#ff5252' : 
                                    value <= 3 ? '#ffca28' : 
                                    value <= 4 ? '#66bb6a' : '#42a5f5'
                                }}
                              ></div>
                              <span className="distribution-percentage">{percentage}%</span>
                              <span className="distribution-count">({count})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Overall Summaries Section */}
        <div className="overall-feedback">
          <h4>Overall Summaries</h4>
          <div className="feedback-summary">
            {reviews.some(review => review.scores?.summary) ? (
              <ul className="feedback-points">
                {reviews
                  .filter(review => review.scores?.summary)
                  .map((review, index) => (
                    <li key={index} className="feedback-point">
                      <div className="reviewer-label">Reviewer {index + 1}</div>
                      <p>{review.scores.summary}</p>
                    </li>
                  ))
                }
              </ul>
            ) : (
              <p className="no-feedback">No summary feedback provided yet.</p>
            )}
          </div>
        </div>
        
        {/* Detailed Feedback Section */}
        <div className="overall-feedback">
          <h4>Detailed Feedback</h4>
          <div className="feedback-summary">
            {reviews.some(review => review.scores?.feedback) ? (
              <ul className="feedback-points">
                {reviews
                  .filter(review => review.scores?.feedback)
                  .map((review, index) => (
                    <li key={index} className="feedback-point">
                      <div className="reviewer-label">Reviewer {index + 1}</div>
                      <p>{review.scores.feedback}</p>
                    </li>
                  ))
                }
              </ul>
            ) : (
              <p className="no-feedback">No detailed feedback provided yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallScore;