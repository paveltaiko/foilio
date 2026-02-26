import { useState } from 'react';
import { getCachedCardById } from '../../utils/scryfallCache';
import { getCardImage } from '../../services/scryfall';
import { formatPrice } from '../../utils/formatPrice';
import type { ScryfallCard } from '../../types/card';
import type { ValuableCard } from '../../hooks/useHomeStats';
import type { OwnedCard } from '../../types/card';

interface CardSpotlightWidgetProps {
  mostValuableCards: ValuableCard[];
  recentCards: OwnedCard[];
  onCardClick: (card: ScryfallCard, variant: 'nonfoil' | 'foil') => void;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Tab = 'valuable' | 'recent';

const TABS: { id: Tab; label: string }[] = [
  { id: 'valuable', label: 'Most Valuable' },
  { id: 'recent', label: 'Recently Added' },
];

export function CardSpotlightWidget({ mostValuableCards, recentCards, onCardClick }: CardSpotlightWidgetProps) {
  const [activeTab, setActiveTab] = useState<Tab>('valuable');
  const [activeIndex, setActiveIndex] = useState(0);

  const isEmpty = mostValuableCards.length === 0 && recentCards.length === 0;

  const currentList = activeTab === 'valuable' ? mostValuableCards : recentCards;
  const safeIndex = Math.min(activeIndex, currentList.length - 1);

  const featuredId = activeTab === 'valuable'
    ? mostValuableCards[safeIndex]?.scryfallId
    : recentCards[safeIndex]?.scryfallId;

  const featuredCached = featuredId ? getCachedCardById(featuredId) : null;
  const featuredImageUrl = featuredCached ? getCardImage(featuredCached, 'normal') : '';

  const featuredIsFoil = activeTab === 'valuable'
    ? (mostValuableCards[safeIndex]?.isFoil ?? false)
    : (recentCards[safeIndex]?.ownedFoil ?? false);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setActiveIndex(0);
  }

  function handleRowClick(scryfallId: string, isFoil: boolean) {
    const cached = getCachedCardById(scryfallId);
    if (cached) onCardClick(cached, isFoil ? 'foil' : 'nonfoil');
  }

  return (
    <div className="bg-surface-primary border border-surface-border rounded-lg overflow-hidden">
      {/* Tab header */}
      <div className="border-b border-surface-border flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              px-4 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer
              border-b-2 whitespace-nowrap -mb-px
              ${activeTab === tab.id
                ? 'text-primary-500 border-primary-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-8 px-3 pb-3 sm:p-4">
        {isEmpty ? (
          <p className="text-xs text-neutral-400 py-1">Browse your collection first</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-8">
            {/* Featured karta */}
            <div className="shrink-0 w-full max-w-[180px] mx-auto sm:mx-0 sm:w-[140px]">
              {featuredImageUrl ? (
                <img
                  src={featuredImageUrl}
                  alt={featuredCached?.name ?? ''}
                  onClick={() => featuredCached && handleRowClick(featuredCached.id, featuredIsFoil)}
                  className={`w-full rounded-lg aspect-[488/680] object-cover shadow-md cursor-pointer hover:opacity-90 transition-opacity ${featuredIsFoil ? 'ring-1 ring-violet-400' : ''}`}
                />
              ) : (
                <div className="w-full rounded-lg aspect-[488/680] bg-neutral-100" />
              )}
            </div>

            {/* Seznam karet */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              {activeTab === 'valuable' && mostValuableCards.map((card, i) => (
                <button
                  key={card.scryfallId}
                  onClick={() => { setActiveIndex(i); handleRowClick(card.scryfallId, card.isFoil); }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-md transition-colors ${i === safeIndex ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.isFoil ? 'bg-violet-500' : 'bg-neutral-300'}`} />
                  <span className="text-xs sm:text-sm font-medium text-neutral-700 truncate">
                    {card.name}
                  </span>
                  <span className={`text-xs font-mono font-bold shrink-0 ml-auto ${card.isFoil ? 'text-violet-500' : 'text-neutral-700'}`}>
                    {formatPrice(card.priceEur)}
                  </span>
                </button>
              ))}

              {activeTab === 'recent' && recentCards.map((card, i) => (
                <button
                  key={card.scryfallId}
                  onClick={() => { setActiveIndex(i); handleRowClick(card.scryfallId, card.ownedFoil); }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-md transition-colors ${i === safeIndex ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.ownedFoil ? 'bg-violet-500' : 'bg-neutral-300'}`} />
                  <span className="text-xs sm:text-sm font-medium text-neutral-700 truncate">
                    {card.name}
                  </span>
                  <span className="text-xs font-mono text-neutral-400 shrink-0 ml-auto">
                    {formatRelativeTime(card.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
