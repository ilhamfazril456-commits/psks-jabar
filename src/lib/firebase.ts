import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific named Firestore database provisioned for this app
// Configured with persistent IndexedDB multi-tab cache for extreme read quota efficiency,
// fast offline loading, and seamless multi-device/multi-tab real-time sync.
function createFirestoreInstance() {
  const databaseId = (firebaseConfig as any).firestoreDatabaseId;
  if (typeof window !== 'undefined') {
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }, databaseId);
    } catch {
      return getFirestore(app, databaseId);
    }
  }
  return getFirestore(app, databaseId);
}

export const db = createFirestoreInstance();

export {
  OperationType,
  type FirestoreErrorInfo,
  handleFirestoreError,
  isQuotaError,
  isNetworkOrUnavailableError,
} from './firebaseErrors';


