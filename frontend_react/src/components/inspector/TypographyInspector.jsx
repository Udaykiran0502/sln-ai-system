import React, { memo, useState } from 'react';
import { Type, Minus, Plus, AlignVerticalSpaceAround } from 'lucide-react';
import useDesignStore from '../../store/useDesignStore';

export const TypographyInspector = memo(function TypographyInspector() {
  const layers         = useDesignStore(s => s.layers);
  const selectedNodeId = useDesignStore(s => s.selectedNodeId);
  const updateLayerTransform = useDesignStore(s => s.updateLayerTransform);
  const syncTextBounds       = useDesignStore(s => s.syncTextBounds);
  const measureTextMetrics   = useDesignStore(s => s.measureTextMetrics);

  const [alignTargetId, setAlignTargetId] = useState('');

  const node = layers.find(l => l.id === selectedNodeId && l.type === 'TextNode');

  if (!node) {
    return (
      <section className="px-3 py-3">
        <div className="flex items-center gap-2 panel-title mb-3">
          <Type size={11} />
          Typography
        </div>
        <p className="text-[11px] text-[#55556a] italic">
          Select a text layer to inspect
        </p>
      </section>
    );
  }

  const otherTextNodes = layers.filter(l => l.id !== node.id && l.type === 'TextNode');

  const handleSizeChange = (newSize) => {
    const size = Math.max(6, Math.min(300, newSize));
    updateLayerTransform(node.id, { font_size: size });
    // Trigger auto-bounds sync to fit the new font size
    setTimeout(() => syncTextBounds(node.id), 50);
  };

  const handleTextChange = (newText) => {
    updateLayerTransform(node.id, { text_content: newText });
    // Trigger auto-bounds sync to fit the new text content
    setTimeout(() => syncTextBounds(node.id), 50);
  };

  const handleBaselineAlign = async () => {
    if (!alignTargetId) return;
    const targetNode = layers.find(l => l.id === alignTargetId);
    if (!targetNode || !node) return;

    // Get font file names
    const nodeFont = node.font_path ? node.font_path.split(/[\\/]/).pop() : 'NTR.ttf';
    const targetFont = targetNode.font_path ? targetNode.font_path.split(/[\\/]/).pop() : 'NTR.ttf';

    // Measure metrics to extract baseline offsets
    const currentMetrics = await measureTextMetrics(node.text_content || '', nodeFont, node.font_size || 24, node.bounds.width);
    const targetMetrics = await measureTextMetrics(targetNode.text_content || '', targetFont, targetNode.font_size || 24, targetNode.bounds.width);

    if (currentMetrics && targetMetrics) {
      const currentAscent = currentMetrics.ascent;
      const targetAscent = targetMetrics.ascent;

      // Aligned position: nodeY + currentAscent = targetY + targetAscent
      const newY = targetNode.transform.y + targetAscent - currentAscent;
      
      // Update Y coordinate in store
      updateLayerTransform(node.id, { y: newY });
    }
  };

  return (
    <section className="px-3 py-3">
      <div className="flex items-center gap-2 panel-title mb-3">
        <Type size={11} />
        Typography
      </div>

      <div className="flex flex-col gap-3">
        {/* Font path (display only) */}
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Font File</label>
          <div className="sln-input text-[10px] text-[#8b8ba3] truncate" title={node.font_path}>
            {node.font_path ? node.font_path.split(/[\\/]/).pop() : 'Default'}
          </div>
        </div>

        {/* Font size */}
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Size (pt)</label>
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost !py-1 !px-2"
              onClick={() => handleSizeChange((node.font_size || 24) - 1)}
            >
              <Minus size={10} />
            </button>
            <input
              type="number"
              className="sln-input text-center text-[12px]"
              value={node.font_size || 24}
              min={6}
              max={300}
              onChange={e => handleSizeChange(parseInt(e.target.value) || 24)}
            />
            <button
              className="btn btn-ghost !py-1 !px-2"
              onClick={() => handleSizeChange((node.font_size || 24) + 1)}
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Text content */}
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">
            Content
            {node.language === 'telugu' && (
              <span className="ml-2 badge badge-gold !py-0 !text-[9px]">Telugu</span>
            )}
          </label>
          <textarea
            className="sln-input resize-none text-[12px]"
            rows={3}
            value={node.text_content || ''}
            onChange={e => handleTextChange(e.target.value)}
          />
          {node.language === 'telugu' && (
            <p className="text-[9px] text-[#55556a] mt-1">
              ⚠ Telugu shaped on backend — auto-fit updates bounds instantly
            </p>
          )}
        </div>

        {/* Color */}
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={node.color || '#ffffff'}
              className="w-8 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
              onChange={e => updateLayerTransform(node.id, { color: e.target.value })}
            />
            <span className="font-mono text-[11px] text-[#8b8ba3]">{node.color || '#ffffff'}</span>
          </div>
        </div>

        {/* Alignment */}
        <div>
          <label className="text-[10px] text-[#55556a] block mb-1">Alignment</label>
          <div className="flex gap-1">
            {['left','center','right'].map(a => (
              <button
                key={a}
                onClick={() => updateLayerTransform(node.id, { alignment: a })}
                className={`flex-1 btn btn-ghost !py-1 text-[11px] capitalize ${node.alignment === a ? 'border-[#D4AF37]/50 text-[#D4AF37]' : ''}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Baseline Alignment Tool */}
        {otherTextNodes.length > 0 && (
          <div className="border-t border-white/5 pt-3 mt-1">
            <label className="text-[10px] text-[#D4AF37] font-semibold flex items-center gap-1 mb-1.5">
              <AlignVerticalSpaceAround size={10} />
              Baseline Alignment
            </label>
            <div className="flex gap-1.5">
              <select
                value={alignTargetId}
                onChange={e => setAlignTargetId(e.target.value)}
                className="sln-input flex-1 text-[11px] bg-[#0d0e16] !py-1 h-[26px]"
              >
                <option value="">Select target...</option>
                {otherTextNodes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.id.replace('node_', '')} ({t.text_content?.slice(0, 10)}...)
                  </option>
                ))}
              </select>
              <button
                className="btn btn-gold !py-0.5 !px-2.5 text-[10px] h-[26px] whitespace-nowrap"
                disabled={!alignTargetId}
                onClick={handleBaselineAlign}
              >
                Align
              </button>
            </div>
            <p className="text-[9px] text-[#55556a] mt-1 leading-normal">
              Aligns current baseline perfectly to target layer using backend metrics.
            </p>
          </div>
        )}
      </div>
    </section>
  );
});
