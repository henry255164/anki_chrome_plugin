// modules/ui.js

import { removeToolbar } from './toolbar.js';

const CONTAINER_ID = 'anki-clipper-container';

/**
 * Toggles the main floating UI visibility.
 */
export async function toggleUI(htmlUrl) {
  const existingUI = document.getElementById(CONTAINER_ID);
  if (existingUI) {
    existingUI.remove();
    removeToolbar(); // Also remove toolbar when main UI is closed
    return null; // UI was removed
  } else {
    return await createUI(htmlUrl); // UI was created
  }
}

/**
 * Fetches the UI template and injects it into the page.
 * @param {string} htmlUrl The fully-resolved URL to the floating-ui.html template.
 * @returns {Promise<HTMLElement>} A promise that resolves to the created UI container element.
 */
async function createUI(htmlUrl) {
  const container = document.createElement('div');
  container.id = CONTAINER_ID;

  try {
    const response = await fetch(htmlUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch UI content: ${response.statusText}`);
    }
    const html = await response.text();
    const hasTT = !!window.trustedTypes;
    const sanitized = DOMPurify.sanitize(
      html,
      hasTT ? { RETURN_TRUSTED_TYPE: true } : {}
    );
    container.innerHTML = sanitized;
    document.body.appendChild(container);
    return container; // Return the created container
  } catch (error) {
    console.error('Anki Clipper Error:', error);
    return null; // Indicate failure
  }
}
