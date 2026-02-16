import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

function getDb() {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

function randomToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export async function getOrCreateShareToken(user: {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<string> {
  const firestore = getDb();
  const userShareRef = doc(firestore, 'userShares', user.uid);
  const userShareSnap = await getDoc(userShareRef);

  if (userShareSnap.exists()) {
    const existingToken = userShareSnap.data().token as string | undefined;
    if (existingToken) {
      await setDoc(
        doc(firestore, 'sharedCollections', existingToken),
        {
          userId: user.uid,
          displayName: user.displayName ?? 'User',
          photoURL: user.photoURL ?? null,
          enabled: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return existingToken;
    }
  }

  const token = randomToken();
  const now = serverTimestamp();

  await setDoc(userShareRef, {
    token,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(doc(firestore, 'sharedCollections', token), {
    userId: user.uid,
    displayName: user.displayName ?? 'User',
    photoURL: user.photoURL ?? null,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  });

  await syncAllOwnedCardsToShared(user.uid, token);
  return token;
}

export async function getExistingShareToken(userId: string): Promise<string | null> {
  const firestore = getDb();
  const snapshot = await getDoc(doc(firestore, 'userShares', userId));
  if (!snapshot.exists()) return null;
  const token = snapshot.data().token;
  return typeof token === 'string' ? token : null;
}

export async function syncAllOwnedCardsToShared(userId: string, token: string): Promise<void> {
  const firestore = getDb();
  const source = await getDocs(collection(firestore, 'users', userId, 'ownedCards'));
  const targetCollection = collection(firestore, 'sharedCollections', token, 'ownedCards');

  const existing = await getDocs(targetCollection);
  const batch = writeBatch(firestore);

  const incomingIds = new Set<string>();
  source.forEach((snapshotDoc) => {
    incomingIds.add(snapshotDoc.id);
    batch.set(doc(firestore, 'sharedCollections', token, 'ownedCards', snapshotDoc.id), snapshotDoc.data());
  });

  existing.forEach((snapshotDoc) => {
    if (!incomingIds.has(snapshotDoc.id)) {
      batch.delete(doc(firestore, 'sharedCollections', token, 'ownedCards', snapshotDoc.id));
    }
  });

  batch.set(
    doc(firestore, 'sharedCollections', token),
    {
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

export async function mirrorOwnedCardToShared(token: string, cardId: string, data: {
  set: string;
  collectorNumber: string;
  name: string;
  ownedNonFoil: boolean;
  ownedFoil: boolean;
  quantityNonFoil: number;
  quantityFoil: number;
  addedAt?: unknown;
}): Promise<void> {
  const firestore = getDb();
  await setDoc(doc(firestore, 'sharedCollections', token, 'ownedCards', cardId), {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeMirroredOwnedCard(token: string, cardId: string): Promise<void> {
  const firestore = getDb();
  const batch = writeBatch(firestore);
  batch.delete(doc(firestore, 'sharedCollections', token, 'ownedCards', cardId));
  batch.set(
    doc(firestore, 'sharedCollections', token),
    { updatedAt: serverTimestamp() },
    { merge: true }
  );
  await batch.commit();
}
