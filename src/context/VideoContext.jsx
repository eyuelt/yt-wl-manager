import React, { createContext, useState, useEffect, useContext } from 'react';
import wlData from '../../wl.json';
import { autoTag } from '../utils/autoTag';

const VideoContext = createContext();

export const useVideoContext = () => useContext(VideoContext);

export const VideoProvider = ({ children }) => {
    const [videos, setVideos] = useState([]);
    const [tags, setTags] = useState({}); // { videoId: ['tag1', 'tag2'] }
    const [allTags, setAllTags] = useState(new Set());
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [tagMetadata, setTagMetadata] = useState({}); // { tagName: { color: '#hex' } }

    useEffect(() => {
        // Load initial data
        const savedData = localStorage.getItem('yt-wl-data');
        let initialVideos = [];

        if (savedData) {
            try {
                initialVideos = JSON.parse(savedData);
            } catch (e) {
                console.error('Failed to parse saved video data', e);
                initialVideos = wlData.entries || [];
            }
        } else {
            initialVideos = wlData.entries || [];
        }

        setVideos(initialVideos);

        // Load tags from local storage
        const savedTags = localStorage.getItem('yt-wl-tags');
        const savedMetadata = localStorage.getItem('yt-wl-tag-metadata');

        let parsedTags = {};
        let parsedMetadata = {};

        if (savedMetadata) {
            parsedMetadata = JSON.parse(savedMetadata);
        }

        if (savedTags) {
            parsedTags = JSON.parse(savedTags);
            setTags(parsedTags);

            // Reconstruct allTags set
            const newAllTags = new Set();
            Object.values(parsedTags).forEach(videoTags => {
                videoTags.forEach(tag => newAllTags.add(tag));
            });
            setAllTags(newAllTags);
        } else {
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
            localStorage.setItem('yt-wl-tags', JSON.stringify(initialTags));
            parsedTags = initialTags;
        }

        setTagMetadata(parsedMetadata);

        // Message listener for sync
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'YT_WL_SYNC') {
                console.log('Received synced videos:', event.data.videos);
                const newVideos = event.data.videos;
                setVideos(newVideos);
                localStorage.setItem('yt-wl-data', JSON.stringify(newVideos));

                // Re-run auto-tagging for new videos? 
                // For now, let's just keep existing tags and maybe auto-tag new ones if we want to be fancy.
                // But simple replacement is safer for now to avoid duplicates.
                // Actually, we should probably merge or re-evaluate tags.
                // Let's just re-run auto-tagging for the new set for simplicity in this iteration.
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
                localStorage.setItem('yt-wl-tags', JSON.stringify(initialTags));
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
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
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn('Extension not responding:', chrome.runtime.lastError.message);
                            return;
                        }

                        if (response && response.success && response.videos) {
                            console.log('Received synced videos from extension:', response.videos);
                            const newVideos = response.videos;
                            setVideos(newVideos);
                            localStorage.setItem('yt-wl-data', JSON.stringify(newVideos));

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
                            localStorage.setItem('yt-wl-tags', JSON.stringify(newTags));

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

    const addTag = (videoId, tag) => {
        const newTags = { ...tags };
        if (!newTags[videoId]) {
            newTags[videoId] = [];
        }
        if (!newTags[videoId].includes(tag)) {
            newTags[videoId].push(tag);
            setTags(newTags);
            localStorage.setItem('yt-wl-tags', JSON.stringify(newTags));

            setAllTags(prev => new Set(prev).add(tag));
        }
    };

    const removeTag = (videoId, tag) => {
        const newTags = { ...tags };
        if (newTags[videoId]) {
            newTags[videoId] = newTags[videoId].filter(t => t !== tag);
            if (newTags[videoId].length === 0) {
                delete newTags[videoId];
            }
            setTags(newTags);
            localStorage.setItem('yt-wl-tags', JSON.stringify(newTags));

            // Re-calculate all tags to see if we should remove it from the list
            // (Optional: keeping it in allTags might be better for UX)
        }
    };

    const updateTagColor = (tag, color) => {
        const newMetadata = { ...tagMetadata };
        newMetadata[tag] = { ...newMetadata[tag], color };
        setTagMetadata(newMetadata);
        localStorage.setItem('yt-wl-tag-metadata', JSON.stringify(newMetadata));
    };

    const getTagColor = (tag) => {
        return tagMetadata[tag]?.color || '#2563EB'; // Default to blue-600
    };

    const resetToWlJson = () => {
        // Clear all localStorage data
        localStorage.removeItem('yt-wl-data');
        localStorage.removeItem('yt-wl-tags');
        localStorage.removeItem('yt-wl-tag-metadata');

        // Reload from wl.json
        const initialVideos = wlData.entries || [];
        setVideos(initialVideos);

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
        localStorage.setItem('yt-wl-tags', JSON.stringify(initialTags));

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
