import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from './db';

export async function createUserProfileIfNeeded(user: {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}): Promise<void> {
  const ref = doc(getDb(), 'userProfiles', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? 'User',
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
    });
  } else {
    // Update displayName and photoURL if changed
    const data = snap.data();
    if (data.displayName !== user.displayName || data.photoURL !== user.photoURL) {
      await setDoc(ref, {
        displayName: user.displayName ?? 'User',
        photoURL: user.photoURL ?? null,
      }, { merge: true });
    }
  }
}


