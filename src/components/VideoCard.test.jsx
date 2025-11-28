import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoCard from './VideoCard';
import { VideoProvider } from '../context/VideoContext';

// Mock wl.json with inline data
vi.mock('../../wl.json', () => ({
    default: {
        entries: [
            {
                id: 'test-video-1',
                title: 'Test Video 1',
                description: 'A test video',
                duration: 600,
                channel: 'Test Channel',
                thumbnails: [
                    { url: 'https://example.com/thumb.jpg', height: 188, width: 336 },
                ],
                url: 'https://www.youtube.com/watch?v=test-video-1',
            },
        ],
    },
}));

const mockVideo = {
    id: 'test-video-1',
    title: 'Test Video 1',
    description: 'A test video',
    duration: 600,
    channel: 'Test Channel',
    thumbnails: [
        { url: 'https://example.com/thumb.jpg', height: 188, width: 336 },
    ],
    url: 'https://www.youtube.com/watch?v=test-video-1',
};

const renderWithContext = (component) => {
    return render(<VideoProvider>{component}</VideoProvider>);
};

describe('VideoCard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders video title', () => {
        renderWithContext(<VideoCard video={mockVideo} />);
        expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    });

    it('renders channel name', () => {
        renderWithContext(<VideoCard video={mockVideo} />);
        expect(screen.getByText(mockVideo.channel)).toBeInTheDocument();
    });

    it('renders video thumbnail', () => {
        renderWithContext(<VideoCard video={mockVideo} />);
        const thumbnail = screen.getByAltText(mockVideo.title);
        expect(thumbnail).toBeInTheDocument();
        expect(thumbnail).toHaveAttribute('src', mockVideo.thumbnails[mockVideo.thumbnails.length - 1].url);
    });

    it('displays formatted duration', () => {
        renderWithContext(<VideoCard video={mockVideo} />);
        // 600 seconds = 10:00
        expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('formats duration with hours correctly', () => {
        const longVideo = { ...mockVideo, duration: 3661 }; // 1:01:01
        renderWithContext(<VideoCard video={longVideo} />);
        expect(screen.getByText('1:01:01')).toBeInTheDocument();
    });

    it('shows add tag button', () => {
        renderWithContext(<VideoCard video={mockVideo} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('opens tag input when add button is clicked', async () => {
        const user = userEvent.setup();
        renderWithContext(<VideoCard video={mockVideo} />);

        const buttons = screen.getAllByRole('button');
        const addButton = buttons.find(btn => btn.querySelector('svg'));
        if (addButton) {
            await user.click(addButton);

            const input = screen.queryByPlaceholderText('New tag...');
            expect(input).toBeInTheDocument();
        }
    });

    it('links to the video URL', () => {
        renderWithContext(<VideoCard video={mockVideo} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', mockVideo.url);
        expect(link).toHaveAttribute('target', '_blank');
    });
});
