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
        customPrice: data.customPrice ?? null,
        customPriceFoil: data.customPriceFoil ?? null,
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
  currentOwned: OwnedCard | undefined
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
    customPrice: currentOwned?.customPrice ?? null,
    customPriceFoil: currentOwned?.customPriceFoil ?? null,
    addedAt: currentOwned ? currentOwned.addedAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCustomPrice(
  userId: string,
  cardId: string,
  variant: 'nonfoil' | 'foil',
  price: number | null,
  currentOwned: OwnedCard
): Promise<void> {
  const ref = doc(getDb(), 'users', userId, 'ownedCards', cardId);

  await setDoc(ref, {
    set: currentOwned.set,
    collectorNumber: currentOwned.collectorNumber,
    name: currentOwned.name,
    ownedNonFoil: currentOwned.ownedNonFoil,
    ownedFoil: currentOwned.ownedFoil,
    quantityNonFoil: currentOwned.quantityNonFoil,
    quantityFoil: currentOwned.quantityFoil,
    customPrice: variant === 'nonfoil' ? price : currentOwned.customPrice,
    customPriceFoil: variant === 'foil' ? price : currentOwned.customPriceFoil,
    addedAt: currentOwned.addedAt,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateCardQuantity(
  userId: string,
  cardId: string,
  variant: 'nonfoil' | 'foil',
  quantity: number,
  currentOwned: OwnedCard
): Promise<void> {
  const ref = doc(getDb(), 'users', userId, 'ownedCards', cardId);

  const newQtyNonFoil = variant === 'nonfoil' ? quantity : currentOwned.quantityNonFoil;
  const newQtyFoil = variant === 'foil' ? quantity : currentOwned.quantityFoil;
  const newOwnedNonFoil = variant === 'nonfoil' ? quantity > 0 : currentOwned.ownedNonFoil;
  const newOwnedFoil = variant === 'foil' ? quantity > 0 : currentOwned.ownedFoil;

  if (!newOwnedNonFoil && !newOwnedFoil) {
    await deleteDoc(ref);
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
    customPrice: currentOwned.customPrice,
    customPriceFoil: currentOwned.customPriceFoil,
    addedAt: currentOwned.addedAt,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
