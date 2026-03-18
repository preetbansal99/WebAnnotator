import React, { useState, useEffect, useRef } from 'react';

interface NoteModalProps {
  initialNote?: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}

/**
 * Modal for adding/editing notes on highlights
 */
export function NoteModal({ initialNote = '', onSave, onCancel }: NoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus the textarea
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim()) {
      onSave(note.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
    // Close on Escape
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center animate-fadeIn" style={{ height: '100vh', width: '100vw', margin: 0, padding: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-slideUp relative z-[1000000]">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {initialNote ? 'Edit Note' : 'Add Note'}
        </h2>

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Enter your note here..."
            autoFocus
          />

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!note.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Note
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-3">
          Tip: Press Cmd/Ctrl + Enter to save quickly
        </p>
      </div>
    </div>
  );
}
