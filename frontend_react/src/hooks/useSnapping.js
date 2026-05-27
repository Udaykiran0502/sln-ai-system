import { useRef, useCallback } from 'react';
import useDesignStore from '../store/useDesignStore';

const GRID_SIZE = 8; // snap to 8px logical grid

export function useSnapping(enabled = true) {
  const snap = useCallback((val) => {
    if (!enabled) return val;
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }, [enabled]);

  const snapPoint = useCallback((x, y) => ({
    x: snap(x),
    y: snap(y),
  }), [snap]);

  return { snap, snapPoint, GRID_SIZE };
}
