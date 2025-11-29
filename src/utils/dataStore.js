/**
 * Data Store Abstraction Layer
 *
 * Single source of truth for all app data.
 * Provides async API and change notifications.
 * Currently backed by localStorage, but can be swapped to server/IndexedDB.
 */

// Storage keys
const KEYS = {
    VIDEOS: 'yt-wl-data',
    TAGS: 'yt-wl-tags',
    TAG_METADATA: 'yt-wl-tag-metadata'
};

// Subscribers for change notifications
const subscribers = new Set();

/**
 * Notify all subscribers of data changes
 * @param {string} key - The data key that changed
 * @param {any} newValue - The new value
 */
function notifySubscribers(key, newValue) {
    subscribers.forEach(callback => {
        try {
            callback({ key, value: newValue });
        } catch (error) {
            console.error('Error in dataStore subscriber:', error);
        }
    });
}

/**
 * Listen for storage events (cross-tab changes or external modifications)
 */
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        // Only notify if it's one of our keys
        if (Object.values(KEYS).includes(event.key)) {
            const newValue = event.newValue ? JSON.parse(event.newValue) : null;
            notifySubscribers(event.key, newValue);
        }
    });
}

/**
 * Data Store API
 */
export const dataStore = {
    // ==================== Videos ====================

    /**
     * Get all videos
     * @returns {Promise<Array>} Array of video objects
     */
    async getVideos() {
        const data = localStorage.getItem(KEYS.VIDEOS);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Set videos
     * @param {Array} videos - Array of video objects
     * @returns {Promise<void>}
     */
    async setVideos(videos) {
        const json = JSON.stringify(videos);
        localStorage.setItem(KEYS.VIDEOS, json);
        notifySubscribers(KEYS.VIDEOS, videos);
    },

    // ==================== Tags ====================

    /**
     * Get all tags
     * @returns {Promise<Object>} Object mapping video IDs to tag arrays
     */
    async getTags() {
        const data = localStorage.getItem(KEYS.TAGS);
        return data ? JSON.parse(data) : {};
    },

    /**
     * Set tags
     * @param {Object} tags - Object mapping video IDs to tag arrays
     * @returns {Promise<void>}
     */
    async setTags(tags) {
        const json = JSON.stringify(tags);
        localStorage.setItem(KEYS.TAGS, json);
        notifySubscribers(KEYS.TAGS, tags);
    },

    // ==================== Tag Metadata ====================

    /**
     * Get tag metadata
     * @returns {Promise<Object>} Object mapping tag names to metadata
     */
    async getTagMetadata() {
        const data = localStorage.getItem(KEYS.TAG_METADATA);
        return data ? JSON.parse(data) : {};
    },

    /**
     * Set tag metadata
     * @param {Object} metadata - Object mapping tag names to metadata
     * @returns {Promise<void>}
     */
    async setTagMetadata(metadata) {
        const json = JSON.stringify(metadata);
        localStorage.setItem(KEYS.TAG_METADATA, json);
        notifySubscribers(KEYS.TAG_METADATA, metadata);
    },

    // ==================== Utility ====================

    /**
     * Clear all data
     * @returns {Promise<void>}
     */
    async clear() {
        localStorage.removeItem(KEYS.VIDEOS);
        localStorage.removeItem(KEYS.TAGS);
        localStorage.removeItem(KEYS.TAG_METADATA);

        // Notify subscribers of all changes
        notifySubscribers(KEYS.VIDEOS, []);
        notifySubscribers(KEYS.TAGS, {});
        notifySubscribers(KEYS.TAG_METADATA, {});
    },

    // ==================== Observer Pattern ====================

    /**
     * Subscribe to data changes
     * @param {Function} callback - Called when data changes: ({ key, value }) => void
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        subscribers.add(callback);

        // Return unsubscribe function
        return () => {
            subscribers.delete(callback);
        };
    },

    /**
     * Unsubscribe from data changes
     * @param {Function} callback - The callback to remove
     */
    unsubscribe(callback) {
        subscribers.delete(callback);
    },

    // ==================== Direct Access (for debugging) ====================

    /**
     * Get the underlying storage keys (for debugging/migration)
     */
    KEYS
};

export default dataStore;
