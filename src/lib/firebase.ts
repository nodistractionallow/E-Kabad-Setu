import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton pattern)
export const firebaseApp = !getApps().length ? initializeApp(config) : getApp();

// Initialize Firestore with robust multi-tab and offline persistence fallback
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, config.firestoreDatabaseId);
} catch {
  firestoreInstance = getFirestore(firebaseApp, config.firestoreDatabaseId);
}

export const db = firestoreInstance;
export default db;
