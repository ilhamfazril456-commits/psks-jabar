import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect to the specific named Firestore database provisioned for this app
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {},
    operationType,
    path,
  };

  const isQuota = isQuotaError(error);
  const isOffline = isNetworkOrUnavailableError(error);

  if (isQuota) {
    console.warn(`[Firestore Cache Fallback] Quota limit reached for operation '${operationType}' on '${path || 'unknown'}'. App is operating in Cache Mode.`);
  } else if (isOffline) {
    console.warn(`[Firestore Offline Mode] Backend temporarily unavailable for operation '${operationType}' on '${path || 'unknown'}'. App is operating in Offline Cache Mode.`);
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  return errInfo;
}

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'resource-exhausted' ||
    msg.includes('Quota exceeded') ||
    msg.includes('resource-exhausted') ||
    msg.includes('429') ||
    msg.toLowerCase().includes('quota')
  );
}

export function isNetworkOrUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code;
  return (
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    msg.toLowerCase().includes('could not reach cloud firestore backend') ||
    msg.toLowerCase().includes('connection failed') ||
    msg.toLowerCase().includes('unavailable') ||
    msg.toLowerCase().includes('offline')
  );
}

