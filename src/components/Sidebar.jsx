import React, { useState } from 'react';
import { useVideoContext } from '../context/VideoContext';
import { Tag, Hash, Database, Settings as SettingsIcon } from 'lucide-react';
import DataViewer from './DataViewer';
import Settings from './Settings';
import TagMenu from './TagMenu';
import MergeTagModal from './MergeTagModal';
import ScrollView from './ScrollView';

const Sidebar = () => {
    const { allTags, selectedCategory, setSelectedCategory, videos, tags, updateTagColor, getTagColor, mergeTag } = useVideoContext();
    const [isDataViewerOpen, setIsDataViewerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [tagToMerge, setTagToMerge] = useState(null);

    const archivedCount = videos.filter(v => v.archived).length;
    const unarchivedCount = videos.filter(v => !v.archived).length;

    // Separate system and custom categories
    const systemCategories = ['All', 'Uncategorized', 'Archived'];
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
            <ScrollView
                className="flex-1 px-4 pb-4"
                shadowColor="rgba(17, 24, 39, 0.7)"
                shadowSize={28}
            >
                <div className="space-y-1">
                    {customCategories.map(category => {
                        const isSystemCategory = category === 'All' || category === 'Uncategorized' || category === 'Archived';
                        const tagColor = !isSystemCategory ? getTagColor(category) : null;
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
                                    <TagMenu
                                        tag={category}
                                        color={tagColor}
                                        onColorChange={updateTagColor}
                                        onMergeClick={(tag) => {
                                            setTagToMerge(tag);
                                            setIsMergeModalOpen(true);
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollView>


            <div className="p-4 border-t border-gray-800 space-y-2">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                    <SettingsIcon size={18} />
                    Settings
                </button>
                <button
                    onClick={() => setIsDataViewerOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                    <Database size={18} />
                    View Data
                </button>
            </div>

            <Settings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
            <DataViewer
                isOpen={isDataViewerOpen}
                onClose={() => setIsDataViewerOpen(false)}
            />
            <MergeTagModal
                isOpen={isMergeModalOpen}
                onClose={() => {
                    setIsMergeModalOpen(false);
                    setTagToMerge(null);
                }}
                sourceTag={tagToMerge}
                allTags={allTags}
                onMerge={mergeTag}
                getTagColor={getTagColor}
            />
        </div>
    );
};

export default Sidebar;
