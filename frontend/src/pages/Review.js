import React, { useState } from 'react';
import './review.css';

const Review = () => {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('view');
  const [comments, setComments] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [rubric, setRubric] = useState({
    clarity: 0,
    grammar: 0,
    structure: 0,
  });
  const [summary, setSummary] = useState('');

  // Sample document list
  const documents = [
    { id: 1, title: 'Research Paper', status: 'Pending Review' },
    { id: 2, title: 'Technical Report', status: 'In Progress' },
    { id: 3, title: 'Case Study', status: 'Not Started' },
    { id: 4, title: 'Academic Essay', status: 'Pending Review' },
    { id: 5, title: 'Project Proposal', status: 'In Progress' },
  ];

  const handleAddComment = (e) => {
    e.preventDefault();
    const newComment = e.target.elements.comment.value;
    if (newComment) {
      setComments([...comments, newComment]);
      e.target.elements.comment.value = '';
    }
  };

  const handleRubricChange = (e) => {
    const { name, value } = e.target;
    setRubric({ ...rubric, [name]: parseInt(value) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Feedback:', feedback);
    console.log('Rubric:', rubric);
    console.log('Summary:', summary);
  };

  return (
    <div className="review-container">
      {/* Left Card: Documents List */}
      <div className="review-card docs-list">
        <h2 className="review-title">Documents to Review</h2>
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
      <div className="review-card content-area">
        {/* Segmented Button */}
        <div className="segmented-control">
          <button 
            className={`segment-button ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            View
          </button>
          <button 
            className={`segment-button ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback
          </button>
        </div>

        {/* Content Display */}
        <div className="tab-content">
          {activeTab === 'view' && (
            <div className="document-viewer">
              <h3 className="content-title">
                {selectedDoc ? selectedDoc.title : 'Select a document to view'}
              </h3>
              <p>
                This is a sample document. Click on any part of the text to add an inline comment.
              </p>
              <form className="comment-form" onSubmit={handleAddComment}>
                <input
                  type="text"
                  name="comment"
                  placeholder="Add an inline comment"
                  required
                />
                <button type="submit" className="comment-button">
                  Add Comment
                </button>
              </form>
              <ul className="comment-list">
                {comments.map((comment, index) => (
                  <li key={index} className="comment-item">
                    {comment}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h3 className="content-title">
                {selectedDoc ? `Feedback for ${selectedDoc.title}` : 'Select a document to review'}
              </h3>
              <form className="review-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="feedback">Add Feedback/Comments</label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Write your feedback here"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rate with Rubric</label>
                  <div className="rubric-group">
                    <label>
                      Clarity:
                      <input
                        type="number"
                        name="clarity"
                        value={rubric.clarity}
                        onChange={handleRubricChange}
                        min="0"
                        max="5"
                        required
                      />
                    </label>
                    <label>
                      Grammar:
                      <input
                        type="number"
                        name="grammar"
                        value={rubric.grammar}
                        onChange={handleRubricChange}
                        min="0"
                        max="5"
                        required
                      />
                    </label>
                    <label>
                      Structure:
                      <input
                        type="number"
                        name="structure"
                        value={rubric.structure}
                        onChange={handleRubricChange}
                        min="0"
                        max="5"
                        required
                      />
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="summary">Submit Summary</label>
                  <textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Write a summary of your review"
                    required
                  />
                </div>
                <button type="submit" className="review-button">
                  Submit Review
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;