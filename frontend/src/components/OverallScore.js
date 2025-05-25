import React, { useState } from 'react';
import './OverallScore.css';

const OverallScore = ({ reviews, documentTitle }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const scoreCategories = [
    { key: 'structure', label: 'Structure', icon: '📝' },
    { key: 'grammar', label: 'Grammar', icon: '🔤' },
    { key: 'clarity', label: 'Clarity', icon: '💡' },
    { key: 'content', label: 'Content', icon: '📚' },
    { key: 'overall', label: 'Overall', icon: '⭐' }
  ];

  if (!reviews || reviews.length === 0) {
    return (
      <div className="no-reviews-message">
        <div className="empty-state-icon">📊</div>
        <p>No reviews available for this document yet.</p>
        <p className="sub-message">Assign reviewers to see evaluation scores.</p>
      </div>
    );
  }

  // Handle card click to show detailed view
  const toggleCategoryExpand = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className="overall-score-section">
      <h3 className="content-title">Overall Evaluation for {documentTitle}</h3>
      
      <div className="evaluation-summary">
        <h4>Combined Scores from All Reviewers</h4>
        <div className="scores-container">
          <h5>Scores</h5>
          <div className="score-visual-grid">
            {scoreCategories.map(({ key, label, icon }) => {
              const scores = reviews
                .map(review => Number(review.scores?.[key] || 0))
                .filter(score => score > 0);
              
              const average = scores.length 
                ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) 
                : 0;

              const color = average <= 2 ? 'var(--error-light)' : 
                          average <= 3 ? 'var(--warning-light)' : 
                          average <= 4 ? 'var(--success-light)' : 
                          'var(--accent-light)';
              
              return (
                <div 
                  key={key} 
                  className="score-card"
                  onClick={() => toggleCategoryExpand(key)}
                >
                  <div className="score-card-header">
                    <span className="score-icon">{icon}</span>
                    <span className="score-label">{label}</span>
                  </div>
                  <div className="score-value-display">{average}/5</div>
                  <div className="score-bar-container">
                    <div 
                      className="score-bar"
                      data-score={Math.round(average)}
                      style={{
                        width: `${(average / 5) * 100}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                  <div className="click-hint">Click for details</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed breakdowns */}
        <div className="review-text-container">
          <div className="review-summary">
            <h5><span className="review-icon">📋</span> Summary Feedback</h5>
            <div className="review-content-box">
              {reviews.some(review => review.scores?.summary) ? (
                reviews
                  .filter(review => review.scores?.summary)
                  .map((review, index) => (
                    <div key={index} className="feedback-item">
                      <div className="reviewer-label">Reviewer {index + 1}</div>
                      <p>{review.scores.summary}</p>
                    </div>
                  ))
              ) : (
                <p className="no-feedback">No summary feedback provided yet.</p>
              )}
            </div>
          </div>

          <div className="review-feedback">
            <h5><span className="review-icon">💬</span> Detailed Feedback</h5>
            <div className="review-content-box">
              {reviews.some(review => review.scores?.feedback) ? (
                reviews
                  .filter(review => review.scores?.feedback)
                  .map((review, index) => (
                    <div key={index} className="feedback-item">
                      <div className="reviewer-label">Reviewer {index + 1}</div>
                      <p>{review.scores.feedback}</p>
                    </div>
                  ))
              ) : (
                <p className="no-feedback">No detailed feedback provided yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution Popup */}
      {expandedCategory && (
        <div className="score-detail-overlay" onClick={(e) => {
          if (e.target.classList.contains('score-detail-overlay')) {
            setExpandedCategory(null);
          }
        }}>
          <div className="score-detail-popup">
            <button className="close-popup" onClick={() => setExpandedCategory(null)}>×</button>
            <h3>{expandedCategory.charAt(0).toUpperCase() + expandedCategory.slice(1)} Score Distribution</h3>
            
            <div className="score-detail-content">
              {(() => {
                const scores = reviews
                  .map(review => Number(review.scores?.[expandedCategory] || 0))
                  .filter(score => score > 0);
                
                const average = scores.length 
                  ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) 
                  : 0;

                return (
                  <>
                    <div className="average-score-display">
                      <div className="big-score">{average}</div>
                      <div className="out-of">out of 5</div>
                      <div className="reviewer-count">
                        Based on {scores.length} reviewer{scores.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <div className="score-distribution-detail">
                      <h4>Distribution</h4>
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
                                  backgroundColor: value <= 2 ? 'var(--error-light)' : 
                                                value === 3 ? 'var(--warning-light)' : 
                                                value === 4 ? 'var(--success-light)' : 
                                                'var(--accent-light)'
                                }}
                              />
                              <span className="distribution-percentage">{percentage}%</span>
                              <span className="distribution-count">({count})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverallScore;