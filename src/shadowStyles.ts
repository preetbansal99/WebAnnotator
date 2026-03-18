/**
 * Inline styles for Shadow DOM
 * This ensures our UI works even if external CSS fails to load
 */

export const shadowStyles = `
  /* Tailwind base reset */
  * {
    box-sizing: border-box;
  }

  /* Highlight colors */
  .highlight-light-yellow, .bg-highlight-light-yellow {
    background-color: #fef08a !important;
    cursor: pointer;
  }

  .highlight-light-green, .bg-highlight-light-green {
    background-color: #86efac !important;
    cursor: pointer;
  }

  .highlight-light-blue, .bg-highlight-light-blue {
    background-color: #93c5fd !important;
    cursor: pointer;
  }

  /* Note indicator */
  .has-note::after {
    content: '📝';
    font-size: 0.75em;
    margin-left: 2px;
    vertical-align: super;
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-in;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }

  /* Utility classes for overlay */
  .fixed {
    position: fixed;
  }

  .z-9999 {
    z-index: 9999;
  }

  .z-10000 {
    z-index: 10000;
  }

  .bg-white {
    background-color: white;
  }

  .bg-black {
    background-color: black;
  }

  .bg-opacity-50 {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .rounded-full {
    border-radius: 9999px;
  }

  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .shadow-xl {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .shadow-2xl {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .shadow-md {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .border {
    border-width: 1px;
  }

  .border-2 {
    border-width: 2px;
  }

  .border-4 {
    border-width: 4px;
  }

  .border-gray-200 {
    border-color: #e5e7eb;
  }

  .border-gray-300 {
    border-color: #d1d5db;
  }

  .p-2 {
    padding: 0.5rem;
  }

  .p-4 {
    padding: 1rem;
  }

  .p-6 {
    padding: 1.5rem;
  }

  .px-3 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .px-5 {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }

  .py-1\.5 {
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
  }

  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .py-3 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .flex {
    display: flex;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-end {
    justify-content: flex-end;
  }

  .gap-2 {
    gap: 0.5rem;
  }
  
  .gap-4 {
    gap: 1rem;
  }

  .inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .w-8 {
    width: 2rem;
  }

  .w-12 {
    width: 3rem;
  }

  .h-8 {
    height: 2rem;
  }

  .h-12 {
    height: 3rem;
  }

  .w-full {
    width: 100%;
  }

  .max-w-md {
    max-width: 28rem;
  }

  .h-32 {
    height: 8rem;
  }

  .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .text-xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }
  
  .text-lg {
    font-size: 1.125rem;
    line-height: 1.75rem;
  }

  .font-medium {
    font-weight: 500;
  }

  .font-semibold {
    font-weight: 600;
  }

  .font-bold {
    font-weight: 700;
  }

  .font-semibold {
    font-weight: 600;
  }

  .text-gray-500 {
    color: #6b7280;
  }

  .text-gray-700 {
    color: #374151;
  }

  .text-gray-800 {
    color: #1f2937;
  }

  .text-white {
    color: white;
  }

  .bg-gray-100 {
    background-color: #f3f4f6;
  }

  .bg-blue-600 {
    background-color: #2563eb;
  }

  .mb-4 {
    margin-bottom: 1rem;
  }

  .mt-3 {
    margin-bottom: 0.75rem;
  }

  .mt-4 {
    margin-top: 1rem;
  }

  button {
    cursor: pointer;
    border: none;
    font-family: inherit;
  }

  button:hover {
    opacity: 0.9;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hover\:scale-110:hover {
    transform: scale(1.1);
  }

  .hover\:bg-gray-100:hover {
    background-color: #f3f4f6;
  }

  .hover\:bg-gray-200:hover {
    background-color: #e5e7eb;
  }

  .hover\:bg-blue-700:hover {
    background-color: #1d4ed8;
  }

  .hover\:border-gray-500:hover {
    border-color: #6b7280;
  }

  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  .transition-colors {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  .duration-150 {
    transition-duration: 150ms;
  }

  .resize-none {
    resize: none;
  }

  textarea {
    font-family: inherit;
  }

  textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

  .w-px {
    width: 1px;
  }

  .h-6 {
    height: 1.5rem;
  }
  
  .h-10 {
    height: 2.5rem;
  }

  .absolute {
    position: absolute;
  }

  .left-1\/2 {
    left: 50%;
  }

  .-translate-x-1\/2 {
    transform: translateX(-50%);
  }

  .-bottom-2 {
    bottom: -0.5rem;
  }
  
  .text-red-600 {
    color: #dc2626;
  }

  .outline-none {
    outline: 2px solid transparent;
    outline-offset: 2px;
  }

  .z-10 {
    z-index: 10;
  }

  .z-20 {
    z-index: 20;
  }

  .z-\[999999\] {
    z-index: 999999;
  }

  .z-\[1000000\] {
    z-index: 1000000;
  }

  .border-\[3px\] {
    border-width: 3px;
  }
  
  .hover\:bg-gray-50:hover {
    background-color: #f9fafb;
  }

  .bg-red-600 {
    background-color: #dc2626;
  }

  .hover\:bg-red-700:hover {
    background-color: #b91c1c;
  }

  .text-white {
    color: #ffffff;
  }

  .hover\:bg-red-50:hover {
    background-color: #fef2f2;
  }

  .p-3 {
    padding: 0.75rem;
  }

  .gap-3 {
    gap: 0.75rem;
  }

  .gap-1 {
    gap: 0.25rem;
  }

  .flex-col {
    flex-direction: column;
  }

  .bottom-6 {
    bottom: 1.5rem;
  }

  .right-6 {
    right: 1.5rem;
  }

  .pointer-events-auto {
    pointer-events: auto;
  }

  .border-transparent {
    border-color: transparent;
  }

  .text-gray-900 {
    color: #111827;
  }

  .disabled\:opacity-50:disabled {
    opacity: 0.5;
  }

  .disabled\:cursor-not-allowed:disabled {
    cursor: not-allowed;
  }
`;
