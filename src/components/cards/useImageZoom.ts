import { useState, useRef, useCallback, useEffect } from 'react';

interface UseImageZoomReturn {
  zoomedImageKey: string | null;
  openZoom: (imageKey: string) => void;
  triggerCssClose: () => void;
  triggerSwipeClose: (fromY: number) => void;
  zoomOverlayOpacity: number;
  isDraggingZoom: boolean;
  zoomDragY: number;
  zoomClosingMode: 'css' | 'swipe' | false;
  zoomSwipeExitY: number;
  zoomTouchHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function useImageZoom(): UseImageZoomReturn {
  const [zoomedImageKey, setZoomedImageKey] = useState<string | null>(null);
  const [zoomDragY, setZoomDragY] = useState(0);
  const zoomDragStartY = useRef<number | null>(null);
  const [zoomClosingMode, setZoomClosingMode] = useState<'css' | 'swipe' | false>(false);
  const [zoomSwipeExitY, setZoomSwipeExitY] = useState(0);
  const [zoomOverlayOpacity, setZoomOverlayOpacity] = useState(1);
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const zoomCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (zoomCloseTimerRef.current) clearTimeout(zoomCloseTimerRef.current);
    };
  }, []);

  const resetZoomState = useCallback(() => {
    setZoomDragY(0);
    setZoomSwipeExitY(0);
    setZoomOverlayOpacity(1);
    setIsDraggingZoom(false);
    setZoomClosingMode(false);
    zoomDragStartY.current = null;
  }, []);

  const openZoom = useCallback((imageKey: string) => {
    setZoomedImageKey(imageKey);
  }, []);

  const triggerCssClose = useCallback(() => {
    if (zoomClosingMode) return;
    setZoomClosingMode('css');
    zoomCloseTimerRef.current = setTimeout(() => {
      setZoomedImageKey(null);
      resetZoomState();
    }, 250);
  }, [zoomClosingMode, resetZoomState]);

  const triggerSwipeClose = useCallback((fromY: number) => {
    if (zoomClosingMode) return;
    const exitY = fromY > 0
      ? fromY + window.innerHeight
      : fromY - window.innerHeight;
    setZoomClosingMode('swipe');
    setZoomSwipeExitY(fromY);
    setZoomOverlayOpacity(1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setZoomSwipeExitY(exitY);
        setZoomOverlayOpacity(0);
      });
    });
    zoomCloseTimerRef.current = setTimeout(() => {
      setZoomedImageKey(null);
      resetZoomState();
    }, 300);
  }, [zoomClosingMode, resetZoomState]);

  const zoomTouchHandlers = {
    onTouchStart: useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      zoomDragStartY.current = e.touches[0].clientY;
      setIsDraggingZoom(true);
    }, []),
    onTouchMove: useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      if (zoomDragStartY.current === null) return;
      const diff = e.touches[0].clientY - zoomDragStartY.current;
      setZoomDragY(diff);
    }, []),
    onTouchEnd: useCallback((e: React.TouchEvent) => {
      e.stopPropagation();
      setIsDraggingZoom(false);
      zoomDragStartY.current = null;
      setZoomDragY((currentDragY) => {
        if (Math.abs(currentDragY) > 80) {
          triggerSwipeClose(currentDragY);
        }
        return Math.abs(currentDragY) > 80 ? currentDragY : 0;
      });
    }, [triggerSwipeClose]),
  };

  return {
    zoomedImageKey,
    openZoom,
    triggerCssClose,
    triggerSwipeClose,
    zoomOverlayOpacity,
    isDraggingZoom,
    zoomDragY,
    zoomClosingMode,
    zoomSwipeExitY,
    zoomTouchHandlers,
  };
}
