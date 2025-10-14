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
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addAnkiNote') {
    addNote(request.payload)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates that the response is sent asynchronously
  }
});

// --- AnkiConnect API Call ---

/**
 * Adds a note to Anki using the AnkiConnect API.
 * @param {object} noteData - The data for the note, e.g., { Front, Back }.
 * @returns {Promise<object>} A promise that resolves to a success or error object.
 */
async function addNote(noteData) {
  const ankiConnectUrl = 'http://127.0.0.1:8765';
  const body = {
    action: "addNote",
    version: 6,
    params: {
      note: {
        deckName: "Default",
        modelName: "Basic",
        fields: {
          Front: noteData.Front,
          Back: noteData.Back
        },
        tags: ["anki-web-clipper"]
      }
    }
  };

  try {
    const response = await fetch(ankiConnectUrl, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.error) {
      throw new Error(`AnkiConnect error: ${jsonResponse.error}`);
    }

    return { success: true, result: jsonResponse.result };

  } catch (error) {
    console.error('AnkiConnect request failed:', error);
    // A common error is failing to fetch, which can mean Anki is not running.
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { success: false, error: 'Failed to connect to Anki. Is Anki with AnkiConnect running?' };
    }
    return { success: false, error: error.message };
  }
}
