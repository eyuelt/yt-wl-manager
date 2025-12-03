import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RotateCcw } from 'lucide-react';
import { JsonViewer } from '@textea/json-viewer';
import dataStore from '../utils/dataStore';

const DataViewer = ({ isOpen, onClose, onReset }) => {
    const [activeTab, setActiveTab] = useState('videos');
    const [videosData, setVideosData] = useState([]);
    const [tagsData, setTagsData] = useState({});
    const [metadataData, setMetadataData] = useState({});

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            const videos = await dataStore.getVideos();
            const tags = await dataStore.getTags();
            const metadata = await dataStore.getTagMetadata();

            setVideosData(videos);
            setTagsData(tags);
            setMetadataData(metadata);
        };

        loadData();

        // Subscribe to changes
        const unsubscribe = dataStore.subscribe(async ({ key, value }) => {
            if (key === dataStore.KEYS.VIDEOS && value) {
                setVideosData(value);
            } else if (key === dataStore.KEYS.TAGS && value) {
                setTagsData(value);
            } else if (key === dataStore.KEYS.TAG_METADATA && value) {
                setMetadataData(value);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all data to wl.json? This will delete all synced videos and custom tags.')) {
            onReset();
            onClose();
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            {/* Backdrop - sibling to pane */}
            <div
                className="absolute inset-0 bg-gray-500 opacity-60 pointer-events-auto"
                onClick={onClose}
            />
            {/* Pane - sibling to backdrop */}
            <div className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-700 relative z-10 pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Saved Data</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-4 border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('videos')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeTab === 'videos'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Videos ({videosData.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('tags')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeTab === 'tags'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Tags
                    </button>
                    <button
                        onClick={() => setActiveTab('metadata')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            activeTab === 'metadata'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Tag Metadata
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-gray-950 rounded-lg">
                    {activeTab === 'videos' && (
                        <JsonViewer
                            value={videosData}
                            theme="dark"
                            defaultInspectDepth={1}
                            displayDataTypes={false}
                            enableClipboard={true}
                            quotesOnKeys={false}
                            rootName="videos"
                        />
                    )}
                    {activeTab === 'tags' && (
                        <JsonViewer
                            value={tagsData}
                            theme="dark"
                            defaultInspectDepth={2}
                            displayDataTypes={false}
                            enableClipboard={true}
                            quotesOnKeys={false}
                            rootName="tags"
                        />
                    )}
                    {activeTab === 'metadata' && (
                        <JsonViewer
                            value={metadataData}
                            theme="dark"
                            defaultInspectDepth={2}
                            displayDataTypes={false}
                            enableClipboard={true}
                            quotesOnKeys={false}
                            rootName="tagMetadata"
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-800">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
                    >
                        <RotateCcw size={18} />
                        Reset to wl.json
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default DataViewer;
