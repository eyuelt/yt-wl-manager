/**
 * Google Drive Sync Utility
 *
 * Handles OAuth authentication and file operations with Google Drive API.
 * Uses the 'drive.appdata' scope which provides access to an app-specific folder
 * that is hidden from the user in Google Drive.
 */

import { getOrCreateClientId } from './clientId';

const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const TOKEN_STORAGE_KEY = 'yt-wl-gdrive-token';
const TOKEN_EXPIRY_KEY = 'yt-wl-gdrive-token-expiry';

// File names in Drive
export const FILES = {
    VIDEOS: 'videos.json',
    TAGS: 'tags.json',
    METADATA: 'metadata.json',
    LOCKFILE: 'lockfile.json'
};

// Global state
let tokenClient = null;
let accessToken = null;
let authChangeCallbacks = new Set();

/**
 * Store access token in localStorage
 */
function storeToken(token, expiresIn = 3600) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Get stored access token if not expired
 */
function getStoredToken() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return null;

    if (Date.now() >= parseInt(expiry)) {
        // Token expired, clear it
        clearStoredToken();
        return null;
    }

    return token;
}

/**
 * Clear stored token
 */
function clearStoredToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Initialize Google Identity Services
 * @param {string} clientId - OAuth 2.0 Client ID from Google Cloud Console
 */
export function initGoogleAuth(clientId) {
    if (!clientId) {
        throw new Error('OAuth Client ID is required');
    }

    if (typeof google === 'undefined' || !google.accounts) {
        throw new Error('Google Identity Services not loaded. Add the GIS script to index.html');
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                console.error('Auth error:', response);
                clearStoredToken();
                notifyAuthChange({ isSignedIn: false, user: null });
                return;
            }

            accessToken = response.access_token;
            storeToken(response.access_token, response.expires_in);
            notifyAuthChange({ isSignedIn: true, user: null });
        },
    });

    // Try to restore token from localStorage
    const storedToken = getStoredToken();
    if (storedToken) {
        accessToken = storedToken;
        notifyAuthChange({ isSignedIn: true, user: null });
    }
}

/**
 * Trigger Google sign-in flow
 * @returns {Promise<void>}
 */
export function signIn() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Google Auth not initialized. Call initGoogleAuth first.'));
            return;
        }

        // Override callback temporarily to resolve/reject promise
        const originalCallback = tokenClient.callback;
        tokenClient.callback = (response) => {
            tokenClient.callback = originalCallback;

            if (response.error) {
                reject(new Error(response.error));
                return;
            }

            accessToken = response.access_token;
            storeToken(response.access_token, response.expires_in);
            notifyAuthChange({ isSignedIn: true, user: null });
            resolve();
        };

        // Request an access token
        tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
}

/**
 * Try to sign in silently (without showing UI)
 * Used for automatic re-authentication on page load
 * @returns {Promise<void>}
 */
export function signInSilent() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Google Auth not initialized. Call initGoogleAuth first.'));
            return;
        }

        // Override callback temporarily to resolve/reject promise
        const originalCallback = tokenClient.callback;
        tokenClient.callback = (response) => {
            tokenClient.callback = originalCallback;

            if (response.error) {
                reject(new Error(response.error));
                return;
            }

            accessToken = response.access_token;
            storeToken(response.access_token, response.expires_in);
            notifyAuthChange({ isSignedIn: true, user: null });
            resolve();
        };

        // Request an access token silently (prompt: '' means no UI)
        tokenClient.requestAccessToken({ prompt: '' });
    });
}

/**
 * Sign out and revoke token
 */
export function signOut() {
    if (accessToken) {
        google.accounts.oauth2.revoke(accessToken, () => {
            console.log('Access token revoked');
        });
        accessToken = null;
    }

    clearStoredToken();
    notifyAuthChange({ isSignedIn: false, user: null });
}

/**
 * Get current auth status
 * @returns {{ isSignedIn: boolean, user: object|null }}
 */
export function getAuthStatus() {
    return {
        isSignedIn: !!accessToken,
        user: null // GIS doesn't provide user info, would need separate call
    };
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called when auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
    authChangeCallbacks.add(callback);
    return () => authChangeCallbacks.delete(callback);
}

/**
 * Notify all subscribers of auth state change
 * @param {object} status - Auth status object
 */
function notifyAuthChange(status) {
    authChangeCallbacks.forEach(callback => {
        try {
            callback(status);
        } catch (error) {
            console.error('Error in auth change callback:', error);
        }
    });
}

/**
 * Make a request to Google Drive API
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function driveRequest(url, options = {}) {
    if (!accessToken) {
        throw new Error('Not signed in to Google Drive');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            ...options.headers
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Drive API error: ${error.error?.message || response.statusText}`);
    }

    return response;
}

/**
 * List files in the app data folder
 * @returns {Promise<Array>} List of files
 */
export async function listFiles() {
    const url = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder';
    const response = await driveRequest(url);
    const data = await response.json();
    return data.files || [];
}

/**
 * Find a file by name
 * @param {string} filename - Name of the file
 * @returns {Promise<object|null>} File metadata or null if not found
 */
async function findFile(filename) {
    const files = await listFiles();
    return files.find(file => file.name === filename) || null;
}

/**
 * Read a JSON file from Drive
 * @param {string} filename - Name of the file
 * @returns {Promise<object|null>} Parsed JSON data or null if file doesn't exist
 */
export async function readFile(filename) {
    const file = await findFile(filename);
    if (!file) {
        return null;
    }

    const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    const response = await driveRequest(url);
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error(`Error parsing ${filename}:`, error);
        throw new Error(`Invalid JSON in ${filename}`);
    }
}

/**
 * Write a JSON file to Drive (creates or updates)
 * @param {string} filename - Name of the file
 * @param {object} data - Data to write (will be JSON.stringified)
 * @returns {Promise<object>} File metadata
 */
export async function writeFile(filename, data) {
    const existingFile = await findFile(filename);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    const metadata = {
        name: filename,
        mimeType: 'application/json'
    };

    // Only include parents when creating a new file, not when updating
    if (!existingFile) {
        metadata.parents = ['appDataFolder'];
    }

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    let url;
    let method;

    if (existingFile) {
        // Update existing file
        url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
        method = 'PATCH';
    } else {
        // Create new file
        url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        method = 'POST';
    }

    const response = await driveRequest(url, {
        method,
        body: form
    });

    return response.json();
}

/**
 * Delete a file from Drive
 * @param {string} filename - Name of the file
 * @returns {Promise<void>}
 */
export async function deleteFile(filename) {
    const file = await findFile(filename);
    if (!file) {
        return; // File doesn't exist, nothing to delete
    }

    const url = `https://www.googleapis.com/drive/v3/files/${file.id}`;
    await driveRequest(url, { method: 'DELETE' });
}

/**
 * Check if Drive has any data files
 * @returns {Promise<boolean>}
 */
export async function checkDriveHasData() {
    const videosFile = await findFile(FILES.VIDEOS);
    return !!videosFile;
}

/**
 * Get the lockfile from Drive
 * @returns {Promise<object|null>} Lockfile data or null if doesn't exist
 */
export async function getLockfile() {
    return await readFile(FILES.LOCKFILE);
}

/**
 * Acquire the lock for this client
 * @returns {Promise<void>}
 */
export async function acquireLock() {
    const clientId = getOrCreateClientId();
    const lockfile = {
        clientId,
        acquiredAt: Date.now()
    };

    await writeFile(FILES.LOCKFILE, lockfile);
}

/**
 * Release the lock if this client owns it
 * @returns {Promise<void>}
 */
export async function releaseLock() {
    const lockfile = await getLockfile();
    const clientId = getOrCreateClientId();

    if (lockfile && lockfile.clientId === clientId) {
        await deleteFile(FILES.LOCKFILE);
    }
}

/**
 * Check if this client owns the lock
 * @returns {Promise<boolean>}
 */
export async function isLockOwner() {
    const lockfile = await getLockfile();
    const clientId = getOrCreateClientId();

    if (!lockfile) {
        return false;
    }

    return lockfile.clientId === clientId;
}

/**
 * Sync all data TO Drive
 * @param {object} data - Data to sync { videos, tags, metadata }
 * @returns {Promise<void>}
 */
export async function syncToDrive(data) {
    await writeFile(FILES.VIDEOS, data.videos || []);
    await writeFile(FILES.TAGS, data.tags || {});
    await writeFile(FILES.METADATA, data.metadata || {});
}

/**
 * Sync all data FROM Drive
 * @returns {Promise<object|null>} Data object { videos, tags, metadata } or null if no data
 */
export async function syncFromDrive() {
    const videos = await readFile(FILES.VIDEOS);
    const tags = await readFile(FILES.TAGS);
    const metadata = await readFile(FILES.METADATA);

    if (videos === null && tags === null && metadata === null) {
        return null;
    }

    return {
        videos: videos || [],
        tags: tags || {},
        metadata: metadata || {}
    };
}

export default {
    initGoogleAuth,
    signIn,
    signInSilent,
    signOut,
    getAuthStatus,
    onAuthChange,
    listFiles,
    readFile,
    writeFile,
    deleteFile,
    checkDriveHasData,
    getLockfile,
    acquireLock,
    releaseLock,
    isLockOwner,
    syncToDrive,
    syncFromDrive,
    FILES
};
