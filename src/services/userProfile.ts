import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserProfile } from '../types/user';

function getDb() {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}

export async function createUserProfileIfNeeded(user: {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const ref = doc(getDb(), 'userProfiles', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? 'Uživatel',
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
    });
  } else {
    // Update displayName and photoURL if changed
    const data = snap.data();
    if (data.displayName !== user.displayName || data.photoURL !== user.photoURL) {
      await setDoc(ref, {
        displayName: user.displayName ?? 'Uživatel',
        photoURL: user.photoURL ?? null,
      }, { merge: true });
    }
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(getDb(), 'userProfiles', userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    userId,
    displayName: data.displayName ?? 'Uživatel',
    photoURL: data.photoURL ?? null,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}
