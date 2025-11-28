import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { VideoProvider, useVideoContext } from './VideoContext';

// Mock wl.json with inline data
vi.mock('../../wl.json', () => ({
    default: {
        entries: [
            {
                id: 'test-1',
                title: 'Test Video 1',
                description: 'Tech video',
                channel: 'Tech Channel',
                thumbnails: [],
                duration: 600,
                url: 'https://youtube.com/1',
            },
            {
                id: 'test-2',
                title: 'Test Video 2',
                description: 'Gaming video',
                channel: 'Gaming Channel',
                thumbnails: [],
                duration: 600,
                url: 'https://youtube.com/2',
            },
        ],
    },
}));

describe('VideoContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('provides initial video data', () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        expect(result.current.videos).toHaveLength(2);
    });

    it('initializes with "All" category selected', () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        expect(result.current.selectedCategory).toBe('All');
    });

    it('shows all videos when "All" category is selected', () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        expect(result.current.filteredVideos).toHaveLength(2);
    });

    it('adds a tag to a video', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        const videoId = 'test-1';
        const tagName = 'Test Tag';

        act(() => {
            result.current.addTag(videoId, tagName);
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

        const videoId = 'test-1';
        const tagName = 'Test Tag';

        // Add tag
        act(() => {
            result.current.addTag(videoId, tagName);
        });

        await waitFor(() => {
            expect(result.current.tags[videoId]).toContain(tagName);
        });

        // Remove tag
        act(() => {
            result.current.removeTag(videoId, tagName);
        });

        await waitFor(() => {
            expect(result.current.tags[videoId] || []).not.toContain(tagName);
        });
    });

    it('filters videos by category', async () => {
        const { result } = renderHook(() => useVideoContext(), {
            wrapper: VideoProvider,
        });

        const videoId = 'test-1';
        const category = 'Tech';

        // Add tag to first video
        act(() => {
            result.current.addTag(videoId, category);
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

        const tagName = 'ColorTag';
        const color = '#ff0000';

        // Default color
        expect(result.current.getTagColor(tagName)).toBe('#2563EB');

        // Update color
        act(() => {
            result.current.updateTagColor(tagName, color);
        });

        await waitFor(() => {
            expect(result.current.getTagColor(tagName)).toBe(color);
            expect(result.current.tagMetadata[tagName].color).toBe(color);
        });
    });
});
