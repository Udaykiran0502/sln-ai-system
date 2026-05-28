import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva';
import { useStore } from '../store/useStore';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export const Canvas: React.FC = () => {
  const project = useStore((state) => state.project);
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useStore((state) => state.setSelectedNodeId);
  const updateNode = useStore((state) => state.updateNode);
  const zoom = useStore((state) => state.zoom);
  const setZoom = useStore((state) => state.setZoom);

  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  // Keep transformer in sync with selected node
  useEffect(() => {
    if (transformerRef.current) {
      const stage = transformerRef.current.getStage();
      const selectedNode = stage.findOne(`#${selectedNodeId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedNodeId, project.sceneGraph]);

  const handleStageMouseDown = (e: any) => {
    // deselect when clicking on empty stage background
    if (e.target === e.target.getStage() || e.target.id() === 'bg-rect') {
      setSelectedNodeId(null);
      return;
    }
  };

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    updateNode(node.id(), {
      x: node.x(),
      y: node.y(),
      width: node.width() * node.scaleX(),
      height: node.height() * node.scaleY(),
      rotation: node.rotation(),
    });
    // Reset scaling multipliers
    node.scaleX(1);
    node.scaleY(1);
  };

  return (
    <div className="flex-1 bg-[#090d16] flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Canvas Top Bar Options (Zoom, Canvas size indicator) */}
      <div className="absolute top-4 left-4 z-10 bg-[#080c14] border border-[#1e2d4a] px-3 py-1.5 rounded flex items-center gap-3 text-[10px] font-mono text-slate-300">
        <span>Sri Lakshmi Narasimha Stage</span>
        <span className="text-[#a855f7]">{project.width} x {project.height} px</span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#080c14] border border-[#1e2d4a] p-1 rounded">
        <button
          onClick={() => setZoom(Math.max(0.2, zoom - 0.1))}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#121c2c] transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-[10px] font-mono font-bold px-2 text-slate-300">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#121c2c] transition-colors"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#121c2c] transition-colors border-l border-[#1e2d4a] pl-1.5 ml-0.5"
        >
          <Maximize size={14} />
        </button>
      </div>

      {/* RULERS */}
      <div className="absolute top-0 left-0 w-full h-4 bg-[#080c14] border-b border-[#1e2d4a] z-0 flex items-center text-[8px] font-mono text-slate-500 overflow-hidden pl-4 select-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} style={{ minWidth: '80px' }}>| {i * 100}</span>
        ))}
      </div>
      <div className="absolute top-4 left-0 w-4 h-full bg-[#080c14] border-r border-[#1e2d4a] z-0 flex flex-col items-center text-[8px] font-mono text-slate-500 overflow-hidden pt-4 select-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="py-2.5 h-[80px]">─ {i * 100}</span>
        ))}
      </div>

      {/* Editor Main Canvas Stage */}
      <div
        className="shadow-2xl shadow-purple-950/20 border border-[#1e2d4a]/80"
        style={{ transform: `scale(${zoom})`, transition: 'transform 0.1s ease-out' }}
      >
        <Stage
          ref={stageRef}
          width={project.width}
          height={project.height}
          onMouseDown={handleStageMouseDown}
        >
          <Layer>
            {project.sceneGraph
              .filter((node) => node.visible)
              .map((node) => {
                if (node.type === 'shape' && node.style.shapeType === 'rect') {
                  return (
                    <Rect
                      key={node.id}
                      id={node.id}
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      fill={node.style.fill}
                      stroke={node.style.stroke}
                      strokeWidth={node.style.strokeWidth}
                      draggable={!node.locked}
                      onClick={() => setSelectedNodeId(node.id)}
                      onDragEnd={(e) => {
                        updateNode(node.id, { x: e.target.x(), y: e.target.y() });
                      }}
                    />
                  );
                }
                
                if (node.type === 'text') {
                  return (
                    <Text
                      key={node.id}
                      id={node.id}
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      text={node.style.text}
                      fontSize={node.style.fontSize}
                      fontFamily={node.style.fontFamily}
                      fill={node.style.fill}
                      align={node.style.align}
                      draggable={!node.locked}
                      onClick={() => setSelectedNodeId(node.id)}
                      onDragEnd={(e) => {
                        updateNode(node.id, { x: e.target.x(), y: e.target.y() });
                      }}
                      onTransformEnd={handleTransformEnd}
                    />
                  );
                }

                return null;
              })}

            {/* Selection Transform Node Overlay */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // limit minimum size of elements
                if (newBox.width < 10 || newBox.height < 10) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="#a855f7"
              anchorStroke="#a855f7"
              anchorFill="#090d16"
              anchorSize={6}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
