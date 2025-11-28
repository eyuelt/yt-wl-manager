import React, { useState } from 'react';
import { useVideoContext } from '../context/VideoContext';
import { Plus, X, ExternalLink } from 'lucide-react';

const VideoCard = ({ video }) => {
    const { tags, addTag, removeTag, getTagColor } = useVideoContext();
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    const videoTags = tags[video.id] || [];

    const handleAddTag = (e) => {
        e.preventDefault();
        if (newTag.trim()) {
            addTag(video.id, newTag.trim());
            setNewTag('');
            setIsAddingTag(false);
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
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <div className="relative group">
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ExternalLink className="text-white w-8 h-8 drop-shadow-lg" />
                    </div>
                </a>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-white font-semibold text-lg leading-tight mb-2 line-clamp-2" title={video.title}>
                    {video.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{video.channel}</p>

                <div className="mt-auto">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {videoTags.map(tag => (
                            <span
                                key={tag}
                                className="text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                                style={{ backgroundColor: getTagColor(tag) }}
                            >
                                {tag}
                                <button onClick={() => removeTag(video.id, tag)} className="hover:text-white/80">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={() => setIsAddingTag(!isAddingTag)}
                            className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full hover:bg-gray-600 flex items-center"
                        >
                            <Plus size={12} />
                        </button>
                    </div>

                    {isAddingTag && (
                        <form onSubmit={handleAddTag} className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
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
            </div>
        </div>
    );
};

export default VideoCard;
