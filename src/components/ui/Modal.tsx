import { useEffect, useRef, useState } from 'react';

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
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

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
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY.current;
    // Only allow dragging down
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // If dragged more than 100px, close the modal
    if (dragY > 100) {
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
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
      >
        <div className="bg-surface-primary max-h-[90svh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-scale-in overflow-hidden sm:rounded-2xl">
          {/* Drawer handle — mobile only, swipe to close */}
          <div
            className="flex justify-center py-3 sm:hidden cursor-grab active:cursor-grabbing flex-shrink-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-9 h-1 bg-neutral-300 rounded-full" />
          </div>
          {/* Scrollable content */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain touch-pan-y scrollbar-hide sm:scrollbar-default"
            style={{ scrollbarGutter: 'stable', overflowAnchor: 'none' }}
          >
            <div className="p-4 pb-10 sm:p-6 sm:pt-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
