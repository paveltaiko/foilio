import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { OwnedCard } from '../types/card';
import { mirrorOwnedCardToShared, removeMirroredOwnedCard } from './sharing';

function getDb() {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

function ownedCardsCollection(userId: string) {
  return collection(getDb(), 'users', userId, 'ownedCards');
}

export function subscribeToOwnedCards(
  userId: string,
  callback: (cards: Map<string, OwnedCard>) => void
): Unsubscribe {
  const ref = ownedCardsCollection(userId);

  return onSnapshot(ref, (snapshot) => {
    const cards = new Map<string, OwnedCard>();
    snapshot.forEach((doc) => {
      const data = doc.data();
      cards.set(doc.id, {
        scryfallId: doc.id,
        set: data.set,
        collectorNumber: data.collectorNumber,
        name: data.name,
        ownedNonFoil: data.ownedNonFoil ?? false,
        ownedFoil: data.ownedFoil ?? false,
        quantityNonFoil: data.quantityNonFoil ?? (data.ownedNonFoil ? 1 : 0),
        quantityFoil: data.quantityFoil ?? (data.ownedFoil ? 1 : 0),
        addedAt: data.addedAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      });
    });
    callback(cards);
  });
}

export async function toggleCardOwnership(
  userId: string,
  cardId: string,
  cardData: {
    set: string;
    collectorNumber: string;
    name: string;
  },
  variant: 'nonfoil' | 'foil',
  currentOwned: OwnedCard | undefined,
  shareToken?: string
): Promise<void> {
  const ref = doc(getDb(), 'users', userId, 'ownedCards', cardId);

  const isNowOwned = variant === 'nonfoil'
    ? !(currentOwned?.ownedNonFoil ?? false)
    : !(currentOwned?.ownedFoil ?? false);

  const newNonFoil = variant === 'nonfoil' ? isNowOwned : (currentOwned?.ownedNonFoil ?? false);
  const newFoil = variant === 'foil' ? isNowOwned : (currentOwned?.ownedFoil ?? false);
  const newQtyNonFoil = variant === 'nonfoil' ? (isNowOwned ? 1 : 0) : (currentOwned?.quantityNonFoil ?? 0);
  const newQtyFoil = variant === 'foil' ? (isNowOwned ? 1 : 0) : (currentOwned?.quantityFoil ?? 0);

  if (!newNonFoil && !newFoil) {
    await deleteDoc(ref);
    if (shareToken) {
      await removeMirroredOwnedCard(shareToken, cardId);
    }
    return;
  }

  await setDoc(ref, {
    set: cardData.set,
    collectorNumber: cardData.collectorNumber,
    name: cardData.name,
    ownedNonFoil: newNonFoil,
    ownedFoil: newFoil,
    quantityNonFoil: newQtyNonFoil,
    quantityFoil: newQtyFoil,
    addedAt: currentOwned ? currentOwned.addedAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (shareToken) {
    await mirrorOwnedCardToShared(shareToken, cardId, {
      set: cardData.set,
      collectorNumber: cardData.collectorNumber,
      name: cardData.name,
      ownedNonFoil: newNonFoil,
      ownedFoil: newFoil,
      quantityNonFoil: newQtyNonFoil,
      quantityFoil: newQtyFoil,
      addedAt: currentOwned?.addedAt ?? serverTimestamp(),
    });
  }
}

// ─── Collection Settings ──────────────────────────────────────────────────────

function settingsDocRef(userId: string) {
  return doc(getDb(), 'users', userId, 'settings', 'collections');
}

export function subscribeToCollectionSettings(
  userId: string,
  callback: (raw: Record<string, unknown> | null) => void
): Unsubscribe {
  return onSnapshot(settingsDocRef(userId), (snap) => {
    callback(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
  });
}

export async function saveCollectionSettings(
  userId: string,
  settings: Record<string, unknown>
): Promise<void> {
  await setDoc(settingsDocRef(userId), settings);
}

// ─── Card Quantity ────────────────────────────────────────────────────────────

export async function updateCardQuantity(
  userId: string,
  cardId: string,
  variant: 'nonfoil' | 'foil',
  quantity: number,
  currentOwned: OwnedCard,
  shareToken?: string
): Promise<void> {
  const ref = doc(getDb(), 'users', userId, 'ownedCards', cardId);

  const newQtyNonFoil = variant === 'nonfoil' ? quantity : currentOwned.quantityNonFoil;
  const newQtyFoil = variant === 'foil' ? quantity : currentOwned.quantityFoil;
  const newOwnedNonFoil = variant === 'nonfoil' ? quantity > 0 : currentOwned.ownedNonFoil;
  const newOwnedFoil = variant === 'foil' ? quantity > 0 : currentOwned.ownedFoil;

  if (!newOwnedNonFoil && !newOwnedFoil) {
    await deleteDoc(ref);
    if (shareToken) {
      await removeMirroredOwnedCard(shareToken, cardId);
    }
    return;
  }

  await setDoc(ref, {
    set: currentOwned.set,
    collectorNumber: currentOwned.collectorNumber,
    name: currentOwned.name,
    ownedNonFoil: newOwnedNonFoil,
    ownedFoil: newOwnedFoil,
    quantityNonFoil: newQtyNonFoil,
    quantityFoil: newQtyFoil,
    addedAt: currentOwned.addedAt,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  if (shareToken) {
    await mirrorOwnedCardToShared(shareToken, cardId, {
      set: currentOwned.set,
      collectorNumber: currentOwned.collectorNumber,
      name: currentOwned.name,
      ownedNonFoil: newOwnedNonFoil,
      ownedFoil: newOwnedFoil,
      quantityNonFoil: newQtyNonFoil,
      quantityFoil: newQtyFoil,
      addedAt: currentOwned.addedAt,
    });
  }
}
