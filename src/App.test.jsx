import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { VideoProvider } from './context/VideoContext';

// Mock GoogleDriveContext
vi.mock('./context/GoogleDriveContext', () => ({
    useGoogleDrive: vi.fn(() => ({
        syncMode: 'disabled',
        isSignedIn: false,
        isSyncing: false,
        hasUnsyncedChanges: false,
        conflictModal: {
            isOpen: false,
            type: null,
            localData: null,
            driveData: null,
            onResolve: null
        },
        resolveConflict: vi.fn(),
        closeConflictModal: vi.fn()
    }))
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {
        this.callback([{ target: { offsetWidth: 1280 } }]);
    }
    unobserve() {}
    disconnect() {}
};

const renderApp = () => {
    return render(
        <VideoProvider>
            <App />
        </VideoProvider>
    );
};

describe('App Integration Tests', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
            configurable: true,
            value: 1280,
        });

        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
            configurable: true,
            value: 1000,
        });
    });

    it('renders the full app with sidebar and video grid', async () => {
        renderApp();

        // Sidebar should be present
        expect(screen.getByText(/watch later/i)).toBeInTheDocument();

        // Video grid should be present (initially empty)
        await waitFor(() => {
            const grid = screen.getByText(/watch later/i).closest('.w-64');
            expect(grid).toBeInTheDocument();
        });
    });

    it('shows correct video count in sidebar when empty', async () => {
        renderApp();

        await waitFor(() => {
            expect(screen.getByText('0 videos')).toBeInTheDocument();
        });
    });
});
