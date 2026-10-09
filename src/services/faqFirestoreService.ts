import { PortalFaqItem } from '../types';
import { DEFAULT_PORTAL_FAQS } from '../data/defaultFaqs';
import { getFirestoreModule, cleanFirestoreData } from './firestoreDataService';
import { OperationType, handleFirestoreError } from '../lib/firebaseErrors';
import { supabase, safeSubscribeRealtime } from '../lib/supabase';

const TABLE_NAME = 'portal_faqs';
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
 * Realtime listener for FAQs powered by Supabase
 */
export function subscribeToFaqs(
  onUpdate: (faqs: PortalFaqItem[]) => void,
  activeOnlyOrError?: boolean | ((err: any) => void),
  onErrorCallback?: (err: any) => void
): () => void {
  const activeOnly = typeof activeOnlyOrError === 'boolean' ? activeOnlyOrError : false;
  const onError = typeof activeOnlyOrError === 'function' ? activeOnlyOrError : onErrorCallback;

  let isCancelled = false;

  // Emit current cached FAQs immediately
  const initialCached = getCachedFaqs();
  onUpdate(activeOnly ? initialCached.filter((f) => f.isActive) : initialCached);

  async function fetchFaqs() {
    let q = supabase.from(TABLE_NAME).select('*').order('order', { ascending: true });
    if (activeOnly) {
      q = q.eq('isActive', true);
    }
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) {
      onUpdate(DEFAULT_PORTAL_FAQS);
      setCachedFaqs(DEFAULT_PORTAL_FAQS);
      return;
    }

    const items: PortalFaqItem[] = data.map((row) => ({
      id: row.id,
      question: row.question || '',
      answer: row.answer || '',
      category: row.category || 'pilar_psks',
      order: typeof row.order === 'number' ? row.order : 99,
      isActive: row.isActive !== false,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString(),
      updatedBy: 'Superadmin',
    }));

    items.sort((a, b) => a.order - b.order);
    setCachedFaqs(items);
    if (!isCancelled) {
      onUpdate(items);
    }
  }

  fetchFaqs().catch((err) => {
    if (!isCancelled) {
      if (onError) onError(err);
      onUpdate(getCachedFaqs());
    }
  });

  // Realtime channel (with WebSocket safe guard)
  const channelName = `sub_faqs_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE_NAME },
      () => {
        if (!isCancelled) fetchFaqs().catch(() => {});
      }
    );

  const unsubChannel = safeSubscribeRealtime(channel);

  return () => {
    isCancelled = true;
    unsubChannel();
  };
}

/**
 * Save / Update single FAQ item
 */
export async function saveFaqToFirestore(faq: PortalFaqItem): Promise<boolean> {
  const docId = faq.id || `faq-${Date.now()}`;
  const payload = {
    id: docId,
    question: faq.question.trim(),
    answer: faq.answer.trim(),
    category: faq.category || 'pilar_psks',
    order: Number(faq.order) || 1,
    isActive: Boolean(faq.isActive),
    createdAt: faq.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase.from(TABLE_NAME).upsert(payload);
  if (error) {
    throw new Error(error.message);
  }

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

  // Passive cold backup to Firestore
  try {
    const { firestore, db } = await getFirestoreModule();
    await firestore.setDoc(firestore.doc(db, TABLE_NAME, docId), cleanFirestoreData(payload), { merge: true });
  } catch {}

  return true;
}

/**
 * Delete single FAQ item
 */
export async function deleteFaqFromFirestore(faqId: string): Promise<boolean> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', faqId);
  if (error) throw new Error(error.message);

  const current = getCachedFaqs().filter((i) => i.id !== faqId);
  setCachedFaqs(current);

  // Passive cold backup to Firestore
  try {
    const { firestore, db } = await getFirestoreModule();
    await firestore.deleteDoc(firestore.doc(db, TABLE_NAME, faqId));
  } catch {}

  return true;
}

/**
 * Seed or restore default FAQs
 */
export async function seedDefaultFaqsToFirestore(): Promise<boolean> {
  const list = DEFAULT_PORTAL_FAQS.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    order: faq.order,
    isActive: faq.isActive,
    createdAt: faq.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const { error } = await supabase.from(TABLE_NAME).upsert(list);
  if (error) throw new Error(error.message);

  setCachedFaqs([...DEFAULT_PORTAL_FAQS]);
  return true;
}
