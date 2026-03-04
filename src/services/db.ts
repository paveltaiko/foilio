import { db } from '../config/firebase';

/**
 * Returns the Firestore database instance.
 * Throws if Firebase is not configured.
 */
export function getDb() {
  if (!db) throw new Error('Firebase is not configured');
  return db;
}
