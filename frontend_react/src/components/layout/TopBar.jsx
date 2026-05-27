import React, { useState } from 'react';
import { Activity, Download, Bell, Cpu, Zap, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';
import { exportUrl } from '../../api/orders';

const STATUS_ICONS = {
  idle:        <span className="pulse-dot bg-[#55556a]" />,
  loading:     <span className="pulse-dot bg-[#6366f1]" />,
  queued:      <span className="pulse-dot bg-[#F59E0B]" />,
  processing:  <span className="pulse-dot bg-[#6366f1]" style={{ animationDuration:'0.8s' }} />,
  composited:  <span className="pulse-dot bg-[#6366f1]" />,
  completed:   <CheckCircle size={10} className="text-emerald-400" />,
  failed:      <XCircle size={10} className="text-red-400" />,
  connected:   <span className="pulse-dot bg-emerald-400" />,
};

const STATUS_LABELS = {
  idle: 'Idle', loading: 'Loading...', queued: 'Queued', processing: 'Processing',
  composited: 'Composited', completed: 'Completed', failed: 'Failed', connected: 'Connected',
};

export function TopBar({ onPageChange, activePage }) {
  const { pipelineStatus, activeAgent, pipelineProgress, orderId, health, exportPaths } = useDesignStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const hasPdf  = exportPaths?.pdf;
  const hasTiff = exportPaths?.tiff;

  return (
    <header
      style={{ height: 'var(--topbar-h)' }}
      className="w-full flex items-center gap-3 px-4 border-b border-white/5 bg-[#09090e]/90 backdrop-blur-md flex-shrink-0 z-50"
    >
      {/* Brand */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-[#D4AF37] to-[#F3E5AB] p-[1px]">
          <div className="w-full h-full rounded-[5px] bg-[#08080d] flex items-center justify-center">
            <span className="text-[#D4AF37] font-black text-[9px] tracking-wider">SLN</span>
          </div>
        </div>
        <div className="hidden sm:block">
          <div className="text-[11px] font-semibold text-white/90 leading-none">SLN Digitals</div>
          <div className="text-[9px] text-[#55556a] uppercase tracking-widest leading-none mt-0.5">Creative OS</div>
        </div>
      </div>

      {/* Nav tabs */}
      {[
        { id: 'dashboard', label: 'Studio' },
        { id: 'workspace', label: 'Workspace' },
        { id: 'templates', label: 'Templates' },
        { id: 'create-wizard', label: 'Wizard' },
        { id: 'exports', label: 'Exports' },
        { id: 'admin', label: 'Admin' },
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => onPageChange(tab.id)}
          className={`text-[11px] sm:text-[12px] font-medium px-2.5 sm:px-3 py-1 rounded-md transition-all ${
            activePage === tab.id
              ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
              : 'text-[#8b8ba3] hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}

      <div className="flex-1" />

      {/* Active agent indicator */}
      {activeAgent && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20">
          <Cpu size={11} className="text-[#818cf8]" />
          <span className="text-[10px] text-[#818cf8] font-mono">{activeAgent}</span>
          <span className="text-[10px] text-[#55556a]">{pipelineProgress}%</span>
        </div>
      )}

      {/* Pipeline status */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass">
        {STATUS_ICONS[pipelineStatus] || <span className="pulse-dot bg-[#55556a]" />}
        <span className="text-[10px] text-[#8b8ba3]">
          {STATUS_LABELS[pipelineStatus] || pipelineStatus}
        </span>
      </div>

      {/* Export button */}
      {(hasPdf || hasTiff) && (
        <div className="flex items-center gap-1">
          {hasPdf && (
            <a
              href={exportUrl(orderId, 'pdf')}
              download
              className="btn btn-ghost !py-1 !px-2 text-[11px]"
              title="Download PDF"
            >
              <Download size={12} /> PDF
            </a>
          )}
          {hasTiff && (
            <a
              href={exportUrl(orderId, 'tiff')}
              download
              className="btn btn-ghost !py-1 !px-2 text-[11px]"
              title="Download TIFF"
            >
              <Download size={12} /> TIFF
            </a>
          )}
        </div>
      )}

      {/* Health dot */}
      <div className="flex items-center gap-1.5" title={health ? 'Backend connected' : 'Backend offline'}>
        <span
          className={`pulse-dot ${health ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ animationDuration: health ? '3s' : '0.5s' }}
        />
      </div>
    </header>
  );
}
