import { supabase, safeSubscribeRealtime } from '../lib/supabase';
import { OperationType, handleFirestoreError, isQuotaError } from '../lib/firebaseErrors';

let firestoreModulePromise: Promise<{
  firestore: typeof import('firebase/firestore');
  db: import('firebase/firestore').Firestore;
}> | null = null;

export function getFirestoreModule() {
  if (!firestoreModulePromise) {
    firestoreModulePromise = Promise.all([
      import('firebase/firestore'),
      import('../lib/firebase'),
    ]).then(([firestore, { db }]) => ({
      firestore,
      db,
    }));
  }
  return firestoreModulePromise;
}

export function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item));
  }
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined && typeof val !== 'function') {
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (key === 'nama' && trimmed.length > 900) {
          cleaned[key] = trimmed.slice(0, 900);
        } else if (key === 'wilayah' && trimmed.length > 190) {
          cleaned[key] = trimmed.slice(0, 190);
        } else {
          cleaned[key] = trimmed;
        }
      } else if (Array.isArray(val)) {
        cleaned[key] = val
          .filter((item) => item !== undefined)
          .map((item) => (typeof item === 'object' && item !== null ? cleanFirestoreData(item) : item));
      } else if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
        cleaned[key] = cleanFirestoreData(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned;
}

/**
 * Mapping helper: converts Supabase table row to frontend Document object
 */
export function mapSupabaseRowToDoc(collectionName: string, row: any): any {
  if (!row) return null;

  if (collectionName === 'psks_records') {
    const restData = row.data && typeof row.data === 'object' ? row.data : {};
    return {
      id: row.id,
      ...restData,
      pillarId: row.pillarId || restData.pillarId || 'peksos',
      wilayah: row.wilayah || restData.wilayah || '',
      nama: row.nama || restData.nama || '',
      status: row.status || restData.status || '',
      kec: row.kec || restData.kec || '',
      kelDesa: row.kelDesa || restData.kelDesa || '',
      orderIndex: typeof row.orderIndex === 'number' ? row.orderIndex : restData.orderIndex || 0,
      createdAt: row.createdAt || restData.createdAt || '',
      updatedAt: row.updatedAt || restData.updatedAt || '',
    };
  }

  if (collectionName === 'admin_accounts') {
    const restData = row.data && typeof row.data === 'object' ? row.data : {};
    return {
      id: row.id,
      ...restData,
      username: row.username || restData.username || row.id,
      namaAdmin: row.namaAdmin || restData.namaAdmin || '',
      role: row.role || restData.role || 'admin',
      statusActive: row.statusActive || restData.statusActive || 'SAH_TERDAFTAR',
      wilayahTugas: row.wilayahTugas || restData.wilayahTugas || '',
      passwordHash: row.passwordHash || restData.passwordHash || '',
      sessionToken: row.sessionToken || restData.sessionToken || '',
    };
  }

  if (collectionName === 'psks_regional_logos') {
    return {
      id: row.id,
      regionName: row.regionName || row.id,
      logo: row.logo || '',
      updatedAt: row.updatedAt || '',
    };
  }

  if (collectionName === 'system_logs') {
    const restData = row.data && typeof row.data === 'object' ? row.data : {};
    return {
      id: row.id,
      ...restData,
      actorName: row.actorName || restData.actorName || '',
      actorRole: row.actorRole || restData.actorRole || '',
      actorWilayah: row.actorWilayah || restData.actorWilayah || '',
      actionType: row.actionType || restData.actionType || '',
      category: row.category || restData.category || '',
      timestamp: row.timestamp || restData.timestamp || '',
      createdAt: row.createdAt || restData.createdAt || '',
      details: row.details || restData.details || '',
    };
  }

  if (collectionName === 'portal_faqs') {
    return {
      id: row.id,
      question: row.question || '',
      answer: row.answer || '',
      category: row.category || '',
      order: typeof row.order === 'number' ? row.order : 0,
      isActive: row.isActive !== false,
      createdAt: row.createdAt || '',
      updatedAt: row.updatedAt || '',
    };
  }

  if (collectionName === 'app_settings' || collectionName === 'psks_records_meta' || collectionName === 'psks_app_settings') {
    return row.data || {};
  }

  const restData = row.data && typeof row.data === 'object' ? row.data : {};
  return {
    id: row.id,
    ...row,
    ...restData,
  };
}

/**
 * Mapping helper: converts frontend Document object to Supabase table row
 */
export function mapDocToSupabaseRow(collectionName: string, docId: string, data: Record<string, any>): Record<string, any> {
  const cleaned = cleanFirestoreData(data);

  if (collectionName === 'psks_records') {
    const { id: _id, pillarId, wilayah, nama, status, kec, kelDesa, orderIndex, createdAt, updatedAt, ...rest } = cleaned;
    return {
      id: docId,
      pillarId: pillarId || '',
      wilayah: wilayah || '',
      nama: nama || rest.namaKarangTaruna || rest.namaLks || rest.namaPsm || '',
      status: status || '',
      kec: kec || '',
      kelDesa: kelDesa || '',
      orderIndex: typeof orderIndex === 'number' ? orderIndex : 0,
      createdAt: createdAt || '',
      updatedAt: updatedAt || new Date().toISOString(),
      data: rest,
    };
  }

  if (collectionName === 'admin_accounts') {
    const { id: _id, username, namaAdmin, role, statusActive, wilayahTugas, passwordHash, sessionToken, ...rest } = cleaned;
    return {
      id: docId,
      username: username || docId,
      namaAdmin: namaAdmin || '',
      role: role || 'admin',
      statusActive: statusActive || 'SAH_TERDAFTAR',
      wilayahTugas: wilayahTugas || '',
      passwordHash: passwordHash || '',
      sessionToken: sessionToken || '',
      data: rest,
    };
  }

  if (collectionName === 'psks_regional_logos') {
    return {
      id: docId,
      regionName: cleaned.regionName || docId,
      logo: cleaned.logo || '',
      updatedAt: cleaned.updatedAt || new Date().toISOString(),
    };
  }

  if (collectionName === 'system_logs') {
    const { id: _id, actorName, actorRole, actorWilayah, actionType, category, timestamp, createdAt, details, ...rest } = cleaned;
    return {
      id: docId,
      actorName: actorName || '',
      actorRole: actorRole || '',
      actorWilayah: actorWilayah || '',
      actionType: actionType || '',
      category: category || '',
      timestamp: timestamp || '',
      createdAt: createdAt || new Date().toISOString(),
      details: typeof details === 'string' ? details : JSON.stringify(details || {}),
      data: rest,
    };
  }

  if (collectionName === 'portal_faqs') {
    return {
      id: docId,
      question: cleaned.question || '',
      answer: cleaned.answer || '',
      category: cleaned.category || '',
      order: typeof cleaned.order === 'number' ? cleaned.order : 0,
      isActive: cleaned.isActive !== false,
      createdAt: cleaned.createdAt || '',
      updatedAt: cleaned.updatedAt || new Date().toISOString(),
    };
  }

  if (collectionName === 'registration_submissions') {
    const { id: _id, nama, nik, hp, wilayah, kec, pillarId, status, submittedAt, recordData, ...rest } = cleaned;
    return {
      id: docId,
      nama: nama || '',
      nik: nik || '',
      hp: hp || '',
      wilayah: wilayah || '',
      kec: kec || '',
      pillarId: pillarId || '',
      status: status || 'PENDING',
      submittedAt: submittedAt || new Date().toISOString(),
      recordData: recordData || {},
      data: rest,
    };
  }

  if (collectionName === 'task_items') {
    const { id: _id, title, description, pillarId, status, priority, targetWilayah, assignedTo, deadline, progressPercent, ...rest } = cleaned;
    return {
      id: docId,
      title: title || '',
      description: description || '',
      pillarId: pillarId || '',
      status: status || '',
      priority: priority || '',
      targetWilayah: targetWilayah || '',
      assignedTo: assignedTo || '',
      deadline: deadline || '',
      progressPercent: progressPercent || 0,
      data: rest,
    };
  }

  if (collectionName === 'app_settings' || collectionName === 'psks_records_meta' || collectionName === 'psks_app_settings') {
    return {
      id: docId,
      data: cleaned,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: docId,
    data: cleaned,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Passive, silent cold-backup write to Firestore (completely non-blocking)
 */
async function passiveFirestoreBackup(
  action: 'set' | 'delete' | 'batchSet' | 'batchDelete',
  collectionName: string,
  docIdOrDocs: any,
  dataOrMerge?: any
) {
  try {
    const { firestore, db } = await getFirestoreModule();
    if (action === 'set') {
      const docRef = firestore.doc(db, collectionName, docIdOrDocs);
      await firestore.setDoc(docRef, cleanFirestoreData(dataOrMerge), { merge: true });
    } else if (action === 'delete') {
      const docRef = firestore.doc(db, collectionName, docIdOrDocs);
      await firestore.deleteDoc(docRef);
    } else if (action === 'batchSet') {
      const batch = firestore.writeBatch(db);
      for (const item of (docIdOrDocs as Array<{ id: string; data: any }>)) {
        const docRef = firestore.doc(db, collectionName, item.id);
        batch.set(docRef, cleanFirestoreData(item.data), { merge: true });
      }
      await batch.commit();
    } else if (action === 'batchDelete') {
      const batch = firestore.writeBatch(db);
      for (const id of (docIdOrDocs as string[])) {
        const docRef = firestore.doc(db, collectionName, id);
        batch.delete(docRef);
      }
      await batch.commit();
    }
  } catch {
    // Non-blocking: Firestore is purely cold backup
  }
}

/**
 * Non-blocking dynamic listener for a single document powered by Supabase with Firestore fallback
 */
export function subscribeToDoc(
  collectionName: string,
  docId: string,
  onNext: (data: any, exists: boolean) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;
  let lastDataHash = '';

  const loadFromFirestoreFallback = async () => {
    try {
      const { firestore, db } = await getFirestoreModule();
      const docRef = firestore.doc(db, collectionName, docId);
      const snap = await firestore.getDoc(docRef);
      if (isCancelled) return;
      if (snap.exists()) {
        const d = snap.data();
        const hash = JSON.stringify(d);
        if (hash !== lastDataHash) {
          lastDataHash = hash;
          onNext(d, true);
        }
      } else {
        if (lastDataHash !== '__NULL__') {
          lastDataHash = '__NULL__';
          onNext(null, false);
        }
      }
    } catch (fErr) {
      if (!isCancelled && onError) onError(fErr);
    }
  };

  // 1. Fetch from Supabase
  const loadFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from(collectionName)
        .select('*')
        .eq('id', docId)
        .maybeSingle();

      if (isCancelled) return;
      if (error) {
        await loadFromFirestoreFallback();
        return;
      }
      if (data) {
        const mapped = mapSupabaseRowToDoc(collectionName, data);
        const hash = JSON.stringify(mapped);
        if (hash !== lastDataHash) {
          lastDataHash = hash;
          onNext(mapped, true);
        }
      } else {
        if (lastDataHash !== '__NULL__') {
          lastDataHash = '__NULL__';
          onNext(null, false);
        }
      }
    } catch {
      if (!isCancelled) {
        await loadFromFirestoreFallback();
      }
    }
  };

  // Immediate initial load
  loadFromSupabase();

  // 2. High-speed adaptive polling interval (guarantees sync across multiple devices even without websocket publication)
  // Check every 3 seconds for critical app_settings/security signals, 5 seconds for others
  const pollIntervalMs = collectionName === 'app_settings' || collectionName === 'security_signals' ? 3000 : 5000;
  const pollTimer = setInterval(() => {
    if (!isCancelled && typeof document !== 'undefined' && !document.hidden) {
      loadFromSupabase();
    }
  }, pollIntervalMs);

  // 3. Realtime listener via Supabase Channels (with graceful WebSocket fallback)
  const channelName = `sub_${collectionName}_${docId}_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: collectionName,
        filter: `id=eq.${docId}`,
      },
      (payload) => {
        if (isCancelled) return;
        if (payload.eventType === 'DELETE') {
          lastDataHash = '__NULL__';
          onNext(null, false);
        } else if (payload.new) {
          const mapped = mapSupabaseRowToDoc(collectionName, payload.new);
          lastDataHash = JSON.stringify(mapped);
          onNext(mapped, true);
        }
      }
    );

  const unsubChannel = safeSubscribeRealtime(channel);

  return () => {
    isCancelled = true;
    clearInterval(pollTimer);
    unsubChannel();
  };
}

/**
 * High-speed concurrent loader for collections (supports loading all 21.963 records in ~2 seconds)
 */
async function loadAllSupabaseCollectionRows(collectionName: string): Promise<any[]> {
  if (collectionName === 'psks_records') {
    const PAGE_SIZE = 1000;
    const TOTAL_ESTIMATE = 23000;
    const pageRanges: number[] = [];

    for (let from = 0; from < TOTAL_ESTIMATE; from += PAGE_SIZE) {
      pageRanges.push(from);
    }

    try {
      const results = await Promise.all(
        pageRanges.map(async (from) => {
          const { data } = await supabase
            .from('psks_records')
            .select('id, pillarId, wilayah, nama, status, kec, kelDesa, orderIndex, createdAt, updatedAt, data')
            .range(from, from + PAGE_SIZE - 1);
          return data || [];
        })
      );

      const allRows: any[] = [];
      for (const chunk of results) {
        if (Array.isArray(chunk)) {
          allRows.push(...chunk);
        }
      }
      if (allRows.length > 0) return allRows;
    } catch (err) {
      console.warn('Supabase records chunk load notice:', err);
    }
  }

  try {
    const { data, error } = await supabase.from(collectionName).select('*');
    if (!error && data) return data;
  } catch {}

  // Fallback to Firestore if table doesn't exist in Supabase
  try {
    const { firestore, db } = await getFirestoreModule();
    const snap = await firestore.getDocs(firestore.collection(db, collectionName));
    return snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data(), ...docSnap.data() }));
  } catch {
    return [];
  }
}

/**
 * Non-blocking dynamic listener for a collection powered by Supabase Realtime
 */
export function subscribeToCollection(
  collectionName: string,
  onNext: (docs: { id: string; data: any }[]) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;
  let debounceTimer: any = null;

  const refreshCollection = () => {
    if (isCancelled) return;
    loadAllSupabaseCollectionRows(collectionName)
      .then((rows) => {
        if (isCancelled) return;
        const docs = rows.map((row) => ({
          id: row.id,
          data: mapSupabaseRowToDoc(collectionName, row),
        }));
        onNext(docs);
      })
      .catch((err) => {
        if (!isCancelled && onError) onError(err);
      });
  };

  // 1. Initial bulk fetch
  refreshCollection();

  // 2. Realtime listener with debounce protection & WebSocket safe guard
  const channelName = `sub_col_${collectionName}_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: collectionName,
      },
      () => {
        if (isCancelled) return;
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          refreshCollection();
        }, 1200);
      }
    );

  const unsubChannel = safeSubscribeRealtime(channel);

  return () => {
    isCancelled = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubChannel();
  };
}

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
 * Non-blocking dynamic listener for an indexed composite query powered by Supabase with Firestore fallback
 */
export function subscribeToIndexedQuery(
  collectionName: string,
  options: IndexedQueryOptions,
  onNext: (docs: { id: string; data: any }[]) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;

  async function executeQuery() {
    try {
      let q = supabase.from(collectionName).select('*');

      if (options.wheres && options.wheres.length > 0) {
        for (const w of options.wheres) {
          if (w.value === undefined) continue;
          if (w.op === '==') q = q.eq(w.field, w.value);
          else if (w.op === '!=') q = q.neq(w.field, w.value);
          else if (w.op === '<') q = q.lt(w.field, w.value);
          else if (w.op === '<=') q = q.lte(w.field, w.value);
          else if (w.op === '>') q = q.gt(w.field, w.value);
          else if (w.op === '>=') q = q.gte(w.field, w.value);
          else if (w.op === 'in' && Array.isArray(w.value)) q = q.in(w.field, w.value);
        }
      }

      if (options.orders && options.orders.length > 0) {
        for (const o of options.orders) {
          q = q.order(o.field, { ascending: o.direction !== 'desc' });
        }
      }

      if (typeof options.limitCount === 'number' && options.limitCount > 0) {
        q = q.limit(options.limitCount);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        data: mapSupabaseRowToDoc(collectionName, row),
      }));
    } catch {
      // Fallback to Firestore
      try {
        const { firestore, db } = await getFirestoreModule();
        let fQuery = firestore.query(firestore.collection(db, collectionName));
        if (options.wheres && options.wheres.length > 0) {
          for (const w of options.wheres) {
            if (w.value === undefined) continue;
            fQuery = firestore.query(fQuery, firestore.where(w.field, w.op as any, w.value));
          }
        }
        if (options.orders && options.orders.length > 0) {
          for (const o of options.orders) {
            fQuery = firestore.query(fQuery, firestore.orderBy(o.field, o.direction || 'asc'));
          }
        }
        if (typeof options.limitCount === 'number' && options.limitCount > 0) {
          fQuery = firestore.query(fQuery, firestore.limit(options.limitCount));
        }
        const snap = await firestore.getDocs(fQuery);
        return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
      } catch {
        return [];
      }
    }
  }

  let lastDocsHash = '';

  const runQuery = () => {
    executeQuery()
      .then((docs) => {
        if (isCancelled) return;
        const hash = `${docs.length}_${docs.slice(0, 3).map((d: any) => d.id).join('_')}_${docs.slice(-3).map((d: any) => d.id).join('_')}`;
        if (hash !== lastDocsHash) {
          lastDocsHash = hash;
          onNext(docs);
        }
      })
      .catch((err) => {
        if (!isCancelled && onError) onError(err);
      });
  };

  runQuery();

  // Periodic fallback poll every 8s when tab is active (ensures other devices see new registrations/messages)
  const pollTimer = setInterval(() => {
    if (!isCancelled && typeof document !== 'undefined' && !document.hidden) {
      runQuery();
    }
  }, 8000);

  const channelName = `sub_idx_${collectionName}_${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: collectionName },
      () => {
        if (isCancelled) return;
        runQuery();
      }
    );

  const unsubChannel = safeSubscribeRealtime(channel);

  return () => {
    isCancelled = true;
    clearInterval(pollTimer);
    unsubChannel();
  };
}

/**
 * Fetch one-off indexed query from Supabase with Firestore fallback
 */
export async function queryFirestoreCollection(
  collectionName: string,
  options: IndexedQueryOptions
): Promise<{ id: string; data: any }[]> {
  try {
    let q = supabase.from(collectionName).select('*');

    if (options.wheres && options.wheres.length > 0) {
      for (const w of options.wheres) {
        if (w.value === undefined) continue;
        if (w.op === '==') q = q.eq(w.field, w.value);
        else if (w.op === '!=') q = q.neq(w.field, w.value);
        else if (w.op === '<') q = q.lt(w.field, w.value);
        else if (w.op === '<=') q = q.lte(w.field, w.value);
        else if (w.op === '>') q = q.gt(w.field, w.value);
        else if (w.op === '>=') q = q.gte(w.field, w.value);
        else if (w.op === 'in' && Array.isArray(w.value)) q = q.in(w.field, w.value);
      }
    }

    if (options.orders && options.orders.length > 0) {
      for (const o of options.orders) {
        q = q.order(o.field, { ascending: o.direction !== 'desc' });
      }
    }

    if (typeof options.limitCount === 'number' && options.limitCount > 0) {
      q = q.limit(options.limitCount);
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      data: mapSupabaseRowToDoc(collectionName, row),
    }));
  } catch {
    // Fallback to Firestore
    try {
      const { firestore, db } = await getFirestoreModule();
      let fQuery = firestore.query(firestore.collection(db, collectionName));
      if (options.wheres && options.wheres.length > 0) {
        for (const w of options.wheres) {
          if (w.value === undefined) continue;
          fQuery = firestore.query(fQuery, firestore.where(w.field, w.op as any, w.value));
        }
      }
      if (options.orders && options.orders.length > 0) {
        for (const o of options.orders) {
          fQuery = firestore.query(fQuery, firestore.orderBy(o.field, o.direction || 'asc'));
        }
      }
      if (typeof options.limitCount === 'number' && options.limitCount > 0) {
        fQuery = firestore.query(fQuery, firestore.limit(options.limitCount));
      }
      const snap = await firestore.getDocs(fQuery);
      return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
    } catch {
      return [];
    }
  }
}

/**
 * Persist document to Supabase (and passive non-blocking Firestore backup)
 */
export async function setFirestoreDoc(
  collectionName: string,
  docId: string,
  data: Record<string, any>,
  _options?: { merge?: boolean }
): Promise<void> {
  let supabaseOk = false;
  let supabaseError: any = null;
  try {
    const row = mapDocToSupabaseRow(collectionName, docId, data);
    const { error } = await supabase.from(collectionName).upsert(row);
    if (!error) {
      supabaseOk = true;
    } else {
      supabaseError = error;
    }
  } catch (sbErr) {
    supabaseError = sbErr;
  }

  // If Supabase write failed or table doesn't exist, fallback to Firestore write
  if (!supabaseOk) {
    try {
      const { firestore, db } = await getFirestoreModule();
      const docRef = firestore.doc(db, collectionName, docId);
      await firestore.setDoc(docRef, cleanFirestoreData(data), { merge: true });
    } catch (err) {
      console.warn(`Write error on ${collectionName}/${docId}:`, supabaseError || err);
      throw err;
    }
  } else {
    // If Supabase was successful, do silent background backup to Firestore without throwing or blocking
    passiveFirestoreBackup('set', collectionName, docId, data);
  }
}

/**
 * Persist multiple documents to Supabase in batches with progress tracking
 */
export async function batchSetFirestoreDocs(
  collectionName: string,
  docs: Array<{ id: string; data: Record<string, any> }>,
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (!docs || docs.length === 0) return;

  const rows = docs.map((d) => mapDocToSupabaseRow(collectionName, d.id, d.data));
  const CHUNK_SIZE = 300;
  let completed = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      await supabase.from(collectionName).upsert(chunk);
    } catch {}
    completed += chunk.length;
    if (onProgress) {
      onProgress(completed, rows.length);
    }
  }

  // Silent passive background sync to Firestore
  passiveFirestoreBackup('batchSet', collectionName, docs);
}

/**
 * Delete document from Supabase
 */
export async function deleteFirestoreDoc(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    await supabase.from(collectionName).delete().eq('id', docId);
  } catch {}

  // Silent passive background delete from Firestore
  passiveFirestoreBackup('delete', collectionName, docId);
}

/**
 * Delete multiple documents from Supabase
 */
export async function batchDeleteFirestoreDocs(
  collectionName: string,
  docIds: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<void> {
  if (!docIds || docIds.length === 0) return;

  const CHUNK_SIZE = 300;
  let completed = 0;

  for (let i = 0; i < docIds.length; i += CHUNK_SIZE) {
    const chunk = docIds.slice(i, i + CHUNK_SIZE);
    try {
      await supabase.from(collectionName).delete().in('id', chunk);
    } catch {}
    completed += chunk.length;
    if (onProgress) {
      onProgress(completed, docIds.length);
    }
  }

  // Silent passive background delete from Firestore
  passiveFirestoreBackup('batchDelete', collectionName, docIds);
}

/**
 * Fetch a single document directly from Supabase with Firestore fallback
 */
export async function getFirestoreDoc(
  collectionName: string,
  docId: string
): Promise<{ exists: boolean; data: any }> {
  try {
    const { data, error } = await supabase
      .from(collectionName)
      .select('*')
      .eq('id', docId)
      .maybeSingle();

    if (!error && data) {
      return {
        exists: true,
        data: mapSupabaseRowToDoc(collectionName, data),
      };
    }
  } catch {}

  // Fallback to Firestore
  try {
    const { firestore, db } = await getFirestoreModule();
    const docRef = firestore.doc(db, collectionName, docId);
    const snap = await firestore.getDoc(docRef);
    if (snap.exists()) {
      return { exists: true, data: snap.data() };
    }
  } catch {}

  return { exists: false, data: null };
}

/**
 * Check if backend database (Supabase) is responsive
 */
export async function checkServerConnectivity(): Promise<boolean> {
  try {
    const { error } = await supabase.from('app_settings').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export { OperationType, handleFirestoreError, isQuotaError };
