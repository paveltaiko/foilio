import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '../ui/Modal';
import type { ScryfallCard, OwnedCard, CardWithVariant, CardVariant } from '../../types/card';
import { getCardImage } from '../../services/scryfall';
import { formatPrice, parsePrice } from '../../utils/formatPrice';
import { getRarityInfo } from '../../utils/rarity';
import { CardProductsTooltip } from './CardProductsTooltip';

const DEFAULT_SWIPE_VIEWPORT_WIDTH = 400;
const DEFAULT_SWIPE_TRACK_WIDTH = 300;
const SWIPE_EXIT_PADDING = 24;
const DEFAULT_EXIT_DISTANCE_PX = Math.ceil((DEFAULT_SWIPE_VIEWPORT_WIDTH + DEFAULT_SWIPE_TRACK_WIDTH) / 2 + SWIPE_EXIT_PADDING);

interface CardDetailProps {
  card: ScryfallCard | null;
  selectedVariant?: CardVariant;
  owned?: OwnedCard;
  onClose: () => void;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onQuantityChange?: (cardId: string, variant: 'nonfoil' | 'foil', quantity: number) => void;
  cards?: CardWithVariant[];
  onNavigate?: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
}

export function CardDetail({ card, selectedVariant = null, owned, onClose, onToggle, onQuantityChange, cards, onNavigate, readOnly }: CardDetailProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [zoomedImageKey, setZoomedImageKey] = useState<string | null>(null);

  // Animation state machine: 'idle' | 'exiting' | 'repositioning' | 'entering'
  const [animPhase, setAnimPhase] = useState<'idle' | 'exiting' | 'repositioning' | 'entering'>('idle');
  const [animDirection, setAnimDirection] = useState<'prev' | 'next'>('next');
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);
  const [exitDistancePx, setExitDistancePx] = useState(DEFAULT_EXIT_DISTANCE_PX);
  const pendingNavigate = useRef<{ card: ScryfallCard; variant: CardVariant } | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const swipeViewportRef = useRef<HTMLDivElement>(null);
  const swipeTrackRef = useRef<HTMLDivElement>(null);

  const isAnimating = animPhase !== 'idle';

  // Navigation logic
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
    // Lock container height to prevent vertical shift during card swap
    if (imageWrapperRef.current) {
      setLockedHeight(imageWrapperRef.current.getBoundingClientRect().height);
    }
    setAnimDirection(direction);
    setAnimPhase('exiting');
  }, [cards, onNavigate, isAnimating, canGoPrev, canGoNext, currentIndex]);

  // Handle transition end events — only for our container's own transform
  const handleTransitionEnd = useCallback((e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'transform') return;
    if (animPhase === 'exiting') {
      // Card has slid out — switch card and reposition off-screen on opposite side
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
    // Double rAF ensures the browser has painted the repositioned element
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

      if (swipeViewportRef.current) {
        resizeObserver.observe(swipeViewportRef.current);
      }
      if (swipeTrackRef.current) {
        resizeObserver.observe(swipeTrackRef.current);
      }

      return () => resizeObserver.disconnect();
    }

    window.addEventListener('resize', updateExitDistance);
    return () => window.removeEventListener('resize', updateExitDistance);
  }, [card, selectedVariant]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null || isAnimating) return;

    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;

    // Only track horizontal swipe if it's more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Apply resistance at edges when can't navigate
      const resistance = 0.2;
      let offset = deltaX;

      if ((deltaX > 0 && !canGoPrev) || (deltaX < 0 && !canGoNext)) {
        offset = deltaX * resistance;
      }

      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || isAnimating) return;

    const threshold = 80;

    if (swipeOffset > threshold && canGoPrev) {
      setSwipeOffset(0);
      goToPrev();
    } else if (swipeOffset < -threshold && canGoNext) {
      setSwipeOffset(0);
      goToNext();
    } else {
      // Snap back to center
      setSwipeOffset(0);
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (!card) return null;

  const imageUrl = getCardImage(card, 'large');
  const isOwnedNonFoil = owned?.ownedNonFoil ?? false;
  const isOwnedFoil = owned?.ownedFoil ?? false;
  const showFoilEffect = selectedVariant === 'foil' || (selectedVariant === null && isOwnedFoil);
  const hasNonFoil = card.finishes.includes('nonfoil');
  const hasFoil = card.finishes.includes('foil');
  const currentImageKey = `${card.id}:${selectedVariant ?? 'default'}`;
  const isImageZoomed = zoomedImageKey === currentImageKey;

  const scryfallPriceEur = parsePrice(card.prices.eur);
  const scryfallPriceFoil = parsePrice(card.prices.eur_foil);

  return (
    <Modal isOpen={!!card} onClose={onClose}>
      <div
        ref={imageWrapperRef}
        className="space-y-5"
        style={{ height: lockedHeight ?? undefined }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">{card.name}</h2>
            <div className="mt-0.5 flex items-center gap-4 flex-wrap">
              <p className="text-xs font-mono text-neutral-500">
                #{card.collector_number} · {card.set_name} · <span className={`font-semibold ${getRarityInfo(card.rarity).colorClass}`}>{getRarityInfo(card.rarity).label}</span>
              </p>
              <CardProductsTooltip setCode={card.set} collectorNumber={card.collector_number} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="hidden sm:block text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors p-1 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Card image with navigation */}
        <div className="flex justify-center relative">
          {/* Previous button - desktop only */}
          {cards && cards.length > 1 && (
            <button
              onClick={goToPrev}
              disabled={!canGoPrev}
              className={`
                hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20
                w-9 h-9 items-center justify-center rounded-full
                transition-all duration-200 cursor-pointer
                ${canGoPrev
                  ? 'bg-neutral-800 text-white hover:bg-neutral-900 hover:scale-110'
                  : 'bg-neutral-200 text-neutral-400 opacity-40 cursor-not-allowed'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Card image container with swipe */}
          <div
            ref={swipeViewportRef}
            className="w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] -mx-4 sm:-mx-6 overflow-x-hidden flex justify-center z-10"
          >
            <div
              ref={swipeTrackRef}
              className="relative inline-block touch-pan-y overflow-visible"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTransitionEnd={handleTransitionEnd}
              style={{
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
                  : swipeOffset !== 0
                  ? 'none'
                  : 'none',
              }}
            >
              {imageUrl && (
                <div className="relative overflow-hidden rounded-lg">
                  <button
                    type="button"
                    onClick={() => setZoomedImageKey(currentImageKey)}
                    className="block cursor-zoom-in leading-none"
                    aria-label={`Open enlarged image for ${card.name}`}
                  >
                    <img
                      src={imageUrl}
                      alt={card.name}
                      className={`block h-[280px] sm:h-[400px] w-auto object-contain select-none ${showFoilEffect ? 'foil-image' : ''}`}
                      draggable={false}
                    />
                  </button>
                  {showFoilEffect && <div className="foil-overlay" />}
                </div>
              )}
            </div>
          </div>

          {/* Next button - desktop only */}
          {cards && cards.length > 1 && (
            <button
              onClick={goToNext}
              disabled={!canGoNext}
              className={`
                hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20
                w-9 h-9 items-center justify-center rounded-full
                transition-all duration-200 cursor-pointer
                ${canGoNext
                  ? 'bg-neutral-800 text-white hover:bg-neutral-900 hover:scale-110'
                  : 'bg-neutral-200 text-neutral-400 opacity-40 cursor-not-allowed'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Position indicator */}
        {cards && cards.length > 1 && (
          <div className="text-center text-xs text-neutral-400 -mt-2">
            {currentIndex + 1} / {totalCards}
          </div>
        )}

        {/* Ownership toggles with quantity */}
        {readOnly ? (
          <div className={`grid gap-2 ${hasNonFoil && hasFoil ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {hasNonFoil && (
              <div className={`flex items-center justify-center px-3 rounded-lg border h-11 ${isOwnedNonFoil ? 'bg-owned-bg border-owned-border' : 'bg-neutral-50 border-neutral-200'}`}>
                <span className={`text-sm font-medium ${isOwnedNonFoil ? 'text-owned' : 'text-neutral-400'}`}>
                  {isOwnedNonFoil ? `${owned?.quantityNonFoil || 1}x Non-Foil` : 'Non-Foil'}
                </span>
              </div>
            )}
            {hasFoil && (
              <div className={`flex items-center justify-center px-3 rounded-lg border h-11 ${isOwnedFoil ? 'bg-foil-bg border-foil-border' : 'bg-neutral-50 border-neutral-200'}`}>
                <span className={`text-sm font-medium ${isOwnedFoil ? 'text-foil-purple' : 'text-neutral-400'}`}>
                  {isOwnedFoil ? `${owned?.quantityFoil || 1}x Foil` : 'Foil'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className={`grid gap-2 ${hasNonFoil && hasFoil ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {hasNonFoil && (
              <div
                onClick={() => !isOwnedNonFoil && onToggle(card.id, 'nonfoil')}
                className={`
                  flex items-center justify-center px-3 rounded-lg border transition-all duration-200 h-11
                  ${isOwnedNonFoil
                    ? 'bg-owned-bg border-owned-border'
                    : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 cursor-pointer'
                  }
                `}
              >
                {isOwnedNonFoil && onQuantityChange ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuantityChange(card.id, 'nonfoil', Math.max(0, (owned?.quantityNonFoil || 1) - 1)); }}
                      className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-owned">
                      {owned?.quantityNonFoil || 1}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuantityChange(card.id, 'nonfoil', (owned?.quantityNonFoil || 1) + 1); }}
                      className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggle(card.id, 'nonfoil'); }}
                    className="text-sm font-medium text-neutral-500 transition-colors cursor-pointer"
                  >
                    Non-Foil
                  </button>
                )}
              </div>
            )}
            {hasFoil && (
              <div
                onClick={() => !isOwnedFoil && onToggle(card.id, 'foil')}
                className={`
                  flex items-center justify-center px-3 rounded-lg border transition-all duration-200 h-11
                  ${isOwnedFoil
                    ? 'bg-foil-bg border-foil-border'
                    : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 cursor-pointer'
                  }
                `}
              >
                {isOwnedFoil && onQuantityChange ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuantityChange(card.id, 'foil', Math.max(0, (owned?.quantityFoil || 1) - 1)); }}
                      className="w-6 h-6 flex items-center justify-center rounded bg-purple-400 text-white hover:bg-purple-500 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-foil-purple">
                      {owned?.quantityFoil || 1}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuantityChange(card.id, 'foil', (owned?.quantityFoil || 1) + 1); }}
                      className="w-6 h-6 flex items-center justify-center rounded bg-purple-400 text-white hover:bg-purple-500 transition-colors cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggle(card.id, 'foil'); }}
                    className="text-sm font-medium text-neutral-500 transition-colors cursor-pointer"
                  >
                    Foil
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Prices section */}
        <div className={`grid gap-2 -mt-3 ${hasNonFoil && hasFoil ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {hasNonFoil && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 text-center flex items-center justify-center h-11">
              <p className="text-base font-semibold text-neutral-800">
                {formatPrice(scryfallPriceEur)}
              </p>
            </div>
          )}

          {hasFoil && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-foil-border rounded-lg px-3 text-center flex items-center justify-center h-11">
              <p className="text-base font-semibold text-foil-purple">
                {formatPrice(scryfallPriceFoil)}
              </p>
            </div>
          )}
        </div>

        {/* Cardmarket link */}
        {card.purchase_uris?.cardmarket && (
          <a
            href={card.purchase_uris.cardmarket}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center justify-center gap-2 w-full py-2.5
              text-sm font-medium text-secondary-500 bg-secondary-50 border border-secondary-200
              rounded-md hover:bg-secondary-100 transition-colors duration-150
            "
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Cardmarket
          </a>
        )}
      </div>
      {isImageZoomed && imageUrl && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3 sm:p-6" onClick={() => setZoomedImageKey(null)}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomedImageKey(null);
            }}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 rounded-full bg-white/15 p-2 text-white hover:bg-white/25 transition-colors cursor-pointer"
            aria-label="Close enlarged card image"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative inline-block overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={card.name}
              className={`block max-w-[95vw] max-h-[94vh] w-auto h-auto object-contain shadow-2xl select-none ${showFoilEffect ? 'foil-image' : ''}`}
              draggable={false}
            />
            {showFoilEffect && <div className="foil-overlay" />}
          </div>
        </div>,
        document.body
      )}
    </Modal>
  );
}
