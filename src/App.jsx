import React from 'react';
import Sidebar from './components/Sidebar';
import VideoHeader from './components/VideoHeader';
import VideoGrid from './components/VideoGrid';
import BulkActionsBar from './components/BulkActionsBar';

function App() {
  return (
    <div className="flex bg-gray-950 min-h-screen text-white font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 h-screen flex flex-col">
        <VideoHeader />
        <VideoGrid />
      </main>
      <BulkActionsBar />
    </div>
  );
}

export default App;
