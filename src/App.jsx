import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import VideoHeader from './components/VideoHeader';
import VideoGrid from './components/VideoGrid';
import BulkActionsBar from './components/BulkActionsBar';
import ConflictResolutionModal from './components/ConflictResolutionModal';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex bg-gray-950 min-h-screen text-white font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="flex-1 lg:ml-64 h-screen flex flex-col">
        <VideoHeader onMenuClick={() => setSidebarOpen(true)} />
        <VideoGrid />
      </main>
      <BulkActionsBar />
      <ConflictResolutionModal />
    </div>
  );
}

export default App;
