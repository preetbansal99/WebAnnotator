import type { Highlight, HighlightColor } from '../types';
import { deserializeRange, getTextNodes } from './rangeSerializer';

const HIGHLIGHT_DATA_ATTRIBUTE = 'data-highlight-id';
const HIGHLIGHT_CLASS_PREFIX = 'highlight-';

/**
 * Generate a unique ID for highlights
 */
export function generateId(): string {
  return `hl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Apply a highlight to the DOM by wrapping text nodes in spans
 */
export function applyHighlight(range: Range, highlight: Highlight): void {
  const spans: HTMLSpanElement[] = [];

  const createSpan = () => {
    const span = document.createElement('span');
    span.className = `${HIGHLIGHT_CLASS_PREFIX}${highlight.color}`;
    span.setAttribute(HIGHLIGHT_DATA_ATTRIBUTE, highlight.id);
    return span;
  };

  try {
    // Attempt simple surroundContents first (fastest for simple text selections)
    const span = createSpan();
    range.surroundContents(span);
    spans.push(span);
  } catch (e) {
    // Fallback: cross-element selection. Walk text nodes and wrap individually.
    const walker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    const nodesToWrap: { node: Text, start: number, end: number }[] = [];

    while ((node = walker.nextNode())) {
      if (range.intersectsNode(node)) {
        let start = 0;
        let end = node.textContent?.length || 0;

        if (node === range.startContainer) start = range.startOffset;
        if (node === range.endContainer) end = range.endOffset;

        if (start < end) {
          nodesToWrap.push({ node: node as Text, start, end });
        }
      }
    }

    // Wrap backwards to preserve node references during DOM mutations
    for (let i = nodesToWrap.length - 1; i >= 0; i--) {
      const { node, start, end } = nodesToWrap[i];
      const text = node.textContent || '';
      const before = text.substring(0, start);
      const middle = text.substring(start, end);
      const after = text.substring(end);

      const fragment = document.createDocumentFragment();
      if (before) fragment.appendChild(document.createTextNode(before));

      const span = createSpan();
      span.textContent = middle;
      fragment.appendChild(span);
      spans.push(span); // First pushed is the VISUALLY LAST node!

      if (after) fragment.appendChild(document.createTextNode(after));

      node.parentNode?.replaceChild(fragment, node);
    }
  }

  // Add note icon to the LAST visual span
  if (highlight.note && spans.length > 0) {
    const lastSpan = spans[0]; // Either the only span, or the last one wrapped
    lastSpan.classList.add('has-note');

    const icon = document.createElement('span');
    icon.className = 'note-icon';
    icon.textContent = ' 💬';
    icon.title = highlight.note;
    icon.style.userSelect = 'none';
    icon.style.cursor = 'pointer';
    lastSpan.appendChild(icon);
  }
}

/**
 * Remove a highlight from the DOM
 */
export function removeHighlight(highlightId: string): void {
  const elements = document.querySelectorAll(`[${HIGHLIGHT_DATA_ATTRIBUTE}="${highlightId}"]`);

  elements.forEach(element => {
    const parent = element.parentNode;
    if (parent) {
      while (element.firstChild) {
        if ((element.firstChild as Element).className === 'note-icon') {
          element.removeChild(element.firstChild);
          continue;
        }
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      parent.normalize();
    }
  });
}

/**
 * Remove all highlights from the page
 */
export function clearAllHighlights(): void {
  const elements = document.querySelectorAll(`[${HIGHLIGHT_DATA_ATTRIBUTE}]`);
  elements.forEach(element => {
    const id = element.getAttribute(HIGHLIGHT_DATA_ATTRIBUTE);
    if (id) removeHighlight(id);
  });
}

/**
 * Restore highlights for the current page
 * @param highlights Array of highlights to restore
 * @param clearFirst If true, removes all existing highlights before restoring
 */
export function restoreHighlights(highlights: Highlight[], clearFirst: boolean = true): void {
  if (clearFirst) {
    clearAllHighlights();
  }

  let successCount = 0;
  let failCount = 0;

  // Filter out highlights that are already in the DOM if we didn't clear
  const toRestore = clearFirst
    ? highlights
    : highlights.filter(h => !document.querySelector(`[${HIGHLIGHT_DATA_ATTRIBUTE}="${h.id}"]`));

  // Pre-fetch text nodes once to massively speed up bulk deserialization
  const textNodes = toRestore.length > 0 ? getTextNodes(document.body) : [];

  // Apply each highlight
  toRestore.forEach(highlight => {
    try {
      const range = deserializeRange(highlight.range, document.body, textNodes);
      if (range) {
        applyHighlight(range, highlight);
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      failCount++;
    }
  });
}

/**
 * Update the note indicator on a highlight
 */
export function updateHighlightNote(highlightId: string, note?: string): void {
  const elements = document.querySelectorAll(`[${HIGHLIGHT_DATA_ATTRIBUTE}="${highlightId}"]`);

  elements.forEach(element => {
    element.classList.remove('has-note');
    const childIcons = element.querySelectorAll('.note-icon');
    childIcons.forEach(icon => icon.remove());
  });

  if (elements.length > 0 && note) {
    const lastSpan = elements[elements.length - 1];
    lastSpan.classList.add('has-note');
    const icon = document.createElement('span');
    icon.className = 'note-icon';
    icon.textContent = ' 💬';
    icon.title = note;
    icon.style.userSelect = 'none';
    icon.style.cursor = 'pointer';
    lastSpan.appendChild(icon);
  }
}

/**
 * Get the highlight ID from a DOM element (if it's a highlight)
 */
export function getHighlightId(element: Element): string | null {
  return element.getAttribute(HIGHLIGHT_DATA_ATTRIBUTE);
}
