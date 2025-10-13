// content.js

const CONTAINER_ID = 'anki-clipper-container';
const TOOLBAR_ID = 'anki-selection-toolbar';

// --- Main UI Management --- //

// Listen for messages from the background script to toggle the main UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_ui') {
    toggleUI();
  }
});

function toggleUI() {
  const existingUI = document.getElementById(CONTAINER_ID);
  if (existingUI) {
    existingUI.remove();
    removeToolbar(); // Also remove toolbar when main UI is closed
  } else {
    createUI();
  }
}

async function createUI() {
  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  try {
    const uiHtmlUrl = chrome.runtime.getURL('floating-ui.html');
    const response = await fetch(uiHtmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch UI content: ${response.statusText}`);
    }
    container.innerHTML = await response.text();
    document.body.appendChild(container);
  } catch (error) {
    console.error('Anki Clipper Error:', error);
  }
}

// --- Selection Toolbar Management --- //

function removeToolbar() {
  const existingToolbar = document.getElementById(TOOLBAR_ID);
  if (existingToolbar) {
    existingToolbar.remove();
  }
}

// Show toolbar on text selection
document.addEventListener('mouseup', (event) => {
  // Only show toolbar if the main UI is active
  if (!document.getElementById(CONTAINER_ID)) {
    return;
  }

  // Use a timeout to allow the selection to be finalized
  setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    removeToolbar(); // Remove any existing toolbar first

    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      const toolbar = document.createElement('div');
      toolbar.id = TOOLBAR_ID;

      const btn1 = document.createElement('button');
      btn1.className = 'anki-toolbar-btn';
      btn1.textContent = 'Q';
      btn1.title = 'Add to Question'; // Tooltip

      const btn2 = document.createElement('button');
      btn2.className = 'anki-toolbar-btn';
      btn2.textContent = 'A';
      btn2.title = 'Add to Answer'; // Tooltip

      toolbar.appendChild(btn1);
      toolbar.appendChild(btn2);

      // --- Toolbar Positioning Logic ---
      // Append temporarily to calculate height, but keep it invisible
      toolbar.style.visibility = 'hidden';
      document.body.appendChild(toolbar);
      const toolbarHeight = toolbar.offsetHeight;
      document.body.removeChild(toolbar); // Remove it before final placement
      toolbar.style.visibility = 'visible';

      const spaceAbove = rect.top;
      const margin = 10; // Margin from the selection

      let topPosition;

      // Decide whether to place the toolbar above or below the selection
      if (spaceAbove > toolbarHeight + margin) {
        // Prefer to place it above
        topPosition = window.scrollY + rect.top - toolbarHeight - margin;
      } else {
        // Otherwise, place it below
        topPosition = window.scrollY + rect.bottom + margin;
      }

      toolbar.style.top = `${topPosition}px`;
      toolbar.style.left = `${window.scrollX + rect.left}px`;

      document.body.appendChild(toolbar);
    }
  }, 10); // A small delay can help prevent race conditions
});

// Hide toolbar when clicking elsewhere
document.addEventListener('mousedown', (event) => {
  const toolbar = document.getElementById(TOOLBAR_ID);
  if (toolbar && !toolbar.contains(event.target)) {
    const selection = window.getSelection();
    if (selection.isCollapsed) {
        removeToolbar();
    }
  }
});