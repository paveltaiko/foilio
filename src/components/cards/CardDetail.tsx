import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '../ui/Modal';
import type { ScryfallCard, OwnedCard, CardWithVariant } from '../../types/card';
import { getCardImage } from '../../services/scryfall';
import { formatPrice, parsePrice } from '../../utils/formatPrice';

interface CardDetailProps {
  card: ScryfallCard | null;
  owned?: OwnedCard;
  onClose: () => void;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onQuantityChange?: (cardId: string, variant: 'nonfoil' | 'foil', quantity: number) => void;
  cards?: CardWithVariant[];
  onNavigate?: (card: ScryfallCard) => void;
  readOnly?: boolean;
}

const ANIM_DURATION = 300;

export function CardDetail({ card, owned, onClose, onToggle, onQuantityChange, cards, onNavigate, readOnly }: CardDetailProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Exiting card state — shown simultaneously with the new card during transition
  const [exitingCard, setExitingCard] = useState<ScryfallCard | null>(null);
  const [exitingFoil, setExitingFoil] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');
  const [enterDirection, setEnterDirection] = useState<'left' | 'right'>('right');
  const [slidePhase, setSlidePhase] = useState<'idle' | 'sliding'>('idle');

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Navigation logic
  const currentIndex = cards?.findIndex(c => c.card.id === card?.id) ?? -1;
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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (!cards || !onNavigate || isAnimating) return;
    if (direction === 'prev' && !canGoPrev) return;
    if (direction === 'next' && !canGoNext) return;

    const nextIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    const nextCard = cards[nextIndex].card;

    // Capture current card as "exiting"
    setExitingCard(card);
    setExitingFoil(owned?.ownedFoil ?? false);

    // Directions: going next = current exits left, new enters from right
    setExitDirection(direction === 'next' ? 'left' : 'right');
    setEnterDirection(direction === 'next' ? 'right' : 'left');

    // Navigate immediately so new card renders
    onNavigate(nextCard);
    setIsAnimating(true);

    // Start slide on next frame
    requestAnimationFrame(() => {
      setSlidePhase('sliding');
    });

    // Clean up after animation completes
    animTimerRef.current = setTimeout(() => {
      setSlidePhase('idle');
      setExitingCard(null);
      setIsAnimating(false);
    }, ANIM_DURATION);
  }, [cards, onNavigate, isAnimating, canGoPrev, canGoNext, currentIndex, card, owned]);

  const goToPrev = useCallback(() => navigate('prev'), [navigate]);
  const goToNext = useCallback(() => navigate('next'), [navigate]);

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

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
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
      setSwipeOffset(0);
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  if (!card) return null;

  const imageUrl = getCardImage(card, 'large');
  const isOwnedNonFoil = owned?.ownedNonFoil ?? false;
  const isOwnedFoil = owned?.ownedFoil ?? false;
  const hasNonFoil = card.finishes.includes('nonfoil');
  const hasFoil = card.finishes.includes('foil');

  const scryfallPriceEur = parsePrice(card.prices.eur);
  const scryfallPriceFoil = parsePrice(card.prices.eur_foil);

  // Calculate positions for the dual-image carousel
  const exitingImageUrl = exitingCard ? getCardImage(exitingCard, 'large') : null;

  // Enter: starts off-screen, slides to center
  const enterStartX = enterDirection === 'right' ? 400 : -400;
  const currentTransformX = slidePhase === 'sliding' ? 0 : (exitingCard ? enterStartX : swipeOffset);

  // Exit: starts at center, slides off-screen
  const exitEndX = exitDirection === 'left' ? -400 : 400;
  const exitingTransformX = slidePhase === 'sliding' ? exitEndX : 0;

  const transitionStyle = slidePhase === 'sliding'
    ? `transform ${ANIM_DURATION}ms ease-out, opacity ${ANIM_DURATION}ms ease-out`
    : (swipeOffset === 0 ? 'transform 0.15s ease-out' : 'none');

  return (
    <Modal isOpen={!!card} onClose={onClose}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">{card.name}</h2>
            <p className="text-xs font-mono text-neutral-500">
              #{card.collector_number} · {card.set_name}
            </p>
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
              disabled={!canGoPrev || isAnimating}
              className={`
                hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10
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

          {/* Image carousel container */}
          <div
            ref={imageContainerRef}
            className="relative inline-block touch-pan-y overflow-visible"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Exiting card (old) — slides out simultaneously */}
            {exitingCard && exitingImageUrl && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `translateX(${exitingTransformX}px)`,
                  opacity: slidePhase === 'sliding' ? 0 : 1,
                  transition: slidePhase === 'sliding'
                    ? `transform ${ANIM_DURATION}ms ease-out, opacity ${ANIM_DURATION * 0.8}ms ease-out`
                    : 'none',
                  willChange: 'transform, opacity',
                }}
              >
                <img
                  src={exitingImageUrl}
                  alt=""
                  className={`max-h-[280px] sm:max-h-[400px] rounded-lg select-none ${exitingFoil ? 'foil-image' : ''}`}
                  draggable={false}
                />
                {exitingFoil && <div className="foil-overlay rounded-lg" />}
              </div>
            )}

            {/* Current card (new / active) — slides in simultaneously */}
            <div
              style={{
                transform: `translateX(${currentTransformX}px)`,
                opacity: exitingCard && slidePhase !== 'sliding' ? 0 : 1,
                transition: transitionStyle,
                willChange: isAnimating ? 'transform, opacity' : 'auto',
                position: 'relative',
              }}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={card.name}
                  className={`max-h-[280px] sm:max-h-[400px] rounded-lg select-none ${isOwnedFoil ? 'foil-image' : ''}`}
                  draggable={false}
                />
              )}
              {isOwnedFoil && <div className="foil-overlay rounded-lg" />}
            </div>
          </div>

          {/* Next button - desktop only */}
          {cards && cards.length > 1 && (
            <button
              onClick={goToNext}
              disabled={!canGoNext || isAnimating}
              className={`
                hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10
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
    </Modal>
  );
}
