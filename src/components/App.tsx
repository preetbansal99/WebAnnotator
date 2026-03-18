import { useState, useEffect, useCallback, useRef } from 'react';
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
  removeHighlight,
  clearAllHighlights as clearDomHighlights,
} from '../utils/highlighter';

const COLOR_MAP: Record<string, string> = {
  'light-yellow': '#fef08a',
  'light-green': '#86efac',
  'light-blue': '#93c5fd',
  'light-pink': '#f9a8d4',
  'light-purple': '#d8b4fe',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Main App component for the Web Annotator
 * Manages selection detection, toolbar display, and highlight creation
 */
export function App() {
  const url = window.location.href;
  const { highlights, saveHighlight, deleteHighlight, clearAllHighlights: clearAllStorageHighlights, isLoading } = useStorage(url);

  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingHighlight, setPendingHighlight] = useState<Highlight | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  // Handle note icon clicks globally and Alt+Click to delete highlights
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Delete highlight on Alt+Click
      if (e.altKey && target && target.tagName === 'SPAN' && target.hasAttribute('data-highlight-id')) {
        e.preventDefault();
        e.stopPropagation();
        const highlightId = target.getAttribute('data-highlight-id');
        if (highlightId && confirm('Delete this highlight?')) {
          deleteHighlight(highlightId);
          removeHighlight(highlightId);
          showToast('Highlight deleted.');
        }
        return;
      }

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
  }, [deleteHighlight, showToast]);

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

  const handleExportHTML = useCallback(() => {
    if (highlights.length === 0) {
      showToast('No highlights to export');
      return;
    }

    const dt = new Date().toLocaleString();
    const pageTitle = document.title || 'Page';

    const cardRows = highlights.map((h, i) => {
      const bg = COLOR_MAP[h.color] || '#fef08a';
      const text = escapeHtml(h.range.text);
      const colorLabel = h.color.replace('light-', '').toUpperCase();
      const created = new Date(h.createdAt).toLocaleString();
      const noteRow = h.note
        ? '<div class="note"><span class="note-icon">&#x1F4AC;</span> ' + escapeHtml(h.note) + '</div>'
        : '';

      return (
        '<div class="card" style="border-left: 5px solid ' + bg + ';">' +
          '<div class="chip" style="background:' + bg + ';">' + colorLabel + '</div>' +
          '<blockquote>&#8220;' + text + '&#8221;</blockquote>' +
          noteRow +
          '<div class="meta">#' + (i + 1) + ' &nbsp;&middot;&nbsp; ' + created + '</div>' +
        '</div>'
      );
    });

    const htmlParts = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>Highlights - ' + escapeHtml(pageTitle) + '</title>',
      '<style>',
      '* { box-sizing: border-box; margin: 0; padding: 0; }',
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8f9fa; color: #1f2937; padding: 2rem; }',
      'header { max-width: 720px; margin: 0 auto 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e5e7eb; }',
      'header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: .4rem; }',
      'header p { font-size: .875rem; color: #6b7280; margin-top: .3rem; }',
      'header a { color: #2563eb; text-decoration: none; word-break: break-all; }',
      'header a:hover { text-decoration: underline; }',
      '.cards { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }',
      '.card { background: #fff; border-radius: .75rem; padding: 1.25rem 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }',
      '.chip { display: inline-block; font-size: .65rem; font-weight: 700; letter-spacing: .05em; padding: .15rem .6rem; border-radius: 999px; margin-bottom: .75rem; }',
      'blockquote { font-size: 1rem; line-height: 1.7; color: #111827; font-style: italic; border: none; }',
      '.note { font-size: .875rem; color: #374151; background: #f3f4f6; border-radius: .5rem; padding: .6rem .75rem; margin-top: .75rem; }',
      '.note-icon { margin-right: .35rem; }',
      '.meta { font-size: .75rem; color: #9ca3af; margin-top: .75rem; }',
      '</style>',
      '</head>',
      '<body>',
      '<header>',
      '<h1>&#x1F4CC; ' + escapeHtml(pageTitle) + '</h1>',
      '<p>Exported: ' + dt + ' &nbsp;&middot;&nbsp; ' + highlights.length + ' highlight' + (highlights.length !== 1 ? 's' : '') + '</p>',
      '<p>Source: <a href="' + url + '">' + escapeHtml(url) + '</a></p>',
      '</header>',
      '<div class="cards">',
      cardRows.join('\n'),
      '</div>',
      '</body>',
      '</html>',
    ];

    const html = htmlParts.join('\n');
    const safeTitle = pageTitle.replace(/[\\/:*?"<>|]/g, '_').substring(0, 60);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'highlights-' + safeTitle + '.html';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    setShowExportMenu(false);
    showToast('Exported ' + highlights.length + ' highlights as HTML');
  }, [highlights, url, showToast]);

  const handleExportText = useCallback(() => {
    if (highlights.length === 0) {
      showToast('No highlights to export');
      return;
    }

    const pageTitle = document.title || 'Page';
    const dt = new Date().toLocaleString();

    const lines: string[] = [
      'HIGHLIGHTS — ' + pageTitle,
      '='.repeat(60),
      'Exported: ' + dt,
      'Source:   ' + url,
      '='.repeat(60),
      '',
    ];

    highlights.forEach((h, i) => {
      lines.push('#' + (i + 1) + ' [' + h.color.replace('light-', '').toUpperCase() + ']');
      lines.push('"' + h.range.text + '"');
      if (h.note) {
        lines.push('  Note: ' + h.note);
      }
      lines.push('  Saved: ' + new Date(h.createdAt).toLocaleString());
      lines.push('');
    });

    const text = lines.join('\n');
    const safeTitle = pageTitle.replace(/[\\/:*?"<>|]/g, '_').substring(0, 60);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'highlights-' + safeTitle + '.txt';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    setShowExportMenu(false);
    showToast('Exported ' + highlights.length + ' highlights as TXT');
  }, [highlights, url, showToast]);

  useEffect(() => {
    if (!showExportMenu) return;
    const close = () => setShowExportMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showExportMenu]);

  const handleClearAll = useCallback(async () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000); // Reset after 3 seconds
      return;
    }

    try {
      await clearAllStorageHighlights();
      clearDomHighlights();
      showToast('All highlights cleared.');
      setIsConfirmingClear(false);
    } catch (error) {
      showToast('Failed to clear highlights.');
    }
  }, [clearAllStorageHighlights, showToast, isConfirmingClear]);

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
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[999999] bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl font-medium text-sm animate-fadeIn pointer-events-auto">
          {toastMessage}
        </div>
      )}

      {/* Action Buttons */}
      {highlights.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-auto">
          <button
            onClick={handleClearAll}
            title={isConfirmingClear ? "Click again to confirm" : "Clear all highlights"}
            className={`px-5 py-3 ${isConfirmingClear ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-red-600 hover:bg-red-50'} border border-gray-200 rounded-full shadow-lg transition-colors duration-200 text-sm font-semibold flex items-center justify-center`}
          >
            {isConfirmingClear ? 'Are you sure?' : 'Clear All'}
          </button>
          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExportMenu(prev => !prev);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '9999px',
                background: '#2563eb', color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600,
                boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
              }}
            >
              &#x2193; Export ({highlights.length})
            </button>

            {showExportMenu && (
              <div style={{
                position: 'absolute', bottom: '110%', right: 0,
                background: '#fff', borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                overflow: 'hidden', minWidth: '200px',
                border: '1px solid #e5e7eb',
                marginBottom: '8px',
              }}>
                {/* Option 1 — Styled HTML report */}
                <button
                  onClick={handleExportHTML}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '12px 16px', background: 'none',
                    border: 'none', cursor: 'pointer',
                    fontSize: '13px', color: '#111827',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontWeight: 600 }}>&#x1F5C3; Styled HTML Report</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    Opens in browser · includes colors &amp; notes
                  </div>
                </button>

                {/* Option 2 — Plain text */}
                <button
                  onClick={handleExportText}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '12px 16px', background: 'none',
                    border: 'none', cursor: 'pointer',
                    fontSize: '13px', color: '#111827',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontWeight: 600 }}>&#x1F4DD; Plain Text (.txt)</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                    Simple list · highlighted text &amp; notes only
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
