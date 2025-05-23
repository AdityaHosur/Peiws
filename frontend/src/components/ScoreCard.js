import React, { useState, useEffect } from 'react';
import './ScoreCard.css';

// Score descriptions for each category and value
const scoreDescriptions = {
  structure: {
    1: 'Poor organization, unclear sections',
    2: 'Basic structure, needs improvement',
    3: 'Adequate organization',
    4: 'Well-structured content',
    5: 'Excellent organization and flow'
  },
  grammar: {
    1: 'Multiple errors, difficult to read',
    2: 'Several grammatical issues',
    3: 'Few grammatical errors',
    4: 'Minor grammar issues',
    5: 'Perfect grammar and punctuation'
  },
  clarity: {
    1: 'Very unclear and confusing',
    2: 'Somewhat unclear',
    3: 'Moderately clear',
    4: 'Clear and understandable',
    5: 'Exceptionally clear and precise'
  },
  content: {
    1: 'Insufficient content',
    2: 'Basic content coverage',
    3: 'Adequate content',
    4: 'Comprehensive content',
    5: 'Excellent, thorough content'
  },
  overall: {
    1: 'Needs significant improvement',
    2: 'Below expectations',
    3: 'Meets basic requirements',
    4: 'Exceeds expectations',
    5: 'Outstanding work'
  }
};

const ScoreCard = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  documentId, 
  reviewId, 
  existingScores = null 
}) => {
  const [scores, setScores] = useState({
    structure: 0,
    grammar: 0,
    clarity: 0,
    content: 0,
    overall: 0
  });
  const [feedback, setFeedback] = useState('');
  const [summary, setSummary] = useState('');
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  // Load existing scores if provided
  useEffect(() => {
    if (existingScores) {
      setScores(existingScores.scores || scores);
      setFeedback(existingScores.feedback || '');
      setSummary(existingScores.summary || '');
    } else {
      // Reset form when no existing scores or when document changes
      setScores({
        structure: 0,
        grammar: 0,
        clarity: 0,
        content: 0,
        overall: 0
      });
      setFeedback('');
      setSummary('');
    }
    setTouched({});
    setErrors({});
  }, [existingScores, documentId]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate scores
    Object.entries(scores).forEach(([category, value]) => {
      if (value === 0) {
        newErrors[category] = `Please provide a score for ${category}`;
      }
    });
    
    // Validate feedback and summary
    if (!feedback.trim()) {
      newErrors.feedback = 'Please provide detailed feedback';
    }
    if (!summary.trim()) {
      newErrors.summary = 'Please provide a summary';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScoreChange = (category, value) => {
    setScores(prev => ({
      ...prev,
      [category]: parseInt(value, 10)
    }));
    setTouched(prev => ({
      ...prev,
      [category]: true
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        structure: parseInt(scores.structure),
        grammar: parseInt(scores.grammar),
        clarity: parseInt(scores.clarity),
        content: parseInt(scores.content),
        overall: parseInt(scores.overall),
        feedback: feedback,
        summary: summary,
        timestamp: Date.now()
      });
      onClose();
    }
  };

  const getScoreColor = (value) => {
    if (value === 0) return '#ccc';
    if (value <= 2) return '#ff4d4d';
    if (value <= 3) return '#ffd700';
    if (value <= 4) return '#4caf50';
    return '#2196f3';
  };

  if (!isOpen) return null;

  return (
    <div className="score-card-overlay">
      <div className="score-card">
        <div className="score-card-header">
          <h2>Document Evaluation</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="scoring-section">
            <h3>Scores</h3>
            {Object.entries(scores).map(([category, value]) => (
              <div key={category} className="score-item">
                <label htmlFor={category}>{category.charAt(0).toUpperCase() + category.slice(1)}:</label>
                <div className="score-input">
                  <input
                    type="range"
                    id={category}
                    min="1"
                    max="5"
                    value={value || 1}
                    onChange={(e) => handleScoreChange(category, e.target.value)}
                    style={{ '--track-color': getScoreColor(value) }}
                  />
                  <span className="score-value" style={{ color: getScoreColor(value) }}>
                    {value || '-'}
                  </span>
                </div>
                {touched[category] && value > 0 && (
                  <div className="score-description">
                    {scoreDescriptions[category][value]}
                  </div>
                )}
                {errors[category] && (
                  <div className="error-message">{errors[category]}</div>
                )}
              </div>
            ))}
          </div>
          
          <div className="feedback-section">
            <h3>Detailed Feedback</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, feedback: true }))}
              placeholder="Provide detailed feedback on the document..."
              rows={6}
              className={errors.feedback && touched.feedback ? 'error' : ''}
            />
            {errors.feedback && touched.feedback && (
              <div className="error-message">{errors.feedback}</div>
            )}
          </div>
          
          <div className="summary-section">
            <h3>Summary</h3>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, summary: true }))}
              placeholder="Provide a summary of your evaluation..."
              rows={3}
              className={errors.summary && touched.summary ? 'error' : ''}
            />
            {errors.summary && touched.summary && (
              <div className="error-message">{errors.summary}</div>
            )}
          </div>
          
          <div className="score-card-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-button">Submit Evaluation</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScoreCard;