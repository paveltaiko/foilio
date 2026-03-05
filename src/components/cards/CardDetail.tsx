import { Modal } from '../ui/Modal';
import type { ScryfallCard, OwnedCard, CardWithVariant, CardVariant } from '../../types/card';
import { getCardImage } from '../../services/scryfall';
import { getRarityInfo } from '../../utils/rarity';
import { CardProductsTooltip } from './CardProductsTooltip';
import { CardDetailContent } from './CardDetailContent';
import { CardImageZoom } from './CardImageZoom';
import { useCardDetailNavigation } from './useCardDetailNavigation';
import { useImageZoom } from './useImageZoom';

interface CardDetailProps {
  card: ScryfallCard | null;
  selectedVariant?: CardVariant;
  owned?: OwnedCard;
  onClose: () => void;
  onToggle: (card: ScryfallCard, variant: 'nonfoil' | 'foil') => void;
  onQuantityChange?: (card: ScryfallCard, variant: 'nonfoil' | 'foil', quantity: number) => void;
  cards?: CardWithVariant[];
  onNavigate?: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
}

export function CardDetail({ card, selectedVariant = null, owned, onClose, onToggle, onQuantityChange, cards, onNavigate, readOnly }: CardDetailProps) {
  const nav = useCardDetailNavigation({ card, selectedVariant, cards, onNavigate });
  const zoom = useImageZoom();

  if (!card) return null;

  const imageUrl = getCardImage(card, 'large');
  const isOwnedFoil = owned?.ownedFoil ?? false;
  const showFoilEffect = selectedVariant === 'foil' || (selectedVariant === null && isOwnedFoil);
  const currentImageKey = `${card.id}:${selectedVariant ?? 'default'}`;
  const isImageZoomed = zoom.zoomedImageKey === currentImageKey;

  return (
    <Modal isOpen={!!card} onClose={onClose}>
      <div
        ref={nav.imageWrapperRef}
        className="space-y-5"
        style={{ height: nav.lockedHeight ?? undefined }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-neutral-800 truncate">{card.name}</h2>
            <p className="text-xs text-neutral-500 mt-1.5 truncate">{card.set_name}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-xs font-mono text-neutral-500 whitespace-nowrap">
                #{card.collector_number} · <span className={`font-semibold ${getRarityInfo(card.rarity).colorClass}`}>{getRarityInfo(card.rarity).label}</span> ·
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
              onClick={nav.goToPrev}
              disabled={!nav.canGoPrev}
              className={`
                hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20
                w-9 h-9 items-center justify-center rounded-full
                transition-all duration-200 cursor-pointer
                ${nav.canGoPrev
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
            ref={nav.swipeViewportRef}
            className="w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] -mx-4 sm:-mx-6 overflow-x-hidden flex justify-center z-10"
          >
            <div
              ref={nav.swipeTrackRef}
              className="relative inline-block touch-pan-y overflow-visible"
              onTouchStart={nav.handleTouchStart}
              onTouchMove={nav.handleTouchMove}
              onTouchEnd={nav.handleTouchEnd}
              onTransitionEnd={nav.handleTransitionEnd}
              style={nav.swipeTrackStyle}
            >
              {imageUrl && (
                <div className="relative overflow-hidden rounded-lg">
                  <button
                    type="button"
                    onClick={() => zoom.openZoom(currentImageKey)}
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
              onClick={nav.goToNext}
              disabled={!nav.canGoNext}
              className={`
                hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20
                w-9 h-9 items-center justify-center rounded-full
                transition-all duration-200 cursor-pointer
                ${nav.canGoNext
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
            {nav.currentIndex + 1} / {nav.totalCards}
          </div>
        )}

        <CardDetailContent
          card={card}
          owned={owned}
          onToggle={onToggle}
          onQuantityChange={onQuantityChange}
          readOnly={readOnly}
        />
      </div>

      {(isImageZoomed || zoom.zoomClosingMode) && imageUrl && (
        <CardImageZoom
          imageUrl={imageUrl}
          cardName={card.name}
          showFoilEffect={showFoilEffect}
          zoom={zoom}
        />
      )}
    </Modal>
  );
}
