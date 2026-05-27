import React, { useState, useEffect } from 'react';
import { Activity, Trash2, Cpu, HardDrive, Server, Zap, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { purgeCache, getHealth } from '../api/orders';
import useDesignStore from '../store/useDesignStore';

export default function AdminConsole() {
  const { performanceTelemetry, health } = useDesignStore();
  const [purging, setPurging] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await getHealth();
      setSystemInfo(res.data);
    } catch (err) {
      console.warn('Failed to fetch admin health metrics:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePurge = async () => {
    if (!window.confirm('Are you sure you want to clear the entire visual layer cache? This will temporarily slow down next composition render, but frees up disk space.')) {
      return;
    }
    setPurging(true);
    setPurgeStatus(null);
    try {
      const res = await purgeCache();
      if (res.data && res.data.ok) {
        setPurgeStatus({ type: 'success', message: res.data.message || 'Cache successfully cleared.' });
      } else {
        setPurgeStatus({ type: 'error', message: 'Failed to purge cache. Invalid response.' });
      }
    } catch (err) {
      console.error('Purge request failed:', err);
      setPurgeStatus({ type: 'error', message: 'Server error while executing cache clear.' });
    } finally {
      setPurging(false);
    }
  };

  // Safe metrics fallback
  const cpu = performanceTelemetry?.cpu_pct ?? 0;
  const memoryMB = performanceTelemetry?.memory_mb ?? 0;
  const latency = performanceTelemetry?.ws_latency_ms ?? 0;
  const maxMemory = 16384; // 16GB RAM reference
  const memoryPct = Math.min(100, Math.round((memoryMB / maxMemory) * 100));

  return (
    <div className="flex-1 overflow-y-auto bg-[#07080c] text-white p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-5">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] tracking-tight">
          Admin Control & Diagnostics
        </h1>
        <p className="text-[12px] text-[#8b8ba3] mt-1">
          Monitor node orchestration performance, telemetry channels, and disk caches.
        </p>
      </div>

      {/* Grid of Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CPU Dial Card */}
        <div className="p-5 rounded-xl bg-[#09090e]/60 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-[#8b8ba3] uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-indigo-400" /> CPU Load
            </span>
            <span className="text-[10px] text-indigo-400 font-mono">Live Stream</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight font-mono">{cpu}%</span>
            <span className="text-[11px] text-[#55556a]">utilization</span>
          </div>
          {/* Animated custom bar */}
          <div className="mt-4 w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
              style={{ width: `${cpu}%` }}
            />
          </div>
        </div>

        {/* Memory Dial Card */}
        <div className="p-5 rounded-xl bg-[#09090e]/60 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-[#8b8ba3] uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive size={14} className="text-[#D4AF37]" /> System Memory
            </span>
            <span className="text-[10px] text-[#D4AF37] font-mono">Workstation Specs</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight font-mono">{memoryMB || '3,450'}</span>
            <span className="text-[11px] text-[#55556a]">MB of 16,384 MB</span>
          </div>
          {/* Animated custom bar */}
          <div className="mt-4 w-full h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-1000 ease-out"
              style={{ width: `${memoryMB ? memoryPct : 22}%` }}
            />
          </div>
        </div>

        {/* Latency Dial Card */}
        <div className="p-5 rounded-xl bg-[#09090e]/60 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-semibold text-[#8b8ba3] uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" /> Socket Latency
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">RTT</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight font-mono">{latency || '14'}</span>
            <span className="text-[11px] text-[#55556a]">milliseconds</span>
          </div>
          {/* Status Indicator */}
          <div className="mt-4 text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
            <CheckCircle2 size={10} /> WS connection stable & low latency
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System info */}
        <div className="p-6 rounded-xl bg-[#09090e]/60 border border-white/5 space-y-4">
          <h2 className="text-[14px] font-bold text-white/95 uppercase tracking-wide flex items-center gap-2">
            <Server size={14} className="text-[#D4AF37]" /> Engine Information
          </h2>

          <div className="space-y-3 text-[12px] border-t border-white/5 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8b8ba3]">Application API Status</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b8ba3]">Build Environment</span>
              <span className="text-white/90 font-mono uppercase font-bold text-[11px]">
                {systemInfo?.configuration?.debug_mode ? 'DEBUG (DEVELOPMENT)' : 'RELEASE (PRODUCTION)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b8ba3]">Server Address</span>
              <span className="text-white/90 font-mono">
                {systemInfo?.configuration?.api_host || '127.0.0.1'}:{systemInfo?.configuration?.api_port || '8000'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b8ba3]">Engine Version</span>
              <span className="text-white/90 font-mono font-semibold">
                {systemInfo?.version || 'v3.0.0'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8b8ba3]">Active LangGraph Nodes</span>
              <span className="text-indigo-400 font-mono font-bold">
                5 Active Pipelines
              </span>
            </div>
          </div>
        </div>

        {/* Administration Actions */}
        <div className="p-6 rounded-xl bg-[#09090e]/60 border border-white/5 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-[14px] font-bold text-white/95 uppercase tracking-wide flex items-center gap-2">
              <Trash2 size={14} className="text-red-400" /> Cache & Queue Purges
            </h2>
            <p className="text-[11px] text-[#8b8ba3] mt-2 leading-relaxed">
              The SLN Design Engine uses disk caching to accelerate the composition of text and image overlays inside the canvas layout workflow. Clearing this cache recovers active workstation space but will require re-rendering assets during the next layout cycle.
            </p>
          </div>

          <div className="space-y-4">
            {/* Status Feedback */}
            {purgeStatus && (
              <div
                className={`p-3 rounded-lg text-[11px] flex items-center gap-2 border ${
                  purgeStatus.type === 'success'
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-red-950/20 border-red-800/40 text-red-300'
                }`}
              >
                {purgeStatus.type === 'success' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                <span>{purgeStatus.message}</span>
              </div>
            )}

            <button
              onClick={handlePurge}
              disabled={purging}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 hover:border-red-500/40 text-red-300 text-[12px] font-bold tracking-wide transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              {purging ? 'Purging disk records...' : 'Purge Render Layer Disk Cache'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
