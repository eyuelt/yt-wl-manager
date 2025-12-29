import React, { useState, useEffect } from 'react';
import { Cloud, CloudUpload, CloudDownload, LogOut, Lock, Edit3, Check } from 'lucide-react';
import { useGoogleDrive } from '../context/GoogleDriveContext';
import { useVideoContext } from '../context/VideoContext';
import dataStore from '../utils/dataStore';

const GoogleDriveSection = () => {
    const {
        isSignedIn,
        syncMode,
        isSyncing,
        lastSyncTime,
        isLockOwner,
        signIn,
        signOut,
        syncToDrive,
        syncFromDrive,
        requestEditControl,
        releaseEditControl,
    } = useGoogleDrive();

    const { showToast } = useVideoContext();

    const [oauthClientId, setOauthClientId] = useState('');
    const [showClientIdInput, setShowClientIdInput] = useState(false);
    const [isSavingClientId, setIsSavingClientId] = useState(false);

    // Load OAuth Client ID from settings
    useEffect(() => {
        const loadSettings = async () => {
            const settings = await dataStore.getSettings();
            setOauthClientId(settings.googleOAuthClientId || '');
            setShowClientIdInput(!settings.googleOAuthClientId);
        };
        loadSettings();
    }, []);

    const handleSaveClientId = async () => {
        if (!oauthClientId.trim()) {
            showToast('Please enter an OAuth Client ID', 'error');
            return;
        }

        setIsSavingClientId(true);
        try {
            const settings = await dataStore.getSettings();
            await dataStore.setSettings({
                ...settings,
                googleOAuthClientId: oauthClientId.trim()
            });
            showToast('OAuth Client ID saved! Reload the page to use Google Drive sync.');
            setShowClientIdInput(false);
        } catch (error) {
            console.error('Error saving client ID:', error);
            showToast('Failed to save OAuth Client ID', 'error');
        } finally {
            setIsSavingClientId(false);
        }
    };

    const handleSignIn = async () => {
        try {
            await signIn();
            showToast('Signed in to Google Drive successfully!');
        } catch (error) {
            console.error('Sign in error:', error);
            showToast(`Sign in failed: ${error.message}`, 'error');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            showToast('Signed out from Google Drive');
        } catch (error) {
            console.error('Sign out error:', error);
            showToast('Sign out failed', 'error');
        }
    };

    const handleSyncToDrive = async () => {
        try {
            await syncToDrive();
            showToast('Data synced to Google Drive successfully!');
        } catch (error) {
            if (error.message !== 'User cancelled sync') {
                console.error('Sync to Drive error:', error);
                showToast(`Sync failed: ${error.message}`, 'error');
            }
        }
    };

    const handleSyncFromDrive = async () => {
        try {
            await syncFromDrive();
            showToast('Data synced from Google Drive successfully!');
        } catch (error) {
            console.error('Sync from Drive error:', error);
            showToast(`Sync failed: ${error.message}`, 'error');
        }
    };

    const handleTakeOverEditing = async () => {
        try {
            await requestEditControl();
            showToast('You are now the editor!');
        } catch (error) {
            if (error.message !== 'User cancelled') {
                console.error('Take over error:', error);
                showToast(`Failed to take over: ${error.message}`, 'error');
            }
        }
    };

    const handleReleaseControl = async () => {
        try {
            await releaseEditControl();
            showToast('Edit control released');
        } catch (error) {
            console.error('Release control error:', error);
            showToast('Failed to release control', 'error');
        }
    };

    const formatLastSync = () => {
        if (!lastSyncTime) return 'Never';
        const now = Date.now();
        const diff = now - lastSyncTime;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                Google Drive Sync
            </label>

            {/* OAuth Client ID Configuration */}
            {(showClientIdInput || !oauthClientId) && !isSignedIn && (
                <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-3">
                        To enable Google Drive sync, you need to create a Google Cloud project and obtain an OAuth 2.0 Client ID.
                        {' '}
                        <a
                            href="https://console.cloud.google.com/apis/credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-500 hover:text-red-400 underline"
                        >
                            Get Client ID
                        </a>
                    </p>
                    <input
                        type="text"
                        value={oauthClientId}
                        onChange={(e) => setOauthClientId(e.target.value)}
                        placeholder="Enter OAuth 2.0 Client ID"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent mb-2"
                    />
                    <button
                        onClick={handleSaveClientId}
                        disabled={isSavingClientId || !oauthClientId.trim()}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSavingClientId ? 'Saving...' : 'Save Client ID'}
                    </button>
                </div>
            )}

            {/* Not Signed In */}
            {!isSignedIn && oauthClientId && !showClientIdInput && (
                <div className="space-y-3">
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-400 mb-1">OAuth Client ID</p>
                        <p className="text-sm text-white font-mono break-all">{oauthClientId}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                        Sign in with Google to sync your data across devices.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSignIn}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            <Cloud size={18} />
                            Sign in with Google
                        </button>
                        <button
                            onClick={() => setShowClientIdInput(true)}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                        >
                            Change Client ID
                        </button>
                    </div>
                </div>
            )}

            {/* Signed In */}
            {isSignedIn && (
                <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                        {syncMode === 'editor' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-900/30 border border-green-700 rounded-full text-green-400 text-sm">
                                <Edit3 size={14} />
                                You are the editor
                            </div>
                        )}
                        {syncMode === 'readonly' && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 border border-yellow-700 rounded-full text-yellow-400 text-sm">
                                <Lock size={14} />
                                Read-only mode
                            </div>
                        )}
                    </div>

                    {/* Last Sync Time */}
                    <p className="text-sm text-gray-400">
                        Last synced: <span className="text-white">{formatLastSync()}</span>
                    </p>

                    {/* Sync Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {syncMode === 'editor' && (
                            <>
                                <button
                                    onClick={handleSyncToDrive}
                                    disabled={isSyncing}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CloudUpload size={18} />
                                    {isSyncing ? 'Syncing...' : 'Sync to Drive'}
                                </button>
                                <button
                                    onClick={handleSyncFromDrive}
                                    disabled={isSyncing}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CloudDownload size={18} />
                                    Sync from Drive
                                </button>
                            </>
                        )}
                        {syncMode === 'readonly' && (
                            <>
                                <button
                                    onClick={handleSyncFromDrive}
                                    disabled={isSyncing}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CloudDownload size={18} />
                                    Sync from Drive
                                </button>
                                <button
                                    onClick={handleTakeOverEditing}
                                    disabled={isSyncing}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Edit3 size={18} />
                                    Take Over Editing
                                </button>
                            </>
                        )}
                    </div>

                    {/* Additional Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                        {syncMode === 'editor' && (
                            <button
                                onClick={handleReleaseControl}
                                className="text-sm text-gray-400 hover:text-white transition-colors underline"
                            >
                                Release edit control
                            </button>
                        )}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <LogOut size={14} />
                            Sign out
                        </button>
                    </div>
                </div>
            )}

            <p className="mt-3 text-sm text-gray-500">
                Your data is stored in a private app folder in Google Drive and can only be accessed by this app.
            </p>
        </div>
    );
};

export default GoogleDriveSection;
