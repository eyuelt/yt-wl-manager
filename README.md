# YouTube Watch Later Browser

A powerful React + Vite web application for browsing, managing, and organizing your YouTube Watch Later playlists with AI-powered tagging and Google Drive sync capabilities.

## Features

### Core Functionality
- **Video Management**: Browse your YouTube Watch Later videos in a responsive, virtualized grid layout
- **Tagging System**: Add custom tags to videos for better organization and filtering
- **Search & Filter**: Search videos by title or channel, filter by tags or categories
- **Selection Mode**: Bulk select videos with keyboard shortcuts (Shift+click for ranges)
- **Archive System**: Archive watched videos to keep your active list clean

### Advanced Features
- **AI-Powered Tagging**: Automatically tag videos using Google Gemini API based on video content, titles, and descriptions
- **Google Drive Sync**: Sync your video collection across devices with conflict resolution and file locking
- **Chrome Extension Integration**: Browser extension syncs your YouTube Watch Later playlist directly
- **Cross-Tab Synchronization**: Changes sync across browser tabs in real-time
- **Read-Only Mode**: Safe viewing mode when Drive sync is enabled but you're not signed in, or when another user holds the lock

## Technologies Used

### Frontend
- **React 19** with React DOM
- **Vite 7** (build tool with HMR)
- **Tailwind CSS 4** with PostCSS
- **Material-UI 7** (MUI components)
- **Lucide React** (icons)

### Performance & Optimization
- **@tanstack/react-virtual** for virtualized scrolling (handles 1000+ videos efficiently)
- React Context API for state management
- localStorage with custom abstraction layer

### APIs & External Services
- **Google Drive API v3** (file sync and collaboration)
- **Google Gemini API** (AI-powered video tagging)
- **Google Identity Services** (OAuth 2.0 authentication)
- **Chrome Extension API** (YouTube playlist integration)

### Testing & Quality
- **Vitest** (unit testing)
- **@testing-library/react** (component testing)
- **ESLint** with React hooks rules

## Setup

### Installation

```bash
npm install
```

### Configuration

You'll need to configure API keys in the Settings panel within the app:

1. **Gemini API Key** (optional, for AI tagging):
   - Obtain from [Google AI Studio](https://aistudio.google.com/)
   - Enter in Settings > Gemini API Key

2. **Google OAuth 2.0 Client ID** (optional, for Google Drive sync):
   - Create in [Google Cloud Console](https://console.cloud.google.com/)
   - Configure OAuth consent screen and credentials
   - Requires `https://www.googleapis.com/auth/drive.appdata` scope
   - Enter in Settings > Google OAuth Client ID

3. **Chrome Extension ID** (optional, for YouTube sync):
   - Build and install the Chrome extension (see below)
   - Copy the extension ID from `chrome://extensions`
   - Enter in Settings > Chrome Extension ID

## Development

### Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Run Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Chrome Extension Setup

The project includes a Chrome extension for syncing your YouTube Watch Later playlist:

1. Build the extension (if needed) or use the files in `src/extension/`
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `src/extension` directory
5. Copy the extension ID and paste it in the app's Settings

## Project Structure

```
src/
├── components/          # React UI components
│   ├── VideoCard        # Individual video display
│   ├── VideoGrid        # Virtualized grid layout
│   ├── Sidebar          # Navigation and tag management
│   ├── BulkActionsBar   # Bulk operations toolbar
│   ├── SearchBar        # Search functionality
│   └── [Modals]         # Various modal dialogs
├── context/             # React Context providers
│   ├── VideoContext     # Main app state
│   └── GoogleDriveContext # Drive sync state
├── utils/               # Utility functions
│   ├── dataStore        # localStorage abstraction
│   ├── googleDriveSync  # Google Drive API client
│   ├── geminiTag        # AI tagging engine
│   └── syncDiff         # Sync change detection
├── extension/           # Chrome extension files
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── inject.js
└── main.jsx            # Entry point
```

## API Management

This project uses multiple Google APIs. Here are the dashboards where each API is configured and managed:

- **Gemini API**: Managed through [Google AI Studio](https://aistudio.google.com/)
  - API key generation
  - Usage quotas and limits
  - Model selection

- **Google Drive API**: Managed through [Google Cloud Console](https://console.cloud.google.com/)
  - OAuth 2.0 credentials
  - API quotas and billing
  - OAuth consent screen configuration
  - Authorized domains

## Deployment

Deploy to GitHub Pages:

```bash
npm run deploy
```

The app is currently hosted at: https://eyuelt.github.io/yt-wl-manager

## Key Features Explained

### Google Drive Sync
- **File Locking**: Prevents concurrent edits by multiple users
- **Conflict Resolution**: Choose between local or Drive data when conflicts occur
- **Sync Preview**: View changes before syncing with detailed diff statistics
- **Read-Only Mode**: Automatically enabled when sync is on but you're not the editor

### AI Tagging
- **Single Video Tagging**: Tag one video at a time with context-aware suggestions
- **Batch Tagging**: Process multiple videos with progress tracking
- **Smart Context**: Uses video title, description, and channel info for accurate tags
- **Duplicate Prevention**: Respects existing tags to avoid redundancy

### Tag Management
- **Rename**: Rename tags across all videos at once
- **Merge**: Consolidate duplicate or similar tags
- **Delete**: Remove tags from all videos
- **Filter**: Click any tag to filter videos

## License

MIT
