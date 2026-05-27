import React from 'react';
import { Grid, ZoomIn, ZoomOut, Maximize2, Eye, EyeOff } from 'lucide-react';
import useDesignStore from '../store/useDesignStore';

export function CanvasToolbar() {
  const { zoomLevel, showGrid, showSafeZone, setZoom, toggleGrid, toggleSafeZone } = useDesignStore();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#0a0b12]">
      {/* Zoom controls */}
      <button className="btn btn-ghost !py-1 !px-2" onClick={() => setZoom(zoomLevel - 0.1)}>
        <ZoomOut size={13} />
      </button>

      <span
        className="text-[11px] font-mono text-[#8b8ba3] min-w-[40px] text-center cursor-pointer"
        onClick={() => setZoom(1.0)}
        title="Reset zoom"
      >
        {Math.round(zoomLevel * 100)}%
      </span>

      <button className="btn btn-ghost !py-1 !px-2" onClick={() => setZoom(zoomLevel + 0.1)}>
        <ZoomIn size={13} />
      </button>

      <div className="divider !my-0 !h-[20px] !w-px !mx-1" />

      {/* Grid toggle */}
      <button
        className={`btn btn-ghost !py-1 !px-2 ${showGrid ? 'text-[#D4AF37]' : ''}`}
        onClick={toggleGrid}
        title="Toggle grid"
      >
        <Grid size={13} />
      </button>

      {/* Safe zone toggle */}
      <button
        className={`btn btn-ghost !py-1 !px-2 ${showSafeZone ? 'text-[#F59E0B]' : ''}`}
        onClick={toggleSafeZone}
        title="Toggle safe zone"
      >
        {showSafeZone ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>

      {/* Fit to screen */}
      <button className="btn btn-ghost !py-1 !px-2" onClick={() => setZoom(1.0)} title="Fit to screen">
        <Maximize2 size={13} />
      </button>

      <div className="flex-1" />

      {/* Canvas info */}
      <span className="text-[10px] font-mono text-[#55556a]">
        800 × 400 px logical · 72 DPI viewport
      </span>
    </div>
  );
}
