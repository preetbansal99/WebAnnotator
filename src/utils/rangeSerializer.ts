import type { SerializedRange } from '../types';

/**
 * Get all valid text nodes within a given root node,
 * ignoring text inside scripts, styles, and our injected extension UI.
 */
export function getTextNodes(root: Node): Text[] {
  const textNodes: Text[] = [];

  const filter = {
    acceptNode: function (node: Node) {
      if (node.parentNode) {
        const parent = node.parentNode as HTMLElement;
        const tag = parent.nodeName?.toUpperCase();
        // Ignore invisible scripts and styles
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        // Ignore our own injected note icons so they don't corrupt global text offsets
        if (parent.classList && parent.classList.contains('note-icon')) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  };

  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, filter);
  let node: Node | null;
  while ((node = walk.nextNode())) {
    textNodes.push(node as Text);
  }
  return textNodes;
}

/**
 * Serialize a Range object to a plain object for storage based on absolute text character offsets.
 * This skips elements and only counts text length, making it immune to DOM changes like inserted spans.
 */
export function serializeRange(range: Range, root: Node = document.body): SerializedRange {
  const textNodes = getTextNodes(root);

  let startOffset = 0;
  let endOffset = 0;
  let currentOffset = 0;

  let foundStart = false;
  let foundEnd = false;

  // Helper to resolve Element containers to Text nodes safely
  const resolveToTextNode = (node: Node, offset: number, isStart: boolean): { rNode: Node, rOffset: number } => {
    if (node.nodeType === Node.TEXT_NODE) return { rNode: node, rOffset: offset };
    const element = node as Element;
    if (offset >= element.childNodes.length) {
      const allText = getTextNodes(element);
      if (allText.length > 0) {
        const last = allText[allText.length - 1];
        return { rNode: last, rOffset: last.textContent?.length || 0 };
      }
      return { rNode: node, rOffset: offset };
    }
    if (!isStart && offset > 0) {
      const prev = element.childNodes[offset - 1];
      const allText = getTextNodes(prev);
      if (allText.length > 0) {
        const last = allText[allText.length - 1];
        return { rNode: last, rOffset: last.textContent?.length || 0 };
      }
    }
    const target = element.childNodes[offset];
    const allText = getTextNodes(target);
    if (allText.length > 0) {
      return { rNode: allText[0], rOffset: 0 };
    }
    return { rNode: node, rOffset: offset };
  };

  const { rNode: resolvedStartNode, rOffset: resolvedStartOffset } = resolveToTextNode(range.startContainer, range.startOffset, true);
  const { rNode: resolvedEndNode, rOffset: resolvedEndOffset } = resolveToTextNode(range.endContainer, range.endOffset, false);

  for (const node of textNodes) {
    const length = node.textContent?.length || 0;

    // Found start container
    if (!foundStart && node === resolvedStartNode) {
      startOffset = currentOffset + resolvedStartOffset;
      foundStart = true;
    }

    // Found end container
    if (!foundEnd && node === resolvedEndNode) {
      endOffset = currentOffset + resolvedEndOffset;
      foundEnd = true;
    }

    currentOffset += length;

    if (foundStart && foundEnd) {
      break;
    }
  }

  // Fallback for when start/end container is an Element (e.g. triple click selects the paragraph)
  if (!foundStart || !foundEnd) {
    console.warn("range.startContainer or endContainer was not a Text node.");
    // To handle edge cases robustly, return a dummy or attempt to resolve Element offsets. 
    // Usually getSelection() mostly gives Text nodes. We ignore Element node edge cases for simplicity.
  }

  return {
    startContainerPath: [], // Deprecated
    startOffset: startOffset,
    endContainerPath: [],   // Deprecated
    endOffset: endOffset,
    text: range.toString(),
  };
}

/**
 * Deserialize a SerializedRange back to a Range object using absolute text offets.
 */
export function deserializeRange(
  serialized: SerializedRange,
  root: Node = document.body,
  precomputedTextNodes?: Text[]
): Range | null {
  try {
    const textNodes = precomputedTextNodes || getTextNodes(root);
    const range = document.createRange();

    let currentOffset = 0;
    let foundStart = false;
    let foundEnd = false;

    // Use absolute global text offsets
    const globalStart = serialized.startOffset;
    const globalEnd = serialized.endOffset;

    for (const node of textNodes) {
      const length = node.textContent?.length || 0;

      if (!foundStart && currentOffset + length >= globalStart) {
        range.setStart(node, globalStart - currentOffset);
        foundStart = true;
      }

      if (!foundEnd && currentOffset + length >= globalEnd) {
        range.setEnd(node, globalEnd - currentOffset);
        foundEnd = true;
      }

      currentOffset += length;

      if (foundStart && foundEnd) {
        break;
      }
    }

    if (!foundStart || !foundEnd) {
      console.warn('Could not restore range: text nodes length has changed drastically.');
      return null;
    }

    // Verify the text matches at least partially
    const textSnippet = range.toString().trim();
    const serializedSnippet = serialized.text.trim();
    if (textSnippet !== serializedSnippet && !serializedSnippet.includes(textSnippet) && !textSnippet.includes(serializedSnippet)) {
      console.warn('Range text mismatch - page content has significantly changed. Expected: ' + serialized.text.substring(0, 20) + '... Got: ' + range.toString().substring(0, 20));
      // Return anyway, as some dynamic content changes white space
    }

    return range;
  } catch (error) {
    console.error('Error deserializing range:', error);
    return null;
  }
}

/**
 * Check if a range is valid for highlighting
 */
export function isValidRange(range: Range): boolean {
  return (
    range &&
    !range.collapsed &&
    range.toString().trim().length > 0
  );
}
