import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import wlData from '../../wl.json';
import { autoTag } from '../utils/autoTag';
import dataStore from '../utils/dataStore';

const VideoContext = createContext();

export const useVideoContext = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    const [videos, setVideos] = useState([]);
    const [tags, setTags] = useState({}); // { videoId: ['tag1', 'tag2'] }
    const [allTags, setAllTags] = useState(new Set());
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [tagMetadata, setTagMetadata] = useState({}); // { tagName: { color: '#hex' } }
    const [isSyncing, setIsSyncing] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    // Refs to store sync operation IDs for cancellation
    const syncIntervalRef = useRef(null);
    const syncTimeoutRef = useRef(null);

    // Helper function to perform delta sync
    const performDeltaSync = async (existingVideos, existingTags, newVideos, syncComplete) => {
        const now = Date.now();
        const newVideosMap = new Map(newVideos.map(v => [v.id, v]));
        const updatedVideos = [];
        const updatedTags = { ...existingTags };
        const newAllTags = new Set();

        // Process existing videos
        for (const video of existingVideos) {
            if (newVideosMap.has(video.id)) {
                // Video still exists - update metadata but preserve tags and archived status
                const newVideoData = newVideosMap.get(video.id);
                updatedVideos.push({
                    ...newVideoData,
                    archived: false, // Un-archive if it was archived
                    archivedAt: null,
                    lastSeenAt: now,
                    // Preserve any additional fields from existing video
                    addedAt: video.addedAt
                });
                newVideosMap.delete(video.id); // Mark as processed
            } else if (syncComplete && !video.archived) {
                // Video not in sync AND sync is complete AND not already archived - archive it
                updatedVideos.push({
                    ...video,
                    archived: true,
                    archivedAt: now
                });
            } else {
                // Keep video as-is (either sync incomplete or already archived)
                updatedVideos.push(video);
            }

            // Keep existing tags
            if (updatedTags[video.id]) {
                updatedTags[video.id].forEach(tag => newAllTags.add(tag));
            }
        }

        // Process truly new videos (not in existing videos)
        for (const [videoId, newVideo] of newVideosMap) {
            updatedVideos.push({
                ...newVideo,
                archived: false,
                lastSeenAt: now,
                addedAt: newVideo.addedAt || now
            });

            // Auto-tag new videos
            const autoTags = autoTag(newVideo);
            if (autoTags.length > 0) {
                updatedTags[videoId] = autoTags;
                autoTags.forEach(tag => newAllTags.add(tag));
            }
        }

        return { updatedVideos, updatedTags, newAllTags };
    };

    useEffect(() => {
        // Load initial data from dataStore
        const loadInitialData = async () => {
            let initialVideos = await dataStore.getVideos();

            if (initialVideos.length === 0) {
                // No saved data, use wl.json
                initialVideos = wlData.entries || [];
                await dataStore.setVideos(initialVideos);
            }

            // Ensure all videos have the new fields (migration for existing data)
            const now = Date.now();
            initialVideos = initialVideos.map(video => ({
                ...video,
                archived: video.archived ?? false,
                lastSeenAt: video.lastSeenAt ?? now,
                archivedAt: video.archivedAt ?? null
            }));

            setVideos(initialVideos);

            // Load tags
            let savedTags = await dataStore.getTags();
            const savedMetadata = await dataStore.getTagMetadata();

            if (Object.keys(savedTags).length === 0) {
                // Run auto-tagging if no saved tags
                const initialTags = {};
                const newAllTags = new Set();

                initialVideos.forEach(video => {
                    const tags = autoTag(video);
                    if (tags.length > 0) {
                        initialTags[video.id] = tags;
                        tags.forEach(tag => newAllTags.add(tag));
                    }
                });

                setTags(initialTags);
                setAllTags(newAllTags);
                await dataStore.setTags(initialTags);
                savedTags = initialTags;
            } else {
                setTags(savedTags);

                // Reconstruct allTags set
                const newAllTags = new Set();
                Object.values(savedTags).forEach(videoTags => {
                    videoTags.forEach(tag => newAllTags.add(tag));
                });
                setAllTags(newAllTags);
            }

            setTagMetadata(savedMetadata);
        };

        loadInitialData();

        // Message listener for sync
        const handleMessage = async (event) => {
            if (event.data && event.data.type === 'YT_WL_SYNC') {
                const newVideos = event.data.videos;
                const syncComplete = event.data.syncComplete || false;
                console.log('Received synced videos:', newVideos.length, 'syncComplete:', syncComplete);

                // Perform delta sync
                const { updatedVideos, updatedTags, newAllTags } = await performDeltaSync(
                    videos,
                    tags,
                    newVideos,
                    syncComplete
                );

                // Update state and storage
                setVideos(updatedVideos);
                setTags(updatedTags);
                setAllTags(newAllTags);
                await dataStore.setVideos(updatedVideos);
                await dataStore.setTags(updatedTags);

                console.log(`Sync complete: ${updatedVideos.length} total videos (${updatedVideos.filter(v => v.archived).length} archived)`);
            }
        };

        // Subscribe to dataStore changes (for cross-tab sync)
        const unsubscribe = dataStore.subscribe(async ({ key, value }) => {
            if (key === dataStore.KEYS.VIDEOS && value) {
                setVideos(value);
            } else if (key === dataStore.KEYS.TAGS && value) {
                setTags(value);
                // Reconstruct allTags
                const newAllTags = new Set();
                Object.values(value).forEach(videoTags => {
                    videoTags.forEach(tag => newAllTags.add(tag));
                });
                setAllTags(newAllTags);
            } else if (key === dataStore.KEYS.TAG_METADATA && value) {
                setTagMetadata(value);
            }
        });

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
            unsubscribe();
        };
    }, []);

    const cancelSync = () => {
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = null;
        }
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
            syncTimeoutRef.current = null;
        }
        setIsSyncing(false);
    };

    const syncVideos = () => {
        // IMPORTANT: Replace this with your actual extension ID from chrome://extensions/
        const EXTENSION_ID = 'aiokgdfhinicjhknkhadpppmgmbnlhap';  // TODO(eyuel)

        // Set syncing state
        setIsSyncing(true);

        // Open YouTube Watch Later page
        window.open(
            'https://www.youtube.com/playlist?list=WL&auto_sync=true',
            'YouTubeWL'
        );

        // Poll the extension for synced data
        syncIntervalRef.current = setInterval(() => {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage(
                    EXTENSION_ID,
                    { type: 'GET_YT_WL_DATA' },
                    async (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn('Extension not responding:', chrome.runtime.lastError.message);
                            return;
                        }

                        if (response && response.success && response.videos) {
                            const newVideos = response.videos;
                            const syncComplete = response.syncComplete || false;
                            console.log('Received synced videos from extension:', newVideos.length, 'syncComplete:', syncComplete);

                            // Perform delta sync
                            const { updatedVideos, updatedTags, newAllTags } = await performDeltaSync(
                                videos,
                                tags,
                                newVideos,
                                syncComplete
                            );

                            // Update state and storage
                            setVideos(updatedVideos);
                            setTags(updatedTags);
                            setAllTags(newAllTags);
                            await dataStore.setVideos(updatedVideos);
                            await dataStore.setTags(updatedTags);

                            const archivedCount = updatedVideos.filter(v => v.archived).length;
                            console.log(`Sync complete: ${updatedVideos.length} total videos (${archivedCount} archived)`);

                            // Clear the interval once we've received the data
                            clearInterval(syncIntervalRef.current);
                            clearTimeout(syncTimeoutRef.current);
                            syncIntervalRef.current = null;
                            syncTimeoutRef.current = null;
                            setIsSyncing(false);
                            alert(`Successfully synced ${newVideos.length} videos from YouTube! Total: ${updatedVideos.length} (${archivedCount} archived)`);
                        }
                    }
                );
            } else {
                console.warn('Chrome extension API not available.');
                clearInterval(syncIntervalRef.current);
                clearTimeout(syncTimeoutRef.current);
                syncIntervalRef.current = null;
                syncTimeoutRef.current = null;
                setIsSyncing(false);
            }
        }, 1000); // Poll every second

        // Stop polling after 30 seconds
        syncTimeoutRef.current = setTimeout(() => {
            clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = null;
            syncTimeoutRef.current = null;
            setIsSyncing(false);
        }, 30000);
    };

    const addTag = async (videoId, tag) => {
        const newTags = { ...tags };
        if (!newTags[videoId]) {
            newTags[videoId] = [];
        }
        if (!newTags[videoId].includes(tag)) {
            newTags[videoId].push(tag);
            setTags(newTags);
            await dataStore.setTags(newTags);

            setAllTags(prev => new Set(prev).add(tag));
        }
    };

    const removeTag = async (videoId, tag) => {
        const newTags = { ...tags };
        if (newTags[videoId]) {
            newTags[videoId] = newTags[videoId].filter(t => t !== tag);
            if (newTags[videoId].length === 0) {
                delete newTags[videoId];
            }
            setTags(newTags);
            await dataStore.setTags(newTags);

            // Re-calculate all tags to see if we should remove it from the list
            // (Optional: keeping it in allTags might be better for UX)
        }
    };

    const updateTagColor = async (tag, color) => {
        const newMetadata = { ...tagMetadata };
        newMetadata[tag] = { ...newMetadata[tag], color };
        setTagMetadata(newMetadata);
        await dataStore.setTagMetadata(newMetadata);
    };

    const getTagColor = (tag) => {
        return tagMetadata[tag]?.color || '#2563EB'; // Default to blue-600
    };

    const resetToWlJson = async () => {
        // Clear all data
        await dataStore.clear();

        // Reload from wl.json
        const initialVideos = wlData.entries || [];
        setVideos(initialVideos);
        await dataStore.setVideos(initialVideos);

        // Re-run auto-tagging
        const initialTags = {};
        const newAllTags = new Set();

        initialVideos.forEach(video => {
            const tags = autoTag(video);
            if (tags.length > 0) {
                initialTags[video.id] = tags;
                tags.forEach(tag => newAllTags.add(tag));
            }
        });

        setTags(initialTags);
        setAllTags(newAllTags);
        setTagMetadata({});
        await dataStore.setTags(initialTags);
        await dataStore.setTagMetadata({});

        alert('Data reset to wl.json successfully!');
    };

    const filteredVideos = videos.filter(video => {
        // Handle "Archived" category
        if (selectedCategory === 'Archived') {
            return video.archived === true;
        }

        // For all other categories, exclude archived videos unless showArchived is true
        if (video.archived && !showArchived) {
            return false;
        }

        // Apply category filter
        if (selectedCategory === 'All') return true;
        if (selectedCategory === 'Uncategorized') {
            return !tags[video.id] || tags[video.id].length === 0;
        }
        return tags[video.id]?.includes(selectedCategory);
    });

    return (
        <VideoContext.Provider value={{
            videos,
            filteredVideos,
            tags,
            allTags: Array.from(allTags),
            tagMetadata,
            selectedCategory,
            setSelectedCategory,
            addTag,
            removeTag,
            updateTagColor,
            getTagColor,
            syncVideos,
            cancelSync,
            resetToWlJson,
            isSyncing,
            showArchived,
            setShowArchived
        }}>
            {children}
        </VideoContext.Provider>
    );
};
