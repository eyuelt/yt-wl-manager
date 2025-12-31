import React from 'react';
import { Cloud, Lock, AlertCircle } from 'lucide-react';
import { useGoogleDrive } from '../context/GoogleDriveContext';

/**
 * Banner that shows the current sync mode and prompts sign-in if needed
 */
const SyncModeBanner = () => {
    const { googleDriveSyncEnabled, isSignedIn, signIn } = useGoogleDrive();

    // Only show banner when sync is enabled but not signed in
    if (!googleDriveSyncEnabled || isSignedIn) {
        return null;
    }

    return (
        <div className="bg-yellow-900/30 border-t border-yellow-700/50 px-4 py-2 flex items-center justify-between gap-4" style={{
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}>
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Lock size={16} className="flex-shrink-0" />
                <span>
                    <strong>Read-Only Mode:</strong> Google Drive sync is enabled. Sign in to edit your videos.
                </span>
            </div>
            <button
                onClick={signIn}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm flex-shrink-0"
            >
                <Cloud size={16} />
                Sign In
            </button>
        </div>
    );
};

export default SyncModeBanner;
