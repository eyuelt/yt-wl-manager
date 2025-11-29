import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VideoGrid from './VideoGrid';
import { VideoProvider } from '../context/VideoContext';

// Mock wl.json with inline data
vi.mock('../../wl.json', () => ({
    default: {
        entries: [
            {
                id: 'test-1',
                title: 'Test Video 1',
                channel: 'Test Channel 1',
                thumbnails: [{ url: 'https://example.com/1.jpg' }],
                duration: 600,
                url: 'https://youtube.com/watch?v=test-1',
            },
            {
                id: 'test-2',
                title: 'Test Video 2',
                channel: 'Test Channel 2',
                thumbnails: [{ url: 'https://example.com/2.jpg' }],
                duration: 600,
                url: 'https://youtube.com/watch?v=test-2',
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

    it('renders a grid of videos', async () => {
        renderWithContext(<VideoGrid />);

        await waitFor(() => {
            expect(screen.getByText('Test Video 1')).toBeInTheDocument();
            expect(screen.getByText('Test Video 2')).toBeInTheDocument();
        });
    });

    it('displays videos in a grid layout', async () => {
        const { container } = renderWithContext(<VideoGrid />);

        await waitFor(() => {
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toBeInTheDocument();
        });
    });

    it('renders video cards', async () => {
        renderWithContext(<VideoGrid />);

        await waitFor(() => {
            expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
            expect(screen.getByText('Test Channel 2')).toBeInTheDocument();
        });
    });
});
