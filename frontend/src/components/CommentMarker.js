import { useState } from 'react';
import './CommentMarker.css';

const CommentMarker = ({ comment, position, scale, onDelete, onUpdate, readOnly=false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(comment.text);

  const handleIconClick = (e) => {
    e.stopPropagation();
    if (!readOnly && !comment.text) {
      setIsEditing(true);
    }
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
    if (!readOnly) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (readOnly) return;
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
        {isEditing && !readOnly ? (
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
            onClick={readOnly ? null : handleContentClick}
          >
            <p>{comment.text || 'Click to add comment'}</p>
            {!readOnly && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentMarker;