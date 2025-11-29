// background.js - Service worker for handling communication

console.log('Background service worker loaded');

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'YT_WL_SYNC') {
        // Store the synced videos
        chrome.storage.local.set({
            ytWatchLaterVideos: message.videos,
            ytWatchLaterTimestamp: Date.now()
        }, () => {
            console.log('Stored videos in background:', message.videos.length);
            sendResponse({ success: true });
        });
        return true; // Keep the message channel open for async response
    }
});

// Listen for messages from external web pages (the app)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('Background received external message:', message, 'from:', sender.url);

    if (message.type === 'GET_YT_WL_DATA') {
        // Retrieve and send the stored videos
        chrome.storage.local.get(['ytWatchLaterVideos', 'ytWatchLaterTimestamp'], (result) => {
            if (result.ytWatchLaterVideos) {
                console.log('Sending videos to app:', result.ytWatchLaterVideos.length);
                sendResponse({
                    success: true,
                    videos: result.ytWatchLaterVideos,
                    timestamp: result.ytWatchLaterTimestamp
                });

                // Clear the storage after sending
                chrome.storage.local.remove(['ytWatchLaterVideos', 'ytWatchLaterTimestamp']);
            } else {
                sendResponse({ success: false, message: 'No data available' });
            }
        });
        return true; // Keep the message channel open for async response
    }
});
