import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3 } from 'lucide-react';

const RenameTagModal = ({ isOpen, onClose, tag, onRename }) => {
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (isOpen && tag) {
            setNewName(tag);
        }
    }, [isOpen, tag]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = newName.trim();
        if (trimmedName && trimmedName !== tag) {
            onRename(tag, trimmedName);
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
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
                    <h2 className="text-xl font-bold text-white">Rename Tag</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-gray-300 mb-4">
                        Rename "<span className="font-semibold text-white">{tag}</span>" to:
                    </p>

                    <div className="relative">
                        <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter new tag name..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!newName.trim() || newName.trim() === tag}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Rename
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default RenameTagModal;
