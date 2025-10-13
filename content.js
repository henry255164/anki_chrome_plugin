// content.js

const CONTAINER_ID = 'anki-clipper-container';

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle_ui') {
    toggleUI();
  }
});

function toggleUI() {
  const existingUI = document.getElementById(CONTAINER_ID);
  if (existingUI) {
    // If UI exists, remove it
    existingUI.remove();
  } else {
    // If UI doesn't exist, create and inject it
    createUI();
  }
}

async function createUI() {
  // Create the main container
  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  // Fetch the HTML content for the UI
  try {
    const uiHtmlUrl = chrome.runtime.getURL('floating-ui.html');
    const response = await fetch(uiHtmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch UI content: ${response.statusText}`);
    }
    const html = await response.text();
    container.innerHTML = html;

    // Append the container to the body
    document.body.appendChild(container);
  } catch (error) {
    console.error('Anki Clipper Error:', error);
  }
}
