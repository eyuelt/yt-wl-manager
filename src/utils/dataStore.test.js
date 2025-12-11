import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataStore } from './dataStore';

describe('dataStore', () => {
    beforeEach(() => {
        // Create a working localStorage mock
        let store = {};
        const localStorageMock = {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => {
                store[key] = value.toString();
            }),
            removeItem: vi.fn((key) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        };

        // Replace the global mock with our working one
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        });

        vi.clearAllMocks();
    });

    it('clear() removes videos, tags, and metadata but preserves settings', async () => {
        // Setup initial data
        const videos = [{ id: 'v1', title: 'Video 1' }];
        const tags = { 'v1': ['tag1'] };
        const metadata = { 'tag1': { color: 'red' } };
        const settings = { theme: 'dark', apiKey: 'xyz' };

        await dataStore.setVideos(videos);
        await dataStore.setTags(tags);
        await dataStore.setTagMetadata(metadata);
        await dataStore.setSettings(settings);

        // Verify data is set
        expect(await dataStore.getVideos()).toEqual(videos);
        expect(await dataStore.getTags()).toEqual(tags);
        expect(await dataStore.getTagMetadata()).toEqual(metadata);
        expect(await dataStore.getSettings()).toEqual(settings);

        // Clear data
        await dataStore.clear();

        // Verify videos, tags, and metadata are cleared
        expect(await dataStore.getVideos()).toEqual([]);
        expect(await dataStore.getTags()).toEqual({});
        expect(await dataStore.getTagMetadata()).toEqual({});

        // Verify settings are PRESERVED
        expect(await dataStore.getSettings()).toEqual(settings);
    });
});
