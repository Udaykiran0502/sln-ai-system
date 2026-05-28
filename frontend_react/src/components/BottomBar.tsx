import React from 'react';
import { useStore } from '../store/useStore';
import { Network, Timer, Layers, LayoutGrid } from 'lucide-react';

export const BottomBar: React.FC = () => {
  const telemetry = useStore((state) => state.telemetry);
  const project = useStore((state) => state.project);

  return (
    <footer className="h-8 border-t border-[#1e2d4a] bg-[#030712] px-6 flex items-center justify-between shrink-0 select-none text-[10px] text-slate-500 font-mono">
      {/* Network Latency Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Network size={11} className="text-slate-600" />
          <span>Server Endpoint: <span className="text-slate-400">ws://localhost:8000</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer size={11} className="text-slate-600" />
          <span>Latency: <span className="text-slate-400">{telemetry.latency}ms</span></span>
        </div>
      </div>

      {/* Render Queue & Scene Telemetry */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Layers size={11} className="text-slate-600" />
          <span>Layers: <span className="text-slate-400">{project.sceneGraph.length} active</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <LayoutGrid size={11} className="text-slate-600" />
          <span>DPI Enforcement: <span className="text-purple-400 font-bold">300 DPI (Strict)</span></span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#0a1424] border border-[#1e2d4a] px-2 py-0.5 rounded text-[9px]">
          <span className="text-slate-500">Export Queue:</span>
          <span className="text-purple-400 font-bold font-mono">{telemetry.queueLength} pending</span>
        </div>
      </div>
    </footer>
  );
};
