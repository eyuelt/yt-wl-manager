// inject.js - Runs in page context to access window.ytInitialData

(function() {
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

    function extractVideosFromData() {
        let videos = [];
        try {
            const initialData = window.ytInitialData;
            if (initialData) {
                const tabs = initialData.contents?.twoColumnBrowseResultsRenderer?.tabs;
                const tab = tabs?.find(t => t.tabRenderer?.selected);
                const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
                const itemSection = contents?.find(c => c.itemSectionRenderer)?.itemSectionRenderer;
                const playlistVideoList = itemSection?.contents?.find(c => c.playlistVideoListRenderer)?.playlistVideoListRenderer;
                const videoItems = playlistVideoList?.contents;

                if (videoItems) {
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
                }
            }
        } catch (e) {
            console.error('Error extracting videos from data:', e);
        }
        return videos;
    }

    // Listen for extraction request from content script
    window.addEventListener('YT_WL_EXTRACT_REQUEST', function() {
        console.log('Received extract request in page context');
        const videos = extractVideosFromData();
        console.log('Extracted videos in page context:', videos.length);

        // Send data back to content script via custom event
        // TODO: When pagination is re-implemented, set syncComplete to true only after all pages are fetched
        // For now, treating first page as complete sync
        window.dispatchEvent(new CustomEvent('YT_WL_EXTRACT_RESPONSE', {
            detail: {
                videos: videos,
                syncComplete: true
            }
        }));
    });

    console.log('Injected script ready and listening for extraction requests');
})();
