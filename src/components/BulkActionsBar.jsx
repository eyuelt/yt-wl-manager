import React, { useState, useEffect } from 'react';
import { Archive, ArchiveRestore, Trash2, X, Sparkles } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';
import dataStore from '../utils/dataStore';

const BulkActionsBar = () => {
    const { selectedVideos, selectedCategory, selectionMode, archiveSelected, unarchiveSelected, deleteSelected, clearSelection, retagSelectedWithGemini, isReadOnly } = useVideoContext();
    const [hasGeminiKey, setHasGeminiKey] = useState(false);

    useEffect(() => {
        const checkGeminiKey = async () => {
            const settings = await dataStore.getSettings();
            setHasGeminiKey(!!settings?.geminiApiKey);
        };
        checkGeminiKey();

        // Subscribe to settings changes
        const unsubscribe = dataStore.subscribe(async ({ key }) => {
            if (key === dataStore.KEYS.SETTINGS) {
                const settings = await dataStore.getSettings();
                setHasGeminiKey(!!settings?.geminiApiKey);
            }
        });

        return unsubscribe;
    }, []);

    if (!selectionMode && selectedVideos.size === 0) return null;

    const aiTagDisabled = selectedVideos.size === 0 || !hasGeminiKey || isReadOnly;
    const aiTagTitle = isReadOnly
        ? "Read-only mode - cannot modify data"
        : !hasGeminiKey
        ? "Add your Gemini API key in Settings to enable this feature"
        : "Re-tag with AI";

    return (
        <div className="fixed bottom-4 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl px-3 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 z-50" style={{
            left: 'max(0.5rem, env(safe-area-inset-left))',
            right: 'max(0.5rem, env(safe-area-inset-right))',
            bottom: 'max(1rem, env(safe-area-inset-bottom))'
        }}>
            <div className="text-white font-medium text-center sm:text-left">
                {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                <button
                    onClick={retagSelectedWithGemini}
                    disabled={aiTagDisabled}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    title={aiTagTitle}
                >
                    <Sparkles size={18} />
                    <span className="hidden xs:inline sm:inline">AI Tag</span>
                </button>
                {selectedCategory === 'Archived' ? (
                    <>
                        <button
                            onClick={unarchiveSelected}
                            disabled={selectedVideos.size === 0 || isReadOnly}
                            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            title={isReadOnly ? "Read-only mode - cannot modify data" : "Unarchive selected"}
                        >
                            <ArchiveRestore size={18} />
                            <span className="hidden xs:inline sm:inline">Unarchive</span>
                        </button>
                        <button
                            onClick={deleteSelected}
                            disabled={selectedVideos.size === 0 || isReadOnly}
                            className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            title={isReadOnly ? "Read-only mode - cannot modify data" : "Delete selected"}
                        >
                            <Trash2 size={18} />
                            <span className="hidden xs:inline sm:inline">Delete</span>
                        </button>
                    </>
                ) : (
                    <button
                        onClick={archiveSelected}
                        disabled={selectedVideos.size === 0 || isReadOnly}
                        className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        title={isReadOnly ? "Read-only mode - cannot modify data" : "Archive selected"}
                    >
                        <Archive size={18} />
                        <span className="hidden xs:inline sm:inline">Archive</span>
                    </button>
                )}
                <button
                    onClick={clearSelection}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    title="Clear selection"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default BulkActionsBar;
