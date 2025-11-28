import React, { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useVideoContext } from '../context/VideoContext';
import VideoCard from './VideoCard';

const VideoGrid = () => {
    const { filteredVideos } = useVideoContext();
    const parentRef = useRef(null);
    const [columnCount, setColumnCount] = useState(4);

    // Update column count based on container width
    useEffect(() => {
        if (!parentRef.current) return;

        const updateColumns = () => {
            const width = parentRef.current.offsetWidth;
            if (width < 640) setColumnCount(1);      // sm
            else if (width < 1024) setColumnCount(2); // lg
            else if (width < 1280) setColumnCount(3); // xl
            else setColumnCount(4);                   // 2xl+
        };

        updateColumns();
        const resizeObserver = new ResizeObserver(updateColumns);
        resizeObserver.observe(parentRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    // Calculate row count
    const rowCount = Math.ceil(filteredVideos.length / columnCount);

    // Create virtualizer for rows
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 400, // Estimated height of each row (card height + gap)
        overscan: 2, // Render 2 extra rows above and below viewport
    });

    if (filteredVideos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-xl">No videos found in this category.</p>
            </div>
        );
    }

    return (
        <div ref={parentRef} className="h-screen overflow-auto p-6">
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const startIndex = virtualRow.index * columnCount;
                    const rowVideos = filteredVideos.slice(startIndex, startIndex + columnCount);

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {rowVideos.map((video) => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VideoGrid;
