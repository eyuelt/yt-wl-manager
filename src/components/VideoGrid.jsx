import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckSquare, RefreshCw } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';
import VideoCard from './VideoCard';
import SearchBar from './SearchBar';

const VideoGrid = () => {
    const { filteredVideos, selectionMode, toggleSelectionMode, syncVideos, cancelSync, isSyncing } = useVideoContext();
    const parentRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const [columnCount, setColumnCount] = useState(4);
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);

    // Update column count based on container width
    const updateColumns = useCallback((element) => {
        if (!element) return;
        const width = element.offsetWidth;
        if (width < 640) setColumnCount(1);      // sm
        else if (width < 1024) setColumnCount(2); // lg
        else if (width < 1280) setColumnCount(3); // xl
        else setColumnCount(4);                   // 2xl+
    }, []);

    // Handle scroll shadows
    const handleScroll = useCallback(() => {
        if (!parentRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
        setShowTopShadow(scrollTop > 0);
        setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
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
                handleScroll(); // Check shadows on resize
            });
            resizeObserverRef.current.observe(element);

            // Set up scroll listener
            element.addEventListener('scroll', handleScroll);
            handleScroll(); // Initial check
        }

        return () => {
            if (element) {
                element.removeEventListener('scroll', handleScroll);
            }
        };
    }, [updateColumns, handleScroll]);

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

    return (
        <div className="h-screen flex flex-col">
            {/* Search Bar Header */}
            <div className="flex-none p-6 pb-4 border-b border-gray-800">
                <div className="flex items-center justify-between gap-8">
                    <SearchBar />
                    <div className="flex gap-3 flex-shrink-0">
                        <button
                            onClick={toggleSelectionMode}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                selectionMode
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                            }`}
                        >
                            <CheckSquare size={20} />
                            {selectionMode ? 'Cancel' : 'Select'}
                        </button>
                        <button
                            onClick={isSyncing ? cancelSync : syncVideos}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                                isSyncing
                                    ? 'bg-orange-600 hover:bg-orange-700'
                                    : 'bg-red-600 hover:bg-red-700'
                            } text-white`}
                        >
                            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Cancel' : 'Sync'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Video Grid */}
            {filteredVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <p className="text-xl">No videos found.</p>
                </div>
            ) : (
                <div ref={setParentRef} className="flex-1 overflow-auto p-6 relative [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {/* Top shadow */}
                    <div className={`fixed top-[73px] left-64 right-0 h-12 pointer-events-none transition-opacity duration-300 z-10 ${
                        showTopShadow ? 'opacity-100' : 'opacity-0'
                    }`} style={{ background: 'linear-gradient(to bottom, rgba(3, 7, 18, 0.95), transparent)' }} />

                    {/* Bottom shadow */}
                    <div className={`fixed bottom-0 left-64 right-0 h-12 pointer-events-none transition-opacity duration-300 z-10 ${
                        showBottomShadow ? 'opacity-100' : 'opacity-0'
                    }`} style={{ background: 'linear-gradient(to top, rgba(3, 7, 18, 0.95), transparent)' }} />
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
                                className="grid gap-6 select-none"
                                style={{
                                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
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
            )}
        </div>
    );
};

export default VideoGrid;
