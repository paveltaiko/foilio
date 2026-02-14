import { useCallback } from 'react';
import { Check } from 'lucide-react';
import type { ScryfallCard, OwnedCard, CardVariant } from '../../types/card';
import { getCardImage } from '../../services/scryfall';
import { formatPrice, parsePrice } from '../../utils/formatPrice';

interface CardItemProps {
  card: ScryfallCard;
  owned?: OwnedCard;
  displayVariant?: CardVariant; // null = zobrazit obě, 'nonfoil'/'foil' = zobrazit jen jednu
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onClick: (card: ScryfallCard) => void;
  readOnly?: boolean;
}

export function CardItem({ card, owned, displayVariant, onToggle, onClick, readOnly }: CardItemProps) {
  const isOwnedNonFoil = owned?.ownedNonFoil ?? false;
  const isOwnedFoil = owned?.ownedFoil ?? false;

  // Při zobrazení jen jedné varianty, ownership status té varianty
  const isOwned = displayVariant === 'foil'
    ? isOwnedFoil
    : displayVariant === 'nonfoil'
      ? isOwnedNonFoil
      : (isOwnedNonFoil || isOwnedFoil);

  const effectivePrice = owned?.customPrice ?? parsePrice(card.prices.eur);
  const effectivePriceFoil = owned?.customPriceFoil ?? parsePrice(card.prices.eur_foil);

  const imageUrl = getCardImage(card, 'large');
  const hasNonFoil = card.finishes.includes('nonfoil');
  const hasFoil = card.finishes.includes('foil');

  // Zobrazit foil efekt na obrázku?
  const showFoilEffect = displayVariant === 'foil' || (displayVariant === null && isOwnedFoil);

  const handleToggle = useCallback(
    (e: React.MouseEvent, variant: 'nonfoil' | 'foil') => {
      e.stopPropagation();
      onToggle(card.id, variant);
    },
    [card.id, onToggle]
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
    overflow-hidden rounded-lg sm:rounded-card-sm border card-hover-lift cursor-pointer
    ${getBorderClass()}
  `;

  return (
    <div>
      <div className={cardClass} onClick={() => onClick(card)}>
        {/* Card image */}
        <div className="p-1.5 sm:p-2.5 pb-0 sm:pb-0">
          <div className="aspect-[488/680] overflow-hidden rounded-md sm:rounded-lg bg-neutral-100 relative">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={card.name}
                loading="lazy"
                className={`w-full h-full object-cover ${showFoilEffect ? 'foil-image' : ''}`}
              />
            )}
            {showFoilEffect && <div className="foil-overlay" />}
          </div>
        </div>

        {/* Card info */}
        <div className="p-1.5 sm:p-2.5 space-y-1.5 sm:space-y-2.5">
          {/* Name */}
          <p className="text-2xs sm:text-xs font-semibold text-neutral-800 truncate leading-tight">
            {card.name}
          </p>

          {/* Number & price row */}
          <div className="flex items-center justify-between">
            <span className="text-2xs sm:text-xs font-mono text-neutral-400">
              #{card.collector_number}
            </span>
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              {/* Zobrazit pouze relevantní cenu podle varianty */}
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
          {readOnly ? (
            <div className="flex gap-1 sm:gap-1.5 pt-0 sm:pt-0.5">
              {displayVariant === 'foil' ? (
                <div className={`flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border text-center ${isOwnedFoil ? 'bg-foil-bg text-foil-purple border-foil-border' : 'bg-neutral-50 text-neutral-400 border-neutral-200'}`}>
                  {isOwnedFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                  Foil
                </div>
              ) : displayVariant === 'nonfoil' ? (
                <div className={`flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border text-center ${isOwnedNonFoil ? 'bg-owned-bg text-owned border-owned-border' : 'bg-neutral-50 text-neutral-400 border-neutral-200'}`}>
                  {isOwnedNonFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                  Non-Foil
                </div>
              ) : (
                <>
                  {hasNonFoil && (
                    <div className={`flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border text-center ${isOwnedNonFoil ? 'bg-owned-bg text-owned border-owned-border' : 'bg-neutral-50 text-neutral-400 border-neutral-200'}`}>
                      {isOwnedNonFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                      NF
                    </div>
                  )}
                  {hasFoil && (
                    <div className={`flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border text-center ${isOwnedFoil ? 'bg-foil-bg text-foil-purple border-foil-border' : 'bg-neutral-50 text-neutral-400 border-neutral-200'}`}>
                      {isOwnedFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                      F
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex gap-1 sm:gap-1.5 pt-0 sm:pt-0.5">
              {/* Při zobrazení jedné varianty, zobrazit jen jedno tlačítko */}
              {displayVariant === 'foil' ? (
                <button
                  onClick={(e) => handleToggle(e, 'foil')}
                  className={`
                    flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border cursor-pointer
                    transition-all duration-200 active:scale-95
                    ${isOwnedFoil
                      ? 'bg-foil-bg text-foil-purple border-foil-border hover:bg-purple-100'
                      : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                    }
                  `}
                >
                  {isOwnedFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                  Foil
                </button>
              ) : displayVariant === 'nonfoil' ? (
                <button
                  onClick={(e) => handleToggle(e, 'nonfoil')}
                  className={`
                    flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border cursor-pointer
                    transition-all duration-200 active:scale-95
                    ${isOwnedNonFoil
                      ? 'bg-owned-bg text-owned border-owned-border hover:bg-green-100'
                      : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                    }
                  `}
                >
                  {isOwnedNonFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                  Non-Foil
                </button>
              ) : (
                <>
                  {hasNonFoil && (
                    <button
                      onClick={(e) => handleToggle(e, 'nonfoil')}
                      className={`
                        flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border cursor-pointer
                        transition-all duration-200 active:scale-95
                        ${isOwnedNonFoil
                          ? 'bg-owned-bg text-owned border-owned-border hover:bg-green-100'
                          : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                        }
                      `}
                    >
                      {isOwnedNonFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                      NF
                    </button>
                  )}
                  {hasFoil && (
                    <button
                      onClick={(e) => handleToggle(e, 'foil')}
                      className={`
                        flex-1 py-1.5 sm:py-1 text-2xs font-medium tracking-wide uppercase rounded-sm border cursor-pointer
                        transition-all duration-200 active:scale-95
                        ${isOwnedFoil
                          ? 'bg-foil-bg text-foil-purple border-foil-border hover:bg-purple-100'
                          : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100'
                        }
                      `}
                    >
                      {isOwnedFoil && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                      F
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
