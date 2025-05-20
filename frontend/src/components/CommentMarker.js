import React, { useState } from 'react';
import './CommentMarker.css';

const CommentMarker = ({ comment, position, scale, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);

  const handleIconClick = (e) => {
    e.stopPropagation();
    if (!comment.text) {
      setIsEditing(true);
    }
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate({ ...comment, text: editedText });
    setIsEditing(false);
  };

  return (
    <div 
      className={`comment-marker ${isEditing ? 'editing' : ''}`}
      style={{
        left: `${position.left * scale}px`,
        top: `${position.top * scale}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
    >
      <div className="comment-icon" onClick={handleIconClick}>💭</div>
      <div className="comment-popup" onClick={e => e.stopPropagation()}>
        {isEditing ? (
          <div className="comment-edit">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              autoFocus
              placeholder="Add your comment here..."
            />
            <div className="comment-actions">
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div 
            className="comment-content"
            onClick={handleContentClick} // Add click handler here
          >
            <p>{comment.text || 'Click to add comment'}</p>
            <div className="comment-actions">
              <button onClick={(e) => {
                e.stopPropagation(); // Prevent content click handler
                setIsEditing(true);
              }}>Edit</button>
              <button onClick={(e) => {
                e.stopPropagation(); // Prevent content click handler
                onDelete(comment.id);
              }}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentMarker;