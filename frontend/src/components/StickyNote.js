import React, { useState, useRef } from 'react';
import './StickyNote.css';

const StickyNote = ({ note, scale, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(note.text);
  const noteRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (!isEditing) {
      setIsDragging(true);
      const rect = noteRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      const container = noteRef.current.parentElement;
      const rect = container.getBoundingClientRect();
      const newX = ((e.clientX - rect.left) / scale) - (dragOffset.current.x / scale);
      const newY = ((e.clientY - rect.top) / scale) - (dragOffset.current.y / scale);
      
      onUpdate({
        ...note,
        position: { x: newX, y: newY }
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSave = () => {
    onUpdate({
      ...note,
      text: editedText
    });
    setIsEditing(false);
  };

  return (
    <div
      ref={noteRef}
      className={`sticky-note ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${note.position.x * scale}px`,
        top: `${note.position.y * scale}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="sticky-header">
        <span>📝</span>
        <button onClick={() => onDelete(note.id)}>×</button>
      </div>
      {isEditing ? (
        <div className="sticky-edit">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="sticky-actions">
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div 
          className="sticky-content" 
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {note.text || 'Click to add text'}
        </div>
      )}
    </div>
  );
};

export default StickyNote;