import React from 'react';
import { Archive, ArchiveRestore, Trash2, X } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';

const BulkActionsBar = () => {
    const { selectedVideos, selectedCategory, selectionMode, archiveSelected, unarchiveSelected, deleteSelected, clearSelection } = useVideoContext();

    if (!selectionMode && selectedVideos.size === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4 z-50">
            <div className="text-white font-medium">
                {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
                {selectedCategory === 'Archived' ? (
                    <>
                        <button
                            onClick={unarchiveSelected}
                            disabled={selectedVideos.size === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ArchiveRestore size={18} />
                            Unarchive
                        </button>
                        <button
                            onClick={deleteSelected}
                            disabled={selectedVideos.size === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 size={18} />
                            Delete
                        </button>
                    </>
                ) : (
                    <button
                        onClick={archiveSelected}
                        disabled={selectedVideos.size === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Archive size={18} />
                        Archive
                    </button>
                )}
                <button
                    onClick={clearSelection}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default BulkActionsBar;
