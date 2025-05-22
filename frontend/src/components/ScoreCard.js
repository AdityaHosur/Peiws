import React, { useState, useEffect } from 'react';
import './ScoreCard.css';

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

  // Load existing scores if provided
  useEffect(() => {
    if (existingScores) {
      setScores(existingScores.scores || scores);
      setFeedback(existingScores.feedback || '');
      setSummary(existingScores.summary || '');
    }else {
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
  }, [existingScores, documentId]);

  const handleScoreChange = (category, value) => {
    setScores(prev => ({
      ...prev,
      [category]: parseInt(value, 10)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      documentId,
      reviewId,
      scores,
      feedback,
      summary,
      timestamp: Date.now()
    });
    onClose();
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
            <div className="score-item">
              <label htmlFor="structure">Structure:</label>
              <div className="score-input">
                <input
                  type="range"
                  id="structure"
                  min="1"
                  max="5"
                  value={scores.structure}
                  onChange={(e) => handleScoreChange('structure', e.target.value)}
                />
                <span className="score-value">{scores.structure}</span>
              </div>
            </div>
            
            <div className="score-item">
              <label htmlFor="grammar">Grammar:</label>
              <div className="score-input">
                <input
                  type="range"
                  id="grammar"
                  min="1"
                  max="5"
                  value={scores.grammar}
                  onChange={(e) => handleScoreChange('grammar', e.target.value)}
                />
                <span className="score-value">{scores.grammar}</span>
              </div>
            </div>
            
            <div className="score-item">
              <label htmlFor="clarity">Clarity:</label>
              <div className="score-input">
                <input
                  type="range"
                  id="clarity"
                  min="1"
                  max="5"
                  value={scores.clarity}
                  onChange={(e) => handleScoreChange('clarity', e.target.value)}
                />
                <span className="score-value">{scores.clarity}</span>
              </div>
            </div>
            
            <div className="score-item">
              <label htmlFor="content">Content:</label>
              <div className="score-input">
                <input
                  type="range"
                  id="content"
                  min="1"
                  max="5"
                  value={scores.content}
                  onChange={(e) => handleScoreChange('content', e.target.value)}
                />
                <span className="score-value">{scores.content}</span>
              </div>
            </div>
            
            <div className="score-item">
              <label htmlFor="overall">Overall:</label>
              <div className="score-input">
                <input
                  type="range"
                  id="overall"
                  min="1"
                  max="5"
                  value={scores.overall}
                  onChange={(e) => handleScoreChange('overall', e.target.value)}
                />
                <span className="score-value">{scores.overall}</span>
              </div>
            </div>
          </div>
          
          <div className="feedback-section">
            <h3>Detailed Feedback</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback on the document..."
              rows={6}
            />
          </div>
          
          <div className="summary-section">
            <h3>Summary</h3>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide a summary of your evaluation..."
              rows={3}
            />
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