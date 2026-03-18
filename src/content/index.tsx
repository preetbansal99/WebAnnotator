import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '../components/App';
import { shadowStyles } from '../shadowStyles';
import '../index.css';

/**
 * Content Script Entry Point
 * Mounts the React app into a Shadow DOM for style isolation
 */

// Avoid re-mounting if already initialized
if (!document.getElementById('web-annotator-root')) {
  // Create container for our React app
  const container = document.createElement('div');
  container.id = 'web-annotator-root';
  container.setAttribute('data-web-annotator', 'true');

  // Attach Shadow DOM for style isolation
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Create root element inside shadow DOM
  const shadowContainer = document.createElement('div');
  shadowContainer.id = 'shadow-root';
  shadowRoot.appendChild(shadowContainer);

  // Inject inline styles into shadow DOM
  const styleElement = document.createElement('style');
  styleElement.textContent = shadowStyles;
  shadowRoot.appendChild(styleElement);

  // Mount React app
  const root = ReactDOM.createRoot(shadowContainer);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Append to document body
  document.body.appendChild(container);
}

export { };
