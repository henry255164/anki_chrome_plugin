// content.js (Main Entry Point)

import { toggleUI } from './modules/ui.js';
import { showToolbar, removeToolbar } from './modules/toolbar.js';

// --- Event Listeners ---

// Listen for a custom event from the content script to toggle the main UI
window.addEventListener('toggle_anki_clipper_ui', (event) => {
  if (event.detail && event.detail.htmlUrl) {
    toggleUI(event.detail.htmlUrl);
  }
});

// Listen for text selection to show the toolbar
document.addEventListener('mouseup', (event) => {
  // Only show toolbar if the main UI is active
  if (document.getElementById('anki-clipper-container')) {
    // Small delay to let the selection finalize and avoid conflicts
    setTimeout(() => showToolbar(event), 10);
  }
});

// Listen for clicks to hide the toolbar if selection is lost
document.addEventListener('mousedown', (event) => {
  const toolbar = document.getElementById('anki-selection-toolbar');
  // Hide if clicking outside the toolbar itself
  if (toolbar && !toolbar.contains(event.target)) {
    // And if the selection has been cleared
    if (window.getSelection().isCollapsed) {
      removeToolbar();
    }
  }
});