import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Eye, EyeOff } from 'lucide-react';
import dataStore from '../utils/dataStore';
import { useVideoContext } from '../context/VideoContext';

const Settings = ({ isOpen, onClose }) => {
    const { showToast } = useVideoContext();
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [extensionId, setExtensionId] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadSettings = async () => {
            const settings = await dataStore.getSettings();
            setGeminiApiKey(settings.geminiApiKey || '');
            setExtensionId(settings.extensionId || '');
        };

        loadSettings();
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await dataStore.setSettings({
                geminiApiKey: geminiApiKey.trim(),
                extensionId: extensionId.trim()
            });
            showToast('Settings saved successfully!');
            onClose();
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast('Failed to save settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
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
            <div className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col border border-gray-700 relative z-10 pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Gemini API Key Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Gemini API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={geminiApiKey}
                                onChange={(e) => setGeminiApiKey(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter your Gemini API key"
                                className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                                autoComplete="off"
                                name="gemini_api_key_field"
                                data-1p-ignore="true"
                                data-lpignore="true"
                                data-form-type="other"
                            />
                            <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-400">
                            Get your API key from{' '}
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-500 hover:text-red-400 underline"
                            >
                                Google AI Studio
                            </a>
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                            Your API key is stored locally in your browser and is only used to call the Gemini API for AI-powered video tagging.
                        </p>
                    </div>

                    {/* Extension ID Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Chrome Extension ID
                        </label>
                        <input
                            type="text"
                            value={extensionId}
                            onChange={(e) => setExtensionId(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter your Chrome extension ID"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        />
                        <p className="mt-2 text-sm text-gray-400">
                            The extension ID can be found in{' '}
                            <code className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">chrome://extensions</code>
                            {' '}when Developer Mode is enabled.
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-white mb-2">About AI Tagging</h3>
                        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                            <li>Automatically tag new videos during sync</li>
                            <li>Bulk re-tag selected videos using AI</li>
                            <li>Tags are generated based on video title, channel, and YouTube knowledge</li>
                            <li>AI-generated tags are added to existing tags (not replaced)</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Settings;
