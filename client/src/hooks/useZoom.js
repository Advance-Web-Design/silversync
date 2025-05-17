// src/hooks/useZoom.js
import { useState, useCallback } from 'react';

/** Four fixed zoom levels: 100%, 75%, 50%, 25% */
const ZOOM_LEVELS = [1, 0.9, 0.8, 0.7];

/**
 * Custom hook to handle Zoom in game
 * @returns {{ zoomLevel: number, handleWheel(e): void }}
 */
export const useZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(ZOOM_LEVELS[0]);

  const handleZoom = useCallback((deltaY) => {
    setZoomLevel(prev => {
      // Find current index in our array
      const idx = ZOOM_LEVELS.findIndex(lvl => lvl === prev);
      if (idx === -1) return prev;

      // deltaY<0 = wheel up = zoom in (go to higher zoom)
      // deltaY>0 = wheel down = zoom out (go to lower zoom)
      const nextIdx = deltaY < 0
        ? Math.max(0, idx - 1)
        : Math.min(ZOOM_LEVELS.length - 1, idx + 1);

      return ZOOM_LEVELS[nextIdx];
    });
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    handleZoom(e.deltaY);
  }, [handleZoom]);

  return {
    zoomLevel,
    handleWheel
  };
};
