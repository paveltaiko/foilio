import { useState, useEffect, useCallback, useRef } from 'react';
import { getCardImage } from '../../services/scryfall';
import type { ScryfallCard, CardWithVariant, CardVariant } from '../../types/card';

const DEFAULT_SWIPE_VIEWPORT_WIDTH = 400;
const DEFAULT_SWIPE_TRACK_WIDTH = 300;
const SWIPE_EXIT_PADDING = 24;
const DEFAULT_EXIT_DISTANCE_PX = Math.ceil((DEFAULT_SWIPE_VIEWPORT_WIDTH + DEFAULT_SWIPE_TRACK_WIDTH) / 2 + SWIPE_EXIT_PADDING);

type AnimPhase = 'idle' | 'exiting' | 'repositioning' | 'entering';

interface UseCardDetailNavigationOptions {
  card: ScryfallCard | null;
  selectedVariant: CardVariant;
  cards?: CardWithVariant[];
  onNavigate?: (card: ScryfallCard, variant: CardVariant) => void;
}

export function useCardDetailNavigation({
  card,
  selectedVariant,
  cards,
  onNavigate,
}: UseCardDetailNavigationOptions) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeDirectionLock = useRef<'horizontal' | 'vertical' | null>(null);

  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle');
  const [animDirection, setAnimDirection] = useState<'prev' | 'next'>('next');
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const [exitDistancePx, setExitDistancePx] = useState(DEFAULT_EXIT_DISTANCE_PX);
  const pendingNavigate = useRef<{ card: ScryfallCard; variant: CardVariant } | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const swipeViewportRef = useRef<HTMLDivElement>(null);
  const swipeTrackRef = useRef<HTMLDivElement>(null);

  const isAnimating = animPhase !== 'idle';

  // Navigation index
  let currentIndex = -1;
  if (cards && card) {
    currentIndex = cards.findIndex((c) => c.card.id === card.id && c.variant === selectedVariant);
    if (currentIndex === -1) {
      currentIndex = cards.findIndex((c) => c.card.id === card.id);
    }
  }
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < (cards?.length ?? 0) - 1;
  const totalCards = cards?.length ?? 0;

  // Preload adjacent card images
  useEffect(() => {
    if (!cards || currentIndex < 0) return;

    if (currentIndex > 0) {
      const img = new Image();
      img.src = getCardImage(cards[currentIndex - 1].card, 'large');
    }
    if (currentIndex < cards.length - 1) {
      const img = new Image();
      img.src = getCardImage(cards[currentIndex + 1].card, 'large');
    }
  }, [cards, currentIndex]);

  // State-driven animation
  const animateNavigation = useCallback((direction: 'prev' | 'next') => {
    if (!cards || !onNavigate || isAnimating) return;
    if (direction === 'prev' && !canGoPrev) return;
    if (direction === 'next' && !canGoNext) return;

    const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    pendingNavigate.current = {
      card: cards[nextIndex].card,
      variant: cards[nextIndex].variant,
    };
    if (imageWrapperRef.current) {
      setLockedHeight(imageWrapperRef.current.getBoundingClientRect().height);
    }
    setAnimDirection(direction);
    setAnimPhase('exiting');
  }, [cards, onNavigate, isAnimating, canGoPrev, canGoNext, currentIndex]);

  // Handle transition end events
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (animPhase === 'exiting') {
      if (pendingNavigate.current && onNavigate) {
        onNavigate(pendingNavigate.current.card, pendingNavigate.current.variant);
        pendingNavigate.current = null;
      }
      setAnimPhase('repositioning');
    } else if (animPhase === 'entering') {
      setLockedHeight(null);
      setAnimPhase('idle');
    }
  }, [animPhase, onNavigate]);

  // When repositioning, wait for paint then start entering
  useEffect(() => {
    if (animPhase !== 'repositioning') return;
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        setAnimPhase('entering');
      });
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [animPhase]);

  const goToPrev = useCallback(() => animateNavigation('prev'), [animateNavigation]);
  const goToNext = useCallback(() => animateNavigation('next'), [animateNavigation]);

  // Keyboard navigation
  useEffect(() => {
    if (!card) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [card, goToPrev, goToNext]);

  // Compute exit distance from viewport/track widths
  useEffect(() => {
    if (!card) return;

    const updateExitDistance = () => {
      const viewportWidth = swipeViewportRef.current?.getBoundingClientRect().width ?? DEFAULT_SWIPE_VIEWPORT_WIDTH;
      const trackWidth = swipeTrackRef.current?.getBoundingClientRect().width ?? DEFAULT_SWIPE_TRACK_WIDTH;
      const nextDistance = Math.ceil((viewportWidth + trackWidth) / 2 + SWIPE_EXIT_PADDING);
      setExitDistancePx((prev) => (prev === nextDistance ? prev : nextDistance));
    };

    updateExitDistance();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateExitDistance);
      if (swipeViewportRef.current) resizeObserver.observe(swipeViewportRef.current);
      if (swipeTrackRef.current) resizeObserver.observe(swipeTrackRef.current);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener('resize', updateExitDistance);
    return () => window.removeEventListener('resize', updateExitDistance);
  }, [card, selectedVariant]);

  // Swipe touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    swipeDirectionLock.current = null;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || isAnimating) return;

    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;

    if (swipeDirectionLock.current === null) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 10) return;
      swipeDirectionLock.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    if (swipeDirectionLock.current === 'vertical') return;

    const resistance = 0.2;
    let offset = deltaX;
    if ((deltaX > 0 && !canGoPrev) || (deltaX < 0 && !canGoNext)) {
      offset = deltaX * resistance;
    }
    setSwipeOffset(offset);
  }, [touchStartX, touchStartY, isAnimating, canGoPrev, canGoNext]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX === null || isAnimating) return;

    const threshold = 80;

    if (swipeDirectionLock.current === 'horizontal') {
      if (swipeOffset > threshold && canGoPrev) {
        setSwipeOffset(0);
        goToPrev();
      } else if (swipeOffset < -threshold && canGoNext) {
        setSwipeOffset(0);
        goToNext();
      } else {
        setSwipeOffset(0);
      }
    }

    swipeDirectionLock.current = null;
    setTouchStartX(null);
    setTouchStartY(null);
  }, [touchStartX, isAnimating, swipeOffset, canGoPrev, canGoNext, goToPrev, goToNext]);

  // Compute swipe track transform + transition
  const swipeTrackStyle = {
    transform: animPhase === 'exiting'
      ? `translateX(${animDirection === 'next' ? -exitDistancePx : exitDistancePx}px)`
      : animPhase === 'repositioning'
      ? `translateX(${animDirection === 'next' ? exitDistancePx : -exitDistancePx}px)`
      : swipeOffset !== 0
      ? `translateX(${swipeOffset}px)`
      : 'translateX(0px)',
    transition: animPhase === 'exiting'
      ? 'transform 0.28s ease-in'
      : animPhase === 'repositioning'
      ? 'none'
      : animPhase === 'entering'
      ? 'transform 0.28s ease-out'
      : 'none',
  };

  return {
    // Navigation state
    currentIndex,
    canGoPrev,
    canGoNext,
    totalCards,
    goToPrev,
    goToNext,

    // Animation
    lockedHeight,
    swipeTrackStyle,
    handleTransitionEnd,

    // Touch handlers
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    // Refs
    imageWrapperRef,
    swipeViewportRef,
    swipeTrackRef,
  };
}
