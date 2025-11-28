import React from 'react';
import Sidebar from './components/Sidebar';
import VideoGrid from './components/VideoGrid';

function App() {
  return (
    <div className="flex bg-gray-950 min-h-screen text-white font-sans">
      <Sidebar />
      <main className="flex-1 ml-64">
        <VideoGrid />
      </main>
    </div>
  );
}

export default App;
