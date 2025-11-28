import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

const renderWithContext = (component) => {
    return render(<VideoProvider>{component}</VideoProvider>);
};

describe('VideoGrid', () => {
    it('renders a grid of videos', () => {
        renderWithContext(<VideoGrid />);

        expect(screen.getByText('Test Video 1')).toBeInTheDocument();
        expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    });

    it('displays videos in a grid layout', () => {
        const { container } = renderWithContext(<VideoGrid />);

        const gridContainer = container.querySelector('.grid');
        expect(gridContainer).toBeInTheDocument();
    });

    it('renders video cards', () => {
        renderWithContext(<VideoGrid />);

        expect(screen.getByText('Test Channel 1')).toBeInTheDocument();
        expect(screen.getByText('Test Channel 2')).toBeInTheDocument();
    });
});
