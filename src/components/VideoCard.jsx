import React, { useState } from 'react';
import { useVideoContext } from '../context/VideoContext';
import { Plus, X, ExternalLink, Check, Copy } from 'lucide-react';

const VideoCard = ({ video, index }) => {
    const { tags, addTag, removeTag, getTagColor, selectionMode, selectedVideos, toggleVideoSelection, toggleSelectionMode, debugMode, showToast, isReadOnly } = useVideoContext();
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    const videoTags = tags[video.id] || [];
    const isSelected = selectedVideos.has(video.id);

    const handleCardClick = (e) => {
        if (selectionMode) {
            e.preventDefault();
            toggleVideoSelection(video.id, index, e.shiftKey);
        } else {
            // Not in selection mode - enter selection mode and select this video
            e.preventDefault();
            toggleSelectionMode();
            // Need to select after mode is toggled, using setTimeout to allow state update
            setTimeout(() => {
                toggleVideoSelection(video.id, index, false);
            }, 0);
        }
    };

    const handleThumbnailClick = (e) => {
        if (selectionMode) {
            // In selection mode, thumbnail click should select
            e.preventDefault();
        } else {
            // Not in selection mode, let the link work normally
            e.stopPropagation(); // Prevent card click handler
        }
    };

    const handleAddTag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (newTag.trim()) {
            addTag(video.id, newTag.trim());
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    const handleCopyVideoId = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(video.id);
            showToast('Video ID copied to clipboard');
        } catch (err) {
            console.error('Failed to copy video ID:', err);
            showToast('Failed to copy video ID', 'error');
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Get the highest resolution thumbnail available
    const thumbnail = video.thumbnails ? video.thumbnails[video.thumbnails.length - 1].url : '';

    return (
        <div
            className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 flex flex-col ${
                selectionMode ? 'cursor-pointer select-none' : ''
            } ${
                isSelected ? 'ring-4 ring-red-600' : 'hover:shadow-xl'
            }`}
            onClick={handleCardClick}
        >
            <div className="relative group">
                {selectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                        <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                            isSelected
                                ? 'bg-red-600 border-red-600'
                                : 'bg-gray-900/80 border-gray-400'
                        }`}>
                            {isSelected && <Check size={16} className="text-white" />}
                        </div>
                    </div>
                )}
                <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={handleThumbnailClick}
                >
                    <img src={thumbnail} alt={video.title} className={`w-full aspect-video object-cover transition-opacity ${
                        selectionMode ? 'opacity-60' : ''
                    }`} />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                    </div>
                    {!selectionMode && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ExternalLink className="text-white w-8 h-8 drop-shadow-lg" />
                        </div>
                    )}
                </a>
            </div>

            <div className="p-3 sm:p-4 flex-1 flex flex-col relative">
                <h3 className="text-white font-semibold text-base sm:text-lg leading-tight mb-1 sm:mb-2 select-text truncate" title={video.title}>
                    {video.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 select-text truncate">{video.channel}</p>

                <div className="mt-auto">
                    <div className="flex flex-wrap gap-2">
                        {videoTags.map(tag => (
                            <span
                                key={tag}
                                className="text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                style={{ backgroundColor: getTagColor(tag) }}
                            >
                                {tag}
                                {!selectionMode && !isReadOnly && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeTag(video.id, tag);
                                        }}
                                        className="hover:text-white/80"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </span>
                        ))}
                        {!selectionMode && !isReadOnly && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAddingTag(!isAddingTag);
                                }}
                                className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full hover:bg-gray-600 flex items-center"
                            >
                                <Plus size={12} />
                            </button>
                        )}
                    </div>

                    {isAddingTag && (
                        <form onSubmit={handleAddTag} onClick={(e) => e.stopPropagation()} className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="New tag..."
                                className="bg-gray-700 text-white text-xs px-2 py-1 rounded flex-1 outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                            />
                            <button type="submit" className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-500">
                                Add
                            </button>
                        </form>
                    )}
                </div>

                {debugMode && (
                    <div
                        className="absolute bottom-2 right-2 flex items-center gap-1 text-gray-500 text-xs font-mono"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="select-text">{video.id}</span>
                        <button
                            onClick={handleCopyVideoId}
                            className="hover:text-gray-300 transition-colors"
                            title="Copy video ID"
                        >
                            <Copy size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCard;
