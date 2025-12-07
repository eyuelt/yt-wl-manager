// inject.js - Runs in page context to access window.ytInitialData

(function () {
    console.log('Injected script running in page context');

    // Convert duration string "6:51" or "1:02:34" to seconds
    function parseDuration(durationStr) {
        if (!durationStr) return null;
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 2) {
            // MM:SS
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            // HH:MM:SS
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return null;
    }

    // Extract videos from a list of items
    function parseVideoItems(videoItems) {
        const videos = [];
        if (!videoItems) return videos;

        videoItems.forEach(item => {
            const videoRenderer = item.playlistVideoRenderer;
            if (videoRenderer) {
                const videoId = videoRenderer.videoId;
                const title = videoRenderer.title?.runs?.[0]?.text;
                const channel = videoRenderer.shortBylineText?.runs?.[0]?.text;
                const durationStr = videoRenderer.lengthText?.simpleText;
                const thumbnails = videoRenderer.thumbnail?.thumbnails || [];

                if (videoId && title) {
                    videos.push({
                        id: videoId,
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        title: title,
                        channel: channel,
                        duration: parseDuration(durationStr),
                        thumbnails: thumbnails.map(t => ({
                            url: t.url,
                            height: t.height,
                            width: t.width
                        }))
                    });
                }
            }
        });

        return videos;
    }

    // Extract continuation token from items
    function extractContinuationToken(videoItems) {
        if (!videoItems) {
            console.log('[Pagination] No video items provided to extractContinuationToken');
            return null;
        }

        console.log(`[Pagination] Searching for continuation token in ${videoItems.length} items`);
        for (const item of videoItems) {
            if (item.continuationItemRenderer) {
                const endpoint = item.continuationItemRenderer.continuationEndpoint;

                // Try simple format first (single command)
                let token = endpoint?.continuationCommand?.token;
                if (token) {
                    console.log('[Pagination] Found token using continuationCommand format');
                    return token;
                }

                // Try commandExecutorCommand format (multiple commands)
                const commands = endpoint?.commandExecutorCommand?.commands;
                if (commands && Array.isArray(commands)) {
                    console.log(`[Pagination] Found commandExecutorCommand with ${commands.length} commands, searching for continuationCommand...`);
                    for (const command of commands) {
                        if (command.continuationCommand?.token) {
                            token = command.continuationCommand.token;
                            console.log('[Pagination] Found token using commandExecutorCommand format');
                            return token;
                        }
                    }
                }

                console.log('[Pagination] continuationItemRenderer found but no token in either format');
            }
        }
        console.log('[Pagination] No continuation token found');
        return null;
    }

    // Extract API key from page
    function extractApiKey() {
        try {
            // YouTube embeds the API key in the page config
            const apiKey = window.ytcfg?.get('INNERTUBE_API_KEY') || 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
            console.log('[Pagination] API Key:', apiKey ? 'Found' : 'Using fallback');
            return apiKey;
        } catch (e) {
            console.log('[Pagination] Error getting API key, using fallback:', e);
            return 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'; // Fallback public key
        }
    }

    // Helper to get cookie by name
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    // Helper to generate SHA-1 hash using Web Crypto API
    async function sha1(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hash = await crypto.subtle.digest('SHA-1', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Generate SAPISIDHASH for Authorization header
    async function generateSidAuth(sapisid, origin) {
        const timestamp = Math.floor(Date.now() / 1000);
        const hashInput = `${timestamp} ${sapisid} ${origin}`;
        const hash = await sha1(hashInput);
        return `SAPISIDHASH ${timestamp}_${hash}`;
    }

    // Extract session index for X-Goog-AuthUser header
    function extractSessionIndex() {
        try {
            const sessionIndex = window.ytcfg?.get('SESSION_INDEX');
            console.log('[Pagination] Session Index:', sessionIndex !== undefined ? sessionIndex : 'Not found');
            return sessionIndex !== undefined ? sessionIndex : '0';
        } catch (e) {
            console.log('[Pagination] Error getting session index:', e);
            return '0';
        }
    }

    // Extract client context from page
    function extractClientContext() {
        try {
            const context = window.ytcfg?.get('INNERTUBE_CONTEXT');
            if (context) {
                console.log('[Pagination] Using page INNERTUBE_CONTEXT');
                return context;
            } else {
                console.log('[Pagination] Using fallback context');
                return {
                    client: {
                        clientName: 'WEB',
                        clientVersion: '2.20251204.01.00', // Updated to match user's observed version
                    },
                    user: {
                        lockedSafetyMode: false
                    },
                    request: {
                        useSsl: true
                    }
                };
            }
        } catch (e) {
            console.log('[Pagination] Error getting context, using fallback:', e);
            return {
                client: {
                    clientName: 'WEB',
                    clientVersion: '2.20251204.01.00'
                }
            };
        }
    }

    // Fetch next page using continuation token
    async function fetchNextPage(continuationToken) {
        console.log('[Pagination] fetchNextPage called with token:', continuationToken?.substring(0, 50) + '...');
        try {
            const apiKey = extractApiKey();
            const context = extractClientContext();
            const sessionIndex = extractSessionIndex();

            // Get SAPISID for Authorization
            const sapisid = getCookie('SAPISID');
            const origin = 'https://www.youtube.com';
            let authHeader = '';

            if (sapisid) {
                authHeader = await generateSidAuth(sapisid, origin);
                console.log('[Pagination] Generated Auth Header:', authHeader.substring(0, 20) + '...');
            } else {
                console.warn('[Pagination] SAPISID cookie not found! Request might fail.');
            }

            const url = `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`;

            // Ensure context has everything we need
            if (!context.client) context.client = {};
            if (!context.client.clientName) context.client.clientName = 'WEB';
            if (!context.client.clientVersion) context.client.clientVersion = '2.20251204.01.00';

            const payload = {
                context: context,
                continuation: continuationToken
            };

            console.log('[Pagination] Making API request to:', url);
            console.log('[Pagination] Request payload:', JSON.stringify(payload, null, 2).substring(0, 500));

            const headers = {
                'Content-Type': 'application/json',
                'X-YouTube-Client-Name': '1',
                'X-YouTube-Client-Version': context.client.clientVersion,
                'X-Goog-AuthUser': sessionIndex,
                'X-Origin': origin,
                'Origin': origin,
            };

            if (authHeader) {
                headers['Authorization'] = authHeader;
            }

            // Include credentials and necessary headers for authentication
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                credentials: 'include', // Important: include cookies for authentication
                body: JSON.stringify(payload)
            });

            console.log('[Pagination] API response status:', response.status);

            if (!response.ok) {
                console.error('[Pagination] Failed to fetch next page - status:', response.status);
                const responseText = await response.text();
                console.error('[Pagination] Response body:', responseText.substring(0, 500));
                return { videos: [], continuationToken: null };
            }

            const data = await response.json();
            console.log('[Pagination] Response data keys:', Object.keys(data));

            const continuationItems = data.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems;

            if (!continuationItems) {
                console.log('[Pagination] No continuationItems in response');
                console.log('[Pagination] Full response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
                return { videos: [], continuationToken: null };
            }

            console.log('[Pagination] Found continuationItems, count:', continuationItems.length);
            const videos = parseVideoItems(continuationItems);
            console.log('[Pagination] Parsed videos from this page:', videos.length);

            const nextToken = extractContinuationToken(continuationItems);

            return { videos, continuationToken: nextToken };
        } catch (e) {
            console.error('[Pagination] Error fetching next page:', e);
            console.error('[Pagination] Error stack:', e.stack);
            return { videos: [], continuationToken: null };
        }
    }

    // Extract all videos with pagination
    async function extractAllVideos() {
        console.log('[Pagination] ========== Starting extractAllVideos ==========');
        let allVideos = [];
        let pageCount = 1;
        let cancelled = false;
        let lastFetchTime = Date.now(); // Track time of last page fetch

        // Listen for cancellation request
        const cancelHandler = () => {
            console.log('[Pagination] Cancellation requested by user');
            cancelled = true;
        };
        window.addEventListener('YT_WL_CANCEL_SYNC', cancelHandler, { once: true });

        try {
            // Extract first page from initial data
            const initialData = window.ytInitialData;
            if (!initialData) {
                console.error('[Pagination] No ytInitialData found');
                return allVideos;
            }
            console.log('[Pagination] Found ytInitialData');

            const tabs = initialData.contents?.twoColumnBrowseResultsRenderer?.tabs;
            const tab = tabs?.find(t => t.tabRenderer?.selected);
            const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
            const itemSection = contents?.find(c => c.itemSectionRenderer)?.itemSectionRenderer;
            const playlistVideoList = itemSection?.contents?.find(c => c.playlistVideoListRenderer)?.playlistVideoListRenderer;
            const videoItems = playlistVideoList?.contents;

            if (!videoItems) {
                console.error('[Pagination] No video items found in initial data');
                return allVideos;
            }

            console.log(`[Pagination] Found ${videoItems.length} items in initial data`);

            // Parse first page
            const firstPageVideos = parseVideoItems(videoItems);
            allVideos = allVideos.concat(firstPageVideos);
            console.log(`[Pagination] Page ${pageCount}: Extracted ${firstPageVideos.length} videos (Total: ${allVideos.length})`);

            // Dispatch progress event
            window.dispatchEvent(new CustomEvent('YT_WL_EXTRACT_PROGRESS', {
                detail: { page: pageCount, totalVideos: allVideos.length }
            }));

            // Extract continuation token
            let continuationToken = extractContinuationToken(videoItems);
            console.log(`[Pagination] Initial continuation token: ${continuationToken ? 'EXISTS' : 'NULL'}`);

            // Fetch remaining pages
            while (continuationToken && !cancelled) {
                pageCount++;

                // Log fetch timing
                const now = Date.now();
                const secondsSinceLastFetch = ((now - lastFetchTime) / 1000).toFixed(2);
                const isoTime = new Date(now).toISOString();
                console.log(`(${isoTime}) Fetching page ${pageCount} after ${secondsSinceLastFetch} seconds.`);
                lastFetchTime = now;

                const pageResult = await fetchNextPage(continuationToken);
                console.log(`[Pagination] Page ${pageCount} result: ${pageResult.videos.length} videos, next token: ${pageResult.continuationToken ? 'EXISTS' : 'NULL'}`);

                if (pageResult.videos.length > 0) {
                    allVideos = allVideos.concat(pageResult.videos);
                    console.log(`[Pagination] Page ${pageCount}: Extracted ${pageResult.videos.length} videos (Total: ${allVideos.length})`);

                    // Dispatch progress event
                    window.dispatchEvent(new CustomEvent('YT_WL_EXTRACT_PROGRESS', {
                        detail: { page: pageCount, totalVideos: allVideos.length }
                    }));
                } else {
                    console.log(`[Pagination] Page ${pageCount}: No videos extracted, stopping pagination`);
                }

                continuationToken = pageResult.continuationToken;
                if (!continuationToken) {
                    console.log('[Pagination] No more continuation token, pagination complete');
                    break;
                }

                // Check for cancellation
                if (cancelled) {
                    console.log('[Pagination] Sync cancelled by user - stopping pagination');
                    break;
                }

                // Safety check: stop after 100 pages (unlikely to have 10,000+ videos)
                if (pageCount >= 100) {
                    console.warn('[Pagination] Reached maximum page limit (100 pages)');
                    break;
                }

                // Randomized delay (1-2.5 seconds) to appear more human-like
                const delay = 1000 + Math.random() * 1500;
                console.log(`[Pagination] Waiting ${Math.round(delay)}ms before next page...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            if (cancelled) {
                console.log(`[Pagination] ========== Sync cancelled! Partial sync: ${allVideos.length} videos across ${pageCount} pages ==========`);
            } else {
                console.log(`[Pagination] ========== Extraction complete! Total videos: ${allVideos.length} across ${pageCount} pages ==========`);
            }

            // Add playlist indices to maintain YouTube playlist order
            allVideos = allVideos.map((video, index) => ({
                ...video,
                playlistIndex: index
            }));
        } catch (e) {
            console.error('[Pagination] Error extracting all videos:', e);
            console.error('[Pagination] Error stack:', e.stack);
        } finally {
            // Clean up event listener
            window.removeEventListener('YT_WL_CANCEL_SYNC', cancelHandler);
        }

        return { videos: allVideos, cancelled };
    }

    // Listen for extraction request from content script
    window.addEventListener('YT_WL_EXTRACT_REQUEST', async function () {
        console.log('Received extract request in page context');

        const result = await extractAllVideos();
        console.log('Extracted all videos in page context:', result.videos.length);

        // Send data back to content script via custom event
        // syncComplete is true only if extraction completed without cancellation
        window.dispatchEvent(new CustomEvent('YT_WL_EXTRACT_RESPONSE', {
            detail: {
                videos: result.videos,
                syncComplete: !result.cancelled
            }
        }));
    });

    console.log('Injected script ready and listening for extraction requests');
})();
