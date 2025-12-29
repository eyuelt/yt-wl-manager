import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, ArrowRight, CloudUpload, CloudDownload } from 'lucide-react';

const SyncConfirmationModal = ({ isOpen, diff, onConfirm, onCancel }) => {
    if (!isOpen || !diff) return null;

    const isUpload = diff.direction === 'to-drive';
    const Icon = isUpload ? CloudUpload : CloudDownload;
    const title = isUpload ? 'Sync to Google Drive' : 'Sync from Google Drive';
    const description = isUpload
        ? 'This will upload your local changes to Google Drive.'
        : 'This will download changes from Google Drive and update your local data.';

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-500 opacity-60 pointer-events-auto"
                onClick={onCancel}
            />
            {/* Modal */}
            <div className="bg-gray-900 rounded-lg shadow-2xl max-w-lg w-full border border-gray-700 relative z-10 pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <Icon size={24} className={isUpload ? 'text-orange-500' : 'text-blue-500'} />
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">{description}</p>

                    {!diff.hasChanges ? (
                        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                            <p className="text-green-400 text-center">
                                ✓ No changes detected - data is already in sync
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <AlertCircle size={16} />
                                <span>The following changes will be applied:</span>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                                {/* Videos */}
                                {(diff.videosAdded > 0 || diff.videosRemoved > 0) && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300">Videos</span>
                                        <div className="flex items-center gap-3">
                                            {diff.videosAdded > 0 && (
                                                <span className="text-green-400">+{diff.videosAdded}</span>
                                            )}
                                            {diff.videosRemoved > 0 && (
                                                <span className="text-red-400">-{diff.videosRemoved}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {(diff.tagsAdded > 0 || diff.tagsRemoved > 0) && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300">Tags</span>
                                        <div className="flex items-center gap-3">
                                            {diff.tagsAdded > 0 && (
                                                <span className="text-green-400">+{diff.tagsAdded}</span>
                                            )}
                                            {diff.tagsRemoved > 0 && (
                                                <span className="text-red-400">-{diff.tagsRemoved}</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Videos with tag changes */}
                                {diff.videosWithTagChanges > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-300">Videos with tag changes</span>
                                        <span className="text-blue-400">{diff.videosWithTagChanges}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium ${
                            isUpload
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        <Icon size={18} />
                        {isUpload ? 'Upload to Drive' : 'Download from Drive'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default SyncConfirmationModal;
