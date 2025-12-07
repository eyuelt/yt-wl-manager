import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import wlData from '../../wl.json';
import { autoTag } from '../utils/autoTag';
import dataStore from '../utils/dataStore';
import Toast from '../components/Toast';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedVideos, setSelectedVideos] = useState(new Set());
    const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
    const [toasts, setToasts] = useState([]);

    // Refs to store sync operation IDs for cancellation
    const syncIntervalRef = useRef(null);
    const syncTimeoutRef = useRef(null);

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const closeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

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
                    addedAt: video.addedAt,
                    // playlistIndex comes from newVideoData
                });
                newVideosMap.delete(video.id); // Mark as processed
            } else if (syncComplete && !video.archived) {
                // Video not in sync AND sync is complete AND not already archived - archive it
                updatedVideos.push({
                    ...video,
                    archived: true,
                    archivedAt: now,
                    playlistIndex: null // Clear playlist index for archived videos
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
                addedAt: newVideo.addedAt || now,
                // playlistIndex comes from newVideo
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
                archivedAt: video.archivedAt ?? null,
                // playlistIndex will be undefined for old videos, which is fine
                // They'll be sorted by addedAt as fallback
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
                            showToast(`Successfully synced ${newVideos.length} videos from YouTube! Total: ${updatedVideos.length} (${archivedCount} archived)`);
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

        // Stop polling after 3 minutes (enough time for large syncs with pagination)
        syncTimeoutRef.current = setTimeout(() => {
            clearInterval(syncIntervalRef.current);
            syncIntervalRef.current = null;
            syncTimeoutRef.current = null;
            setIsSyncing(false);
            showToast('Sync timed out after 3 minutes. Please try again.', 'error');
        }, 180000);
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

        showToast('Data reset to wl.json successfully!');
    };

    // Selection functions
    const toggleSelectionMode = () => {
        setSelectionMode(!selectionMode);
        setSelectedVideos(new Set());
        setLastSelectedIndex(null);
    };

    const toggleVideoSelection = (videoId, index, shiftKey = false) => {
        const newSelected = new Set(selectedVideos);

        if (shiftKey && lastSelectedIndex !== null && index !== lastSelectedIndex) {
            // Shift-click: select or deselect range based on clicked video's current state
            const start = Math.min(lastSelectedIndex, index);
            const end = Math.max(lastSelectedIndex, index);
            const shouldSelect = !newSelected.has(videoId); // If clicked video is not selected, select range; otherwise deselect

            for (let i = start; i <= end; i++) {
                if (filteredVideos[i]) {
                    if (shouldSelect) {
                        newSelected.add(filteredVideos[i].id);
                    } else {
                        newSelected.delete(filteredVideos[i].id);
                    }
                }
            }
        } else {
            // Normal click: toggle single video
            if (newSelected.has(videoId)) {
                newSelected.delete(videoId);
            } else {
                newSelected.add(videoId);
            }
        }

        setSelectedVideos(newSelected);
        setLastSelectedIndex(index);
    };

    const clearSelection = () => {
        setSelectedVideos(new Set());
        setLastSelectedIndex(null);
    };

    const archiveSelected = async () => {
        if (selectedVideos.size === 0) return;

        if (!window.confirm(`Archive ${selectedVideos.size} selected videos?`)) {
            return;
        }

        const now = Date.now();
        const updatedVideos = videos.map(video => {
            if (selectedVideos.has(video.id)) {
                return {
                    ...video,
                    archived: true,
                    archivedAt: now
                };
            }
            return video;
        });

        setVideos(updatedVideos);
        await dataStore.setVideos(updatedVideos);
        clearSelection();
        setSelectionMode(false);
        showToast(`${selectedVideos.size} videos archived successfully!`);
    };

    const deleteSelected = async () => {
        if (selectedVideos.size === 0) return;

        if (!window.confirm(`Permanently delete ${selectedVideos.size} selected videos? This cannot be undone.`)) {
            return;
        }

        const updatedVideos = videos.filter(video => !selectedVideos.has(video.id));
        const updatedTags = { ...tags };

        // Remove tags for deleted videos
        selectedVideos.forEach(videoId => {
            delete updatedTags[videoId];
        });

        setVideos(updatedVideos);
        setTags(updatedTags);
        await dataStore.setVideos(updatedVideos);
        await dataStore.setTags(updatedTags);
        clearSelection();
        setSelectionMode(false);
        showToast(`${selectedVideos.size} videos deleted successfully!`);
    };

    const filteredVideos = videos.filter(video => {
        // Handle "Archived" category
        if (selectedCategory === 'Archived') {
            if (video.archived !== true) return false;
        } else {
            // For all other categories, exclude archived videos unless showArchived is true
            if (video.archived && !showArchived) {
                return false;
            }

            // Apply category filter
            if (selectedCategory === 'All') {
                // Continue to search filter
            } else if (selectedCategory === 'Uncategorized') {
                if (tags[video.id] && tags[video.id].length > 0) return false;
            } else {
                if (!tags[video.id]?.includes(selectedCategory)) return false;
            }
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const titleMatch = video.title?.toLowerCase().includes(query);
            const channelMatch = video.channel?.toLowerCase().includes(query);
            return titleMatch || channelMatch;
        }

        return true;
    }).sort((a, b) => {
        // Non-archived videos come before archived videos
        if (a.archived !== b.archived) {
            return a.archived ? 1 : -1; // Non-archived first
        }

        // For non-archived videos, sort by playlist index (YouTube playlist order)
        if (!a.archived && !b.archived) {
            const aIndex = a.playlistIndex ?? Infinity;
            const bIndex = b.playlistIndex ?? Infinity;
            if (aIndex !== bIndex) {
                return aIndex - bIndex; // Ascending order (0 first)
            }
        }

        // For archived videos, sort by when they were archived (most recently archived first)
        if (a.archived && b.archived) {
            const aArchivedAt = a.archivedAt || 0;
            const bArchivedAt = b.archivedAt || 0;
            return bArchivedAt - aArchivedAt; // Descending order (newest first)
        }

        // Fallback to addedAt for videos without playlistIndex
        const aTime = a.addedAt || 0;
        const bTime = b.addedAt || 0;
        return bTime - aTime;
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
            setShowArchived,
            searchQuery,
            setSearchQuery,
            selectionMode,
            toggleSelectionMode,
            selectedVideos,
            toggleVideoSelection,
            clearSelection,
            archiveSelected,
            deleteSelected
        }}>
            {children}
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => closeToast(toast.id)}
                />
            ))}
        </VideoContext.Provider>
    );
};
