// background.js - Service worker for handling communication

console.log('Background service worker loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'YT_WL_SYNC') {
        // Store the synced videos
        chrome.storage.local.set({
            ytWatchLaterVideos: message.videos,
            ytWatchLaterSyncComplete: message.syncComplete || false,
            ytWatchLaterTimestamp: Date.now()
        }, () => {
            console.log('Stored videos in background:', message.videos.length, 'syncComplete:', message.syncComplete);
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for async response
    }

    if (message.type === 'GET_ARCHIVED_IDS') {
        // Retrieve archived video IDs for content script
        chrome.storage.local.get(['archivedVideoIds', 'archivedIdsTimestamp'], (result) => {
            sendResponse({
                success: true,
                archivedIds: result.archivedVideoIds || [],
                timestamp: result.archivedIdsTimestamp
            });
        });
        return true; // Keep the message channel open for async response
    }

    if (message.type === 'CLEAR_ARCHIVED_IDS') {
        // Clear archived video IDs
        chrome.storage.local.remove(['archivedVideoIds', 'archivedIdsTimestamp'], () => {
            console.log('Cleared archived IDs');
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for async response
    }
});

// Listen for messages from external web pages (the app)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('Background received external message:', message, 'from:', sender.url);

    if (message.type === 'SET_ARCHIVED_IDS') {
        // Store archived video IDs from web app
        chrome.storage.local.set({
            archivedVideoIds: message.archivedIds,
            archivedIdsTimestamp: Date.now()
        }, () => {
            console.log('Stored archived IDs:', message.archivedIds.length);
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for async response
    }

    if (message.type === 'GET_AND_CLEAR_YT_WL_DATA') {
        // Retrieve and send the stored videos
        chrome.storage.local.get(['ytWatchLaterVideos', 'ytWatchLaterSyncComplete', 'ytWatchLaterTimestamp'], (result) => {
            if (result.ytWatchLaterVideos) {
                console.log('Sending videos to app:', result.ytWatchLaterVideos.length);
                sendResponse({
                    success: true,
                    videos: result.ytWatchLaterVideos,
                    syncComplete: result.ytWatchLaterSyncComplete || false,
                    timestamp: result.ytWatchLaterTimestamp
                });

                // Clear the sync data after sending
                chrome.storage.local.remove(['ytWatchLaterVideos', 'ytWatchLaterSyncComplete', 'ytWatchLaterTimestamp']);
            } else {
                sendResponse({ success: false, message: 'No data available' });
            }
        });
        return true; // Keep the message channel open for async response
    }
});
