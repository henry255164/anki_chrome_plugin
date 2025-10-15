// options.js

// Helper function to format the hotkey string from a keyboard event
function hotkeyToString(e) {
  const parts = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Cmd'); // Handle Command/Windows key

  // Use event.code to represent the physical key, ignoring layout/modifier changes
  const code = e.code;
  if (code.startsWith('Key')) {
    parts.push(code.substring(3)); // 'KeyQ' -> 'Q'
  } else if (code.startsWith('Digit')) {
    parts.push(code.substring(5)); // 'Digit1' -> '1'
  } else if (!['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'].includes(code)) {
    // Add other keys if they are not just modifiers
    parts.push(code);
  }

  // We need at least one modifier and one main key
  if (parts.length > 1 && parts.length - 1 < e.getModifierState(parts[parts.length - 1])) {
    return parts.join(' + ');
  }
  // Check if the last part is a modifier key itself
  const lastPart = parts[parts.length - 1];
  const isLastPartModifier = ['Ctrl', 'Alt', 'Shift', 'Cmd'].includes(lastPart);
  if (parts.length > 1 && !isLastPartModifier) {
    return parts.join(' + ');
  }

  return null; // Not a valid hotkey combination
}

// Saves options to chrome.storage
function save_options() {
  const questionHotkey = document.getElementById('question-hotkey').value;
  const answerHotkey = document.getElementById('answer-hotkey').value;

  chrome.storage.sync.set({
    questionHotkey: questionHotkey,
    answerHotkey: answerHotkey
  }, function () {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
      status.textContent = '';
    }, 1500);
  });
}

// Restores hotkey preferences stored in chrome.storage.
function restore_options() {
  // Use default values Alt+Q and Alt+A
  chrome.storage.sync.get({
    questionHotkey: 'Alt + Q',
    answerHotkey: 'Alt + A'
  }, function (items) {
    document.getElementById('question-hotkey').value = items.questionHotkey;
    document.getElementById('answer-hotkey').value = items.answerHotkey;
  });
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

const questionInput = document.getElementById('question-hotkey');
const answerInput = document.getElementById('answer-hotkey');

questionInput.addEventListener('keydown', (e) => {
  e.preventDefault();
  const hotkeyString = hotkeyToString(e);
  if (hotkeyString) { // Do not update if only a modifier was pressed
    questionInput.value = hotkeyString;
  }
});

answerInput.addEventListener('keydown', (e) => {
  e.preventDefault();
  const hotkeyString = hotkeyToString(e);
  if (hotkeyString) { // Do not update if only a modifier was pressed
    answerInput.value = hotkeyString;
  }
});
