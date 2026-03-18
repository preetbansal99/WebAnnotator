import type { ToolbarPosition } from '../types';

/**
 * Get the current text selection
 */
export function getSelection(): Selection | null {
  return window.getSelection();
}

/**
 * Get the first range from the current selection
 */
export function getSelectionRange(): Range | null {
  const selection = getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  return selection.getRangeAt(0);
}

/**
 * Calculate the optimal position for the toolbar above the selection
 */
export function calculateToolbarPosition(range: Range): ToolbarPosition {
  const rect = range.getBoundingClientRect();

  return {
    top: rect.top + window.scrollY,
    left: rect.left + rect.width / 2 + window.scrollX,
  };
}

/**
 * Clear the current selection
 */
export function clearSelection(): void {
  const selection = getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}

/**
 * Check if the selection is valid for highlighting
 */
export function isValidSelection(selection: Selection | null): boolean {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return false;
  }

  // Check if selection is within our extension UI
  const range = selection.getRangeAt(0);
  if (isExtensionUI(range.commonAncestorContainer)) {
    return false;
  }

  const text = selection.toString().trim();
  return text.length > 0;
}

/**
 * Check if a node is part of our extension's UI (to avoid highlighting our own UI)
 */
export function isExtensionUI(node: Node | null): boolean {
  if (!node) return false;

  let current: Node | null = node;
  while (current) {
    if (current instanceof Element) {
      // Check for our extension's root or shadow root
      if (
        current.id === 'web-annotator-root' ||
        current.getAttribute('data-web-annotator') === 'true'
      ) {
        return true;
      }
    }
    current = current.parentNode;
  }

  return false;
}
