import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useVideoContext } from '../context/VideoContext';
import VideoCard from './VideoCard';

const VideoGrid = () => {
    const { filteredVideos } = useVideoContext();
    const parentRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const [columnCount, setColumnCount] = useState(4);

    // Update column count based on container width
    const updateColumns = useCallback((element) => {
        if (!element) return;
        const width = element.offsetWidth;
        if (width < 640) setColumnCount(1);      // sm
        else if (width < 1024) setColumnCount(2); // lg
        else if (width < 1280) setColumnCount(3); // xl
        else setColumnCount(4);                   // 2xl+
    }, []);

    // Ref callback to set up ResizeObserver when element is attached
    const setParentRef = useCallback((element) => {
        // Clean up previous observer
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }

        parentRef.current = element;

        if (element) {
            // Initial column calculation
            updateColumns(element);

            // Set up ResizeObserver
            resizeObserverRef.current = new ResizeObserver(() => {
                updateColumns(element);
            });
            resizeObserverRef.current.observe(element);
        }
    }, [updateColumns]);

    // Calculate row count - memoize to prevent unnecessary recalculations
    const rowCount = useMemo(
        () => Math.ceil(filteredVideos.length / columnCount),
        [filteredVideos.length, columnCount]
    );

    // Create virtualizer for rows
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 400, // Estimated height of each row (card height + gap)
        overscan: 2, // Render 2 extra rows above and below viewport
    });

    // Force remeasure when column count changes
    useEffect(() => {
        rowVirtualizer.measure();
    }, [columnCount, rowVirtualizer]);

    if (filteredVideos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-xl">No videos found in this category.</p>
            </div>
        );
    }

    return (
        <div ref={setParentRef} className="h-screen overflow-auto p-6">
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
                            <div
                                className="grid gap-6"
                                style={{
                                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                                }}
                            >
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
