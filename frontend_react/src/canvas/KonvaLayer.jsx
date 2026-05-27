import React, { useRef, useCallback, useEffect } from 'react';
import { Layer, Rect, Text, Transformer } from 'react-konva';
import useDesignStore from '../store/useDesignStore';
import { useSnapping } from '../hooks/useSnapping';

const NODE_COLORS = {
  TextNode:  '#D4AF37',
  ImageNode: '#6366f1',
  ShapeNode: '#10b981',
};

function LayerRect({ layer }) {
  const rectRef = useRef(null);
  const transformerRef = useRef(null);
  const selectedNodeId  = useDesignStore((s) => s.selectedNodeId);
  const selectNode       = useDesignStore((s) => s.selectNode);
  const updateLayer      = useDesignStore((s) => s.updateLayer);
  const setDraggingActive = useDesignStore((s) => s.setDraggingActive);
  const { snapPoint } = useSnapping(true);

  const isSelected = selectedNodeId === layer.id;
  const color = NODE_COLORS[layer.type] || '#ffffff';

  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragStart = useCallback(() => {
    setDraggingActive(true);
  }, [setDraggingActive]);

  const handleDragEnd = useCallback((e) => {
    setDraggingActive(false);
    const node = e.target;
    const snapped = snapPoint(node.x(), node.y());
    node.position(snapped);
    updateLayer(layer.id, {
      transform: { x: snapped.x, y: snapped.y }
    });
  }, [layer.id, snapPoint, updateLayer, setDraggingActive]);

  const handleTransformStart = useCallback(() => {
    setDraggingActive(true);
  }, [setDraggingActive]);

  const handleTransformEnd = useCallback((e) => {
    setDraggingActive(false);
    const node = rectRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    
    const newX = node.x();
    const newY = node.y();
    const newW = Math.max(10, node.width() * scaleX);
    const newH = Math.max(10, node.height() * scaleY);
    
    updateLayer(layer.id, {
      transform: {
        x: newX,
        y: newY,
        rotation: node.rotation(),
      },
      bounds: {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
      }
    });
  }, [layer.id, updateLayer, setDraggingActive]);

  return (
    <>
      <Rect
        ref={rectRef}
        id={layer.id}
        x={layer.transform.x}
        y={layer.transform.y}
        width={layer.bounds.width}
        height={layer.bounds.height}
        rotation={layer.transform.rotation}
        draggable={!layer.locked}
        onClick={() => selectNode(layer.id)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        fill="transparent"
        stroke={isSelected ? color : `${color}55`}
        strokeWidth={isSelected ? 1.5 : 0.8}
        dash={isSelected ? [] : [4, 3]}
        cornerRadius={2}
      />

      {/* Node type label — only when selected */}
      {isSelected && (
        <Text
          x={layer.transform.x + 2}
          y={layer.transform.y - 14}
          text={layer.name || layer.type}
          fontSize={9}
          fill={color}
          fontFamily="JetBrains Mono, monospace"
          listening={false}
        />
      )}

      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          borderStroke={color}
          borderStrokeWidth={1}
          anchorStroke={color}
          anchorFill="#07080c"
          anchorSize={7}
          anchorCornerRadius={2}
          keepRatio={false}
          boundBoxFunc={(old, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return old;
            return newBox;
          }}
        />
      )}
    </>
  );
}

export function KonvaLayer() {
  const layers = useDesignStore((s) => s.layers);
  return (
    <Layer>
      {layers
        .filter(l => l.visible !== false)
        .sort((a, b) => (a.z_index || 0) - (b.z_index || 0))
        .map(layer => (
          <LayerRect key={layer.id} layer={layer} />
        ))
      }
    </Layer>
  );
}
