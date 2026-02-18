import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, ShieldCheck, Share2, ChartColumnIncreasing } from 'lucide-react';
import { useScryfallCards } from '../hooks/useScryfallCards';
import { CardGrid, CardGridSkeleton } from '../components/cards/CardGrid';
import { CardDetail } from '../components/cards/CardDetail';
import { FaqAccordion } from '../components/ui/FaqAccordion';
import type { CardWithVariant, OwnedCard, ScryfallCard, CardVariant } from '../types/card';

interface PreviewLoginLandingPageProps {
  onLogin: () => void;
  isLoggedIn: boolean;
}

const featureCards = [
  {
    title: 'Owned vs Missing',
    description: 'Track nonfoil and foil copies separately.',
    icon: Sparkles,
  },
  {
    title: 'Collection Value',
    description: 'Live price roll-up from Scryfall data.',
    icon: ChartColumnIncreasing,
  },
  {
    title: 'Share by Link',
    description: 'Publish your collection in read-only mode.',
    icon: Share2,
  },
  {
    title: 'Private by Default',
    description: 'Auth and access controls via Firebase rules.',
    icon: ShieldCheck,
  },
];

const PREVIEW_CARD_SELECTION = [
  { name: 'The Soul Stone', collectorNumber: '242' },
  { name: 'The Soul Stone', collectorNumber: '243' },
  { name: 'The Soul Stone', collectorNumber: '66' },
  { name: 'Parallel Lives', collectorNumber: '36' },
  { name: 'Miles Morales // Ultimate Spider-Man', collectorNumber: '234' },
  { name: 'Spectacular Spider-Man', collectorNumber: '240' },
  { name: 'Gwen Stacy // Ghost-Spider', collectorNumber: '202' },
  { name: 'Eddie Brock // Venom, Lethal Protector', collectorNumber: '233' },
] as const;

const FAQ_ITEMS = [
  {
    question: 'What data is stored in the app?',
    answer:
      'The app stores your collection state: which cards you own (non-foil/foil), their quantities, and for sharing only public profile details like name and avatar. These details are visible only to people you share your secure collection link with.',
  },
  {
    question: 'Why do I need to sign in?',
    answer:
      'Sign-in protects your data, enables sync across devices, and allows secure collection sharing via link.',
  },
  {
    question: 'Does it work on mobile?',
    answer:
      'Yes. Foilio is a mobile-first app with full controls on both phone and desktop. You can add it to your home screen and open it just like a native app.',
  },
] as const;

export function PreviewLoginLandingPage({ onLogin, isLoggedIn }: PreviewLoginLandingPageProps) {
  const pageContainerClass = 'app-container-padded pb-8 sm:pb-12 space-y-8 sm:space-y-12';
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<CardVariant>(null);
  const { data: spmCards = [], isLoading: spmLoading } = useScryfallCards('spm');
  const { data: speCards = [], isLoading: speLoading } = useScryfallCards('spe');
  const { data: marCards = [], isLoading: marLoading } = useScryfallCards('mar');

  const isLoading = spmLoading || speLoading || marLoading;
  const totalCards = spmCards.length + speCards.length + marCards.length;
  const allCards = useMemo(() => [...spmCards, ...speCards, ...marCards], [spmCards, speCards, marCards]);
  const topCards = useMemo(
    () => PREVIEW_CARD_SELECTION
      .map((target) => allCards.find((card) => card.name === target.name && card.collector_number === target.collectorNumber))
      .filter((card): card is ScryfallCard => !!card),
    [allCards]
  );
  const previewOwnedCards = useMemo(() => createPreviewOwnedCards(topCards), [topCards]);
  const topCardItems: CardWithVariant[] = useMemo(
    () => topCards.map((card) => ({ card, variant: null, sortPrice: null })),
    [topCards]
  );
  const noopToggle = () => {};

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className={pageContainerClass}>
      <section className="relative overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-br from-[#101631] via-[#26143f] to-[#251022] text-white p-6 sm:p-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.48)_0%,rgba(236,72,153,0.44)_24%,rgba(59,130,246,0.44)_54%,rgba(16,185,129,0.34)_78%,rgba(236,72,153,0.3)_100%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_58%)]" />
        <div className="absolute inset-0 bg-black/14" />

        <div className="relative space-y-4 sm:space-y-6 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Track your MTG Spider-Man collection without spreadsheet chaos.
          </h1>
          <p className="text-sm sm:text-base text-neutral-200 max-w-2xl">
            See exactly what you own, what is still missing, and how much your collection is worth. Save progress across devices and share a clean read-only link whenever you want.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-52 px-5 py-3 rounded-lg bg-white text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 transition-colors text-sm font-semibold cursor-pointer"
            >
              Sign in with Google
            </button>
            <a
              href="#preview-cards"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-52 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 transition-colors text-sm font-semibold"
            >
              Explore preview cards
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label="Total cards" value={isLoading ? '...' : `${totalCards}`} />
        <StatTile label="Main set (SPM)" value={isLoading ? '...' : `${spmCards.length}`} />
        <StatTile label="Specials (SPE)" value={isLoading ? '...' : `${speCards.length}`} />
        <StatTile label="Marvel (MAR)" value={isLoading ? '...' : `${marCards.length}`} />
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {featureCards.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-xl border border-surface-border bg-surface-primary p-4 sm:p-5">
              <Icon className="w-5 h-5 text-primary-500 mb-3" />
              <h2 className="text-sm font-semibold text-neutral-800">{feature.title}</h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section id="preview-cards" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Most Popular Cards</h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-500">Using the same card design as the app, including owned foil previews.</p>
          </div>
        </div>

        {isLoading ? <CardGridSkeleton /> : (
          <CardGrid
            cards={topCardItems}
            ownedCards={previewOwnedCards}
            onToggle={noopToggle}
            onCardClick={(card, variant) => {
              setSelectedCard(card);
              setSelectedVariant(variant);
            }}
            readOnly
          />
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">How It Works</h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-500">Get started in under a minute.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-surface-border bg-surface-primary p-4 sm:p-5">
            <p className="text-xs font-semibold text-primary-500 tracking-wide uppercase">Step 1</p>
            <h3 className="mt-2 text-sm sm:text-base font-semibold text-neutral-900">Sign in with Google</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-600">Create your private collection space instantly.</p>
          </article>
          <article className="rounded-xl border border-surface-border bg-surface-primary p-4 sm:p-5">
            <p className="text-xs font-semibold text-primary-500 tracking-wide uppercase">Step 2</p>
            <h3 className="mt-2 text-sm sm:text-base font-semibold text-neutral-900">Mark owned cards</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-600">Track Non-Foil and Foil variants with quantities.</p>
          </article>
          <article className="rounded-xl border border-surface-border bg-surface-primary p-4 sm:p-5">
            <p className="text-xs font-semibold text-primary-500 tracking-wide uppercase">Step 3</p>
            <h3 className="mt-2 text-sm sm:text-base font-semibold text-neutral-900">Track progress and value</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-600">See missing cards, collection value, and share your progress.</p>
          </article>
        </div>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-bold text-neutral-900">FAQ</h2>
        <p className="mt-2 text-xs sm:text-sm text-neutral-500">Quick answers to the most common questions.</p>
        <div className="mt-4">
          <FaqAccordion items={[...FAQ_ITEMS]} />
        </div>
      </section>

      <CardDetail
        card={selectedCard}
        selectedVariant={selectedVariant}
        owned={selectedCard ? previewOwnedCards.get(selectedCard.id) : undefined}
        onClose={() => {
          setSelectedCard(null);
          setSelectedVariant(null);
        }}
        onToggle={noopToggle}
        cards={topCardItems}
        onNavigate={(card, variant) => {
          setSelectedCard(card);
          setSelectedVariant(variant);
        }}
        readOnly
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-surface-border bg-surface-primary p-3 sm:p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 mt-1">{value}</p>
    </article>
  );
}

function createPreviewOwnedCards(cards: ScryfallCard[]): Map<string, OwnedCard> {
  const now = new Date();
  const owned = new Map<string, OwnedCard>();

  cards.forEach((card, index) => {
    const hasFoil = card.finishes.includes('foil');
    const hasNonFoil = card.finishes.includes('nonfoil');
    const ownedNonFoil = hasNonFoil && (index % 2 === 0 || index === 3);
    const ownedFoil = hasFoil && (index % 3 === 0 || index === 5);

    if (!ownedNonFoil && !ownedFoil) return;

    owned.set(card.id, {
      scryfallId: card.id,
      set: card.set,
      collectorNumber: card.collector_number,
      name: card.name,
      ownedNonFoil,
      ownedFoil,
      quantityNonFoil: ownedNonFoil ? (index % 4 === 0 ? 2 : 1) : 0,
      quantityFoil: ownedFoil ? (index % 5 === 0 ? 2 : 1) : 0,
      addedAt: now,
      updatedAt: now,
    });
  });

  return owned;
}
