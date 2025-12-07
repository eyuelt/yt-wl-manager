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
            // Create confirmation toast
            const progressDiv = document.createElement('div');
            progressDiv.id = 'yt-wl-sync-progress';
            progressDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #0f0f0f;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                z-index: 10000;
                font-family: 'Roboto', Arial, sans-serif;
                font-size: 14px;
                min-width: 250px;
                border: 1px solid #3ea6ff;
            `;
            progressDiv.innerHTML = `
                <div style="font-weight: 500; margin-bottom: 8px;">Sync Watch Later?</div>
                <div id="yt-wl-progress-text" style="color: #aaa; margin-bottom: 12px;">Ready to sync your Watch Later videos</div>
                <button id="yt-wl-start-btn" style="
                    background: #3ea6ff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    width: 100%;
                ">Start Sync</button>
            `;
            document.body.appendChild(progressDiv);

            const updateProgress = (message) => {
                const textEl = document.getElementById('yt-wl-progress-text');
                if (textEl) {
                    textEl.textContent = message;
                }
            };

            const startSync = () => {
                console.log('User confirmed sync - starting extraction...');

                // Update toast for syncing state
                progressDiv.innerHTML = `
                    <div style="font-weight: 500; margin-bottom: 8px;">Syncing Watch Later...</div>
                    <div id="yt-wl-progress-text" style="color: #aaa; margin-bottom: 12px;">Starting extraction...</div>
                    <button id="yt-wl-cancel-btn" style="
                        background: #cc0000;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        width: 100%;
                    ">Stop and Sync Now</button>
                `;

                // Add cancel button handler
                const cancelBtn = document.getElementById('yt-wl-cancel-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        console.log('User clicked cancel - dispatching cancel event');
                        updateProgress('Stopping sync...');
                        cancelBtn.disabled = true;
                        cancelBtn.style.opacity = '0.5';
                        cancelBtn.textContent = 'Stopping...';
                        window.dispatchEvent(new CustomEvent('YT_WL_CANCEL_SYNC'));
                    });
                }

                // Listen for progress updates from page script
                window.addEventListener('YT_WL_EXTRACT_PROGRESS', function(event) {
                    const { page, totalVideos } = event.detail;
                    console.log(`Progress: Page ${page}, Total videos: ${totalVideos}`);
                    updateProgress(`Page ${page}: ${totalVideos} videos found...`);
                });

                // Listen for response from page script
                window.addEventListener('YT_WL_EXTRACT_RESPONSE', function(event) {
                    console.log('Received YT_WL_EXTRACT_RESPONSE event');
                    const videos = event.detail.videos;
                    const syncComplete = event.detail.syncComplete || false;
                    console.log(`Received ${videos.length} videos from page script (syncComplete: ${syncComplete})`);

                    updateProgress(`Extraction complete! Found ${videos.length} videos.`);

                    setTimeout(() => {
                        if (videos.length === 0) {
                            // Fallback to DOM extraction
                            updateProgress('Trying fallback extraction...');
                            const domVideos = extractVideosFromDOM();
                            console.log(`DOM extraction found ${domVideos.length} videos.`);
                            sendToBackground(domVideos.length > 0 ? domVideos : videos, syncComplete, progressDiv);
                        } else {
                            sendToBackground(videos, syncComplete, progressDiv);
                        }
                    }, 500);
                }, { once: true });

                // Request extraction from page script
                console.log('Dispatching YT_WL_EXTRACT_REQUEST event');
                window.dispatchEvent(new CustomEvent('YT_WL_EXTRACT_REQUEST'));
            };

            // Add start button handler
            const startBtn = document.getElementById('yt-wl-start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', startSync);
            }
        }, 3000);
    } else {
        console.log('Auto sync NOT detected (parameter was:', autoSync, ')');
    }
}

function sendToBackground(videos, syncComplete, progressDiv) {
    chrome.runtime.sendMessage({
        type: 'YT_WL_SYNC',
        videos: videos,
        syncComplete: syncComplete
    }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('Error sending to background:', chrome.runtime.lastError);
            if (progressDiv) progressDiv.remove();
            return;
        }
        if (response && response.success) {
            console.log('Successfully sent videos to background script');

            // Update toast with completion message and close button
            if (progressDiv) {
                progressDiv.innerHTML = `
                    <div style="font-weight: 500; margin-bottom: 8px;">✓ Sync Complete!</div>
                    <div style="color: #aaa; margin-bottom: 12px;">Synced ${videos.length} videos</div>
                    <button id="yt-wl-close-btn" style="
                        background: #3ea6ff;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        width: 100%;
                    ">Close Tab</button>
                `;

                // Add close button handler
                const closeBtn = document.getElementById('yt-wl-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        window.close();
                    });
                }
            }
        } else {
            console.error('Failed to send videos to background script');
            if (progressDiv) progressDiv.remove();
        }
    });
}

main();
