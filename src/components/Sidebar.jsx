import React, { useState, useEffect } from 'react';
import { useVideoContext } from '../context/VideoContext';
import { Tag, Hash, Database, Settings as SettingsIcon, X } from 'lucide-react';
import DataViewer from './DataViewer';
import Settings from './Settings';
import TagMenu from './TagMenu';
import MergeTagModal from './MergeTagModal';
import RenameTagModal from './RenameTagModal';
import ScrollView from './ScrollView';

const Sidebar = ({ isOpen, onClose }) => {
    const { allTags, selectedCategory, setSelectedCategory, videos, tags, updateTagColor, getTagColor, renameTag, mergeTag, deleteTag, isReadOnly } = useVideoContext();
    const [isDataViewerOpen, setIsDataViewerOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [tagToMerge, setTagToMerge] = useState(null);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [tagToRename, setTagToRename] = useState(null);
    const [isShortHeight, setIsShortHeight] = useState(false);

    const archivedCount = videos.filter(v => v.archived).length;
    const unarchivedCount = videos.filter(v => !v.archived).length;

    // Check if viewport height is too small
    useEffect(() => {
        const checkHeight = () => {
            setIsShortHeight(window.innerHeight < 400);
        };

        checkHeight();
        window.addEventListener('resize', checkHeight);

        return () => window.removeEventListener('resize', checkHeight);
    }, []);

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

    // Render a category button
    const renderCategoryButton = (category, isSystemCategory) => {
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
                    <div className="relative flex items-center gap-3 flex-1 min-w-0">
                        {isSystemCategory ? (
                            <Hash size={18} className="flex-shrink-0" />
                        ) : (
                            <Tag size={18} className="flex-shrink-0" style={{ color: selectedCategory === category ? 'white' : tagColor }} />
                        )}
                        <span className="truncate flex-1">
                            {category}
                        </span>
                        <span className={`text-xs opacity-70 flex-shrink-0 transition-opacity ${!isSystemCategory ? 'group-hover:opacity-0' : ''}`}>
                            {count}
                        </span>
                    </div>
                </button>

                {!isSystemCategory && (
                    <TagMenu
                        tag={category}
                        color={tagColor}
                        onColorChange={updateTagColor}
                        onRenameClick={(tag) => {
                            setTagToRename(tag);
                            setIsRenameModalOpen(true);
                        }}
                        onMergeClick={(tag) => {
                            setTagToMerge(tag);
                            setIsMergeModalOpen(true);
                        }}
                        onDeleteClick={deleteTag}
                        isReadOnly={isReadOnly}
                    />
                )}
            </div>
        );
    };

    return (
        <div
            className={`w-64 sidebar-responsive bg-gray-900 h-screen fixed left-0 top-0 overflow-y-auto border-r border-gray-800 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ overscrollBehavior: 'contain', paddingLeft: 'env(safe-area-inset-left)' }}
        >
            <div className="p-6" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-red-600">▶</span> Watch Later
                    </h1>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {isShortHeight ? (
                // On short screens: All categories in one scrollview
                <ScrollView
                    className="flex-1 px-4 pb-4"
                    shadowColor="rgba(17, 24, 39, 0.7)"
                    shadowSize={28}
                >
                    <div className="space-y-1 pt-2">
                        {systemCategories.map(category => renderCategoryButton(category, true))}
                        {customCategories.map(category => renderCategoryButton(category, false))}
                    </div>
                </ScrollView>
            ) : (
                <>
                    {/* System categories - fixed */}
                    <div className="px-4 pt-2">
                        <div className="space-y-1">
                            {systemCategories.map(category => renderCategoryButton(category, true))}
                        </div>
                    </div>

                    {/* Custom tags - scrollable */}
                    <ScrollView
                        className="flex-1 px-4 pb-4"
                        shadowColor="rgba(17, 24, 39, 0.7)"
                        shadowSize={28}
                    >
                        <div className="space-y-1">
                            {customCategories.map(category => renderCategoryButton(category, false))}
                        </div>
                    </ScrollView>
                </>
            )}


            <div className="p-4 border-t border-gray-800 space-y-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
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
            <RenameTagModal
                isOpen={isRenameModalOpen}
                onClose={() => {
                    setIsRenameModalOpen(false);
                    setTagToRename(null);
                }}
                tag={tagToRename}
                onRename={renameTag}
            />
        </div>
    );
};

export default Sidebar;
