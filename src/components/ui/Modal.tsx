import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

let bodyScrollLockCount = 0;
let savedHtmlOverflow = '';
let savedBodyOverflow = '';
let savedBodyPaddingRight = '';

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    const scrollbarCompensation = window.innerWidth - document.documentElement.clientWidth;

    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyOverflow = document.body.style.overflow;
    savedBodyPaddingRight = document.body.style.paddingRight;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarCompensation > 0 ? `${scrollbarCompensation}px` : savedBodyPaddingRight;
  }

  bodyScrollLockCount += 1;
}

function unlockBodyScroll() {
  if (bodyScrollLockCount === 0) return;

  bodyScrollLockCount -= 1;

  if (bodyScrollLockCount === 0) {
    document.documentElement.style.overflow = savedHtmlOverflow;
    document.body.style.overflow = savedBodyOverflow;
    document.body.style.paddingRight = savedBodyPaddingRight;
  }
}

// Duration for CSS-based exit animations (button/overlay click, Escape)
const CSS_EXIT_MOBILE_MS = 380;
const CSS_EXIT_DESKTOP_MS = 250;

// Duration for swipe-based exit (inline transition)
const SWIPE_EXIT_MS = 380;

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  // isVisible = modal is rendered in DOM (includes exit animation phase)
  const [isVisible, setIsVisible] = useState(isOpen);
  // 'css' = CSS keyframe exit animation (slide-down/scale-out), 'swipe' = inline transform transition, false = not closing
  const [closingMode, setClosingMode] = useState<'css' | 'swipe' | false>(false);
  // Target translateY for swipe exit (starts at dragY, then transitions to viewport height)
  const [swipeExitY, setSwipeExitY] = useState(0);
  // Overlay opacity for swipe close (synced with modal position via inline transition)
  const [swipeOverlayOpacity, setSwipeOverlayOpacity] = useState(1);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartY = useRef(0);
  const dragStartX = useRef(0);
  const canSwipeClose = useRef(false);
  // null = not yet decided, 'vertical' = swipe-to-close, 'horizontal' = ignore (card swipe)
  const directionLock = useRef<'vertical' | 'horizontal' | null>(null);

  const isMobile = () => window.innerWidth < 640;

  const scheduleUnmount = (durationMs: number) => {
    closeTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setClosingMode(false);
      setDragY(0);
      setSwipeExitY(0);
      setSwipeOverlayOpacity(1);
      onClose();
    }, durationMs);
  };

  // CSS-based close: used for button clicks, overlay tap, Escape key
  const triggerCssClose = () => {
    if (closingMode) return;
    setClosingMode('css');
    scheduleUnmount(isMobile() ? CSS_EXIT_MOBILE_MS : CSS_EXIT_DESKTOP_MS);
  };

  // Swipe-based close: starts from current dragY and transitions further down
  const triggerSwipeClose = (fromY: number) => {
    if (closingMode) return;
    const exitY = fromY + window.innerHeight;
    // First frame: set mode with initial position (fromY) so browser paints it there
    setClosingMode('swipe');
    setSwipeExitY(fromY);
    setSwipeOverlayOpacity(1);
    // Second frame: update to target — browser transitions from fromY → exitY and opacity 1 → 0
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSwipeExitY(exitY);
        setSwipeOverlayOpacity(0);
      });
    });
    scheduleUnmount(SWIPE_EXIT_MS);
  };

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setClosingMode(false);
      setDragY(0);
      setSwipeExitY(0);
      setSwipeOverlayOpacity(1);
      setIsVisible(true);
      lockBodyScroll();
    } else {
      if (isVisible && !closingMode) {
        triggerCssClose();
      }
    }

    return () => {
      if (isOpen) {
        unlockBodyScroll();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') triggerCssClose();
    };
    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartX.current = e.touches[0].clientX;
    directionLock.current = null;
    const scrollEl = scrollRef.current;
    canSwipeClose.current = !scrollEl || scrollEl.scrollTop === 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canSwipeClose.current) return;

    const deltaX = Math.abs(e.touches[0].clientX - dragStartX.current);
    const deltaY = e.touches[0].clientY - dragStartY.current;

    if (directionLock.current === null) {
      if (Math.max(deltaX, Math.abs(deltaY)) < 10) return;
      directionLock.current = deltaX > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    if (directionLock.current === 'horizontal') return;

    if (deltaY > 0) {
      setIsDragging(true);
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    canSwipeClose.current = false;
    directionLock.current = null;
    if (dragY > 100) {
      // Continue from current drag position — no snap back
      triggerSwipeClose(dragY);
    } else {
      setDragY(0);
    }
  };

  if (!isVisible) return null;

  // Determine inline transform for the wrapper div
  const isSwipeClosing = closingMode === 'swipe';
  const isCssClosing = closingMode === 'css';

  let wrapperTransform: string | undefined;
  let wrapperTransition: string | undefined;

  if (isSwipeClosing) {
    // Animate from dragY to swipeExitY
    wrapperTransform = `translateY(${swipeExitY}px)`;
    wrapperTransition = `transform ${SWIPE_EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1)`;
  } else if (isDragging) {
    wrapperTransform = `translateY(${dragY}px)`;
    wrapperTransition = 'none';
  } else if (dragY > 0) {
    // Snap back
    wrapperTransform = 'translateY(0)';
    wrapperTransition = 'transform 0.2s ease-out';
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 cursor-pointer ${isCssClosing ? 'animate-fade-out' : (!isSwipeClosing ? 'animate-fade-in' : '')}`}
        style={{
          opacity: isSwipeClosing
            ? swipeOverlayOpacity
            : isDragging
              ? Math.max(0.2, 1 - dragY / 300)
              : undefined,
          transition: isSwipeClosing
            ? `opacity ${SWIPE_EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1)`
            : undefined,
        }}
        onClick={triggerCssClose}
      />

      {/* Modal content — drawer on mobile, centered on desktop */}
      <div
        className="relative w-full sm:max-w-lg sm:mx-4"
        style={{ transform: wrapperTransform, transition: wrapperTransition }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`bg-surface-primary max-h-[90svh] sm:max-h-[85vh] flex flex-col overflow-hidden sm:rounded-2xl ${isCssClosing ? 'animate-slide-down sm:animate-scale-out' : 'animate-slide-up sm:animate-scale-in'}`}>
          {/* Drawer handle — mobile only */}
          <div className="flex justify-center py-3 sm:hidden flex-shrink-0">
            <div className="w-9 h-1 bg-neutral-300 rounded-full" />
          </div>
          {/* Scrollable content */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y scrollbar-hide sm:scrollbar-default"
            style={{ scrollbarGutter: 'stable', overflowAnchor: 'none' }}
          >
            <div className="p-4 pb-10 sm:p-6 sm:pt-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
