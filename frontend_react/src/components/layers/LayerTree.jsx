import React, { memo } from 'react';
import useDesignStore from '../../store/useDesignStore';
import { Type, Image, Box } from 'lucide-react';

const TYPE_ICONS = {
  TextNode:  <Type size={11} className="text-[#D4AF37]" />,
  ImageNode: <Image size={11} className="text-[#6366f1]" />,
  ShapeNode: <Box size={11} className="text-[#10b981]" />,
};

export const LayerTree = memo(function LayerTree() {
  const { layers, selectedNodeId, selectNode } = useDesignStore();

  const sorted = [...layers].sort((a, b) => (b.z_index || 0) - (a.z_index || 0));

  return (
    <div className="flex flex-col py-2">
      <div className="px-3 py-2 panel-title">Layers</div>

      {sorted.length === 0 ? (
        <div className="px-3 py-6 text-center text-[11px] text-[#55556a] italic">
          Load an order to see layers
        </div>
      ) : (
        sorted.map(layer => (
          <button
            key={layer.id}
            onClick={() => selectNode(layer.id)}
            className={`layer-item mx-2 mb-0.5 ${selectedNodeId === layer.id ? 'active' : ''}`}
            style={{ paddingLeft: `${(layer.depth || 0) * 12 + 10}px` }}
          >
            {TYPE_ICONS[layer.type] || <Box size={11} className="text-[#55556a]" />}
            <span className="text-[11px] flex-1 truncate text-left">
              {layer.name || layer.type}
            </span>
            {layer.locked && <span className="text-[9px] text-[#55556a]">🔒</span>}
            {layer.visible === false && <span className="text-[9px] text-[#55556a]">👁</span>}
            {layer.dirty && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] flex-shrink-0" />}
          </button>
        ))
      )}
    </div>
  );
});
