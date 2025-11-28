import React from 'react';
import { useVideoContext } from '../context/VideoContext';
import VideoCard from './VideoCard';

const VideoGrid = () => {
    const { filteredVideos } = useVideoContext();

    if (filteredVideos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-xl">No videos found in this category.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {filteredVideos.map(video => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
};

export default VideoGrid;
