// content.js (Injector and Bridge Script)

// 1. Inject the main script as a module into the page.
// This is the standard method for using ES modules in content scripts for Manifest V3.
(function() {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = chrome.runtime.getURL('main.js');
  (document.head || document.documentElement).appendChild(script);
})();

// 2. Act as a bridge to pass messages from the background script to the page script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_ui') {
    // Get the URL from the extension's context
    const url = chrome.runtime.getURL('floating-ui.html');
    // Forward the message and the URL to the page context
    window.dispatchEvent(new CustomEvent('toggle_anki_clipper_ui', { detail: { htmlUrl: url } }));
  }
  return true;
});