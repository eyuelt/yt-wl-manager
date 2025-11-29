# Video Data Structure and Storage Documentation

## Overview
This document explains how video data is stored, the differences between `wl.json` data and extension data, and why the DataViewer pane might not show data after reset.

## Data Storage Locations

### 1. **wl.json (Static Source File)**
- **Location**: `/wl.json` (root of project)
- **Purpose**: Initial/fallback data source downloaded from YouTube via yt-dlp
- **Size**: ~3.8 MB with 1,898 videos
- **Format**: YouTube yt-dlp playlist JSON format

### 2. **localStorage (Runtime Storage)**
The application stores three items in browser localStorage:
- `yt-wl-data`: Array of video objects
- `yt-wl-tags`: Object mapping video IDs to tag arrays
- `yt-wl-tag-metadata`: Object mapping tag names to metadata (colors, etc.)

---

## Data Shape Comparison

### wl.json Format (yt-dlp YouTube playlist data)
```json
{
  "id": "WL",
  "title": "Watch later",
  "channel": "Eyuel Tessema",
  "playlist_count": 1898,
  "entries": [
    {
      "_type": "url",
      "ie_key": "Youtube",
      "id": "v9vCF467tZg",
      "url": "https://www.youtube.com/watch?v=v9vCF467tZg",
      "title": "Election Night Rage Led Her to Kill",
      "description": null,
      "duration": 411,
      "channel_id": "UC7bYyWCCCLHDU0ZuNzGNTtg",
      "channel": "The Comments Section with Brett Cooper",
      "channel_url": "https://www.youtube.com/channel/UC7bYyWCCCLHDU0ZuNzGNTtg",
      "uploader": "The Comments Section with Brett Cooper",
      "uploader_id": "@TheCommentsSection",
      "uploader_url": "https://www.youtube.com/@TheCommentsSection",
      "thumbnails": [
        {
          "url": "https://i.ytimg.com/vi/v9vCF467tZg/hqdefault.jpg...",
          "height": 94,
          "width": 168
        }
      ],
      "timestamp": null,
      "view_count": 893000
    }
  ]
}
```

### Extension Format (Chrome Extension extracted data)
```json
[
  {
    "id": "v9vCF467tZg",
    "title": "Election Night Rage Led Her to Kill",
    "channel": "The Comments Section with Brett Cooper",
    "duration": "6:51",
    "thumbnail": "https://i.ytimg.com/vi/v9vCF467tZg/hqdefault.jpg",
    "addedAt": 1732851234567
  }
]
```

### localStorage Format (Runtime storage)
The extension data is stored directly in localStorage as:
```json
// localStorage['yt-wl-data']
[
  {
    "id": "v9vCF467tZg",
    "title": "Election Night Rage Led Her to Kill",
    "channel": "The Comments Section with Brett Cooper",
    "duration": "6:51",
    "thumbnail": "https://i.ytimg.com/vi/v9vCF467tZg/hqdefault.jpg",
    "addedAt": 1732851234567
  }
]
```

---

## Key Differences

| Property | wl.json | Extension Data |
|----------|---------|----------------|
| **Container** | `entries` array inside root object | Direct array |
| **Video ID** | `id` | `id` |
| **Title** | `title` | `title` |
| **Channel** | `channel` | `channel` |
| **Duration** | `duration` (seconds, number) | `duration` (string, "MM:SS") |
| **Thumbnail** | `thumbnails` (array of objects) | `thumbnail` (single URL string) |
| **Added Date** | N/A | `addedAt` (timestamp) |
| **Description** | `description` | N/A |
| **View Count** | `view_count` | N/A |
| **Channel URL** | `channel_url` | N/A |

---

## Why DataViewer Shows Empty After Reset

### The Issue
When you click "Reset to wl.json", the DataViewer pane shows no video data because:

1. **VideoContext loads from `wl.json.entries`**:
   ```javascript
   // VideoContext.jsx line 230
   const initialVideos = wlData.entries || [];
   setVideos(initialVideos);
   ```

2. **DataViewer reads from localStorage**:
   ```javascript
   // DataViewer.jsx line 10
   const savedVideos = localStorage.getItem('yt-wl-data');
   const videosData = savedVideos ? JSON.parse(savedVideos) : [];
   ```

3. **The Problem**: After reset, `resetToWlJson()` function:
   - ✅ Clears localStorage (line 225-227)
   - ✅ Loads videos into React state from wl.json
   - ❌ **Does NOT save wl.json data back to localStorage**

### The Flow

```
resetToWlJson() is called
    ↓
localStorage.removeItem('yt-wl-data')  // Clears storage
    ↓
setVideos(wlData.entries)  // Updates React state
    ↓
DataViewer opens
    ↓
Reads localStorage.getItem('yt-wl-data')  // Returns null!
    ↓
Shows empty array []
```

### Why Videos Still Display in the Grid
The `VideoGrid` component reads from the React context state (`videos`), not from localStorage:
```javascript
// VideoContext provides videos from state
const { filteredVideos } = useVideoContext();
```

---

## Solution

To fix the DataViewer issue, the `resetToWlJson()` function should save the data to localStorage:

```javascript
const resetToWlJson = () => {
    // Clear all localStorage data
    localStorage.removeItem('yt-wl-data');
    localStorage.removeItem('yt-wl-tags');
    localStorage.removeItem('yt-wl-tag-metadata');

    // Reload from wl.json
    const initialVideos = wlData.entries || [];
    setVideos(initialVideos);
    
    // ⚠️ ADD THIS LINE:
    localStorage.setItem('yt-wl-data', JSON.stringify(initialVideos));

    // Re-run auto-tagging...
    // (rest of function)
};
```

---

## Data Flow Diagram

```
┌─────────────┐
│   wl.json   │ (Static file, yt-dlp format)
└──────┬──────┘
       │ Initial Load
       ↓
┌─────────────────┐
│ VideoContext    │ (React state)
│ - videos        │
│ - tags          │
│ - allTags       │
└────┬────────────┘
     │
     ├─→ Save to localStorage['yt-wl-data']
     │   (on sync from extension)
     │
     └─→ VideoGrid displays from React state
         DataViewer reads from localStorage
```

---

## Chrome Extension Data Extraction

The extension extracts data from YouTube's internal API:

1. **inject.js**: Accesses `window.ytInitialData` on the page
2. **content.js**: Receives data and formats it
3. **background.js**: Stores data temporarily
4. **VideoContext**: Receives via `postMessage` and saves to localStorage

### Extension Data Path
```javascript
// content.js line 37-44
videos.push({
    id: videoId,           // From URL
    title: title,          // From DOM
    channel: channel,      // From DOM
    duration: duration,    // From DOM (formatted string)
    thumbnail: thumbnail,  // From image src
    addedAt: Date.now()   // Current timestamp
});
```

---

## Summary

1. **wl.json uses yt-dlp format** with `entries` array and rich metadata
2. **Extension data is simplified** with only essential fields
3. **localStorage stores the active dataset** (either from wl.json or extension)
4. **DataViewer reads from localStorage**, not React state
5. **Bug**: `resetToWlJson()` doesn't save to localStorage, causing DataViewer to show empty

The data structures are intentionally different because:
- wl.json has comprehensive metadata from yt-dlp
- Extension data is lightweight and extracted from live DOM
- The app normalizes both formats to work with the same UI components
