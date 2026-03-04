import { LinkButton } from '../ui/Button';
import type { ScryfallCard, OwnedCard } from '../../types/card';
import { formatPrice, parsePrice } from '../../utils/formatPrice';
import { OwnershipBadge } from './OwnershipBadge';

interface CardDetailContentProps {
  card: ScryfallCard;
  owned?: OwnedCard;
  onToggle: (cardId: string, variant: 'nonfoil' | 'foil') => void;
  onQuantityChange?: (cardId: string, variant: 'nonfoil' | 'foil', quantity: number) => void;
  readOnly?: boolean;
}

export function CardDetailContent({ card, owned, onToggle, onQuantityChange, readOnly }: CardDetailContentProps) {
  const isOwnedNonFoil = owned?.ownedNonFoil ?? false;
  const isOwnedFoil = owned?.ownedFoil ?? false;
  const hasNonFoil = card.finishes.includes('nonfoil');
  const hasFoil = card.finishes.includes('foil');

  const scryfallPriceEur = parsePrice(card.prices.eur);
  const scryfallPriceFoil = parsePrice(card.prices.eur_foil);

  return (
    <>
      {/* Ownership toggles with quantity */}
      <div className={`grid gap-2 ${hasNonFoil && hasFoil ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {hasNonFoil && (
          <OwnershipBadge
            className="h-11 text-base"
            variant="nonfoil"
            isOwned={isOwnedNonFoil}
            label={isOwnedNonFoil && readOnly ? `${owned?.quantityNonFoil || 1}× Non-Foil` : 'Non-Foil'}
            onClick={readOnly || isOwnedNonFoil ? undefined : () => onToggle(card.id, 'nonfoil')}
            readOnly={readOnly}
          >
            {!readOnly && isOwnedNonFoil && onQuantityChange ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onQuantityChange(card.id, 'nonfoil', Math.max(0, (owned?.quantityNonFoil || 1) - 1)); }}
                  className="w-6 h-6 flex items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-5 text-center font-semibold text-owned">
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
            ) : undefined}
          </OwnershipBadge>
        )}
        {hasFoil && (
          <OwnershipBadge
            className="h-11 text-base"
            variant="foil"
            isOwned={isOwnedFoil}
            label={isOwnedFoil && readOnly ? `${owned?.quantityFoil || 1}× Foil` : 'Foil'}
            onClick={readOnly || isOwnedFoil ? undefined : () => onToggle(card.id, 'foil')}
            readOnly={readOnly}
          >
            {!readOnly && isOwnedFoil && onQuantityChange ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onQuantityChange(card.id, 'foil', Math.max(0, (owned?.quantityFoil || 1) - 1)); }}
                  className="w-6 h-6 flex items-center justify-center rounded bg-purple-400 text-white hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-5 text-center font-semibold text-foil-purple">
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
            ) : undefined}
          </OwnershipBadge>
        )}
      </div>

      {/* Prices section */}
      <div className={`grid gap-2 -mt-3 ${hasNonFoil && hasFoil ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {hasNonFoil && (
          <div className="bg-neutral-100 rounded-lg px-3 text-center flex items-center justify-center h-11">
            <p className="text-base font-semibold text-neutral-800">
              {formatPrice(scryfallPriceEur)}
            </p>
          </div>
        )}
        {hasFoil && (
          <div className="bg-purple-100 rounded-lg px-3 text-center flex items-center justify-center h-11">
            <p className="text-base font-semibold text-foil-purple">
              {formatPrice(scryfallPriceFoil)}
            </p>
          </div>
        )}
      </div>

      {/* Cardmarket link */}
      {card.purchase_uris?.cardmarket && (
        <LinkButton
          href={card.purchase_uris.cardmarket}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on Cardmarket
        </LinkButton>
      )}
    </>
  );
}
