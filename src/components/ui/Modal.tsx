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

export function Modal({ isOpen, onClose, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartX = useRef(0);
  const canSwipeClose = useRef(false);
  // null = not yet decided, 'vertical' = swipe-to-close, 'horizontal' = ignore (card swipe)
  const directionLock = useRef<'vertical' | 'horizontal' | null>(null);

  useEffect(() => {
    if (isOpen) {
      lockBodyScroll();
    }

    return () => {
      if (isOpen) {
        unlockBodyScroll();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Swipe to close handlers
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

    // Wait until we have enough movement to determine direction
    if (directionLock.current === null) {
      if (Math.max(deltaX, Math.abs(deltaY)) < 10) return;
      directionLock.current = deltaX > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    // Horizontal swipe — leave it to CardDetail, do nothing
    if (directionLock.current === 'horizontal') return;

    // Vertical swipe downward — drag modal down
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
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in cursor-pointer"
        style={{ opacity: isDragging ? Math.max(0.2, 1 - dragY / 300) : undefined }}
        onClick={onClose}
      />

      {/* Modal content — drawer on mobile, centered on desktop */}
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-lg sm:mx-4"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-surface-primary max-h-[90svh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-scale-in overflow-hidden sm:rounded-2xl">
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
