import React, { memo } from 'react';
import { SlidersHorizontal, Lock, Eye, EyeOff } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

export const PropertiesInspector = memo(function PropertiesInspector() {
  const layers         = useDesignStore(s => s.layers);
  const selectedNodeId = useDesignStore(s => s.selectedNodeId);
  const updateLayerTransform = useDesignStore(s => s.updateLayerTransform);

  const node = layers.find(l => l.id === selectedNodeId);

  return (
    <section className="px-3 py-3">
      <div className="flex items-center gap-2 panel-title mb-3">
        <SlidersHorizontal size={11} />
        Properties
      </div>

      {!node ? (
        <p className="text-[11px] text-[#55556a] italic">No layer selected</p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Position */}
          <div>
            <label className="text-[10px] text-[#55556a] block mb-1">Position</label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[9px] text-[#55556a] block mb-0.5">X</span>
                <div className="relative">
                  <input
                    type="number"
                    className="sln-input pr-5 w-full"
                    value={Math.round(node.transform.x)}
                    onChange={e => updateLayerTransform(node.id, { x: Number(e.target.value) })}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[#55556a] select-none pointer-events-none font-mono">px</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-[#55556a] block mb-0.5">Y</span>
                <div className="relative">
                  <input
                    type="number"
                    className="sln-input pr-5 w-full"
                    value={Math.round(node.transform.y)}
                    onChange={e => updateLayerTransform(node.id, { y: Number(e.target.value) })}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[#55556a] select-none pointer-events-none font-mono">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="text-[10px] text-[#55556a] block mb-1">Size</label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <span className="text-[9px] text-[#55556a] block mb-0.5">W</span>
                <div className="relative">
                  <input
                    type="number"
                    className="sln-input pr-5 w-full"
                    value={Math.round(node.bounds.width)}
                    onChange={e => updateLayerTransform(node.id, { width: Number(e.target.value) })}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[#55556a] select-none pointer-events-none font-mono">px</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-[#55556a] block mb-0.5">H</span>
                <div className="relative">
                  <input
                    type="number"
                    className="sln-input pr-5 w-full"
                    value={Math.round(node.bounds.height)}
                    onChange={e => updateLayerTransform(node.id, { height: Number(e.target.value) })}
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[#55556a] select-none pointer-events-none font-mono">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <label className="text-[10px] text-[#55556a] block mb-1">Rotation</label>
            <div className="relative">
              <input
                type="number"
                className="sln-input pr-5"
                value={Math.round(node.transform.rotation || 0)}
                onChange={e => updateLayerTransform(node.id, { rotation: Number(e.target.value) })}
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-[#55556a] select-none pointer-events-none">°</span>
            </div>
          </div>

          {/* Z-index display */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#55556a]">Z-index</span>
            <span className="font-mono text-[11px] text-[#8b8ba3]">{node.z_index ?? 0}</span>
          </div>

          {/* Flags */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#8b8ba3]">
              <Lock size={11} className={node.locked ? 'text-[#D4AF37]' : 'text-[#55556a]'} />
              {node.locked ? 'Locked' : 'Unlocked'}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8b8ba3]">
              {node.visible !== false ? <Eye size={11} className="text-emerald-400" /> : <EyeOff size={11} className="text-[#55556a]" />}
              {node.visible !== false ? 'Visible' : 'Hidden'}
            </div>
          </div>

          {/* Type badge */}
          <div className="flex items-center gap-1.5">
            <span className="panel-title">Type</span>
            <span className="badge badge-blue text-[9px]">{node.type}</span>
            {node.dirty && <span className="badge badge-amber text-[9px]">Dirty</span>}
          </div>
        </div>
      )}
    </section>
  );
});
