import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { VideoProvider } from './context/VideoContext';

// Mock wl.json with inline data
vi.mock('../wl.json', () => ({
    default: {
        entries: [
            {
                id: 'app-test-1',
                title: 'App Test Video 1',
                description: 'Test description',
                channel: 'Test Channel',
                thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
                duration: 600,
                url: 'https://youtube.com/watch?v=app-test-1',
            },
            {
                id: 'app-test-2',
                title: 'App Test Video 2',
                description: 'Another test',
                channel: 'Another Channel',
                thumbnails: [{ url: 'https://example.com/thumb2.jpg' }],
                duration: 600,
                url: 'https://youtube.com/watch?v=app-test-2',
            },
        ],
    },
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

    it('renders the full app with sidebar and video grid', () => {
        renderApp();

        // Sidebar should be present
        expect(screen.getByText(/watch later/i)).toBeInTheDocument();

        // Video grid should be present with videos
        expect(screen.getByText('App Test Video 1')).toBeInTheDocument();
        expect(screen.getByText('App Test Video 2')).toBeInTheDocument();
    });

    it('displays videos in grid layout', () => {
        const { container } = renderApp();

        const grid = container.querySelector('.grid');
        expect(grid).toBeInTheDocument();
    });

    it('shows correct video count in sidebar', () => {
        renderApp();

        expect(screen.getByText('2 videos')).toBeInTheDocument();
    });
});
