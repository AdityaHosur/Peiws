import React, { useState, useRef } from 'react';
import './StickyNote.css';

const StickyNote = ({ note, scale, onUpdate, onDelete, readOnly=false }) => {
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
    if (readOnly) return;
    
    onUpdate({
      ...note,
      text: editedText
    });
    setIsEditing(false);
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
    if (!readOnly) {
      setIsEditing(true);
    }
  };

  return (
    <div
      ref={noteRef}
      className={`sticky-note ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${note.position.x * scale}px`,
        top: `${note.position.y * scale}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        cursor: readOnly ? 'default' : 'move'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="sticky-header">
        <span>📝</span>
        {!readOnly && (
          <button onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}>×</button>
        )}
      </div>
      {isEditing && !readOnly ? (
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
          onClick={handleContentClick}
        >
          {note.text || 'Click to add text'}
          {!readOnly && (
            <div className="sticky-actions">
              <button onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}>Edit</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StickyNote;