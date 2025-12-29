import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VideoGrid from './VideoGrid';
import { VideoProvider } from '../context/VideoContext';

// Mock GoogleDriveContext
vi.mock('../context/GoogleDriveContext', () => ({
    useGoogleDrive: vi.fn(() => ({
        syncMode: 'disabled',
        isSignedIn: false,
        isSyncing: false,
        hasUnsyncedChanges: false,
    }))
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {
        // Trigger callback with mock dimensions
        this.callback([{ target: { offsetWidth: 1280 } }]);
    }
    unobserve() {}
    disconnect() {}
};

const renderWithContext = (component) => {
    return render(<VideoProvider>{component}</VideoProvider>);
};

describe('VideoGrid', () => {
    beforeEach(() => {
        // Mock offsetWidth for the virtualizer container
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
            configurable: true,
            value: 1280,
        });

        // Mock offsetHeight for virtualization to work
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
            configurable: true,
            value: 1000,
        });
    });

    it('renders an empty grid when no videos', async () => {
        renderWithContext(<VideoGrid />);

        await waitFor(() => {
            expect(screen.getByText('No videos found.')).toBeInTheDocument();
        });
    });
});
