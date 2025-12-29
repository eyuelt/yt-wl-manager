import React from 'react';
import { Cloud, CloudOff, Lock, AlertCircle, Check, ArrowUpDown, CloudUpload } from 'lucide-react';
import { useGoogleDrive } from '../context/GoogleDriveContext';

const SyncStatusIndicator = () => {
    const { isSignedIn, syncMode, isSyncing, syncError, lastSyncTime, hasUnsyncedChanges, syncToDrive } = useGoogleDrive();

    // Don't show anything if not signed in
    if (!isSignedIn) {
        return null;
    }

    // Determine icon, color, and click handler
    let Icon = Cloud;
    let color = 'text-gray-400';
    let tooltip = 'Google Drive connected';
    let isClickable = false;
    let onClick = null;

    if (syncError) {
        Icon = AlertCircle;
        color = 'text-red-500';
        tooltip = `Sync error: ${syncError}`;
    } else if (isSyncing) {
        Icon = ArrowUpDown;
        color = 'text-blue-500';
        tooltip = 'Syncing with Google Drive...';
    } else if (syncMode === 'readonly') {
        Icon = Lock;
        color = 'text-yellow-500';
        tooltip = 'Read-only mode - Another device is editing';
    } else if (syncMode === 'editor' && hasUnsyncedChanges) {
        Icon = CloudUpload;
        color = 'text-orange-500';
        tooltip = 'Click to sync changes to Google Drive';
        isClickable = true;
        onClick = syncToDrive;
    } else if (syncMode === 'editor' && lastSyncTime) {
        Icon = Check;
        color = 'text-green-500';
        const timeAgo = getTimeAgo(lastSyncTime);
        tooltip = `Synced ${timeAgo}`;
    }

    return (
        <button
            onClick={isClickable ? onClick : undefined}
            disabled={!isClickable}
            className={`flex items-center gap-2 ${color} ${isClickable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            title={tooltip}
        >
            <Icon size={20} className={isSyncing ? 'animate-pulse' : ''} />
        </button>
    );
};

// Helper to format time ago
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) {
        return 'just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default SyncStatusIndicator;
