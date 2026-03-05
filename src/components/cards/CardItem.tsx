import { memo, useCallback } from 'react';
import type { ScryfallCard, OwnedCard, CardVariant } from '../../types/card';
import { getCardImage } from '../../services/scryfall';
import { formatPrice, parsePrice } from '../../utils/formatPrice';
import { getRarityInfo } from '../../utils/rarity';
import { OwnershipBadge } from './OwnershipBadge';

interface CardItemProps {
  card: ScryfallCard;
  owned?: OwnedCard;
  displayVariant?: CardVariant; // null = show both, 'nonfoil'/'foil' = show only one
  onToggle: (card: ScryfallCard, variant: 'nonfoil' | 'foil') => void;
  onClick: (card: ScryfallCard, variant: CardVariant) => void;
  readOnly?: boolean;
}

export const CardItem = memo(function CardItem({ card, owned, displayVariant, onToggle, onClick, readOnly }: CardItemProps) {
  const isOwnedNonFoil = owned?.ownedNonFoil ?? false;
  const isOwnedFoil = owned?.ownedFoil ?? false;

  // When displaying a single variant, ownership status of that variant
  const isOwned = displayVariant === 'foil'
    ? isOwnedFoil
    : displayVariant === 'nonfoil'
      ? isOwnedNonFoil
      : (isOwnedNonFoil || isOwnedFoil);

  const effectivePrice = parsePrice(card.prices.eur);
  const effectivePriceFoil = parsePrice(card.prices.eur_foil);

  const imageUrl = getCardImage(card, 'large');
  const hasNonFoil = card.finishes.includes('nonfoil');
  const hasFoil = card.finishes.includes('foil');

  // Quantity for badge display - based on displayed variant
  const displayQuantity = displayVariant === 'foil'
    ? (owned?.quantityFoil ?? 0)
    : displayVariant === 'nonfoil'
      ? (owned?.quantityNonFoil ?? 0)
      : (owned?.quantityNonFoil ?? 0) + (owned?.quantityFoil ?? 0);

  // Show foil effect on the image?
  const showFoilEffect = displayVariant === 'foil' || (displayVariant === null && isOwnedFoil);

  const handleToggle = useCallback(
    (e: React.MouseEvent, variant: 'nonfoil' | 'foil') => {
      e.stopPropagation();
      onToggle(card, variant);
    },
    [card, onToggle]
  );

  // Border color based on ownership and displayed variant
  const getBorderClass = () => {
    if (displayVariant === 'foil') {
      return isOwnedFoil ? 'border-foil-border bg-white' : 'card-not-owned border-neutral-200 bg-white';
    }
    if (displayVariant === 'nonfoil') {
      return isOwnedNonFoil ? 'border-owned-border bg-white' : 'card-not-owned border-neutral-200 bg-white';
    }
    // null variant - show both
    if (!isOwned) return 'card-not-owned border-neutral-200 bg-white';
    if (isOwnedFoil) return 'border-foil-border bg-white';
    return 'border-owned-border bg-white';
  };

  const cardClass = `
    overflow-hidden rounded-card-sm sm:rounded-card-lg border card-hover-lift cursor-pointer
    ${getBorderClass()}
  `;

  return (
    <div>
      <div className={cardClass} onClick={() => onClick(card, displayVariant ?? null)}>
        {/* Card image */}
        <div className="p-1.5 sm:p-2 pb-0 sm:pb-0">
          <div className="aspect-[488/680] overflow-hidden rounded-image-sm sm:rounded-image-lg bg-neutral-100 relative">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={card.name}
                loading="lazy"
                className={`w-full h-full object-cover ${showFoilEffect ? 'foil-image' : ''}`}
              />
            )}
            {showFoilEffect && <div className="foil-overlay" />}
            {displayQuantity > 1 && (
              <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 bg-black/70 text-white text-2xs sm:text-xs font-bold rounded-full h-5 sm:h-6 flex items-center justify-center px-2 sm:px-2.5 backdrop-blur-sm">
                {displayQuantity}×
              </div>
            )}
          </div>
        </div>

        {/* Card info */}
        <div className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2.5">
          {/* Name */}
          <p className="text-2xs sm:text-xs font-semibold text-neutral-800 truncate leading-tight">
            {card.name}
          </p>

          {/* Number, rarity & price row */}
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-mono text-neutral-400">
              #{card.collector_number} · <span className={`${getRarityInfo(card.rarity).colorClass}`}>{getRarityInfo(card.rarity).short}</span>
            </span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              {/* Show only the relevant price for the variant */}
              {displayVariant === 'foil' ? (
                effectivePriceFoil !== null && (
                  <span className="text-2xs sm:text-xs font-mono font-semibold text-foil-purple">
                    {formatPrice(effectivePriceFoil)}
                  </span>
                )
              ) : displayVariant === 'nonfoil' ? (
                effectivePrice !== null && (
                  <span className="text-2xs sm:text-xs font-mono font-semibold text-neutral-700">
                    {formatPrice(effectivePrice)}
                  </span>
                )
              ) : (
                <>
                  {effectivePrice !== null && (
                    <span className="text-2xs sm:text-xs font-mono font-semibold text-neutral-700">
                      {formatPrice(effectivePrice)}
                    </span>
                  )}
                  {effectivePrice !== null && effectivePriceFoil !== null && hasFoil && (
                    <span className="text-2xs sm:text-xs font-mono text-neutral-300">/</span>
                  )}
                  {effectivePriceFoil !== null && hasFoil && (
                    <span className="text-2xs sm:text-xs font-mono font-semibold text-foil-purple">
                      {formatPrice(effectivePriceFoil)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Ownership toggle badges */}
          <div className="flex gap-1 sm:gap-1.5 pt-0 sm:pt-0.5">
            {displayVariant === 'foil' ? (
              <OwnershipBadge className="h-8 text-xs"
                variant="foil"
                isOwned={isOwnedFoil}
                label="Foil"
                onClick={readOnly ? undefined : (e) => handleToggle(e, 'foil')}
                readOnly={readOnly}
              />
            ) : displayVariant === 'nonfoil' ? (
              <OwnershipBadge className="h-8 text-xs"
                variant="nonfoil"
                isOwned={isOwnedNonFoil}
                label="Non-Foil"
                onClick={readOnly ? undefined : (e) => handleToggle(e, 'nonfoil')}
                readOnly={readOnly}
              />
            ) : (
              <>
                {hasNonFoil && (
                  <OwnershipBadge className="h-8 text-xs"
                    variant="nonfoil"
                    isOwned={isOwnedNonFoil}
                    label="Non-Foil"
                    onClick={readOnly ? undefined : (e) => handleToggle(e, 'nonfoil')}
                    readOnly={readOnly}
                  />
                )}
                {hasFoil && (
                  <OwnershipBadge className="h-8 text-xs"
                    variant="foil"
                    isOwned={isOwnedFoil}
                    label="Foil"
                    onClick={readOnly ? undefined : (e) => handleToggle(e, 'foil')}
                    readOnly={readOnly}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
