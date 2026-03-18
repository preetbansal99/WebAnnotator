# Web Annotator

A powerful and lightweight Chrome Extension for highlighting and annotating text on any webpage.

## Features
- **Floating Toolbar**: Context-aware toolbar appears on text selection.
- **Color-coded Highlights**: Choose from yellow, green, or blue highlights to categorize information.
- **Inline Notes**: Attach text notes to your highlights.
- **Persistent Storage**: Highlights and notes are automatically saved using Chrome Storage and restored on page reload.
- **Shadow DOM Isolation**: UI components use Shadow DOM to prevent style conflicts with host pages.

## Tech Stack
- React 18 & TypeScript
- Vite & CRXJS for rapid Chrome Extension development
- Tailwind CSS

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run dev
   ```

3. **Load Extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder generated after running the dev or build script.

## Usage Guide
1. Select text on any webpage.
2. The floating toolbar appears above your selection.
3. Click a color (Yellow, Green, or Blue) to highlight the text.
4. Click "📝 Note" to add a text annotation.
5. Hover over highlights to see attached notes.

## Building for Production
```bash
npm run build
```

## Architecture Overview
- **`src/components/`**: React components managing UI and state (`App`, `HighlightOverlay`, `NoteModal`).
- **`src/hooks/`**: Custom hooks, including Chrome storage integration.
- **`src/utils/`**: Core logic for DOM manipulation, highlighting, and robust range serialization.
- **`src/content/`**: Content script entry points mounted into Shadow DOM.

---
*Web Annotator is built with performance and isolation in mind. It uses high-fidelity range serialization to ensure highlights stay accurate.*
