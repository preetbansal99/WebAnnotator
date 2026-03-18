// Core types for the Web Annotator extension

export type HighlightColor = 'light-yellow' | 'light-green' | 'light-blue' | 'light-pink' | 'light-purple';

export interface SerializedRange {
  startContainerPath: number[];
  startOffset: number;
  endContainerPath: number[];
  endOffset: number;
  text: string;
}

export interface Highlight {
  id: string;
  url: string;
  color: HighlightColor;
  range: SerializedRange;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface StorageData {
  highlights: Record<string, Highlight[]>; // Key: URL, Value: Array of highlights
}

export interface ToolbarPosition {
  top: number;
  left: number;
}
