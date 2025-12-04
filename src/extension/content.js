// content.js - Runs in isolated world

console.log('YT Watch Later Sync: Content script loaded (isolated world)');

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Inject script into page to access window.ytInitialData
function injectPageScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = function() {
        console.log('Page script loaded successfully');
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

function extractVideosFromDOM() {
    console.log('Attempting DOM extraction...');
    let videos = [];
    const items = document.querySelectorAll('ytd-playlist-video-renderer');

    items.forEach(item => {
        try {
            const videoId = item.querySelector('a#thumbnail')?.href?.split('v=')[1]?.split('&')[0];
            const title = item.querySelector('#video-title')?.innerText;
            const channel = item.querySelector('.ytd-channel-name a')?.innerText;
            const duration = item.querySelector('#text.ytd-thumbnail-overlay-time-status-renderer')?.innerText;
            const thumbnail = item.querySelector('img#img')?.src;

            if (videoId && title) {
                videos.push({
                    id: videoId,
                    title: title,
                    channel: channel,
                    duration: duration,
                    thumbnail: thumbnail,
                    addedAt: Date.now()
                });
            }
        } catch (e) {
            console.error('Error extracting video from DOM element:', e);
        }
    });
    return videos;
}

function main() {
    console.log('Main function called');
    console.log('Current URL:', window.location.href);
    console.log('Location search:', location.search);

    const autoSync = getUrlParameter('auto_sync');
    console.log('auto_sync parameter value:', autoSync);

    if (autoSync === 'true') {
        console.log('Auto sync detected. Injecting page script and waiting for page load...');

        // Inject script to access page data
        try {
            injectPageScript();
        } catch (e) {
            console.error('Error injecting page script:', e);
        }

        setTimeout(() => {
            console.log('Requesting video extraction from page script...');

            // Listen for response from page script
            window.addEventListener('YT_WL_EXTRACT_RESPONSE', function(event) {
                console.log('Received YT_WL_EXTRACT_RESPONSE event');
                const videos = event.detail.videos;
                const syncComplete = event.detail.syncComplete || false;
                console.log(`Received ${videos.length} videos from page script (syncComplete: ${syncComplete})`);

                if (videos.length === 0) {
                    // Fallback to DOM extraction
                    const domVideos = extractVideosFromDOM();
                    console.log(`DOM extraction found ${domVideos.length} videos.`);
                    sendToBackground(domVideos.length > 0 ? domVideos : videos, syncComplete);
                } else {
                    sendToBackground(videos, syncComplete);
                }
            }, { once: true });

            // Request extraction from page script
            console.log('Dispatching YT_WL_EXTRACT_REQUEST event');
            window.dispatchEvent(new CustomEvent('YT_WL_EXTRACT_REQUEST'));
        }, 3000);
    } else {
        console.log('Auto sync NOT detected (parameter was:', autoSync, ')');
    }
}

function sendToBackground(videos, syncComplete) {
    chrome.runtime.sendMessage({
        type: 'YT_WL_SYNC',
        videos: videos,
        syncComplete: syncComplete
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending to background:', chrome.runtime.lastError);
            return;
        }
        if (response && response.success) {
            console.log('Successfully sent videos to background script');
            alert(`Synced ${videos.length} videos! You can close this window.`);
        } else {
            console.error('Failed to send videos to background script');
        }
    });
}

main();
