import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { VideoProvider } from './context/VideoContext.jsx'
import { GoogleDriveProvider } from './context/GoogleDriveContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleDriveProvider>
      <VideoProvider>
        <App />
      </VideoProvider>
    </GoogleDriveProvider>
  </React.StrictMode>,
)
