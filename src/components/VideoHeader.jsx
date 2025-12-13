import React from 'react';
import { CheckSquare, RefreshCw, Loader2 } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';
import SearchBar from './SearchBar';

const VideoHeader = () => {
    const { selectionMode, toggleSelectionMode, syncVideos, cancelSync, isSyncing, hasExtensionId, batchTaggingProgress } = useVideoContext();

    return (
        <div className="flex-none p-6 pb-4 border-b border-gray-800">
            <div className="flex items-center justify-between gap-8">
                <SearchBar />
                <div className="flex items-center gap-3 flex-shrink-0">
                    {batchTaggingProgress && (
                        <div
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 group relative"
                            title={`AI Tagging: Batch ${batchTaggingProgress.completedBatches}/${batchTaggingProgress.totalBatches}`}
                        >
                            <Loader2 size={18} className="text-blue-400 animate-spin" />
                            <span className="text-gray-300 text-sm">AI Tagging...</span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                <div className="text-white text-sm font-medium">Batch Progress</div>
                                <div className="text-gray-400 text-xs mt-1">
                                    {batchTaggingProgress.completedBatches} / {batchTaggingProgress.totalBatches} batches complete
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                                    <div
                                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                                        style={{ width: `${(batchTaggingProgress.completedBatches / batchTaggingProgress.totalBatches) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
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
                        disabled={!hasExtensionId && !isSyncing}
                        title={!hasExtensionId && !isSyncing ? 'Please configure Chrome Extension ID in Settings' : ''}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                            isSyncing
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : !hasExtensionId
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
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
