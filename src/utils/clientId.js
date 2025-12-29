/**
 * Client ID Management
 *
 * Generates and persists a unique client ID for this browser.
 * Used by the lockfile mechanism to identify which client owns editing rights.
 */

const CLIENT_ID_KEY = 'yt-wl-client-id';

/**
 * Get or create a unique client ID for this browser
 * @returns {string} The client ID
 */
export function getOrCreateClientId() {
    let clientId = localStorage.getItem(CLIENT_ID_KEY);

    if (!clientId) {
        clientId = crypto.randomUUID();
        localStorage.setItem(CLIENT_ID_KEY, clientId);
    }

    return clientId;
}

/**
 * Get the current client ID (returns null if not created yet)
 * @returns {string|null} The client ID or null
 */
export function getClientId() {
    return localStorage.getItem(CLIENT_ID_KEY);
}

export default { getOrCreateClientId, getClientId };
