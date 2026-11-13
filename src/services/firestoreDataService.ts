import { supabase, safeSubscribeRealtime } from '../lib/supabase';
import { OperationType, handleFirestoreError, isQuotaError } from '../lib/firebaseErrors';
import { encryptSensitiveData, decryptSensitiveData, hashSearchableField, hashPassword } from '../utils/crypto';

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

  if (collectionName === 'admin_accounts' || collectionName === 'user_accounts' || collectionName === 'superadmin_accounts' || collectionName === 'dev_accounts') {
    const restData = row.data && typeof row.data === 'object' ? row.data : {};
    const rawPinEnc = row.pinEncrypted || restData.pinEncrypted || '';
    const decPin = rawPinEnc ? decryptSensitiveData(rawPinEnc) : '';
    const legacyPlainPin = row.pinOtoritas || restData.pinOtoritas || '';
    const resolvedPin = /^\d{6}$/.test(decPin) ? decPin : (/^\d{6}$/.test(legacyPlainPin) ? legacyPlainPin : '');
    const resolvedPinEnc = rawPinEnc || (resolvedPin ? encryptSensitiveData(resolvedPin) : undefined);

    return {
      id: row.id,
      ...restData,
      username: row.username || restData.username || row.id,
      namaAdmin: row.namaAdmin || restData.namaAdmin || '',
      role: row.role || restData.role || (collectionName === 'user_accounts' ? 'user' : collectionName === 'superadmin_accounts' ? 'superadmin' : collectionName === 'dev_accounts' ? 'developer' : 'admin'),
      statusActive: row.statusActive || restData.statusActive || 'SAH_TERDAFTAR',
      wilayahTugas: row.wilayahTugas || restData.wilayahTugas || '',
      passwordHash: row.passwordHash || restData.passwordHash || '',
      passwordPolos: '',
      pinOtoritas: resolvedPin || undefined,
      pinEncrypted: resolvedPinEnc || undefined,
      sessionToken: row.sessionToken || restData.sessionToken || '',
      loginTimestamp: typeof row.loginTimestamp === 'number' ? row.loginTimestamp : (typeof restData.loginTimestamp === 'number' ? restData.loginTimestamp : 0),
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

  if (collectionName === 'registration_submissions') {
    const restData = row.data && typeof row.data === 'object' ? row.data : {};
    const rawNik = row.nik || restData.nik || '';
    const rawHp = row.hp || restData.hp || '';
    const decNik = rawNik ? decryptSensitiveData(rawNik) : '';
    const decHp = rawHp ? decryptSensitiveData(rawHp) : '';

    const rawRecordData = row.recordData || restData.recordData || {};
    const safeRecordData = typeof rawRecordData === 'object' ? { ...rawRecordData } : {};
    if (safeRecordData.nik) safeRecordData.nik = decryptSensitiveData(safeRecordData.nik);
    if (safeRecordData.hp) safeRecordData.hp = decryptSensitiveData(safeRecordData.hp);
    if (safeRecordData.noWhatsapp) safeRecordData.noWhatsapp = decryptSensitiveData(safeRecordData.noWhatsapp);

    return {
      id: row.id,
      ...restData,
      nama: row.nama || restData.nama || '',
      nik: decNik,
      hp: decHp,
      wilayah: row.wilayah || restData.wilayah || '',
      kec: row.kec || restData.kec || '',
      pillarId: row.pillarId || restData.pillarId || '',
      status: row.status || restData.status || 'PENDING',
      submittedAt: row.submittedAt || restData.submittedAt || '',
      recordData: safeRecordData,
    };
  }

  if (collectionName === 'app_settings' || collectionName === 'psks_records_meta' || collectionName === 'psks_app_settings') {
    const d = row.data && typeof row.data === 'object' ? { ...row.data } : {};
    if (d.superadminPinEncrypted) {
      const decSuper = decryptSensitiveData(d.superadminPinEncrypted);
      if (/^\d{6}$/.test(decSuper)) d.superadminPin = decSuper;
    }
    if (d.developerPinEncrypted) {
      const decDev = decryptSensitiveData(d.developerPinEncrypted);
      if (/^\d{6}$/.test(decDev)) d.developerPin = decDev;
    }
    return d;
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

  if (collectionName === 'admin_accounts' || collectionName === 'user_accounts' || collectionName === 'superadmin_accounts' || collectionName === 'dev_accounts') {
    const {
      id: _id,
      username,
      namaAdmin,
      role,
      statusActive,
      wilayahTugas,
      passwordHash,
      sessionToken,
      passwordPolos: _pp1,
      pinOtoritas: _pinPlain,
      superadminPin: _sp1,
      developerPin: _dp1,
      _previousUsername: _prevU1,
      ...rest
    } = cleaned;

    // Strict protection for master accounts: prevent accidental downgrade or ID-as-username overwrite
    const safeRole =
      collectionName === 'dev_accounts' || docId === 'adm-dev' || username === 'ilhamfazril'
        ? 'developer'
        : collectionName === 'superadmin_accounts' || docId === 'adm-super' || (username && username.includes('superadmin'))
        ? 'superadmin'
        : collectionName === 'user_accounts'
        ? 'user'
        : role || 'admin';

    const safeUsername =
      safeRole === 'developer' && (!username || username === 'adm-dev')
        ? 'ilhamfazril'
        : safeRole === 'superadmin' && (!username || username === 'adm-super')
        ? 'superadmin jabar'
        : username || docId;

    const safeWilayah =
      safeRole === 'superadmin' && (!wilayahTugas || wilayahTugas === 'Provinsi Jabar' || wilayahTugas === '')
        ? 'PROVINSI JAWA BARAT'
        : safeRole === 'developer' && (!wilayahTugas || wilayahTugas === '')
        ? 'Pusat Developer Jabar'
        : wilayahTugas || '';

    const sanitizedRest: Record<string, any> = { ...rest };
    delete sanitizedRest.passwordPolos;
    delete sanitizedRest.pinOtoritas;
    delete sanitizedRest.superadminPin;
    delete sanitizedRest.developerPin;
    delete sanitizedRest._previousUsername;

    // Zero-Plaintext PIN Hardening: derive pinEncrypted & pinHash from pinOtoritas if supplied in-memory, never save plaintext pinOtoritas
    const rawPlainPin = typeof _pinPlain === 'string' && /^\d{6}$/.test(_pinPlain.trim()) ? _pinPlain.trim() : '';
    const existingPinEnc = typeof sanitizedRest.pinEncrypted === 'string' ? sanitizedRest.pinEncrypted.trim() : '';
    const finalPinEnc = rawPlainPin ? encryptSensitiveData(rawPlainPin) : existingPinEnc;
    const decPinForHash = rawPlainPin || (finalPinEnc ? decryptSensitiveData(finalPinEnc) : '');
    const finalPinHash = /^\d{6}$/.test(decPinForHash)
      ? hashPassword(decPinForHash)
      : (typeof sanitizedRest.pinHash === 'string' ? sanitizedRest.pinHash : '');

    if (finalPinEnc) sanitizedRest.pinEncrypted = finalPinEnc;
    if (finalPinHash) sanitizedRest.pinHash = finalPinHash;

    // Encrypt sensitive PII (NIK & WhatsApp) before persisting to Supabase
    const rawNik = sanitizedRest.nik || '';
    const rawWa = sanitizedRest.noWhatsapp || '';
    const encNik = rawNik ? encryptSensitiveData(rawNik) : '';
    const nikHash = rawNik ? hashSearchableField(rawNik) : (sanitizedRest.nikHash || '');
    const encWa = rawWa ? encryptSensitiveData(rawWa) : '';

    if (rawNik) sanitizedRest.nik = encNik;
    if (nikHash) sanitizedRest.nikHash = nikHash;
    if (rawWa) sanitizedRest.noWhatsapp = encWa;

    return {
      id: docId,
      username: safeUsername,
      namaAdmin: namaAdmin || safeUsername,
      role: safeRole,
      statusActive: statusActive || 'SAH_TERDAFTAR',
      wilayahTugas: safeWilayah,
      passwordHash: passwordHash || '',
      sessionToken: sessionToken || '',
      ...(encNik ? { nik: encNik, nikHash } : {}),
      ...(encWa ? { noWhatsapp: encWa } : {}),
      data: {
        ...sanitizedRest,
        ...(encNik ? { nik: encNik, nikHash } : {}),
        ...(encWa ? { noWhatsapp: encWa } : {}),
        loginTimestamp: cleaned.loginTimestamp || sanitizedRest.loginTimestamp || 0,
      },
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
    const rawNik = (nik || '').toString().trim();
    const rawHp = (hp || '').toString().trim();
    const encNik = rawNik ? (rawNik.startsWith('ENC::') ? rawNik : encryptSensitiveData(rawNik)) : '';
    const encHp = rawHp ? (rawHp.startsWith('ENC::') ? rawHp : encryptSensitiveData(rawHp)) : '';
    const nikHash = rawNik ? hashSearchableField(rawNik) : '';

    const safeRecordData = recordData && typeof recordData === 'object' ? { ...recordData } : {};
    if (safeRecordData.nik && typeof safeRecordData.nik === 'string' && !safeRecordData.nik.startsWith('ENC::')) {
      safeRecordData.nik = encryptSensitiveData(safeRecordData.nik.trim());
    }
    if (safeRecordData.hp && typeof safeRecordData.hp === 'string' && !safeRecordData.hp.startsWith('ENC::')) {
      safeRecordData.hp = encryptSensitiveData(safeRecordData.hp.trim());
    }
    if (safeRecordData.noWhatsapp && typeof safeRecordData.noWhatsapp === 'string' && !safeRecordData.noWhatsapp.startsWith('ENC::')) {
      safeRecordData.noWhatsapp = encryptSensitiveData(safeRecordData.noWhatsapp.trim());
    }

    return {
      id: docId,
      nama: nama || '',
      nik: encNik,
      hp: encHp,
      wilayah: wilayah || '',
      kec: kec || '',
      pillarId: pillarId || '',
      status: status || 'PENDING',
      submittedAt: submittedAt || new Date().toISOString(),
      recordData: safeRecordData,
      data: {
        ...rest,
        ...(encNik ? { nik: encNik, nikHash } : {}),
        ...(encHp ? { hp: encHp } : {}),
      },
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
    const safeSettings = { ...cleaned };
    if (typeof safeSettings.superadminPin === 'string' && /^\d{6}$/.test(safeSettings.superadminPin.trim())) {
      const cleanSuper = safeSettings.superadminPin.trim();
      safeSettings.superadminPinEncrypted = encryptSensitiveData(cleanSuper);
      safeSettings.superadminPinHash = hashPassword(cleanSuper);
    } else if (safeSettings.superadminPinEncrypted && !safeSettings.superadminPinHash) {
      const decSuper = decryptSensitiveData(safeSettings.superadminPinEncrypted).trim();
      if (/^\d{6}$/.test(decSuper)) safeSettings.superadminPinHash = hashPassword(decSuper);
    }
    if (typeof safeSettings.developerPin === 'string' && /^\d{6}$/.test(safeSettings.developerPin.trim())) {
      const cleanDev = safeSettings.developerPin.trim();
      safeSettings.developerPinEncrypted = encryptSensitiveData(cleanDev);
      safeSettings.developerPinHash = hashPassword(cleanDev);
    } else if (safeSettings.developerPinEncrypted && !safeSettings.developerPinHash) {
      const decDev = decryptSensitiveData(safeSettings.developerPinEncrypted).trim();
      if (/^\d{6}$/.test(decDev)) safeSettings.developerPinHash = hashPassword(decDev);
    }
    delete safeSettings.superadminPin;
    delete safeSettings.developerPin;
    return {
      id: docId,
      data: safeSettings,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    id: docId,
    data: cleaned,
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeForFirestorePayload(collectionName: string, rawData: Record<string, any>): Record<string, any> {
  const cleaned = cleanFirestoreData(rawData || {});
  if (
    collectionName === 'dev_accounts' ||
    collectionName === 'superadmin_accounts' ||
    collectionName === 'admin_accounts' ||
    collectionName === 'user_accounts'
  ) {
    const rawPlainPin = typeof cleaned.pinOtoritas === 'string' && /^\d{6}$/.test(cleaned.pinOtoritas.trim())
      ? cleaned.pinOtoritas.trim()
      : '';
    if (rawPlainPin && !cleaned.pinEncrypted) {
      cleaned.pinEncrypted = encryptSensitiveData(rawPlainPin);
    }
    if (rawPlainPin && !cleaned.pinHash) {
      cleaned.pinHash = hashPassword(rawPlainPin);
    }
    if (typeof cleaned.nik === 'string' && cleaned.nik && !cleaned.nik.startsWith('ENC::')) {
      const encNik = encryptSensitiveData(cleaned.nik);
      cleaned.nikHash = hashSearchableField(cleaned.nik);
      cleaned.nik = encNik;
    }
    if (typeof cleaned.noWhatsapp === 'string' && cleaned.noWhatsapp && !cleaned.noWhatsapp.startsWith('ENC::')) {
      cleaned.noWhatsapp = encryptSensitiveData(cleaned.noWhatsapp);
    }
    delete cleaned.passwordPolos;
    delete cleaned.pinOtoritas;
    delete cleaned.superadminPin;
    delete cleaned.developerPin;
    delete cleaned._previousUsername;
  } else if (collectionName === 'app_settings') {
    if (typeof cleaned.superadminPin === 'string' && /^\d{6}$/.test(cleaned.superadminPin.trim())) {
      const cleanSuper = cleaned.superadminPin.trim();
      cleaned.superadminPinEncrypted = encryptSensitiveData(cleanSuper);
      cleaned.superadminPinHash = hashPassword(cleanSuper);
    } else if (cleaned.superadminPinEncrypted && !cleaned.superadminPinHash) {
      const decSuper = decryptSensitiveData(cleaned.superadminPinEncrypted).trim();
      if (/^\d{6}$/.test(decSuper)) cleaned.superadminPinHash = hashPassword(decSuper);
    }
    if (typeof cleaned.developerPin === 'string' && /^\d{6}$/.test(cleaned.developerPin.trim())) {
      const cleanDev = cleaned.developerPin.trim();
      cleaned.developerPinEncrypted = encryptSensitiveData(cleanDev);
      cleaned.developerPinHash = hashPassword(cleanDev);
    } else if (cleaned.developerPinEncrypted && !cleaned.developerPinHash) {
      const decDev = decryptSensitiveData(cleaned.developerPinEncrypted).trim();
      if (/^\d{6}$/.test(decDev)) cleaned.developerPinHash = hashPassword(decDev);
    }
    delete cleaned.superadminPin;
    delete cleaned.developerPin;
  }
  return cleaned;
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
      const safePayload = sanitizeForFirestorePayload(collectionName, dataOrMerge);
      if (collectionName === 'app_settings' && docIdOrDocs === 'global') {
        safePayload.superadminPin = firestore.deleteField();
        safePayload.developerPin = firestore.deleteField();
      }
      await firestore.setDoc(docRef, safePayload, { merge: true });
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
        const raw = snap.data() || {};
        const d =
          collectionName === 'app_settings' ||
          collectionName === 'psks_records_meta' ||
          collectionName === 'psks_app_settings' ||
          collectionName === 'admin_accounts' ||
          collectionName === 'user_accounts' ||
          collectionName === 'superadmin_accounts' ||
          collectionName === 'dev_accounts'
            ? mapSupabaseRowToDoc(collectionName, { id: snap.id, ...raw, data: raw })
            : raw;
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
 * High-speed deterministic loader for collections (fetches exact live row count with ordered paging & completeness verification)
 */
async function loadAllSupabaseCollectionRows(collectionName: string): Promise<any[]> {
  if (collectionName === 'psks_records') {
    const PAGE_SIZE = 1000;
    const SELECT_COLS = 'id, pillarId, wilayah, nama, status, kec, kelDesa, orderIndex, createdAt, updatedAt, data';

    const fetchPageWithRetry = async (from: number, to: number, maxRetries = 3): Promise<any[]> => {
      let lastErr: any = null;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const { data, error } = await supabase
            .from('psks_records')
            .select(SELECT_COLS)
            .order('id', { ascending: true })
            .range(from, to);

          if (!error && Array.isArray(data)) {
            return data;
          }
          lastErr = error || new Error(`Empty response for range ${from}-${to}`);
        } catch (err) {
          lastErr = err;
        }
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, 300 * attempt));
        }
      }
      throw lastErr || new Error(`Failed loading psks_records range ${from}-${to}`);
    };

    const getExactCount = async (): Promise<number | null> => {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const { count, error } = await supabase
            .from('psks_records')
            .select('id', { count: 'exact', head: true });
          if (!error && typeof count === 'number') {
            return count;
          }
        } catch {}
        await new Promise((res) => setTimeout(res, 250));
      }
      return null;
    };

    try {
      const exactCount = await getExactCount();
      const targetEstimate = exactCount && exactCount > 0 ? exactCount : 24000;
      const pageStarts: number[] = [];
      for (let from = 0; from < targetEstimate; from += PAGE_SIZE) {
        pageStarts.push(from);
      }

      const rowMap = new Map<string, any>();
      const CONCURRENCY = 5;

      for (let i = 0; i < pageStarts.length; i += CONCURRENCY) {
        const batchStarts = pageStarts.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batchStarts.map((from) => fetchPageWithRetry(from, from + PAGE_SIZE - 1))
        );
        for (const chunk of batchResults) {
          for (const row of chunk) {
            if (row && row.id) rowMap.set(row.id, row);
          }
        }
        // If no exactCount was available and a chunk returned fewer than PAGE_SIZE rows, stop early
        if (exactCount === null && batchResults.some((c) => c.length < PAGE_SIZE)) {
          break;
        }
      }

      // Catch any newly added rows beyond initial estimate
      let nextFrom = pageStarts.length * PAGE_SIZE;
      while (true) {
        const tailChunk = await fetchPageWithRetry(nextFrom, nextFrom + PAGE_SIZE - 1);
        for (const row of tailChunk) {
          if (row && row.id) rowMap.set(row.id, row);
        }
        if (tailChunk.length < PAGE_SIZE) break;
        nextFrom += PAGE_SIZE;
      }

      // Guard against silent partial reads (e.g. mobile network drop returning 11.000 of 23.929)
      if (typeof exactCount === 'number' && exactCount > 0 && rowMap.size < exactCount) {
        const latestCount = await getExactCount();
        const requiredCount = typeof latestCount === 'number' && latestCount > 0 ? latestCount : exactCount;
        if (rowMap.size < requiredCount) {
          throw new Error(`Incomplete psks_records snapshot: fetched ${rowMap.size} of ${requiredCount}`);
        }
      }

      if (rowMap.size > 0 || exactCount === 0) {
        return Array.from(rowMap.values());
      }
    } catch (err) {
      console.warn('Supabase psks_records load failed completeness check:', err);
      throw err;
    }
  }

  if (collectionName === 'superadmin_accounts' || collectionName === 'dev_accounts') {
    // Merge BOTH Supabase and Firestore by id using highest lastUpdatedTimestamp so neither source shadows updates
    const mergedMap = new Map<string, any>();
    const upsertCandidate = (row: any) => {
      if (!row || !row.id) return;
      const prev = mergedMap.get(row.id);
      const nextTs = Number(row.lastUpdatedTimestamp || row.data?.lastUpdatedTimestamp || 0);
      const prevTs = Number(prev?.lastUpdatedTimestamp || prev?.data?.lastUpdatedTimestamp || 0);
      if (!prev || nextTs >= prevTs) {
        mergedMap.set(row.id, row);
      }
    };

    try {
      const { data, error } = await supabase.from(collectionName).select('*');
      if (!error && Array.isArray(data)) {
        data.forEach(upsertCandidate);
      }
    } catch {}

    try {
      const { firestore, db } = await getFirestoreModule();
      const snap = await firestore.getDocs(firestore.collection(db, collectionName));
      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        upsertCandidate({ id: docSnap.id, data: d, ...d });
      });
    } catch {}

    return Array.from(mergedMap.values());
  }

  try {
    const { data, error } = await supabase.from(collectionName).select('*');
    if (!error && data) return data;
    if (error && collectionName === 'psks_records') throw error;
  } catch (err) {
    if (collectionName === 'psks_records') throw err;
  }

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
  let pollInterval: any = null;
  let unsubFirestore: (() => void) | null = null;

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

  // 1. Initial bulk fetch from Supabase
  refreshCollection();

  // Listen for explicit fast refresh signals (e.g. from security_signals or cross-tab BroadcastChannel)
  const handleForceRefreshEvent = (ev: Event) => {
    if (isCancelled) return;
    const customEv = ev as CustomEvent<{ collection?: string }>;
    const target = customEv?.detail?.collection;
    if (!target || target === collectionName) {
      refreshCollection();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('psks_force_refresh_collection', handleForceRefreshEvent);
  }

  // 2. Adaptive fallback sync: 5s for small high-priority superadmin_accounts/dev_accounts (PIN/pillar permissions), 60s for others
  if (
    collectionName === 'admin_accounts' ||
    collectionName === 'user_accounts' ||
    collectionName === 'superadmin_accounts' ||
    collectionName === 'dev_accounts' ||
    collectionName === 'registration_submissions' ||
    collectionName === 'app_settings'
  ) {
    const intervalMs =
      collectionName === 'superadmin_accounts' || collectionName === 'dev_accounts' ? 5000 : 60000;
    pollInterval = setInterval(() => {
      if (!isCancelled && typeof document !== 'undefined' && !document.hidden) {
        refreshCollection();
      }
    }, intervalMs);
  }

  // 3. Concurrent Real-time Firestore onSnapshot listener for instant sub-second trigger
  if (
    collectionName === 'admin_accounts' ||
    collectionName === 'superadmin_accounts' ||
    collectionName === 'dev_accounts' ||
    collectionName === 'registration_submissions' ||
    collectionName === 'security_signals'
  ) {
    getFirestoreModule()
      .then(({ firestore, db }) => {
        if (isCancelled) return;
        const colRef = firestore.collection(db, collectionName);
        unsubFirestore = firestore.onSnapshot(
          colRef,
          () => {
            if (isCancelled) return;
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              refreshCollection();
            }, 300);
          },
          () => {}
        );
      })
      .catch(() => {});
  }

  // 4. Supabase Realtime channel listener with debounce protection
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
        }, 400);
      }
    );

  const unsubChannel = safeSubscribeRealtime(channel);

  return () => {
    isCancelled = true;
    if (debounceTimer) clearTimeout(debounceTimer);
    if (pollInterval) clearInterval(pollInterval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('psks_force_refresh_collection', handleForceRefreshEvent);
    }
    if (unsubFirestore) {
      try {
        unsubFirestore();
      } catch {}
    }
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
  options?: { merge?: boolean }
): Promise<void> {
  let supabaseOk = false;
  let supabaseError: any = null;
  const isMerge = options?.merge === true;

  try {
    const isAccountCol =
      collectionName === 'admin_accounts' ||
      collectionName === 'user_accounts' ||
      collectionName === 'superadmin_accounts' ||
      collectionName === 'dev_accounts';

    const targetTable =
      collectionName === 'user_accounts' || data.role === 'user'
        ? 'user_accounts'
        : collectionName === 'superadmin_accounts' || data.role === 'superadmin' || docId === 'adm-super'
        ? 'superadmin_accounts'
        : collectionName === 'dev_accounts' || data.role === 'developer' || docId === 'adm-dev'
        ? 'dev_accounts'
        : 'admin_accounts';

    if (isMerge && isAccountCol) {
      // PARTIAL UPDATE for account collections: NEVER wipe omitted columns (like username, role, passwordHash)!
      const partialUpdate: Record<string, any> = {};
      if (data.username !== undefined && data.username !== '') {
        partialUpdate.username = data.username;
      }
      if (data.namaAdmin !== undefined && data.namaAdmin !== '') {
        partialUpdate.namaAdmin = data.namaAdmin;
      }
      if (data.role !== undefined && data.role !== '') {
        // Protect developer & superadmin roles from accidental downgrade
        const lockedRole =
          docId === 'adm-dev' || data.username === 'ilhamfazril'
            ? 'developer'
            : docId === 'adm-super' || (data.username && data.username.includes('superadmin'))
            ? 'superadmin'
            : data.role;
        partialUpdate.role = lockedRole;
      }
      if (data.statusActive !== undefined) partialUpdate.statusActive = data.statusActive;
      if (data.wilayahTugas !== undefined && data.wilayahTugas !== '') {
        partialUpdate.wilayahTugas =
          (docId === 'adm-super' || data.role === 'superadmin') && (data.wilayahTugas === 'Provinsi Jabar' || data.wilayahTugas === '')
            ? 'PROVINSI JAWA BARAT'
            : data.wilayahTugas;
      }
      if (data.passwordHash !== undefined && data.passwordHash !== '') {
        partialUpdate.passwordHash = data.passwordHash;
      }
      if (data.sessionToken !== undefined) partialUpdate.sessionToken = data.sessionToken;
      if (data.nik !== undefined) {
        const enc = encryptSensitiveData(data.nik);
        partialUpdate.nik = enc;
        partialUpdate.nikHash = hashSearchableField(enc);
      }
      if (data.noWhatsapp !== undefined) {
        partialUpdate.noWhatsapp = encryptSensitiveData(data.noWhatsapp);
      }

      // Extract non-column fields to store in JSONB data (ZERO PLAINTEXT: never persist passwordPolos or pinOtoritas)
      const {
        id: _id,
        username: _u,
        namaAdmin: _na,
        role: _r,
        statusActive: _sa,
        wilayahTugas: _wt,
        passwordHash: _ph,
        sessionToken: _st,
        passwordPolos: _pp,
        pinOtoritas: _pinPlain,
        superadminPin: _sp,
        developerPin: _dp,
        _previousUsername: _prevU,
        nik: _nik,
        noWhatsapp: _wa,
        ...rest
      } = data;

      const rawPinStr = typeof _pinPlain === 'string' && /^\d{6}$/.test(_pinPlain.trim()) ? _pinPlain.trim() : '';
      const computedPinEnc = rawPinStr
        ? encryptSensitiveData(rawPinStr)
        : (typeof data.pinEncrypted === 'string' && data.pinEncrypted.trim() ? data.pinEncrypted.trim() : '');
      const decPinForHash = rawPinStr || (computedPinEnc ? decryptSensitiveData(computedPinEnc) : '');
      const computedPinHash = /^\d{6}$/.test(decPinForHash)
        ? hashPassword(decPinForHash)
        : (typeof data.pinHash === 'string' && data.pinHash ? data.pinHash : '');

      const encNik = _nik ? encryptSensitiveData(_nik) : '';
      const nikHash = _nik ? hashSearchableField(_nik) : '';
      const encWa = _wa ? encryptSensitiveData(_wa) : '';

      try {
        let chosenTable = targetTable;
        let existing = await supabase.from(chosenTable).select('id, data').eq('id', docId).maybeSingle();
        if (existing.error && chosenTable !== 'admin_accounts') {
          chosenTable = 'admin_accounts';
          existing = await supabase.from(chosenTable).select('id, data').eq('id', docId).maybeSingle();
        }

        if (!existing.data) {
          // Jangan pernah membuat baris hantu (skeleton ghost account) jika ini hanyalah update status/heartbeat parsial
          const isSkeletonPartialOnly = !data.username && !data.namaAdmin && !data.passwordHash;
          if (isSkeletonPartialOnly) {
            return;
          }
          // Row does not exist yet in Supabase, perform complete upsert
          const row = mapDocToSupabaseRow(collectionName, docId, data);
          if (row.data && typeof row.data === 'object') {
            delete (row.data as any).passwordPolos;
            delete (row.data as any).pinOtoritas;
            delete (row.data as any).superadminPin;
            delete (row.data as any).developerPin;
            delete (row.data as any)._previousUsername;
          }
          const { error } = await supabase.from(chosenTable).upsert(row);
          if (!error) supabaseOk = true;
          else supabaseError = error;
        } else {
          const existingData = existing.data?.data && typeof existing.data.data === 'object' ? { ...existing.data.data } : {};
          delete (existingData as any).passwordPolos;
          delete (existingData as any).pinOtoritas;
          delete (existingData as any).superadminPin;
          delete (existingData as any).developerPin;
          delete (existingData as any)._previousUsername;

          const cleanedRest = { ...rest };
          delete (cleanedRest as any).passwordPolos;
          delete (cleanedRest as any).pinOtoritas;
          delete (cleanedRest as any).superadminPin;
          delete (cleanedRest as any).developerPin;
          delete (cleanedRest as any)._previousUsername;

          partialUpdate.data = {
            ...existingData,
            ...cleanedRest,
            ...(computedPinEnc ? { pinEncrypted: computedPinEnc } : {}),
            ...(computedPinHash ? { pinHash: computedPinHash } : {}),
            ...(encNik ? { nik: encNik, nikHash } : {}),
            ...(encWa ? { noWhatsapp: encWa } : {}),
            ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
            ...(data.lastUpdatedTimestamp ? { lastUpdatedTimestamp: data.lastUpdatedTimestamp } : {}),
          };

          const { error } = await supabase.from(chosenTable).update(partialUpdate).eq('id', docId);
          if (!error) {
            supabaseOk = true;
          } else {
            supabaseError = error;
          }
        }
      } catch (checkErr) {
        supabaseError = checkErr;
      }
    } else if (collectionName === 'psks_records') {
      try {
        const token =
          (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('session_token')) ||
          (typeof localStorage !== 'undefined' && localStorage.getItem('session_token')) ||
          '';
        const resp = await fetch('/api/psks/save-record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-session-token': token,
          },
          body: JSON.stringify({ id: docId, data }),
        });
        if (resp.ok) {
          supabaseOk = true;
        } else {
          // Direct fallback if API returns error
          const row = mapDocToSupabaseRow(collectionName, docId, data);
          const res = await supabase.from('psks_records').upsert(row);
          if (!res.error) supabaseOk = true;
          else supabaseError = res.error;
        }
      } catch {
        const row = mapDocToSupabaseRow(collectionName, docId, data);
        const res = await supabase.from('psks_records').upsert(row);
        if (!res.error) supabaseOk = true;
        else supabaseError = res.error;
      }
    } else if (collectionName === 'app_settings') {
      try {
        const token =
          (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('session_token')) ||
          (typeof localStorage !== 'undefined' && localStorage.getItem('session_token')) ||
          '';
        const resp = await fetch('/api/settings/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-session-token': token,
          },
          body: JSON.stringify({ id: docId, data }),
        });
        if (resp.ok) {
          supabaseOk = true;
        } else {
          const row = mapDocToSupabaseRow(collectionName, docId, data);
          const res = await supabase.from('app_settings').upsert(row);
          if (!res.error) supabaseOk = true;
          else supabaseError = res.error;
        }
      } catch {
        const row = mapDocToSupabaseRow(collectionName, docId, data);
        const res = await supabase.from('app_settings').upsert(row);
        if (!res.error) supabaseOk = true;
        else supabaseError = res.error;
      }
    } else {
      const row = mapDocToSupabaseRow(collectionName, docId, data);
      let chosenTable = isAccountCol ? targetTable : collectionName;
      let res = await supabase.from(chosenTable).upsert(row);
      if (res.error && isAccountCol && chosenTable !== 'admin_accounts') {
        chosenTable = 'admin_accounts';
        res = await supabase.from(chosenTable).upsert(row);
      }
      if (!res.error) {
        supabaseOk = true;
      } else {
        supabaseError = res.error;
      }
    }

    // Remove stale duplicate copies in admin_accounts when saving a superadmin or developer account
    if (isAccountCol && (targetTable === 'superadmin_accounts' || targetTable === 'dev_accounts')) {
      try {
        await supabase.from('admin_accounts').delete().eq('id', docId);
      } catch {}
    }
  } catch (sbErr) {
    supabaseError = sbErr;
  }

  // Ensure critical collections (admin_accounts, user_accounts, etc.) are immediately and synchronously written to Firestore as well
  if (
    collectionName === 'admin_accounts' ||
    collectionName === 'user_accounts' ||
    collectionName === 'superadmin_accounts' ||
    collectionName === 'dev_accounts' ||
    collectionName === 'security_signals'
  ) {
    const resolvedFsCollection =
      collectionName === 'security_signals'
        ? 'security_signals'
        : data.role === 'user' || collectionName === 'user_accounts'
        ? 'user_accounts'
        : data.role === 'developer' || collectionName === 'dev_accounts' || docId === 'adm-dev'
        ? 'dev_accounts'
        : data.role === 'superadmin' || collectionName === 'superadmin_accounts' || docId === 'adm-super'
        ? 'superadmin_accounts'
        : collectionName;

    try {
      const { firestore, db } = await getFirestoreModule();
      const docRef = firestore.doc(db, resolvedFsCollection, docId);
      await firestore.setDoc(docRef, sanitizeForFirestorePayload(resolvedFsCollection, data), { merge: true });
    } catch (fsErr) {
      console.warn(`Direct Firestore sync notice on ${resolvedFsCollection}/${docId}:`, fsErr);
    }
  }

  // If Supabase write failed or table doesn't exist, fallback to Firestore write
  if (!supabaseOk && collectionName !== 'admin_accounts' && collectionName !== 'superadmin_accounts' && collectionName !== 'dev_accounts' && collectionName !== 'user_accounts' && collectionName !== 'security_signals') {
    try {
      const { firestore, db } = await getFirestoreModule();
      const docRef = firestore.doc(db, collectionName, docId);
      await firestore.setDoc(docRef, sanitizeForFirestorePayload(collectionName, data), { merge: true });
    } catch (err) {
      console.warn(`Write error on ${collectionName}/${docId}:`, supabaseError || err);
      throw err;
    }
  } else if (supabaseOk && collectionName !== 'admin_accounts' && collectionName !== 'superadmin_accounts' && collectionName !== 'dev_accounts' && collectionName !== 'user_accounts' && collectionName !== 'security_signals') {
    // Silent background backup to Firestore without throwing or blocking
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
  const CHUNK_SIZE = 150;
  let completed = 0;

  // 1. PRIMARY AUTHORITATIVE PERSISTENCE: Directly upsert into Supabase (Permanent PostgreSQL Storage)
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      const { error } = await supabase.from(collectionName).upsert(chunk);
      if (error) {
        console.warn(`[Supabase Batch Upsert] Notice on chunk ${i}:`, error.message);
      }
    } catch (upsertErr) {
      console.warn(`[Supabase Batch Upsert] Exception on chunk ${i}:`, upsertErr);
    }
    completed += chunk.length;
    if (onProgress) {
      onProgress(completed, rows.length);
    }
  }

  // 2. SERVERLESS ENDPOINT MIRRORING (Vercel / Express backend)
  if (collectionName === 'psks_records') {
    try {
      const token =
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('session_token')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('session_token')) ||
        '';
      if (token) {
        fetch('/api/psks/batch-save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-session-token': token,
          },
          body: JSON.stringify({ docs: docs.slice(0, 500) }),
        }).catch(() => {});
      }
    } catch {}
  }

  // 3. Silent passive background backup to Firestore
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
    if (collectionName === 'psks_records') {
      const token =
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('session_token')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('session_token')) ||
        '';
      await fetch('/api/psks/delete-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-session-token': token,
        },
        body: JSON.stringify({ id: docId }),
      });
    } else {
      await supabase.from(collectionName).delete().eq('id', docId);
      if (collectionName === 'user_accounts' || collectionName === 'superadmin_accounts' || collectionName === 'dev_accounts') {
        await supabase.from('admin_accounts').delete().eq('id', docId);
      }
    }
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

  if (collectionName === 'psks_records') {
    try {
      const token =
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('session_token')) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('session_token')) ||
        '';
      const CHUNK_SIZE = 300;
      let completed = 0;
      for (let i = 0; i < docIds.length; i += CHUNK_SIZE) {
        const chunk = docIds.slice(i, i + CHUNK_SIZE);
        await fetch('/api/psks/batch-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-session-token': token,
          },
          body: JSON.stringify({ ids: chunk }),
        });
        completed += chunk.length;
        if (onProgress) {
          onProgress(completed, docIds.length);
        }
      }
      passiveFirestoreBackup('batchDelete', collectionName, docIds);
      return;
    } catch {}
  }

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
