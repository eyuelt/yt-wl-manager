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
        const initialVideos = wlData.entries || [];
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
    }, []);

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
            getTagColor
        }}>
            {children}
        </VideoContext.Provider>
    );
};
