import React, { useState } from 'react';
import type { HighlightColor, ToolbarPosition } from '../types';

interface HighlightOverlayProps {
  position: ToolbarPosition;
  onColorSelect: (color: HighlightColor) => void;
  onAddNote: () => void;
  onClose: () => void;
}

/**
 * Floating toolbar that appears above text selection
 * Rendered in Shadow DOM for style isolation
 */
export function HighlightOverlay({
  position,
  onColorSelect,
  onAddNote,
  onClose
}: HighlightOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleColorClick = (color: HighlightColor) => {
    onColorSelect(color);
    setIsVisible(false);
    setTimeout(onClose, 300); // Delay to allow animation
  };

  const handleNoteClick = () => {
    onAddNote();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-[9999] animate-fadeIn"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px',
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 flex items-center gap-4">
        {/* Color Selection Circles */}
        <button
          onClick={() => handleColorClick('light-yellow')}
          className="w-12 h-12 rounded-full bg-highlight-light-yellow border-4 border-gray-300 hover:border-gray-500 hover:scale-110 transition-all duration-150 cursor-pointer shadow-md"
          title="Yellow Highlight"
          aria-label="Yellow Highlight"
        />
        <button
          onClick={() => handleColorClick('light-green')}
          className="w-12 h-12 rounded-full bg-highlight-light-green border-4 border-gray-300 hover:border-gray-500 hover:scale-110 transition-all duration-150 cursor-pointer shadow-md"
          title="Green Highlight"
          aria-label="Green Highlight"
        />
        <button
          onClick={() => handleColorClick('light-blue')}
          className="w-12 h-12 rounded-full bg-highlight-light-blue border-4 border-gray-300 hover:border-gray-500 hover:scale-110 transition-all duration-150 cursor-pointer shadow-md"
          title="Blue Highlight"
          aria-label="Blue Highlight"
        />

        {/* Divider */}
        <div className="w-px h-10 bg-gray-300" />

        {/* Add Note Button */}
        <button
          onClick={handleNoteClick}
          className="px-5 py-3 text-lg font-bold text-gray-800 hover:bg-gray-200 rounded-lg transition-colors duration-150 shadow-sm border border-gray-200"
          title="Add Note"
        >
          📝 Add Note
        </button>
      </div>

      {/* Arrow pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"
        style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}
      />
    </div>
  );
}
