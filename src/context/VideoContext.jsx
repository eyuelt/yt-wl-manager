import React, { createContext, useState, useEffect, useContext } from 'react';
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

    useEffect(() => {
        // Load initial data from dataStore
        const loadInitialData = async () => {
            let initialVideos = await dataStore.getVideos();

            if (initialVideos.length === 0) {
                // No saved data, use wl.json
                initialVideos = wlData.entries || [];
                await dataStore.setVideos(initialVideos);
            }

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
                console.log('Received synced videos:', event.data.videos);
                const newVideos = event.data.videos;
                setVideos(newVideos);
                await dataStore.setVideos(newVideos);

                // Re-run auto-tagging for new videos
                const initialTags = {};
                const newAllTags = new Set();

                newVideos.forEach(video => {
                    // Keep existing tags if any
                    if (tags[video.id]) {
                        initialTags[video.id] = tags[video.id];
                        tags[video.id].forEach(tag => newAllTags.add(tag));
                    } else {
                        const newTags = autoTag(video);
                        if (newTags.length > 0) {
                            initialTags[video.id] = newTags;
                            newTags.forEach(tag => newAllTags.add(tag));
                        }
                    }
                });

                setTags(initialTags);
                setAllTags(newAllTags);
                await dataStore.setTags(initialTags);
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

    const syncVideos = () => {
        // IMPORTANT: Replace this with your actual extension ID from chrome://extensions/
        const EXTENSION_ID = 'aiokgdfhinicjhknkhadpppmgmbnlhap';  // TODO(eyuel)

        // Open YouTube Watch Later page
        window.open(
            'https://www.youtube.com/playlist?list=WL&auto_sync=true',
            'YouTubeWL'
        );

        // Poll the extension for synced data
        const pollInterval = setInterval(() => {
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
                            console.log('Received synced videos from extension:', response.videos);
                            const newVideos = response.videos;
                            setVideos(newVideos);
                            await dataStore.setVideos(newVideos);

                            // Re-run auto-tagging
                            const newTags = {};
                            const newAllTags = new Set();

                            newVideos.forEach(video => {
                                if (tags[video.id]) {
                                    newTags[video.id] = tags[video.id];
                                    tags[video.id].forEach(tag => newAllTags.add(tag));
                                } else {
                                    const autoTags = autoTag(video);
                                    if (autoTags.length > 0) {
                                        newTags[video.id] = autoTags;
                                        autoTags.forEach(tag => newAllTags.add(tag));
                                    }
                                }
                            });

                            setTags(newTags);
                            setAllTags(newAllTags);
                            await dataStore.setTags(newTags);

                            // Clear the interval once we've received the data
                            clearInterval(pollInterval);
                            alert(`Successfully synced ${newVideos.length} videos!`);
                        }
                    }
                );
            } else {
                console.warn('Chrome extension API not available.');
                clearInterval(pollInterval);
            }
        }, 1000); // Poll every second

        // Stop polling after 30 seconds
        setTimeout(() => {
            clearInterval(pollInterval);
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
            resetToWlJson
        }}>
            {children}
        </VideoContext.Provider>
    );
};
