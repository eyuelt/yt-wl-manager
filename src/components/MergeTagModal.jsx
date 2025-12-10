import React from 'react';
import { createPortal } from 'react-dom';
import { X, Tag as TagIcon } from 'lucide-react';

const MergeTagModal = ({ isOpen, onClose, sourceTag, allTags, onMerge, getTagColor }) => {
    if (!isOpen) return null;

    // Filter out the source tag and system categories
    const systemCategories = ['All', 'Uncategorized', 'Archived'];
    const availableTags = allTags.filter(tag =>
        tag !== sourceTag && !systemCategories.includes(tag)
    );

    const handleMerge = (targetTag) => {
        onMerge(sourceTag, targetTag);
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-500 opacity-60 pointer-events-auto"
                onClick={onClose}
            />
            {/* Modal */}
            <div className="bg-gray-900 rounded-lg shadow-2xl max-w-md w-full flex flex-col border border-gray-700 relative z-10 pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Merge Tag</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-300 mb-4">
                        Merge "<span className="font-semibold text-white">{sourceTag}</span>" into:
                    </p>

                    {availableTags.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No other tags available to merge into.
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleMerge(tag)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-left"
                                >
                                    <TagIcon
                                        size={18}
                                        style={{ color: getTagColor(tag) }}
                                        className="flex-shrink-0"
                                    />
                                    <span className="text-white font-medium">{tag}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default MergeTagModal;
