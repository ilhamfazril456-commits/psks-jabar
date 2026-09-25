import { DocumentRepoItem } from '../types';
import { DEFAULT_DOCUMENT_REPOSITORY } from '../data/defaultDocuments';
import {
  subscribeToCollection,
  setFirestoreDoc,
  deleteFirestoreDoc,
  cleanFirestoreData,
  handleFirestoreError,
  OperationType,
} from './firestoreDataService';

const COLLECTION_NAME = 'document_repository';
const LOCAL_STORAGE_KEY = 'portal_documents_cache_v1';

/**
 * Real-time subscriber for Document Repository
 */
export function subscribeToDocuments(
  onUpdate: (documents: DocumentRepoItem[]) => void,
  onError?: (error: any) => void
): () => void {
  // Initial load from cache or defaults
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdate(parsed);
      } else {
        onUpdate(DEFAULT_DOCUMENT_REPOSITORY);
      }
    } else {
      onUpdate(DEFAULT_DOCUMENT_REPOSITORY);
    }
  } catch {
    onUpdate(DEFAULT_DOCUMENT_REPOSITORY);
  }

  const unsubscribe = subscribeToCollection(
    COLLECTION_NAME,
    (docs) => {
      if (!docs || docs.length === 0) {
        // First run: Seed Firestore with default 10 authentic documents
        seedDefaultDocumentsToFirestore().catch(() => {});
        onUpdate(DEFAULT_DOCUMENT_REPOSITORY);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DOCUMENT_REPOSITORY));
        } catch {}
        return;
      }

      const items: DocumentRepoItem[] = [];
      docs.forEach(({ id, data }) => {
        if (!data || typeof data !== 'object') return;
        items.push({
          id,
          title: (data as any).title || 'Dokumen Resmi',
          category: (data as any).category || 'regulasi_kemensos',
          nomorRegulasi: (data as any).nomorRegulasi || 'DINSOS/REG/2026',
          tahun: (data as any).tahun || 2026,
          tanggalDitetapkan: (data as any).tanggalDitetapkan || '',
          instansi: (data as any).instansi || 'Dinas Sosial Provinsi Jawa Barat',
          description: (data as any).description || '',
          fileSize: (data as any).fileSize || '1.5 MB',
          pageCount: (data as any).pageCount || 10,
          status: (data as any).status || 'PUBLIK',
          downloadCount: typeof (data as any).downloadCount === 'number' ? (data as any).downloadCount : 0,
          tags: Array.isArray((data as any).tags) ? (data as any).tags : ['Regulasi'],
          createdAt: (data as any).createdAt || new Date().toISOString(),
          updatedAt: (data as any).updatedAt || undefined,
          updatedBy: (data as any).updatedBy || undefined,
          pdfType: (data as any).pdfType || undefined,
          externalDownloadUrl: (data as any).externalDownloadUrl || undefined,
          fileType: (data as any).fileType || 'PDF',
        });
      });

      // Sort by creation date (newest first)
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      } catch {}

      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Save or update a document in Firestore & localStorage
 */
export async function saveDocumentToFirestore(item: DocumentRepoItem): Promise<boolean> {
  const cleanData = cleanFirestoreData({
    ...item,
    updatedAt: new Date().toISOString(),
  });

  try {
    // Optimistic local update
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const currentList: DocumentRepoItem[] = raw ? JSON.parse(raw) : DEFAULT_DOCUMENT_REPOSITORY;
      const index = currentList.findIndex((d) => d.id === item.id);
      let updatedList: DocumentRepoItem[];
      if (index >= 0) {
        updatedList = currentList.map((d) => (d.id === item.id ? { ...d, ...item } : d));
      } else {
        updatedList = [item, ...currentList];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {}

    await setFirestoreDoc(COLLECTION_NAME, item.id, cleanData, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${item.id}`);
    return false;
  }
}

/**
 * Delete a document from Firestore & localStorage
 */
export async function deleteDocumentFromFirestore(docId: string): Promise<boolean> {
  try {
    // Optimistic local update
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const currentList: DocumentRepoItem[] = JSON.parse(raw);
        const filtered = currentList.filter((d) => d.id !== docId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {}

    await deleteFirestoreDoc(COLLECTION_NAME, docId);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${docId}`);
    return false;
  }
}

/**
 * Increment download counter for a document
 */
export async function incrementDocumentDownloadCount(docId: string, currentCount: number = 0): Promise<void> {
  const newCount = currentCount + 1;
  try {
    // Optimistic local update
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const currentList: DocumentRepoItem[] = JSON.parse(raw);
        const updated = currentList.map((d) => (d.id === docId ? { ...d, downloadCount: newCount } : d));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}

    await setFirestoreDoc(COLLECTION_NAME, docId, { downloadCount: newCount }, { merge: true });
  } catch {
    // Silent fail for telemetry counter
  }
}

/**
 * Seed all default 10 authentic documents to Firestore
 */
export async function seedDefaultDocumentsToFirestore(): Promise<boolean> {
  try {
    for (const docItem of DEFAULT_DOCUMENT_REPOSITORY) {
      await setFirestoreDoc(COLLECTION_NAME, docItem.id, cleanFirestoreData(docItem), { merge: true });
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DOCUMENT_REPOSITORY));
    } catch {}
    return true;
  } catch (err) {
    console.error('Failed to seed default documents:', err);
    return false;
  }
}
