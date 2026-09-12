import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific named Firestore database provisioned for this app
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export {
  OperationType,
  type FirestoreErrorInfo,
  handleFirestoreError,
  isQuotaError,
  isNetworkOrUnavailableError,
} from './firebaseErrors';


