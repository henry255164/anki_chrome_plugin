// content.js (Injector and Bridge Script)

// 1. Inject the main script as a module into the page.
// This is the standard method for using ES modules in content scripts for Manifest V3.
(function() {
  const purifyScript = document.createElement('script');
  purifyScript.src = chrome.runtime.getURL('vendor/dompurify.min.js');
  purifyScript.onload = function() {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = chrome.runtime.getURL('main.js');
      (document.head || document.documentElement).appendChild(script);
  };
  (document.head || document.documentElement).appendChild(purifyScript);
})();

// 2. Act as a bridge to pass messages from the background script to the page script.
// This listener handles messages from the background script (e.g., toggle UI).
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_ui') {
    // Get the URL from the extension's context
    const url = chrome.runtime.getURL('floating-ui.html');
    // Forward the message and the URL to the page context
    window.dispatchEvent(new CustomEvent('toggle_anki_clipper_ui', { detail: { htmlUrl: url } }));
  }
  return true;
});

// This listener handles messages from the page script (e.g., add Anki note).
window.addEventListener('anki_add_note', (event) => {
  if (event.detail) {
    // Send the note data to the background script for AnkiConnect API call.
    chrome.runtime.sendMessage({ action: 'addAnkiNote', payload: event.detail }, (response) => {
      // Forward the response from the background script back to the page script.
      window.dispatchEvent(new CustomEvent('anki_add_note_response', { detail: response }));
    });
  }
});

// Listen for requests for settings from the page script
window.addEventListener('anki_request_settings', () => {
  chrome.storage.sync.get({
    questionHotkey: 'Alt + Q',
    answerHotkey: 'Alt + A'
  }, (items) => {
    // Forward the settings back to the page script
    window.dispatchEvent(new CustomEvent('anki_receive_settings', { detail: items }));
  });
});
