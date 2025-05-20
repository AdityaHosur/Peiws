import React, { useState } from 'react';
import './HighlightTool.css';

const HighlightTool = ({ onHighlight }) => {
  const [selectedColor, setSelectedColor] = useState('#ffff00'); // Default yellow

  const handleHighlight = () => {
    if (onHighlight) {
      onHighlight(selectedColor);
    }
  };

  return (
    <div className="highlight-tool">
      <label htmlFor="highlight-color">Highlight Color:</label>
      <input
        type="color"
        id="highlight-color"
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
      />
      <button onClick={handleHighlight} className="highlight-button">
        Highlight
      </button>
    </div>
  );
};

export default HighlightTool;