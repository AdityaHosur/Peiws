import React from 'react';
import HighlightTool from './HighlightTool';
import TextMarkupTool from './TextMarkupTool';
import DrawingTool from './DrawingTool';
import './Toolbar.css';

const Toolbar = ({ onHighlight, onMarkup }) => {
  return (
    <div className="toolbar">
      <HighlightTool onHighlight={onHighlight} />
      <TextMarkupTool onMarkup={onMarkup} />
      <DrawingTool />
    </div>
  );
};

export default Toolbar;