import React from 'react';
import { useVideoContext } from '../context/VideoContext';
import { Tag, Hash } from 'lucide-react';

const Sidebar = () => {
    const { allTags, selectedCategory, setSelectedCategory, videos } = useVideoContext();

    const categories = ['All', 'Uncategorized', ...allTags.sort()];

    return (
        <div className="w-64 bg-gray-900 h-screen fixed left-0 top-0 overflow-y-auto border-r border-gray-800 flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-red-600">▶</span> Watch Later
                </h1>
                <p className="text-gray-400 text-sm">{videos.length} videos</p>
            </div>

            <nav className="flex-1 px-4 pb-4">
                <div className="space-y-1">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-3 ${selectedCategory === category
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            {category === 'All' || category === 'Uncategorized' ? (
                                <Hash size={18} />
                            ) : (
                                <Tag size={18} />
                            )}
                            <span className="truncate">{category}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
