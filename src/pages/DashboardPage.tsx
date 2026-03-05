import { useState, useCallback } from 'react';
import { PullToRefresh } from '../components/ui/PullToRefresh';
import { useAuth } from '../hooks/useAuth';
import { useOwnedCards } from '../hooks/useOwnedCards';
import { useCollectionsSettings } from '../hooks/useCollectionsSettings';
import { useHomeStats } from '../hooks/useHomeStats';
import { useDashboardCardLoader } from '../hooks/useDashboardCardLoader';
import { isFirebaseConfigured } from '../config/firebase';
import { toggleCardOwnership, updateCardQuantity } from '../services/firestore';
import { HeroWidget } from '../components/dashboard/HeroWidget';
import { FoilBreakdownWidget } from '../components/dashboard/FoilBreakdownWidget';
import { RarityBreakdownWidget } from '../components/dashboard/RarityBreakdownWidget';
import { TopFranchisesWidget } from '../components/dashboard/TopFranchisesWidget';
import { NearCompleteWidget } from '../components/dashboard/NearCompleteWidget';
import { CardSpotlightWidget } from '../components/dashboard/CardSpotlightWidget';
import { SetProgressWidget } from '../components/dashboard/SetProgressWidget';
import { CardDetail } from '../components/cards/CardDetail';
import type { ScryfallCard } from '../types/card';
import type { CardVariant } from '../types/card';

export function DashboardPage() {
  const { user } = useAuth();
  const { ownedCards, loading: isOwnedCardsLoading } = useOwnedCards(user?.uid ?? null);
  const { settings, isLoading: isSettingsLoading } = useCollectionsSettings();
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefreshConsumed = useCallback(() => {
    setRefreshKey(0);
  }, []);
  const { cacheVersion, getRefreshPromise } = useDashboardCardLoader(ownedCards, settings, isOwnedCardsLoading, isSettingsLoading, refreshKey, handleRefreshConsumed);
  const handleRefresh = useCallback(async () => {
    const done = getRefreshPromise();
    setRefreshKey((k) => k + 1);
    await done;
  }, [getRefreshPromise]);
  const stats = useHomeStats(ownedCards, settings, cacheVersion);

  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>(null);

  const handleToggle = useCallback(
    (card: ScryfallCard, variant: 'nonfoil' | 'foil') => {
      if (isFirebaseConfigured) {
        void toggleCardOwnership(user?.uid ?? '', card.id, {
          set: card.set,
          collectorNumber: card.collector_number,
          name: card.name,
        }, variant, ownedCards.get(card.id));
      }
    },
    [ownedCards, user?.uid]
  );

  const handleQuantityChange = useCallback(
    (card: ScryfallCard, variant: 'nonfoil' | 'foil', quantity: number) => {
      const existing = ownedCards.get(card.id);
      if (!existing) return;
      if (isFirebaseConfigured) {
        void updateCardQuantity(user?.uid ?? '', card.id, variant, quantity, existing);
      }
    },
    [ownedCards, user?.uid]
  );

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={!!selectedCard}>
    <div className="app-container-padded pb-3 sm:py-5">
      <div className="flex flex-col gap-3 sm:gap-4">

        {/* Hero */}
        <HeroWidget
          totalValueEur={stats.totalValueEur}
          totalUniqueOwned={stats.totalUniqueOwned}
          totalCardsInCollection={stats.totalCardsInCollection}
          globalCompletionPct={stats.globalCompletionPct}
        />

        {/* Spotlight – Most Valuable + Recently Added */}
        <CardSpotlightWidget
          mostValuableCards={stats.mostValuableCards}
          recentCards={stats.recentCards}
          onCardClick={(card, variant) => {
            setSelectedCard(card);
            setSelectedVariant(variant);
          }}
        />

        {/* Foil + Rarity – 2 sloupce */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FoilBreakdownWidget
            nonFoilCount={stats.nonFoilCount}
            foilCount={stats.foilCount}
            nonFoilValue={stats.nonFoilValue}
            foilValue={stats.foilValue}
          />
          <RarityBreakdownWidget rarityBreakdown={stats.rarityBreakdown} />
        </div>

        {/* Collection Progress + Almost Complete – 2 sloupce na desktopu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <TopFranchisesWidget topFranchises={stats.topFranchises} />
          <NearCompleteWidget nearCompleteSets={stats.nearCompleteSets} />
        </div>

        {/* Set Progress */}
        <SetProgressWidget setProgress={stats.setProgress} />

      </div>

      {/* Card detail modal */}
      <CardDetail
        card={selectedCard}
        selectedVariant={selectedVariant}
        owned={selectedCard ? ownedCards.get(selectedCard.id) : undefined}
        onClose={() => {
          setSelectedCard(null);
          setSelectedVariant(null);
        }}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
      />
    </div>
    </PullToRefresh>
  );
}
