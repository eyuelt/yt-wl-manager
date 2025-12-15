import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useVideoContext } from '../context/VideoContext';
import VideoCard from './VideoCard';
import ScrollView from './ScrollView';

const VideoGrid = () => {
    const { filteredVideos } = useVideoContext();
    const scrollViewRef = useRef(null);
    const contentRef = useRef(null);
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
    const setContentRef = useCallback((element) => {
        // Clean up previous observer
        if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
        }

        contentRef.current = element;

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

    // Create virtualizer for rows with dynamic measurement
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollViewRef.current,
        estimateSize: () => 400, // Initial estimate (card height + gap)
        overscan: 2, // Render 2 extra rows above and below viewport
        measureElement: (element) => element?.getBoundingClientRect().height ?? 400, // Measure actual height
    });

    // Force remeasure when column count changes
    useEffect(() => {
        rowVirtualizer.measure();
    }, [columnCount, rowVirtualizer]);

    return (
        <div className="flex-1 min-h-0 flex flex-col">
            {/* Video Grid */}
            {filteredVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <p className="text-xl">No videos found.</p>
                </div>
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    shadowColor="rgba(3, 7, 18, 0.7)"
                    shadowSize={40}
                >
                    <div ref={setContentRef} className="p-3 sm:p-6">
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
                                        data-index={virtualRow.index}
                                        ref={rowVirtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div
                                            className="grid gap-3 sm:gap-6 mb-3 sm:mb-6 select-none"
                                            style={{
                                                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
                                            }}
                                        >
                                            {rowVideos.map((video, colIndex) => {
                                                const videoIndex = startIndex + colIndex;
                                                return (
                                                    <VideoCard key={video.id} video={video} index={videoIndex} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollView>
            )}
        </div>
    );
};

export default VideoGrid;
