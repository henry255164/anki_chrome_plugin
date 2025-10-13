// background.js

// Listen for the extension icon to be clicked
chrome.action.onClicked.addListener((tab) => {
  // Check if the tab is ready before sending a message
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle_ui" }, (response) => {
      // This callback is used to handle the response, but more importantly,
      // it prevents an "Uncaught (in promise)" error if the receiving end does not exist.
      if (chrome.runtime.lastError) {
        // This error is expected on pages where the content script can't be injected
        // (e.g., chrome://extensions) or if the page is not yet ready.
        // We can safely ignore it.
        // console.warn("Anki Clipper: Message sending failed: " + chrome.runtime.lastError.message);
      }
    });
  } else {
    console.error("Anki Clipper: Could not get active tab ID.");
  }
});