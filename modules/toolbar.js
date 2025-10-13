// modules/toolbar.js

const TOOLBAR_ID = 'anki-selection-toolbar';

/**
 * Removes the selection toolbar and stops any collision checks.
 */
export function removeToolbar() {
  const existingToolbar = document.getElementById(TOOLBAR_ID);
  if (existingToolbar) {
    existingToolbar.remove();
  }
}

/**
 * Appends the currently selected text to a specified textarea.
 * @param {string} fieldId The ID of the textarea to append to.
 */
function appendSelectedTextToField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const selectedText = window.getSelection().toString();
  if (field.value.length > 0) {
    field.value += '\n' + selectedText;
  } else {
    field.value = selectedText;
  }
  removeToolbar();
}

/**
 * Creates and displays the selection toolbar near the selected text.
 */
export function showToolbar() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  removeToolbar(); // Remove any existing toolbar first

  if (selectedText.length === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const toolbar = document.createElement('div');
  toolbar.id = TOOLBAR_ID;

  // --- Create Buttons ---
  const btnQ = document.createElement('button');
  btnQ.className = 'anki-toolbar-btn';
  btnQ.textContent = 'Q';
  btnQ.title = 'Add to Question';
  btnQ.addEventListener('click', () => appendSelectedTextToField('anki-question-field'));

  const btnA = document.createElement('button');
  btnA.className = 'anki-toolbar-btn';
  btnA.textContent = 'A';
  btnA.title = 'Add to Answer';
  btnA.addEventListener('click', () => appendSelectedTextToField('anki-answer-field'));

  toolbar.appendChild(btnQ);
  toolbar.appendChild(btnA);

  // --- Simplified Collision Check on Hover ---
  toolbar.addEventListener('mouseenter', () => {
    const gtxIcon = document.getElementById('gtx-trans');
    if (gtxIcon) {
      const myRect = toolbar.getBoundingClientRect();
      const gtxRect = gtxIcon.getBoundingClientRect();
      const intersects = !(myRect.right < gtxRect.left || myRect.left > gtxRect.right || myRect.bottom < gtxRect.top || myRect.top > gtxRect.bottom);

      if (intersects) {
        const currentLeft = parseFloat(toolbar.style.left || 0);
        // Check if moving left would go off-screen (using a 10px safety margin)
        if (myRect.left - 30 > 10) {
          toolbar.style.left = `${currentLeft - 30}px`;
        } else {
          // If it would, move right instead
          toolbar.style.left = `${currentLeft + 60}px`;
        }
      }
    }
  }, { once: false });

  // --- Initial Positioning ---
  positionToolbar(toolbar, rect);
}

/**
 * Calculates and sets the initial position of the toolbar: always above and centered.
 */
function positionToolbar(toolbar, rect) {
  toolbar.style.visibility = 'hidden';
  document.body.appendChild(toolbar);
  const toolbarHeight = toolbar.offsetHeight;
  const toolbarWidth = toolbar.offsetWidth;
  document.body.removeChild(toolbar);
  toolbar.style.visibility = 'visible';

  const margin = 10;
  const topPosition = window.scrollY + rect.top - toolbarHeight - margin;
  let leftPosition = window.scrollX + rect.left + (rect.width / 2) - (toolbarWidth / 2);

  // Clamp left position to stay within viewport
  if (leftPosition < window.scrollX + margin) {
    leftPosition = window.scrollX + margin;
  }
  if (leftPosition + toolbarWidth > window.scrollX + window.innerWidth - margin) {
    leftPosition = window.scrollX + window.innerWidth - toolbarWidth - margin;
  }

  toolbar.style.top = `${topPosition}px`;
  toolbar.style.left = `${leftPosition}px`;
  document.body.appendChild(toolbar);
}
