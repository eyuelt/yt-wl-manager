import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { VideoProvider } from '../context/VideoContext';

// Mock wl.json with inline data
vi.mock('../../wl.json', () => ({
    default: {
        entries: [
            { id: '1', title: 'Video 1', channel: 'Channel 1', thumbnails: [], duration: 600, url: 'https://youtube.com/1' },
            { id: '2', title: 'Video 2', channel: 'Channel 2', thumbnails: [], duration: 600, url: 'https://youtube.com/2' },
        ],
    },
}));

const renderWithContext = (component) => {
    return render(<VideoProvider>{component}</VideoProvider>);
};

describe('Sidebar', () => {
    it('renders the app title', () => {
        renderWithContext(<Sidebar />);
        expect(screen.getByText(/watch later/i)).toBeInTheDocument();
    });

    it('displays video count', async () => {
        renderWithContext(<Sidebar />);
        await waitFor(() => {
            expect(screen.getByText('2 videos')).toBeInTheDocument();
        });
    });

    it('renders "All" category', () => {
        renderWithContext(<Sidebar />);
        expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('renders "Uncategorized" category', () => {
        renderWithContext(<Sidebar />);
        expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    });

    it('highlights the selected category', () => {
        renderWithContext(<Sidebar />);

        const allButton = screen.getByRole('button', { name: /all/i });
        expect(allButton).toHaveClass('bg-red-600');
    });

    it('changes selected category when clicked', async () => {
        const user = userEvent.setup();
        renderWithContext(<Sidebar />);

        const uncategorizedButton = screen.getByRole('button', { name: /uncategorized/i });
        await user.click(uncategorizedButton);

        expect(uncategorizedButton).toHaveClass('bg-red-600');
    });
});
