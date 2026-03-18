import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HighlightOverlay } from './HighlightOverlay';
import { NoteModal } from './NoteModal';
import { useStorage } from '../hooks/useStorage';
import type { HighlightColor, ToolbarPosition, Highlight } from '../types';
import {
  getSelectionRange,
  calculateToolbarPosition,
  clearSelection,
  isValidSelection,
  getSelection,
} from '../utils/selection';
import {
  serializeRange,
} from '../utils/rangeSerializer';
import {
  applyHighlight,
  generateId,
  restoreHighlights,
} from '../utils/highlighter';

/**
 * Main App component for the Web Annotator
 * Manages selection detection, toolbar display, and highlight creation
 */
export function App() {
  const url = window.location.href;
  const { highlights, saveHighlight, deleteHighlight, isLoading } = useStorage(url);

  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingHighlight, setPendingHighlight] = useState<Highlight | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const savedRangeRef = useRef<Range | null>(null);

  // Restore highlights when they're loaded
  useEffect(() => {
    if (!isLoading && highlights.length > 0) {
      // Pass false to avoid clearing all highlights on initial hydration cycle dynamically
      restoreHighlights(highlights, false);
    }
  }, [highlights, isLoading]);

  // Handle note icon clicks globally
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.classList && target.classList.contains('note-icon')) {
        e.preventDefault();
        e.stopPropagation();
        const noteText = target.getAttribute('title');
        if (noteText) {
          showToast(`Note: ${noteText}`);
        }
      }
    };

    // The highlights are in the main document, not our shadow DOM
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Monitor DOM changes and re-apply highlights (with debouncing, missing only)
  useEffect(() => {
    let timeoutId: number;
    let observer: MutationObserver | null = null;

    const setupObserver = () => {
      if (observer) observer.disconnect();
      observer = new MutationObserver(() => {
        if (isLoading || highlights.length === 0) return;

        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          try {
            // Disconnect momentarily to avoid infinite mutation loops from our own DOM injection
            if (observer) observer.disconnect();
            restoreHighlights(highlights, false);
          } finally {
            if (observer) {
              observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
              });
            }
          }
        }, 500);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    };

    setupObserver();

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [highlights, isLoading]);

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    const selection = getSelection();
    if (!isValidSelection(selection)) {
      setToolbarPosition(null);
      setSelectedRange(null);
      return;
    }

    const range = getSelectionRange();
    if (!range) return;

    setToolbarPosition(calculateToolbarPosition(range));
    setSelectedRange(range.cloneRange());
  }, []);

  // Set up selection listener
  useEffect(() => {
    let timeoutId: number;
    const debouncedSelectionChange = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleSelectionChange, 150);
    };

    document.addEventListener('selectionchange', debouncedSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', debouncedSelectionChange);
      clearTimeout(timeoutId);
    };
  }, [handleSelectionChange]);

  // Recalculate toolbar position on scroll or resize
  useEffect(() => {
    const handleScrollOrResize = () => {
      if (selectedRange) {
        setToolbarPosition(calculateToolbarPosition(selectedRange));
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [selectedRange]);

  // Handle color selection
  const handleColorSelect = useCallback(async (color: HighlightColor) => {
    if (!selectedRange) return;

    const rangeCopy = selectedRange.cloneRange();
    const highlight: Highlight = {
      id: generateId(),
      url,
      color,
      range: serializeRange(rangeCopy),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      applyHighlight(rangeCopy, highlight);
      await saveHighlight(highlight);
      clearSelection();
      setToolbarPosition(null);
      setSelectedRange(null);
    } catch (error) {
      console.error('Error creating highlight:', error);
      showToast('Failed to create highlight.');
    }
  }, [selectedRange, url, saveHighlight, showToast]);

  // Handle "Add Note" button
  const handleAddNote = useCallback(() => {
    if (!selectedRange) return;

    savedRangeRef.current = selectedRange.cloneRange();

    const highlight: Highlight = {
      id: generateId(),
      url,
      color: 'light-yellow' as HighlightColor, // Default color for notes changed to light-yellow
      range: serializeRange(selectedRange),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setPendingHighlight(highlight);
    setShowNoteModal(true);
    setToolbarPosition(null);
  }, [selectedRange, url]);

  // Handle note save
  const handleNoteSave = useCallback(async (note: string) => {
    const rangeCopy = savedRangeRef.current?.cloneRange();
    if (!pendingHighlight || !rangeCopy) return;

    const highlightWithNote: Highlight = {
      ...pendingHighlight,
      note,
    };

    try {
      applyHighlight(rangeCopy, highlightWithNote);
      await saveHighlight(highlightWithNote);
      clearSelection();
      setShowNoteModal(false);
      setPendingHighlight(null);
      setSelectedRange(null);
      savedRangeRef.current = null;
    } catch (error) {
      console.error('Error creating highlight with note:', error);
      showToast('Failed to save note.');
    }
  }, [pendingHighlight, saveHighlight, showToast]);

  const handleNoteCancel = useCallback(() => {
    setShowNoteModal(false);
    setPendingHighlight(null);
    clearSelection();
    setSelectedRange(null);
  }, []);

  const handleToolbarClose = useCallback(() => {
    setToolbarPosition(null);
  }, []);

  // Export Highlights function
  const handleExport = useCallback(() => {
    if (highlights.length === 0) {
      showToast("No highlights to export");
      return;
    }

    const dt = new Date().toLocaleString();
    let content = `Highlights for ${url}\nExported: ${dt}\n\n`;

    highlights.forEach((h, i) => {
      content += `--- [Highlight ${i + 1}] (${h.color}) ---\n`;
      content += `"${h.range.text}"\n`;
      if (h.note) {
        content += `\nComment: ${h.note}\n`;
      }
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `webannotator-export-${document.title || 'page'}.txt`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    showToast(`Exported ${highlights.length} highlights.`);
  }, [highlights, url, showToast]);

  const handleClearAll = useCallback(async () => {
    if (confirm('Delete all highlights on this page?')) {
      for (const h of highlights) {
        await deleteHighlight(h.id);
      }
      showToast('All highlights cleared.');
    }
  }, [highlights, deleteHighlight, showToast]);

  return (
    <>
      {toolbarPosition && (
        <HighlightOverlay
          position={toolbarPosition}
          onColorSelect={handleColorSelect}
          onAddNote={handleAddNote}
          onClose={handleToolbarClose}
        />
      )}

      {showNoteModal && (
        <NoteModal
          onSave={handleNoteSave}
          onCancel={handleNoteCancel}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[999999] bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl font-medium text-sm animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Action Buttons */}
      {highlights.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-3">
          <button
            onClick={handleClearAll}
            title="Clear all highlights"
            className="px-5 py-3 bg-white text-red-600 border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors duration-150 text-sm font-semibold flex items-center justify-center shadow-md"
          >
            Clear All
          </button>
          <button
            onClick={handleExport}
            title="Export current page's highlights to a text file"
            className="px-5 py-3 bg-white text-gray-800 border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-colors duration-150 text-sm font-semibold flex items-center gap-2 shadow-md"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export ({highlights.length})
          </button>
        </div>
      )}
    </>
  );
}
