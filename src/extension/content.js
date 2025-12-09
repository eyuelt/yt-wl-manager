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

// ========== ARCHIVED VIDEO HIGHLIGHTING ==========

let archivedVideoIds = new Set();
let highlightObserver = null;

// Fetch archived IDs from background
async function fetchArchivedIds() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_ARCHIVED_IDS' }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Error fetching archived IDs:', chrome.runtime.lastError);
                resolve([]);
                return;
            }
            if (response && response.success) {
                const ids = response.archivedIds || [];
                console.log('Fetched archived IDs:', ids.length);

                // Clear the archived IDs now that we've read them
                // This ensures they won't be used on subsequent page loads
                chrome.runtime.sendMessage({ type: 'CLEAR_ARCHIVED_IDS' });

                resolve(ids);
            } else {
                resolve([]);
            }
        });
    });
}

// Extract video ID from a renderer element
function getVideoIdFromRenderer(renderer) {
    // Try thumbnail link first
    const thumbnailLink = renderer.querySelector('a#thumbnail[href]');
    if (thumbnailLink) {
        const href = thumbnailLink.getAttribute('href');
        const match = href.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
    }

    // Try video title link
    const titleLink = renderer.querySelector('a#video-title[href]');
    if (titleLink) {
        const href = titleLink.getAttribute('href');
        const match = href.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
    }

    return null;
}

// Inject CSS styles for highlighting
function injectHighlightStyles() {
    if (document.getElementById('yt-wl-archive-styles')) return;

    const style = document.createElement('style');
    style.id = 'yt-wl-archive-styles';
    style.textContent = `
        .yt-wl-archived {
            position: relative;
            outline: 3px solid #dc2626 !important;
            outline-offset: -3px;
        }

        .yt-wl-archived::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(220, 38, 38, 0.1);
            pointer-events: none;
            z-index: 1;
        }

        .yt-wl-remove-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            transition: transform 0.15s, background 0.15s;
        }

        .yt-wl-remove-btn:hover {
            background: #b91c1c;
            transform: scale(1.1);
        }

        .yt-wl-remove-btn:active {
            transform: scale(0.95);
        }

        .yt-wl-remove-btn.removing {
            background: #666;
            cursor: wait;
        }
    `;
    document.head.appendChild(style);
}

// Helper: Wait for an element to appear
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
        const existing = document.querySelector(selector);
        if (existing) {
            resolve(existing);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const el = document.querySelector(selector);
            if (el) {
                obs.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

// Helper: Sleep for a specified duration
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Remove video from YouTube Watch Later
async function removeVideoFromWatchLater(renderer) {
    try {
        // Step 1: Find the 3-dot menu button
        const menuButton = renderer.querySelector('button[aria-label="Action menu"]');
        if (!menuButton) {
            console.error('Could not find menu button');
            return false;
        }

        // Click the menu button
        menuButton.click();
        console.log('Clicked menu button');

        // Step 2: Wait for menu to appear
        const menuPopup = await waitForElement('ytd-popup-container tp-yt-paper-listbox', 2000);
        if (!menuPopup) {
            console.error('Menu popup did not appear');
            return false;
        }

        // Step 3: Find "Remove from Watch later" option
        const menuItems = menuPopup.querySelectorAll('ytd-menu-service-item-renderer');
        let removeItem = null;

        for (const item of menuItems) {
            const text = item.textContent?.toLowerCase() || '';
            if (text.includes('remove from watch later') || text.includes('remove from')) {
                removeItem = item;
                break;
            }
        }

        if (!removeItem) {
            // Try alternative selector - look for text content
            const allItems = menuPopup.querySelectorAll('yt-formatted-string');
            for (const item of allItems) {
                if (item.textContent?.toLowerCase().includes('remove from watch later')) {
                    removeItem = item.closest('ytd-menu-service-item-renderer');
                    break;
                }
            }
        }

        if (!removeItem) {
            console.error('Could not find "Remove from Watch later" option');
            // Close the menu by clicking elsewhere
            document.body.click();
            return false;
        }

        // Click the remove option
        removeItem.click();
        console.log('Clicked remove option');

        // Wait a moment for the removal animation
        await sleep(500);

        return true;

    } catch (error) {
        console.error('Error removing video:', error);
        return false;
    }
}

// Create the X button for removal
function createRemoveButton(renderer, videoId) {
    const btn = document.createElement('button');
    btn.className = 'yt-wl-remove-btn';
    btn.innerHTML = '&times;';
    btn.title = 'Remove from Watch Later';
    btn.dataset.videoId = videoId;

    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (btn.classList.contains('removing')) return;

        btn.classList.add('removing');
        btn.innerHTML = '...';

        const success = await removeVideoFromWatchLater(renderer);

        if (!success) {
            btn.classList.remove('removing');
            btn.innerHTML = '&times;';
        }
        // If successful, the renderer will be removed by YouTube's animation
    });

    return btn;
}

// Highlight a single video renderer if it's archived
function processVideoRenderer(renderer) {
    if (renderer.dataset.ytWlProcessed) return;
    renderer.dataset.ytWlProcessed = 'true';

    const videoId = getVideoIdFromRenderer(renderer);
    if (!videoId) return;

    if (archivedVideoIds.has(videoId)) {
        renderer.classList.add('yt-wl-archived');

        // Ensure position relative for absolute positioning of button
        const computedStyle = window.getComputedStyle(renderer);
        if (computedStyle.position === 'static') {
            renderer.style.position = 'relative';
        }

        const removeBtn = createRemoveButton(renderer, videoId);
        renderer.appendChild(removeBtn);

        console.log('Highlighted archived video:', videoId);
    }
}

// Process all visible video renderers
function processAllRenderers() {
    const renderers = document.querySelectorAll('ytd-playlist-video-renderer');
    renderers.forEach(processVideoRenderer);
}

// Set up MutationObserver for lazy-loaded videos
function setupHighlightObserver() {
    if (highlightObserver) return;

    const container = document.querySelector('div#contents.ytd-playlist-video-list-renderer');
    if (!container) {
        console.warn('Could not find video list container for observer');
        return;
    }

    highlightObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'YTD-PLAYLIST-VIDEO-RENDERER') {
                        processVideoRenderer(node);
                    } else {
                        // Check for nested renderers
                        const nested = node.querySelectorAll?.('ytd-playlist-video-renderer');
                        nested?.forEach(processVideoRenderer);
                    }
                }
            }
        }
    });

    highlightObserver.observe(container, {
        childList: true,
        subtree: true
    });

    console.log('Highlight observer set up');
}

// Initialize highlighting
async function initializeHighlighting() {
    // Only run on Watch Later page
    if (!window.location.href.includes('list=WL')) return;

    const ids = await fetchArchivedIds();
    if (ids.length === 0) {
        console.log('No archived IDs to highlight');
        return;
    }

    archivedVideoIds = new Set(ids);
    console.log('Initialized with', archivedVideoIds.size, 'archived video IDs');

    injectHighlightStyles();

    // Wait for page to load
    setTimeout(() => {
        processAllRenderers();
        setupHighlightObserver();
    }, 2000);
}

// Call initialization
initializeHighlighting();
