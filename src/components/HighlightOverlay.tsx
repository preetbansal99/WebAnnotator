import React, { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

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
      className="fixed z-[9999] animate-fadeIn outline-none pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px',
      }}
      tabIndex={-1}
      ref={containerRef}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setIsVisible(false);
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-3 flex items-center gap-3 relative z-20">
        {/* Color Selection Circles */}
        <button
          onClick={() => handleColorClick('light-yellow')}
          className="w-8 h-8 rounded-full bg-highlight-light-yellow border-[3px] border-gray-300 hover:border-gray-500 hover:scale-110 transition-all duration-150 cursor-pointer shadow-sm"
          title="Yellow Highlight"
          aria-label="Yellow Highlight"
        />
        <button
          onClick={() => handleColorClick('light-green')}
          className="w-8 h-8 rounded-full bg-highlight-light-green border-[3px] border-gray-300 hover:border-gray-500 hover:scale-110 transition-all duration-150 cursor-pointer shadow-sm"
          title="Green Highlight"
          aria-label="Green Highlight"
        />
        <button
          onClick={() => handleColorClick('light-blue')}
          className="w-8 h-8 rounded-full bg-highlight-light-blue border-[3px] border-gray-300 hover:border-gray-500 hover:scale-110 transition-all duration-150 cursor-pointer shadow-sm"
          title="Blue Highlight"
          aria-label="Blue Highlight"
        />

        {/* Divider */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Add Note Button */}
        <button
          onClick={handleNoteClick}
          className="px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 rounded text-center transition-colors duration-150 border border-transparent"
          title="Add Note"
        >
          📝 Add Note
        </button>
      </div>

      {/* Arrow pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white z-10"
        style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}
      />
    </div>
  );
}
