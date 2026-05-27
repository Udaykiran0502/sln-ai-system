import React, { useEffect } from 'react';
import { Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import useDesignStore from '../store/useDesignStore';

export function CanvasPreview() {
  const compositeUrl = useDesignStore((s) => s.compositeUrl);
  const canvasLogicalW = useDesignStore((s) => s.canvasLogicalW);
  const canvasLogicalH = useDesignStore((s) => s.canvasLogicalH);

  const [bgImage, status] = useImage(compositeUrl, 'anonymous');

  if (!compositeUrl) {
    // Empty dark canvas placeholder rendered via Konva — no external img
    return (
      <Layer>
        {/* nothing — background CSS handles the dot-grid look */}
      </Layer>
    );
  }

  return (
    <Layer listening={false}>
      {bgImage && (
        <KonvaImage
          image={bgImage}
          x={0}
          y={0}
          width={canvasLogicalW}
          height={canvasLogicalH}
          // Low quality scaling for preview — keeps GPU memory low
          imageSmoothingEnabled={true}
        />
      )}
    </Layer>
  );
}
