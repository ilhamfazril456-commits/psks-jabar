import { PSKSDataRecord } from '../types';

const DB_NAME = 'psks_portal_db';
const STORE_NAME = 'pillar_records';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Persists all pillar records into IndexedDB asynchronously without blocking UI or hitting 5MB limit.
 */
export async function setCachedPillarData(data: Record<string, PSKSDataRecord[]>): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, 'all_pillar_data');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB set cache warning:', err);
  }
}

/**
 * Retrieves cached pillar records from IndexedDB.
 */
export async function getCachedPillarData(): Promise<Record<string, PSKSDataRecord[]> | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get('all_pillar_data');

      request.onsuccess = () => {
        const val = request.result;
        if (val && typeof val === 'object' && Object.keys(val).length > 0) {
          resolve(val);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('IndexedDB get cache warning:', err);
    return null;
  }
}
