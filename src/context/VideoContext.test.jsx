import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { VideoProvider, useVideoContext } from './VideoContext';

// Mock dataStore to control async data loading
vi.mock('../utils/dataStore', () => ({
    default: {
        getVideos: vi.fn().mockResolvedValue([
            { id: 'test-1', title: 'Test Video 1', addedAt: 1000 },
            { id: 'test-2', title: 'Test Video 2', addedAt: 2000 }
        ]),
        getTags: vi.fn().mockResolvedValue({}),
        getTagMetadata: vi.fn().mockResolvedValue({}),
        getSettings: vi.fn().mockResolvedValue({ extensionId: 'test-ext-id' }),
        setVideos: vi.fn().mockResolvedValue(),
        setTags: vi.fn().mockResolvedValue(),
        setTagMetadata: vi.fn().mockResolvedValue(),
        subscribe: vi.fn().mockReturnValue(() => { }),
        KEYS: { VIDEOS: 'videos', TAGS: 'tags', TAG_METADATA: 'tagMetadata', SETTINGS: 'settings' }
    }
}));

// Mock Chrome runtime
global.chrome = {
    runtime: {
        sendMessage: vi.fn((extId, msg, callback) => {
            if (callback) callback({ success: true });
        }),
        lastError: null
    }
};

describe('VideoContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('provides initial empty video data', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        // Wait for initial load to complete
        await waitFor(() => {
            expect(result.current.videos).toHaveLength(2);
        });
    });

    it('initializes with "All" category selected', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        await waitFor(() => {
            expect(result.current.selectedCategory).toBe('All');
        });
    });

    it('shows all videos when "All" category is selected', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        await waitFor(() => {
            expect(result.current.filteredVideos).toHaveLength(2);
        });
    });

    it('adds a tag to a video', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        // Wait for initial data to load
        await waitFor(() => {
            expect(result.current.videos).toHaveLength(2);
        });

        const videoId = 'test-1';
        const tagName = 'Test Tag';

        await act(async () => {
            await result.current.addTag(videoId, tagName);
        });

        await waitFor(() => {
            expect(result.current.tags[videoId]).toContain(tagName);
            expect(result.current.allTags).toContain(tagName);
        });
    });

    it('removes a tag from a video', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        // Wait for initial data to load
        await waitFor(() => {
            expect(result.current.videos).toHaveLength(2);
        });

        const videoId = 'test-1';
        const tagName = 'Test Tag';

        // Add tag
        await act(async () => {
            await result.current.addTag(videoId, tagName);
        });

        await waitFor(() => {
            expect(result.current.tags[videoId]).toContain(tagName);
        });

        // Remove tag
        await act(async () => {
            await result.current.removeTag(videoId, tagName);
        });

        await waitFor(() => {
            expect(result.current.tags[videoId] || []).not.toContain(tagName);
        });
    });

    it('filters videos by category', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        // Wait for initial data to load
        await waitFor(() => {
            expect(result.current.videos).toHaveLength(2);
        });

        const videoId = 'test-1';
        const category = 'Tech';

        // Add tag to first video
        await act(async () => {
            await result.current.addTag(videoId, category);
        });

        await waitFor(() => {
            expect(result.current.tags[videoId]).toContain(category);
        });

        // Select the category
        act(() => {
            result.current.setSelectedCategory(category);
        });

        await waitFor(() => {
            expect(result.current.filteredVideos.length).toBe(1);
            expect(result.current.filteredVideos[0].id).toBe(videoId);
        });
    });

    it('manages tag colors', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        // Wait for initial data to load
        await waitFor(() => {
            expect(result.current.videos).toHaveLength(2);
        });

        const tagName = 'ColorTag';
        const color = '#ff0000';

        // Default color
        expect(result.current.getTagColor(tagName)).toBe('#2563EB');

        // Update color
        await act(async () => {
            await result.current.updateTagColor(tagName, color);
        });

        await waitFor(() => {
            expect(result.current.getTagColor(tagName)).toBe(color);
            expect(result.current.tagMetadata[tagName].color).toBe(color);
        });
    });
});
