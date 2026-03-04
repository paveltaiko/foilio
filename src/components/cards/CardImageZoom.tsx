import { createPortal } from 'react-dom';
import type { useImageZoom } from './useImageZoom';

interface CardImageZoomProps {
  imageUrl: string;
  cardName: string;
  showFoilEffect: boolean;
  zoom: ReturnType<typeof useImageZoom>;
}

export function CardImageZoom({ imageUrl, cardName, showFoilEffect, zoom }: CardImageZoomProps) {
  const {
    zoomClosingMode,
    zoomOverlayOpacity,
    isDraggingZoom,
    zoomDragY,
    zoomSwipeExitY,
    triggerCssClose,
    zoomTouchHandlers,
  } = zoom;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6"
      style={{
        backgroundColor: `rgba(0,0,0,${
          zoomClosingMode === 'swipe'
            ? zoomOverlayOpacity * 0.85
            : isDraggingZoom
              ? Math.max(0.1, (1 - Math.abs(zoomDragY) / 400) * 0.85)
              : 0.85
        })`,
        transition: zoomClosingMode === 'swipe'
          ? 'background-color 300ms cubic-bezier(0.4,0,1,1)'
          : zoomClosingMode === 'css'
            ? 'background-color 250ms ease'
            : undefined,
      }}
      onClick={triggerCssClose}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); triggerCssClose(); }}
        className="absolute top-3 right-3 sm:top-5 sm:right-5 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 transition-colors cursor-pointer"
        aria-label="Close enlarged card image"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        className={`relative inline-block overflow-hidden rounded-xl ${zoomClosingMode === 'css' ? 'animate-scale-out' : zoomClosingMode === false && !isDraggingZoom ? 'animate-scale-in' : ''}`}
        style={{
          transform: zoomClosingMode === 'swipe'
            ? `translateY(${zoomSwipeExitY}px)`
            : zoomDragY !== 0
              ? `translateY(${zoomDragY}px) scale(${Math.max(0.88, 1 - Math.abs(zoomDragY) / 1200)})`
              : undefined,
          transition: zoomClosingMode === 'swipe'
            ? 'transform 300ms cubic-bezier(0.4,0,1,1)'
            : isDraggingZoom
              ? 'none'
              : zoomDragY !== 0
                ? 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)'
                : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
        {...zoomTouchHandlers}
      >
        <img
          src={imageUrl}
          alt={cardName}
          className={`block max-w-[95vw] max-h-[94vh] w-auto h-auto object-contain shadow-2xl select-none ${showFoilEffect ? 'foil-image' : ''}`}
          draggable={false}
        />
        {showFoilEffect && <div className="foil-overlay" />}
      </div>
    </div>,
    document.body
  );
}
