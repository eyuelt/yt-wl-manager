import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Cloud, HardDrive } from 'lucide-react';
import { useGoogleDrive } from '../context/GoogleDriveContext';

const ConflictResolutionModal = () => {
    const { conflictModal, resolveConflict, closeConflictModal } = useGoogleDrive();

    if (!conflictModal.isOpen) return null;

    const { type, localData, driveData } = conflictModal;

    let title = '';
    let description = '';
    let buttons = [];

    if (type === 'initial-setup') {
        // Both localStorage and Drive have data
        const localCount = localData?.videos?.length || 0;
        const driveCount = driveData?.videos?.length || 0;

        title = 'Data Found in Both Locations';
        description = (
            <div className="space-y-3">
                <p className="text-gray-300">
                    We found existing data in both your browser and Google Drive:
                </p>
                <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
                        <HardDrive size={20} className="text-blue-400 flex-shrink-0" />
                        <div>
                            <div className="text-white font-medium">Your Browser</div>
                            <div className="text-sm text-gray-400">
                                {localCount} videos, {Object.keys(localData?.tags || {}).length} tagged videos
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
                        <Cloud size={20} className="text-green-400 flex-shrink-0" />
                        <div>
                            <div className="text-white font-medium">Google Drive</div>
                            <div className="text-sm text-gray-400">
                                {driveCount} videos, {Object.keys(driveData?.tags || {}).length} tagged videos
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-gray-400">
                    Which would you like to use? The other data will be overwritten.
                </p>
            </div>
        );
        buttons = [
            {
                label: 'Use Browser Data',
                onClick: () => resolveConflict('local'),
                variant: 'primary',
                icon: HardDrive
            },
            {
                label: 'Use Drive Data',
                onClick: () => resolveConflict('drive'),
                variant: 'primary',
                icon: Cloud
            }
        ];
    } else if (type === 'copy-to-drive') {
        // Only localStorage has data
        const localCount = localData?.videos?.length || 0;

        title = 'Copy Data to Google Drive?';
        description = (
            <div className="space-y-3">
                <p className="text-gray-300">
                    You have existing data in your browser:
                </p>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
                    <HardDrive size={20} className="text-blue-400 flex-shrink-0" />
                    <div>
                        <div className="text-white font-medium">Your Browser</div>
                        <div className="text-sm text-gray-400">
                            {localCount} videos, {Object.keys(localData?.tags || {}).length} tagged videos
                        </div>
                    </div>
                </div>
                <p className="text-gray-400">
                    Would you like to copy this data to Google Drive, or start fresh?
                </p>
            </div>
        );
        buttons = [
            {
                label: 'Copy to Drive',
                onClick: () => resolveConflict('copy'),
                variant: 'primary',
                icon: Cloud
            },
            {
                label: 'Start Fresh',
                onClick: () => resolveConflict('fresh'),
                variant: 'secondary',
                icon: null
            }
        ];
    } else if (type === 'take-over') {
        // Another client owns the lock
        title = 'Another Device is Editing';
        description = (
            <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-900/20 border border-yellow-700">
                    <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="text-yellow-400 font-medium mb-1">Editor Lock Active</div>
                        <div className="text-sm text-gray-300">
                            Another browser or device is currently the editor for this data.
                        </div>
                    </div>
                </div>
                <p className="text-gray-300">
                    You can continue in read-only mode, or take over editing. If you take over, the other device will become read-only.
                </p>
            </div>
        );
        buttons = [
            {
                label: 'Stay Read-Only',
                onClick: () => resolveConflict('readonly'),
                variant: 'secondary',
                icon: null
            },
            {
                label: 'Take Over Editing',
                onClick: () => resolveConflict('takeover'),
                variant: 'warning',
                icon: null
            }
        ];
    }

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none" style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
        }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-500 opacity-60 pointer-events-auto"
                onClick={closeConflictModal}
            />
            {/* Modal */}
            <div className="bg-gray-900 rounded-lg shadow-2xl max-w-lg w-full flex flex-col border border-gray-700 relative z-10 pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={closeConflictModal}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {description}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
                    {buttons.map((button, index) => {
                        const Icon = button.icon;
                        let buttonClass = 'px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2';

                        if (button.variant === 'primary') {
                            buttonClass += ' bg-blue-600 hover:bg-blue-700 text-white';
                        } else if (button.variant === 'warning') {
                            buttonClass += ' bg-yellow-600 hover:bg-yellow-700 text-white';
                        } else {
                            buttonClass += ' bg-gray-700 hover:bg-gray-600 text-white';
                        }

                        return (
                            <button
                                key={index}
                                onClick={button.onClick}
                                className={buttonClass}
                            >
                                {Icon && <Icon size={18} />}
                                {button.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ConflictResolutionModal;
