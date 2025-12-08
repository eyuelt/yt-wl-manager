import React from 'react';
import { CheckSquare, RefreshCw } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';
import SearchBar from './SearchBar';

const VideoHeader = () => {
    const { selectionMode, toggleSelectionMode, syncVideos, cancelSync, isSyncing } = useVideoContext();

    return (
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
    );
};

export default VideoHeader;
