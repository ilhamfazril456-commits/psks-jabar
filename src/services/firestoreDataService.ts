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
    const val = obj[key];
    if (val !== undefined) {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (key === 'nama' && trimmed.length > 900) {
          cleaned[key] = trimmed.slice(0, 900);
        } else if (key === 'wilayah' && trimmed.length > 190) {
          cleaned[key] = trimmed.slice(0, 190);
        } else {
          cleaned[key] = trimmed;
        }
      } else {
        cleaned[key] = val;
      }
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
 * Interface parameter kueri terindeks Firestore
 */
export interface FirestoreQueryConstraint {
  field: string;
  op: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'array-contains-any';
  value: any;
}

export interface FirestoreOrderConstraint {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface IndexedQueryOptions {
  wheres?: FirestoreQueryConstraint[];
  orders?: FirestoreOrderConstraint[];
  limitCount?: number;
}

/**
 * Non-blocking dynamic listener for an indexed composite query
 * Automatically builds query with where, orderBy, and limit
 * Has robust fallback to collection listener if index is still building in Firebase Console
 */
export function subscribeToIndexedQuery(
  collectionName: string,
  options: IndexedQueryOptions,
  onNext: (docs: { id: string; data: any }[]) => void,
  onError?: (err: any) => void
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  getFirestoreModule().then(({ firestore, db }) => {
    if (cancelled) return;
    try {
      const collRef = firestore.collection(db, collectionName);
      const constraints: any[] = [];

      // Build WHERE constraints
      if (options.wheres && options.wheres.length > 0) {
        options.wheres.forEach((w) => {
          if (w.value !== undefined) {
            constraints.push(firestore.where(w.field, w.op, w.value));
          }
        });
      }

      // Build ORDER BY constraints
      if (options.orders && options.orders.length > 0) {
        options.orders.forEach((o) => {
          constraints.push(firestore.orderBy(o.field, o.direction || 'asc'));
        });
      }

      // Build LIMIT
      if (typeof options.limitCount === 'number' && options.limitCount > 0) {
        constraints.push(firestore.limit(options.limitCount));
      }

      const q = constraints.length > 0 ? firestore.query(collRef, ...constraints) : collRef;

      unsub = firestore.onSnapshot(
        q as any,
        (snapshot) => {
          if (!cancelled) {
            const docs = (snapshot as any).docs.map((d: any) => ({ id: d.id, data: d.data() }));
            onNext(docs);
          }
        },
        (err) => {
          // If index error occurs (e.g. requires index during initial build), fallback gracefully to base collection
          const errMsg = err?.message || String(err);
          if (errMsg.includes('requires an index') || errMsg.includes('failed-precondition')) {
            console.warn(`[Firestore Indexing Alert] Composite query for ${collectionName} requires index build. Using defensive fallback to full sync.`, errMsg);
            if (!cancelled) {
              unsub = subscribeToCollection(collectionName, onNext, onError);
            }
          } else {
            if (!cancelled && onError) onError(err);
          }
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
 * Fetch one-off indexed query from Firestore
 */
export async function queryFirestoreCollection(
  collectionName: string,
  options: IndexedQueryOptions
): Promise<{ id: string; data: any }[]> {
  try {
    const { firestore, db } = await getFirestoreModule();
    const collRef = firestore.collection(db, collectionName);
    const constraints: any[] = [];

    if (options.wheres) {
      options.wheres.forEach((w) => {
        if (w.value !== undefined) {
          constraints.push(firestore.where(w.field, w.op, w.value));
        }
      });
    }

    if (options.orders) {
      options.orders.forEach((o) => {
        constraints.push(firestore.orderBy(o.field, o.direction || 'asc'));
      });
    }

    if (typeof options.limitCount === 'number' && options.limitCount > 0) {
      constraints.push(firestore.limit(options.limitCount));
    }

    const q = constraints.length > 0 ? firestore.query(collRef, ...constraints) : collRef;
    const snap = await firestore.getDocs(q as any);
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  } catch (err) {
    console.warn(`Error running query on ${collectionName}:`, err);
    return [];
  }
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
 * Persist multiple documents to Firestore using writeBatch in chunks
 */
export async function batchSetFirestoreDocs(
  collectionName: string,
  docs: Array<{ id: string; data: Record<string, any> }>
): Promise<void> {
  const { firestore, db } = await getFirestoreModule();
  const CHUNK_SIZE = 450;
  for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
    const chunk = docs.slice(i, i + CHUNK_SIZE);
    const batch = firestore.writeBatch(db);
    for (const item of chunk) {
      const docRef = firestore.doc(db, collectionName, item.id);
      batch.set(docRef, cleanFirestoreData(item.data), { merge: true });
    }
    await batch.commit();
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
 * Delete multiple documents from Firestore using writeBatch in chunks
 */
export async function batchDeleteFirestoreDocs(
  collectionName: string,
  docIds: string[]
): Promise<void> {
  const { firestore, db } = await getFirestoreModule();
  const CHUNK_SIZE = 450;
  for (let i = 0; i < docIds.length; i += CHUNK_SIZE) {
    const chunk = docIds.slice(i, i + CHUNK_SIZE);
    const batch = firestore.writeBatch(db);
    for (const id of chunk) {
      const docRef = firestore.doc(db, collectionName, id);
      batch.delete(docRef);
    }
    await batch.commit();
  }
}

/**
 * Fetch a single document directly from Firestore
 */
export async function getFirestoreDoc(
  collectionName: string,
  docId: string
): Promise<{ exists: boolean; data: any }> {
  try {
    const { firestore, db } = await getFirestoreModule();
    const docRef = firestore.doc(db, collectionName, docId);
    const snap = await firestore.getDoc(docRef);
    return { exists: snap.exists(), data: snap.data() };
  } catch (err) {
    return { exists: false, data: null };
  }
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
