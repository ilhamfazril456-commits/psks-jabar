import { OperationType, handleFirestoreError, isQuotaError } from '../lib/firebaseErrors';

let firestoreModulePromise: Promise<{
  firestore: typeof import('firebase/firestore');
  db: import('firebase/firestore').Firestore;
}> | null = null;

export function getFirestoreModule() {
  if (!firestoreModulePromise) {
    firestoreModulePromise = Promise.all([
      import('firebase/firestore'),
      import('../lib/firebase')
    ]).then(([firestore, { db }]) => ({
      firestore,
      db,
    }));
  }
  return firestoreModulePromise;
}

export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

/**
 * Non-blocking dynamic listener for a single document
 */
export function subscribeToDoc(
  collectionName: string,
  docId: string,
  onNext: (data: any, exists: boolean) => void,
  onError?: (err: any) => void
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  getFirestoreModule().then(({ firestore, db }) => {
    if (cancelled) return;
    try {
      const docRef = firestore.doc(db, collectionName, docId);
      unsub = firestore.onSnapshot(
        docRef,
        (snap) => {
          if (!cancelled) {
            onNext(snap.data(), snap.exists());
          }
        },
        (err) => {
          if (!cancelled && onError) onError(err);
        }
      );
    } catch (e) {
      if (!cancelled && onError) onError(e);
    }
  }).catch((err) => {
    if (!cancelled && onError) onError(err);
  });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

/**
 * Non-blocking dynamic listener for a collection
 */
export function subscribeToCollection(
  collectionName: string,
  onNext: (docs: { id: string; data: any }[]) => void,
  onError?: (err: any) => void
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  getFirestoreModule().then(({ firestore, db }) => {
    if (cancelled) return;
    try {
      const collRef = firestore.collection(db, collectionName);
      unsub = firestore.onSnapshot(
        collRef,
        (snapshot) => {
          if (!cancelled) {
            const docs = snapshot.docs.map((d) => ({ id: d.id, data: d.data() }));
            onNext(docs);
          }
        },
        (err) => {
          if (!cancelled && onError) onError(err);
        }
      );
    } catch (e) {
      if (!cancelled && onError) onError(e);
    }
  }).catch((err) => {
    if (!cancelled && onError) onError(err);
  });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

/**
 * Persist document to Firestore with clean payload
 */
export async function setFirestoreDoc(
  collectionName: string,
  docId: string,
  data: Record<string, any>,
  options?: { merge?: boolean }
): Promise<void> {
  const { firestore, db } = await getFirestoreModule();
  const docRef = firestore.doc(db, collectionName, docId);
  const cleaned = cleanFirestoreData(data);
  if (options?.merge) {
    await firestore.setDoc(docRef, cleaned, { merge: true });
  } else {
    await firestore.setDoc(docRef, cleaned);
  }
}

/**
 * Delete document from Firestore
 */
export async function deleteFirestoreDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  const { firestore, db } = await getFirestoreModule();
  const docRef = firestore.doc(db, collectionName, docId);
  await firestore.deleteDoc(docRef);
}

/**
 * Check if backend server is responsive
 */
export async function checkServerConnectivity(): Promise<boolean> {
  try {
    const { firestore, db } = await getFirestoreModule();
    await firestore.getDocFromServer(firestore.doc(db, 'app_settings', 'global'));
    return true;
  } catch {
    return false;
  }
}

export { OperationType, handleFirestoreError, isQuotaError };
