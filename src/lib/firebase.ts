import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton pattern)
export const firebaseApp = !getApps().length ? initializeApp(config) : getApp();

// Initialize Firestore with robust multi-tab and offline persistence
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, config.firestoreDatabaseId);

export default db;
