import React from 'react';
import { Layer, Rect, Line, Text, Group } from 'react-konva';
import useDesignStore from '../store/useDesignStore';

// WCAG Contrast calculator helpers
function getRelativeLuminance(color = '#000000') {
  try {
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const a = [r, g, b].map(v => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  } catch (e) {
    return 0; // Default black
  }
}

function getContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function QAOverlays({ showSafeZone }) {
  const { canvasLogicalW: W, canvasLogicalH: H, qaScores, layers, orderMeta, isDraggingActive } = useDesignStore();

  if (isDraggingActive) {
    return <Layer listening={false} />;
  }

  const marginX = W * 0.05;
  const marginY = H * 0.05;

  const hardFailures = qaScores?.hard_failures || [];
  const clippingFailure = hardFailures.some(f => f.code === 'text_clipping');
  const contrastFailure = hardFailures.some(f => f.code === 'low_contrast');

  const bgColor = orderMeta?.colors?.background || '#FFFFFF';

  return (
    <Layer listening={false}>
      {/* ── Safe Zone dashed rectangle ── */}
      {showSafeZone && (
        <>
          <Rect
            x={marginX}
            y={marginY}
            width={W - marginX * 2}
            height={H - marginY * 2}
            stroke="rgba(245,158,11,0.5)"
            strokeWidth={1}
            dash={[6, 4]}
            fill="transparent"
          />
          <Text
            x={marginX + 6}
            y={marginY + 6}
            text="SAFE ZONE (95%)"
            fontSize={8}
            fill="rgba(245,158,11,0.7)"
            fontFamily="JetBrains Mono, monospace"
          />
        </>
      )}

      {/* ── Bleed margin corners ── */}
      {showSafeZone && (
        <>
          {/* Top-left */}
          <Line points={[0,0, 16,0]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
          <Line points={[0,0, 0,16]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
          {/* Top-right */}
          <Line points={[W-16,0, W,0]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
          <Line points={[W,0, W,16]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
          {/* Bottom-left */}
          <Line points={[0,H-16, 0,H]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
          <Line points={[0,H, 16,H]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
          {/* Bottom-right */}
          <Line points={[W-16,H, W,H]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
          <Line points={[W,H-16, W,H]} stroke="#D4AF37" strokeWidth={1} opacity={0.4} />
        </>
      )}

      {/* ── Rich Element-Level QA Inspections ── */}
      {layers.map(l => {
        const x = l.transform.x, y = l.transform.y;
        const w = l.bounds.width,  h = l.bounds.height;

        // 1. Clipping Failure (any part outside canvas)
        const isClipped = x < 0 || y < 0 || x + w > W || y + h > H;

        // 2. Safe Zone Violation (any part outside safe zone)
        const violatesSafeZone = x < marginX || y < marginY || x + w > W - marginX || y + h > H - marginY;

        // 3. Contrast Failure (Text node only, ratio < 3.0)
        const isLowContrast = l.type === 'TextNode' && l.color && getContrastRatio(l.color, bgColor) < 3.0;

        return (
          <Group key={`qa-elem-${l.id}`} x={x} y={y}>
            {/* Draw bright red highlight for clipping failures */}
            {isClipped && (
              <Rect
                x={0}
                y={0}
                width={w}
                height={h}
                stroke="rgba(239,68,68,0.9)"
                strokeWidth={1.5}
                dash={[4, 2]}
                fill="rgba(239,68,68,0.08)"
              />
            )}

            {/* Draw orange warning highlight for safe zone crossings */}
            {!isClipped && violatesSafeZone && showSafeZone && (
              <Rect
                x={0}
                y={0}
                width={w}
                height={h}
                stroke="rgba(245,158,11,0.7)"
                strokeWidth={1.2}
                dash={[3, 3]}
                fill="rgba(245,158,11,0.03)"
              />
            )}

            {/* Draw dotted amber line for low-contrast text elements */}
            {isLowContrast && (
              <Rect
                x={0}
                y={h - 2}
                width={w}
                height={2}
                fill="rgba(217,119,6,0.95)"
              />
            )}

            {/* Render a tiny warning dot and label on failure */}
            {(isClipped || violatesSafeZone || isLowContrast) && (
              <Group x={w - 10} y={-10}>
                <Rect
                  width={12}
                  height={12}
                  fill={isClipped ? '#ef4444' : '#f59e0b'}
                  cornerRadius={6}
                />
                <Text
                  text="!"
                  x={4}
                  y={1}
                  fontSize={9}
                  fill="#ffffff"
                  fontFamily="JetBrains Mono, monospace"
                  fontStyle="bold"
                />
              </Group>
            )}
          </Group>
        );
      })}
    </Layer>
  );
}
