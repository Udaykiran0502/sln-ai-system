import React from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { BottomBar } from './components/BottomBar';
import { useWebSocket } from './hooks/useWebSocket';

const App: React.FC = () => {
  // Activate real-time state synchronization with FastAPI server
  useWebSocket();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#030712] text-slate-100 antialiased selection:bg-purple-900/30">
      {/* Top Controls Branding & Sync Actions */}
      <TopBar />

      {/* Editor Center Work Grid Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Tree & Orders */}
        <Sidebar />

        {/* Center Interactive Drawing Canvas stage */}
        <Canvas />

        {/* Right Side Shape Typographics Controls */}
        <PropertiesPanel />
      </div>

      {/* Bottom Telemetric Bar */}
      <BottomBar />
    </div>
  );
};

export default App;
