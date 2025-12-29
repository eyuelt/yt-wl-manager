import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as driveSync from '../utils/googleDriveSync';
import dataStore from '../utils/dataStore';

const GoogleDriveContext = createContext(null);

export const useGoogleDrive = () => {
    const context = useContext(GoogleDriveContext);
    if (!context) {
        throw new Error('useGoogleDrive must be used within GoogleDriveProvider');
    }
    return context;
};

export const GoogleDriveProvider = ({ children }) => {
    // Auth state
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [user, setUser] = useState(null);

    // Sync state
    const [syncMode, setSyncMode] = useState('disabled'); // 'disabled' | 'editor' | 'readonly'
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [syncError, setSyncError] = useState(null);
    const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);

    // Lock state
    const [isLockOwner, setIsLockOwner] = useState(false);
    const [lockHolder, setLockHolder] = useState(null);

    // Conflict resolution state
    const [conflictModal, setConflictModal] = useState({
        isOpen: false,
        type: null, // 'initial-setup' | 'copy-to-drive' | 'take-over'
        localData: null,
        driveData: null,
        onResolve: null
    });

    // OAuth Client ID from settings
    const [oauthClientId, setOauthClientId] = useState(null);

    // Load OAuth Client ID from settings
    useEffect(() => {
        const loadClientId = async () => {
            const settings = await dataStore.getSettings();
            if (settings.googleOAuthClientId) {
                setOauthClientId(settings.googleOAuthClientId);
                try {
                    driveSync.initGoogleAuth(settings.googleOAuthClientId);
                } catch (error) {
                    console.error('Failed to init Google Auth:', error);
                }
            }
        };
        loadClientId();
    }, []);

    // Subscribe to auth state changes
    useEffect(() => {
        return driveSync.onAuthChange((status) => {
            setIsSignedIn(status.isSignedIn);
            setUser(status.user);
        });
    }, []);

    // Check lock status when signed in
    const checkLockStatus = useCallback(async () => {
        try {
            const lockfile = await driveSync.getLockfile();
            const ownsLock = await driveSync.isLockOwner();

            setLockHolder(lockfile);
            setIsLockOwner(ownsLock);

            if (ownsLock) {
                setSyncMode('editor');
            } else if (lockfile) {
                setSyncMode('readonly');
            } else {
                setSyncMode('disabled');
            }
        } catch (error) {
            console.error('Error checking lock status:', error);
        }
    }, []);

    // When signed in (including from restored token), check lock status
    useEffect(() => {
        if (isSignedIn) {
            checkLockStatus();
        }
    }, [isSignedIn, checkLockStatus]);

    // Periodically check if local data differs from Drive data
    useEffect(() => {
        if (syncMode !== 'editor') {
            setHasUnsyncedChanges(false);
            return;
        }

        const checkForChanges = async () => {
            try {
                // Get local data
                const localVideos = await dataStore.getVideos();
                const localTags = await dataStore.getTags();
                const localMetadata = await dataStore.getTagMetadata();

                // Get Drive data
                const driveData = await driveSync.syncFromDrive();

                // Compare data
                const localDataStr = JSON.stringify({ videos: localVideos, tags: localTags, metadata: localMetadata });
                const driveDataStr = JSON.stringify(driveData || { videos: [], tags: {}, metadata: {} });

                setHasUnsyncedChanges(localDataStr !== driveDataStr);
            } catch (error) {
                console.error('Error checking for changes:', error);
            }
        };

        // Check immediately
        checkForChanges();

        // Then check every 10 seconds
        const interval = setInterval(checkForChanges, 10000);

        return () => clearInterval(interval);
    }, [syncMode]);

    // Handle initial setup after sign-in
    const handleInitialSetup = useCallback(async () => {
        try {
            // Check if Drive has data
            const driveHasData = await driveSync.checkDriveHasData();

            // Check if localStorage has data
            const localVideos = await dataStore.getVideos();
            const localHasData = localVideos.length > 0;

            if (driveHasData && localHasData) {
                // Both have data - check if they're different
                const driveData = await driveSync.syncFromDrive();
                const localTags = await dataStore.getTags();
                const localMetadata = await dataStore.getTagMetadata();

                // Compare data to see if there's actually a conflict
                const localDataStr = JSON.stringify({ videos: localVideos, tags: localTags, metadata: localMetadata });
                const driveDataStr = JSON.stringify(driveData);

                if (localDataStr === driveDataStr) {
                    // Data is the same - no need to ask, just update sync time
                    setLastSyncTime(Date.now());
                } else {
                    // Data is different - show conflict modal
                    return new Promise((resolve) => {
                        setConflictModal({
                            isOpen: true,
                            type: 'initial-setup',
                            localData: { videos: localVideos, tags: localTags, metadata: localMetadata },
                            driveData,
                            onResolve: async (choice) => {
                                if (choice === 'local') {
                                    // Use local data - push to Drive
                                    await driveSync.syncToDrive({
                                        videos: localVideos,
                                        tags: localTags,
                                        metadata: localMetadata
                                    });
                                } else {
                                    // Use Drive data - pull from Drive
                                    await dataStore.setVideos(driveData.videos);
                                    await dataStore.setTags(driveData.tags);
                                    await dataStore.setTagMetadata(driveData.metadata);
                                }
                                setLastSyncTime(Date.now());
                                resolve();
                            }
                        });
                    });
                }
            } else if (driveHasData) {
                // Only Drive has data - pull from Drive
                const driveData = await driveSync.syncFromDrive();
                await dataStore.setVideos(driveData.videos);
                await dataStore.setTags(driveData.tags);
                await dataStore.setTagMetadata(driveData.metadata);
                setLastSyncTime(Date.now());
            } else if (localHasData) {
                // Only localStorage has data - ask to copy or start fresh
                const localTags = await dataStore.getTags();
                const localMetadata = await dataStore.getTagMetadata();

                return new Promise((resolve) => {
                    setConflictModal({
                        isOpen: true,
                        type: 'copy-to-drive',
                        localData: { videos: localVideos, tags: localTags, metadata: localMetadata },
                        driveData: null,
                        onResolve: async (choice) => {
                            if (choice === 'copy') {
                                // Copy local data to Drive
                                await driveSync.syncToDrive({
                                    videos: localVideos,
                                    tags: localTags,
                                    metadata: localMetadata
                                });
                                setLastSyncTime(Date.now());
                            }
                            // If 'fresh', don't copy anything
                            resolve();
                        }
                    });
                });
            }

            // Acquire lock
            await driveSync.acquireLock();
            await checkLockStatus();
        } catch (error) {
            console.error('Error in initial setup:', error);
            setSyncError(error.message);
            throw error;
        }
    }, [checkLockStatus]);

    // Sign in
    const signIn = useCallback(async () => {
        try {
            setSyncError(null);
            await driveSync.signIn();
            await handleInitialSetup();
        } catch (error) {
            console.error('Sign in error:', error);
            setSyncError(error.message);
            throw error;
        }
    }, [handleInitialSetup]);

    // Sign out
    const signOut = useCallback(async () => {
        try {
            driveSync.signOut();
            setIsSignedIn(false);
            setUser(null);
            setSyncMode('disabled');
            setIsLockOwner(false);
            setLockHolder(null);
            setLastSyncTime(null);
            setSyncError(null);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    }, []);

    // Sync TO Drive
    const syncToDrive = useCallback(async () => {
        try {
            setIsSyncing(true);
            setSyncError(null);

            // Check if we own the lock
            const ownsLock = await driveSync.isLockOwner();
            if (!ownsLock) {
                // Show take-over modal
                return new Promise((resolve, reject) => {
                    setConflictModal({
                        isOpen: true,
                        type: 'take-over',
                        localData: null,
                        driveData: null,
                        onResolve: async (choice) => {
                            if (choice === 'takeover') {
                                await driveSync.acquireLock();
                                await checkLockStatus();
                                // Now sync
                                await performSyncToDrive();
                                resolve();
                            } else {
                                reject(new Error('User cancelled sync'));
                            }
                        }
                    });
                });
            }

            await performSyncToDrive();
        } catch (error) {
            console.error('Sync to Drive error:', error);
            setSyncError(error.message);
            throw error;
        } finally {
            setIsSyncing(false);
        }
    }, [checkLockStatus]);

    // Helper to perform the actual sync to Drive
    const performSyncToDrive = async () => {
        const videos = await dataStore.getVideos();
        const tags = await dataStore.getTags();
        const metadata = await dataStore.getTagMetadata();

        await driveSync.syncToDrive({ videos, tags, metadata });
        setLastSyncTime(Date.now());
        setHasUnsyncedChanges(false);
    };

    // Sync FROM Drive
    const syncFromDrive = useCallback(async () => {
        try {
            setIsSyncing(true);
            setSyncError(null);

            const driveData = await driveSync.syncFromDrive();
            if (!driveData) {
                throw new Error('No data found in Google Drive');
            }

            await dataStore.setVideos(driveData.videos);
            await dataStore.setTags(driveData.tags);
            await dataStore.setTagMetadata(driveData.metadata);
            setLastSyncTime(Date.now());
        } catch (error) {
            console.error('Sync from Drive error:', error);
            setSyncError(error.message);
            throw error;
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // Request edit control (take over lock)
    const requestEditControl = useCallback(async () => {
        return new Promise((resolve, reject) => {
            setConflictModal({
                isOpen: true,
                type: 'take-over',
                localData: null,
                driveData: null,
                onResolve: async (choice) => {
                    if (choice === 'takeover') {
                        try {
                            await driveSync.acquireLock();
                            await checkLockStatus();
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        reject(new Error('User cancelled'));
                    }
                }
            });
        });
    }, [checkLockStatus]);

    // Release edit control
    const releaseEditControl = useCallback(async () => {
        try {
            await driveSync.releaseLock();
            await checkLockStatus();
        } catch (error) {
            console.error('Error releasing lock:', error);
            throw error;
        }
    }, [checkLockStatus]);

    // Close conflict modal
    const closeConflictModal = useCallback(() => {
        setConflictModal({
            isOpen: false,
            type: null,
            localData: null,
            driveData: null,
            onResolve: null
        });
    }, []);

    // Resolve conflict
    const resolveConflict = useCallback((choice) => {
        if (conflictModal.onResolve) {
            conflictModal.onResolve(choice);
        }
        closeConflictModal();
    }, [conflictModal, closeConflictModal]);

    const value = {
        // Auth state
        isSignedIn,
        user,
        oauthClientId,

        // Sync state
        syncMode,
        isSyncing,
        lastSyncTime,
        syncError,
        hasUnsyncedChanges,

        // Lock state
        isLockOwner,
        lockHolder,

        // Conflict modal
        conflictModal,
        resolveConflict,
        closeConflictModal,

        // Actions
        signIn,
        signOut,
        syncToDrive,
        syncFromDrive,
        requestEditControl,
        releaseEditControl,
    };

    return (
        <GoogleDriveContext.Provider value={value}>
            {children}
        </GoogleDriveContext.Provider>
    );
};

export default GoogleDriveContext;
