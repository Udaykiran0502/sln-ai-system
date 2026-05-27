import React, { useRef, useCallback, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import useDesignStore from '../store/useDesignStore';
import { CanvasPreview } from './CanvasPreview';
import { KonvaLayer } from './KonvaLayer';
import { QAOverlays } from './QAOverlays';

export function StageContainer() {
  const stageRef = useRef(null);
  const {
    canvasLogicalW, canvasLogicalH,
    zoomLevel, showGrid, showSafeZone,
    selectNode,
  } = useDesignStore();

  const scaledW = canvasLogicalW * zoomLevel;
  const scaledH = canvasLogicalH * zoomLevel;

  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) selectNode(null);
  }, [selectNode]);

  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const setZoom = useDesignStore.getState().setZoom;
    const current = useDesignStore.getState().zoomLevel;
    const delta = e.evt.deltaY < 0 ? 0.1 : -0.1;
    setZoom(current + delta);
  }, []);

  // Keyboard listener for deletions and arrow micro-nudging
  useEffect(() => {
    const handleKeyDown = (e) => {
      const selectedId = useDesignStore.getState().selectedNodeId;
      if (!selectedId) return;

      const layers = useDesignStore.getState().layers;
      const activeLayer = layers.find(l => l.id === selectedId);
      if (!activeLayer) return;

      const nudgeX = 0.001 * canvasLogicalW;
      const nudgeY = 0.001 * canvasLogicalH;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        useDesignStore.getState().deleteNode(selectedId);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        useDesignStore.getState().updateLayer(selectedId, {
          transform: { y: activeLayer.transform.y - nudgeY }
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        useDesignStore.getState().updateLayer(selectedId, {
          transform: { y: activeLayer.transform.y + nudgeY }
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        useDesignStore.getState().updateLayer(selectedId, {
          transform: { x: activeLayer.transform.x - nudgeX }
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        useDesignStore.getState().updateLayer(selectedId, {
          transform: { x: activeLayer.transform.x + nudgeX }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvasLogicalW, canvasLogicalH]);

  return (
    <div className="canvas-stage-wrapper">
      <div
        style={{
          width: scaledW,
          height: scaledH,
          flexShrink: 0,
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.1)',
        }}
      >
        {/* Grid overlay — CSS only, zero JS cost */}
        {showGrid && (
          <div
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
              backgroundImage:
                'linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),' +
                'linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)',
              backgroundSize: `${8 * zoomLevel}px ${8 * zoomLevel}px`,
            }}
          />
        )}

        <Stage
          ref={stageRef}
          width={scaledW}
          height={scaledH}
          scaleX={zoomLevel}
          scaleY={zoomLevel}
          onClick={handleStageClick}
          onWheel={handleWheel}
          style={{ display: 'block' }}
        >
          {/* Layer 1: Raster preview from backend */}
          <CanvasPreview />

          {/* Layer 2: Interactive node bounding boxes */}
          <KonvaLayer />

          {/* Layer 3: QA overlays — safe zone, clipping warnings */}
          <QAOverlays showSafeZone={showSafeZone} />
        </Stage>
      </div>
    </div>
  );
}
