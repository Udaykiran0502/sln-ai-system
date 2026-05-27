import React from 'react';
import { Cpu, HardDrive, Wifi, Zap } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

export function BottomBar() {
  const { performanceTelemetry, health } = useDesignStore();

  const cpuPct = performanceTelemetry?.cpu_pct ?? 0;
  const memoryMb = performanceTelemetry?.memory_mb ?? 0;
  const wsLatency = performanceTelemetry?.ws_latency_ms ?? 0;

  return (
    <footer
      style={{ height: '32px' }}
      className="w-full flex items-center justify-between px-4 border-t border-white/5 bg-[#09090e]/95 backdrop-blur-md flex-shrink-0 z-50 text-[10px] text-[#55556a] font-mono select-none"
    >
      {/* Left: System spec / target hardware */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Zap size={10} className="text-[#D4AF37]" />
          <span>Intel i7 + GT 730 Workstation Mode</span>
        </div>
        <span>|</span>
        <span className="hidden sm:inline">Active Thread: Sequential Render Engine</span>
      </div>

      {/* Right: Live Telemetry Metrics */}
      <div className="flex items-center gap-4">
        {/* CPU */}
        <div className="flex items-center gap-1.5" title="CPU Usage">
          <Cpu size={10} className={cpuPct > 80 ? "text-red-400" : "text-[#818cf8]"} />
          <span>CPU: {cpuPct}%</span>
        </div>
        
        {/* RAM */}
        <div className="flex items-center gap-1.5" title="Workstation RAM Usage">
          <HardDrive size={10} className={memoryMb > 1000 ? "text-red-400" : "text-[#10b981]"} />
          <span>RAM: {memoryMb}MB</span>
        </div>

        {/* Latency */}
        <div className="flex items-center gap-1.5" title="WebSocket Latency">
          <Wifi size={10} className={wsLatency > 300 ? "text-red-400" : "text-[#D4AF37]"} />
          <span>WS Latency: {wsLatency}ms</span>
        </div>

        {/* Network Status */}
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${health ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span>{health ? 'LIVE' : 'DISCONNECTED'}</span>
        </div>
      </div>
    </footer>
  );
}
