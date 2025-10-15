// main.js (Main Entry Point)

import { toggleUI } from './modules/ui.js';
import { showToolbar, removeToolbar, appendSelectedTextToField } from './modules/toolbar.js';
import { processImage } from './modules/image.js';

// --- Module-level state ---
let capturedImage = { url: null, base64: null };
let hotkeySettings = {
  question: { altKey: true, key: 'Q' }, // Default Alt+Q
  answer: { altKey: true, key: 'A' }  // Default Alt+A
};

// --- Global Event Listeners ---

// Listen for a custom event from the content script to toggle the main UI
window.addEventListener('toggle_anki_clipper_ui', async (event) => {
  if (event.detail && event.detail.htmlUrl) {
    const uiContainer = await toggleUI(event.detail.htmlUrl);
    // If UI was just created, attach event listeners and request settings
    if (uiContainer) {
      attachUIEventListeners(uiContainer);
      window.dispatchEvent(new CustomEvent('anki_request_settings'));
    }
  }
});

// Listen for settings sent from the content script bridge
window.addEventListener('anki_receive_settings', (event) => {
  if (event.detail) {
    hotkeySettings.question = parseHotkeyString(event.detail.questionHotkey);
    hotkeySettings.answer = parseHotkeyString(event.detail.answerHotkey);
  }
});

// Listen for keyboard events for hotkeys
document.addEventListener('keydown', (e) => {
  // Ignore hotkeys if typing in an input, textarea, or contenteditable element
  const target = e.target;
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    return;
  }
  // Ignore if no text is selected or if the clipper is closed
  if (window.getSelection().isCollapsed || !document.getElementById('anki-clipper-container')) {
    return;
  }

  const checkHotkey = (setting) => {
    // Get the physical key code, removing prefixes like 'Key' or 'Digit'
    const code = e.code.startsWith('Key') ? e.code.substring(3) :
      e.code.startsWith('Digit') ? e.code.substring(5) :
        e.code;

    return e.altKey === (setting.altKey || false) &&
      e.ctrlKey === (setting.ctrlKey || false) &&
      e.shiftKey === (setting.shiftKey || false) &&
      e.metaKey === (setting.metaKey || false) && // Check for Cmd/Win key
      code.toUpperCase() === setting.key.toUpperCase();
  };

  if (checkHotkey(hotkeySettings.question)) {
    e.preventDefault();
    appendSelectedTextToField('anki-question-field');
  } else if (checkHotkey(hotkeySettings.answer)) {
    e.preventDefault();
    appendSelectedTextToField('anki-answer-field');
  }
});

// Listen for response from the content script bridge (global listener)
window.addEventListener('anki_add_note_response', (event) => {
  const statusMsgSpan = document.getElementById('anki-status-msg');
  const submitBtn = document.getElementById('anki-submit-btn'); // Get submit button here

  if (statusMsgSpan && event.detail) {
    if (submitBtn) submitBtn.disabled = false; // Re-enable button

    if (event.detail.success) {
      statusMsgSpan.textContent = 'Card added successfully!';
      statusMsgSpan.style.color = 'green';
      // Optionally clear fields after success
      const questionField = document.getElementById('anki-question-field');
      const answerField = document.getElementById('anki-answer-field');
      if (questionField) questionField.value = '';
      if (answerField) answerField.value = '';
      // Clear image preview on success
      const imagePreviewContainer = document.getElementById('anki-image-preview-container');
      if (imagePreviewContainer) {
        const previewImage = document.getElementById('anki-image-preview');
        previewImage.src = '';
        imagePreviewContainer.style.display = 'none';
        capturedImage = { url: null, base64: null };
      }
    } else {
      statusMsgSpan.textContent = `Error: ${event.detail.error}`;
      statusMsgSpan.style.color = 'red';
    }
  }
});

// Listen for an image being selected on the page
window.addEventListener('anki_image_selected', async (event) => {
  const previewContainer = document.getElementById('anki-image-preview-container');
  const previewImage = document.getElementById('anki-image-preview');
  const statusMsgSpan = document.getElementById('anki-status-msg');

  if (previewContainer && previewImage && statusMsgSpan && event.detail.imageUrl) {
    // Reset state
    capturedImage = { url: null, base64: null };
    statusMsgSpan.textContent = 'Processing image...';
    statusMsgSpan.style.color = '#666';

    try {
      previewImage.src = event.detail.imageUrl;
      previewContainer.style.display = 'block';

      const base64 = await processImage(event.detail.imageUrl);
      capturedImage = {
        url: event.detail.imageUrl,
        base64: base64
      };
      statusMsgSpan.textContent = 'Image ready.';
      statusMsgSpan.style.color = 'green';

    } catch (error) {
      previewImage.src = '';
      previewContainer.style.display = 'none';
      statusMsgSpan.textContent = `Error: ${error.message}`;
      statusMsgSpan.style.color = 'red';
    }
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

// --- Helper Functions ---

/**
 * Parses a hotkey string (e.g., "Alt + Q") into an object for event checking.
 * @param {string} hotkeyString The string from storage.
 * @returns {object} An object with boolean keys for modifiers and the main key.
 */
function parseHotkeyString(hotkeyString) {
  const parts = hotkeyString.split(' + ');
  const setting = {};
  setting.key = parts.pop() || '';
  setting.altKey = parts.includes('Alt');
  setting.ctrlKey = parts.includes('Ctrl');
  setting.shiftKey = parts.includes('Shift');
  setting.metaKey = parts.includes('Cmd'); // Handle Cmd/Win key
  return setting;
}



/**
 * Attaches event listeners to the dynamically created UI elements.
 * @param {HTMLElement} uiContainer The root element of the Anki Clipper UI.
 */
function attachUIEventListeners(uiContainer) {
  const submitBtn = uiContainer.querySelector('#anki-submit-btn');
  const questionField = uiContainer.querySelector('#anki-question-field');
  const answerField = uiContainer.querySelector('#anki-answer-field');
  const statusMsgSpan = uiContainer.querySelector('#anki-status-msg');
  const imagePreviewContainer = uiContainer.querySelector('#anki-image-preview-container');
  const removeImageBtn = uiContainer.querySelector('#anki-remove-image-btn');

  if (removeImageBtn && imagePreviewContainer) {
    removeImageBtn.addEventListener('click', () => {
      const previewImage = uiContainer.querySelector('#anki-image-preview');
      previewImage.src = '';
      imagePreviewContainer.style.display = 'none';
      capturedImage = { url: null, base64: null }; // Clear stored image data
    });
  }

  if (submitBtn && questionField && answerField && statusMsgSpan) {
    submitBtn.addEventListener('click', () => {
      submitBtn.disabled = true; // Disable button on click

      const front = questionField.value.trim();
      const back = answerField.value.trim();

      if (!front || !back) {
        statusMsgSpan.textContent = 'Front and Back fields cannot be empty.';
        statusMsgSpan.style.color = 'red';
        return;
      }

      statusMsgSpan.textContent = 'Submitting...';
      statusMsgSpan.style.color = '#666';

      // Construct payload
      const payload = { Front: front, Back: back };
      if (capturedImage.base64) {
        payload.Picture = capturedImage.base64;
      }

      // Dispatch a custom event to the content script bridge
      window.dispatchEvent(new CustomEvent('anki_add_note', {
        detail: payload
      }));
    });
  }
}
