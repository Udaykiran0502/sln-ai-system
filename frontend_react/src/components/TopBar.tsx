import React from 'react';
import { useStore } from '../store/useStore';
import { Save, AlertCircle, Bot, HardDriveUpload, CheckCircle } from 'lucide-react';

export const TopBar: React.FC = () => {
  const project = useStore((state) => state.project);
  const telemetry = useStore((state) => state.telemetry);
  const addLog = useStore((state) => state.addLog);

  const handleSave = () => {
    addLog('Manual save triggered. Synchronizing local state graph with backend cache...');
    // Simple alert
    alert('Project saved successfully! Changes synced to local memory.');
  };

  return (
    <header className="h-14 border-b border-[#1e2d4a] bg-[#030712] px-6 flex items-center justify-between shrink-0 select-none text-xs">
      {/* App Branding Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-purple-700 p-1.5 rounded flex items-center justify-center font-black text-white tracking-widest text-[11px] border border-purple-500 shadow-md">
          SLN
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-100 text-[11px] tracking-wide uppercase">SLN Digitals</span>
          <span className="text-[9px] text-[#a855f7] font-mono">{project.name}</span>
        </div>
      </div>

      {/* AI Orchestrator Layer Status Dials */}
      <div className="flex items-center gap-4 bg-[#080c14] border border-[#1e2d4a] px-4 py-1.5 rounded-full">
        <div className="flex items-center gap-2">
          <Bot size={13} className="text-purple-400" />
          <span className="text-[10px] font-bold text-slate-300">LangGraph Governance:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[9px] font-mono text-emerald-400">Idle (Awaiting Task)</span>
        </div>
      </div>

      {/* Workspace Control Buttons */}
      <div className="flex items-center gap-2">
        {/* WS Status Indicator */}
        <div className="flex items-center gap-2 border border-[#1e2d4a] px-3 py-1.5 rounded bg-[#080c14]">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">WebSockets:</span>
          {telemetry.wsStatus === 'connected' ? (
            <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold text-[9px]">
              <CheckCircle size={10} /> Connected
            </div>
          ) : telemetry.wsStatus === 'connecting' ? (
            <div className="flex items-center gap-1 text-amber-400 font-mono font-bold text-[9px]">
              <AlertCircle size={10} /> Connecting
            </div>
          ) : (
            <div className="flex items-center gap-1 text-rose-400 font-mono font-bold text-[9px]">
              <AlertCircle size={10} /> Offline
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-[#0c1424] hover:bg-[#121c2c] border border-[#1e2d4a] px-3 py-2 rounded text-slate-300 font-medium transition-colors"
        >
          <Save size={13} />
          Save Project
        </button>

        <button
          onClick={() => {
            addLog('Export pipeline triggered. Initializing pyvips CMYK TIFF compilation...');
            alert('Export triggered! Render job added to queue.');
          }}
          className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 border border-purple-500 px-3 py-2 rounded text-white font-medium transition-colors"
        >
          <HardDriveUpload size={13} />
          Export Print Flex
        </button>
      </div>
    </header>
  );
};
