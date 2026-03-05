import { useState } from 'react';
import { getCachedCardById } from '../../utils/scryfallCache';
import { getCardImage } from '../../services/scryfall';
import { formatPrice } from '../../utils/formatPrice';
import type { ScryfallCard } from '../../types/card';
import type { ValuableCard } from '../../hooks/useHomeStats';
import type { OwnedCard } from '../../types/card';
import { formatRelativeTime } from '../../utils/formatTime';
import { WidgetCard } from './WidgetCard';

interface CardSpotlightWidgetProps {
  mostValuableCards: ValuableCard[];
  recentCards: OwnedCard[];
  onCardClick: (card: ScryfallCard, variant: 'nonfoil' | 'foil') => void;
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
    <WidgetCard title="Cards">
        {/* Tab header */}
        <div className="flex gap-0 border-b border-surface-border mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={[
                'flex-1 sm:flex-none text-center px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer',
                activeTab === tab.id
                  ? 'text-primary-500 border-primary-500'
                  : 'text-neutral-500 border-transparent hover:text-neutral-700',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {isEmpty ? (
          <p className="text-xs text-neutral-400 py-1">Browse your collection first</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Featured karta */}
            <div className="shrink-0 w-full max-w-[180px] mx-auto sm:mx-0 sm:w-[140px]">
              {featuredImageUrl ? (
                <div
                  className="relative w-full rounded-lg overflow-hidden aspect-[488/680] shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => featuredCached && handleRowClick(featuredCached.id, featuredIsFoil)}
                >
                  <img
                    src={featuredImageUrl}
                    alt={featuredCached?.name ?? ''}
                    className={`w-full h-full object-cover ${featuredIsFoil ? 'foil-image' : ''}`}
                  />
                  {featuredIsFoil && <div className="foil-overlay rounded-lg" />}
                </div>
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
                  <div className={`w-2 h-2 rounded-full shrink-0 ${card.isFoil ? 'bg-violet-500' : 'bg-neutral-300'}`} />
                  <span className="text-sm font-medium text-neutral-700 truncate">
                    {card.name}
                  </span>
                  <span className={`text-sm font-mono font-bold shrink-0 ml-auto ${card.isFoil ? 'text-violet-500' : 'text-neutral-700'}`}>
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
                  <div className={`w-2 h-2 rounded-full shrink-0 ${card.ownedFoil ? 'bg-violet-500' : 'bg-neutral-300'}`} />
                  <span className="text-sm font-medium text-neutral-700 truncate">
                    {card.name}
                  </span>
                  <span className="text-sm font-mono text-neutral-400 shrink-0 ml-auto">
                    {formatRelativeTime(card.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
    </WidgetCard>
  );
}
