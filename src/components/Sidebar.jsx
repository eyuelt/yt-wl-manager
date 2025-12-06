import React, { useState, useRef, useEffect } from 'react';
import { useVideoContext } from '../context/VideoContext';
import { Tag, Hash, Database } from 'lucide-react';
import DataViewer from './DataViewer';

const Sidebar = () => {
    const { allTags, selectedCategory, setSelectedCategory, videos, tags, updateTagColor, getTagColor, resetToWlJson, showArchived, setShowArchived } = useVideoContext();
    const [isDataViewerOpen, setIsDataViewerOpen] = useState(false);
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);
    const navRef = useRef(null);

    const archivedCount = videos.filter(v => v.archived).length;
    const unarchivedCount = videos.filter(v => !v.archived).length;

    // Separate system and custom categories
    const systemCategories = ['All', 'Uncategorized'];
    if (showArchived) systemCategories.push('Archived');
    const customCategories = allTags.sort();

    // Calculate counts for each category
    const getCategoryCount = (category) => {
        if (category === 'All') return unarchivedCount;
        if (category === 'Archived') return archivedCount;
        if (category === 'Uncategorized') {
            return videos.filter(v => !v.archived && (!tags[v.id] || tags[v.id].length === 0)).length;
        }
        // For tag categories, count videos with that tag (excluding archived)
        return videos.filter(v => !v.archived && tags[v.id]?.includes(category)).length;
    };

    // Find max count for bar width calculation (for custom categories only)
    const maxCount = Math.max(...customCategories.map(cat => getCategoryCount(cat)), 1);

    // Handle scroll shadows
    const handleScroll = () => {
        if (!navRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = navRef.current;
        setShowTopShadow(scrollTop > 0);
        setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
    };

    useEffect(() => {
        handleScroll(); // Initial check
        const nav = navRef.current;
        if (nav) {
            nav.addEventListener('scroll', handleScroll);
            // Check on resize or content changes
            const resizeObserver = new ResizeObserver(handleScroll);
            resizeObserver.observe(nav);
            return () => {
                nav.removeEventListener('scroll', handleScroll);
                resizeObserver.disconnect();
            };
        }
    }, [customCategories]);

    return (
        <div className="w-64 bg-gray-900 h-screen fixed left-0 top-0 overflow-y-auto border-r border-gray-800 flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-red-600">▶</span> Watch Later
                </h1>
                <p className="text-gray-400 text-sm">{unarchivedCount} videos</p>
            </div>

            {/* System categories - fixed */}
            <div className="px-4 pt-2">
                <div className="space-y-1">
                    {systemCategories.map(category => {
                        const isSystemCategory = true;
                        const count = getCategoryCount(category);

                        return (
                            <div key={category} className="group relative flex items-center">
                                <button
                                    onClick={() => setSelectedCategory(category)}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === category
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <div className="relative flex items-center gap-3 flex-1 min-w-0">
                                        <Hash size={18} className="flex-shrink-0" />
                                        <span className="truncate flex-1">
                                            {category}
                                        </span>
                                        <span className="text-xs opacity-70 flex-shrink-0">
                                            {count}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Custom tags - scrollable */}
            <nav
                ref={navRef}
                className="flex-1 px-4 pb-4 overflow-y-auto relative [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Top shadow - fixed position */}
                <div className={`fixed left-0 w-64 h-8 pointer-events-none transition-opacity duration-300 z-10 ${
                    showTopShadow ? 'opacity-100' : 'opacity-0'
                }`} style={{
                    background: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), transparent)',
                    top: `${systemCategories.length * 40 + 72}px` // Adjust based on header + system categories
                }} />

                <div className="space-y-1">
                    {customCategories.map(category => {
                        const isSystemCategory = category === 'All' || category === 'Uncategorized' || category === 'Archived';
                        const tagColor = !isSystemCategory ? getTagColor(category) : null;
                        const count = getCategoryCount(category);
                        const barWidth = (count / maxCount) * 100;

                        return (
                            <div key={category} className="group relative flex items-center">
                                <button
                                    onClick={() => setSelectedCategory(category)}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === category
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    {/* Content */}
                                    <div className="relative flex items-center gap-3 flex-1 min-w-0">
                                        {isSystemCategory ? (
                                            <Hash size={18} className="flex-shrink-0" />
                                        ) : (
                                            <Tag size={18} className="flex-shrink-0" style={{ color: selectedCategory === category ? 'white' : tagColor }} />
                                        )}
                                        <span className="truncate flex-1">
                                            {category}
                                        </span>
                                        <span className="text-xs opacity-70 flex-shrink-0">
                                            {count}
                                        </span>
                                    </div>
                                </button>

                                {!isSystemCategory && (
                                    <input
                                        type="color"
                                        value={tagColor}
                                        onChange={(e) => updateTagColor(category, e.target.value)}
                                        className="absolute right-2 w-6 h-6 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                        title="Change tag color"
                                    />
                                )}
                                {!isSystemCategory && (
                                    <div
                                        className="absolute right-2 w-4 h-4 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity border border-white/20"
                                        style={{ backgroundColor: tagColor }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom shadow - fixed position above bottom section */}
                <div className={`fixed left-0 w-64 h-8 pointer-events-none transition-opacity duration-300 z-10 ${
                    showBottomShadow ? 'opacity-100' : 'opacity-0'
                }`} style={{
                    background: 'linear-gradient(to top, rgba(17, 24, 39, 0.95), transparent)',
                    bottom: '120px' // Height of bottom section (View Data + Show Archived + padding)
                }} />
            </nav>


            <div className="p-4 border-t border-gray-800 space-y-2">
                <button
                    onClick={() => setIsDataViewerOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                    <Database size={18} />
                    View Data
                </button>
                <label className="flex items-center justify-between px-4 py-2.5 text-gray-300 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group">
                    <span className="text-sm font-medium">Show Archived</span>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </div>
                </label>
            </div>

            <DataViewer
                isOpen={isDataViewerOpen}
                onClose={() => setIsDataViewerOpen(false)}
                onReset={resetToWlJson}
            />
        </div>
    );
};

export default Sidebar;
