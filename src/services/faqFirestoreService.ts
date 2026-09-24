import { PortalFaqItem } from '../types';
import { DEFAULT_PORTAL_FAQS } from '../data/defaultFaqs';
import { getFirestoreModule, cleanFirestoreData } from './firestoreDataService';
import { OperationType, handleFirestoreError } from '../lib/firebaseErrors';

const COLLECTION_NAME = 'portal_faqs';
const LOCAL_STORAGE_KEY = 'portal_faqs_cache_v1';

// In-memory cache
let inMemoryFaqs: PortalFaqItem[] = [];

/**
 * Get initial cached FAQs synchronously for immediate UI rendering
 */
export function getCachedFaqs(): PortalFaqItem[] {
  if (inMemoryFaqs.length > 0) {
    return inMemoryFaqs;
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryFaqs = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading portal FAQs from localStorage cache', e);
  }
  inMemoryFaqs = [...DEFAULT_PORTAL_FAQS];
  return inMemoryFaqs;
}

/**
 * Update local cache
 */
function setCachedFaqs(faqs: PortalFaqItem[]) {
  inMemoryFaqs = faqs;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(faqs));
  } catch (e) {
    // Ignore storage quota errors
  }
}

/**
 * Realtime listener for FAQs from Firestore
 */
export function subscribeToFaqs(
  onUpdate: (faqs: PortalFaqItem[]) => void,
  onError?: (err: any) => void
): () => void {
  let unsub: (() => void) | null = null;
  let isCancelled = false;

  // Emit current cached FAQs immediately
  onUpdate(getCachedFaqs());

  getFirestoreModule().then(({ firestore, db }) => {
    if (isCancelled) return;

    try {
      const colRef = firestore.collection(db, COLLECTION_NAME);
      unsub = firestore.onSnapshot(
        colRef,
        (snapshot) => {
          if (isCancelled) return;
          if (snapshot.empty) {
            // If collection is empty in Firestore, populate with default FAQs in background if needed
            onUpdate(DEFAULT_PORTAL_FAQS);
            setCachedFaqs(DEFAULT_PORTAL_FAQS);
            return;
          }

          const items: PortalFaqItem[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
            items.push({
              id: doc.id,
              question: data.question || '',
              answer: data.answer || '',
              category: data.category || 'pilar_psks',
              order: typeof data.order === 'number' ? data.order : 99,
              isActive: data.isActive !== false,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              updatedBy: data.updatedBy || 'Superadmin',
            });
          });

          // Sort by order ascending
          items.sort((a, b) => a.order - b.order);

          setCachedFaqs(items);
          onUpdate(items);
        },
        (error) => {
          if (isCancelled) return;
          handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
          if (onError) onError(error);
          // Fallback to cache on error
          onUpdate(getCachedFaqs());
        }
      );
    } catch (err) {
      if (isCancelled) return;
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      if (onError) onError(err);
      onUpdate(getCachedFaqs());
    }
  });

  return () => {
    isCancelled = true;
    if (unsub) {
      unsub();
    }
  };
}

/**
 * Save / Update single FAQ item
 */
export async function saveFaqToFirestore(faq: PortalFaqItem): Promise<boolean> {
  try {
    const { firestore, db } = await getFirestoreModule();
    const docId = faq.id || `faq-${Date.now()}`;
    const payload = cleanFirestoreData({
      id: docId,
      question: faq.question.trim(),
      answer: faq.answer.trim(),
      category: faq.category || 'pilar_psks',
      order: Number(faq.order) || 1,
      isActive: Boolean(faq.isActive),
      createdAt: faq.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: faq.updatedBy || 'Superadmin',
    });

    await firestore.setDoc(firestore.doc(db, COLLECTION_NAME, docId), payload, { merge: true });

    // Update in-memory cache
    const current = getCachedFaqs();
    const idx = current.findIndex((i) => i.id === docId);
    let updated: PortalFaqItem[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...payload } as PortalFaqItem;
    } else {
      updated = [...current, payload as PortalFaqItem];
    }
    updated.sort((a, b) => a.order - b.order);
    setCachedFaqs(updated);

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COLLECTION_NAME}/${faq.id}`);
    throw error;
  }
}

/**
 * Delete single FAQ item
 */
export async function deleteFaqFromFirestore(faqId: string): Promise<boolean> {
  try {
    const { firestore, db } = await getFirestoreModule();
    await firestore.deleteDoc(firestore.doc(db, COLLECTION_NAME, faqId));

    const current = getCachedFaqs().filter((i) => i.id !== faqId);
    setCachedFaqs(current);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${faqId}`);
    throw error;
  }
}

/**
 * Seed or restore default FAQs into Firestore
 */
export async function seedDefaultFaqsToFirestore(): Promise<boolean> {
  try {
    const { firestore, db } = await getFirestoreModule();
    const batch = firestore.writeBatch(db);

    DEFAULT_PORTAL_FAQS.forEach((faq) => {
      const docRef = firestore.doc(db, COLLECTION_NAME, faq.id);
      batch.set(docRef, cleanFirestoreData(faq), { merge: true });
    });

    await batch.commit();
    setCachedFaqs([...DEFAULT_PORTAL_FAQS]);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    throw error;
  }
}
