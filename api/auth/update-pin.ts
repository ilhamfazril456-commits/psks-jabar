import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, deleteField, query, where } from 'firebase/firestore';

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://zwjbjmafxixudhlvaxef.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_-Q49NtwnUsY9oF3jpRXEmw_J82UN4Uy';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const FIREBASE_CONFIG = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0671610320',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:785198268136:web:effd05abea5c957812d35d',
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBR_DTg05W9MISqgY8gT7kg90Sk0ermv7g',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0671610320.firebaseapp.com',
  firestoreDatabaseId:
    process.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-sisteminformasip-5ccd2c2a-19e7-46db-ae5d-63189556c2fb',
};

function getDb() {
  const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
  return getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.VITE_SESSION_SECRET ||
  'psks_jabar_production_auth_secret_2026_super_secure_key';

const PII_SECRET_KEY =
  process.env.PII_SECRET_KEY ||
  process.env.VITE_PII_SECRET_KEY ||
  process.env.SESSION_SECRET ||
  process.env.VITE_SESSION_SECRET ||
  'PSKS_JABAR_AES256_PII_SECRET_KEY_998822';

function evpBytesToKey(passwordBuf: Buffer, saltBuf: Buffer) {
  let d = Buffer.alloc(0);
  let dLast = Buffer.alloc(0);
  while (d.length < 48) {
    const hash = crypto.createHash('md5');
    hash.update(dLast);
    hash.update(passwordBuf);
    hash.update(saltBuf);
    dLast = hash.digest();
    d = Buffer.concat([d, dLast]);
  }
  return { key: d.subarray(0, 32), iv: d.subarray(32, 48) };
}

function encryptSensitiveData(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('ENC::')) return trimmed;
  try {
    const salt = crypto.randomBytes(8);
    const { key, iv } = evpBytesToKey(Buffer.from(PII_SECRET_KEY, 'utf8'), salt);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const enc = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
    return 'ENC::' + Buffer.concat([Buffer.from('Salted__', 'utf8'), salt, enc]).toString('base64');
  } catch {
    return trimmed;
  }
}

function decryptSensitiveData(cipherOrPlain: string): string {
  if (!cipherOrPlain || typeof cipherOrPlain !== 'string') return '';
  const trimmed = cipherOrPlain.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('ENC::')) return trimmed;
  try {
    const raw = Buffer.from(trimmed.slice(5), 'base64');
    if (raw.length < 16 || raw.subarray(0, 8).toString('utf8') !== 'Salted__') return trimmed;
    const salt = raw.subarray(8, 16);
    const data = raw.subarray(16);
    const { key, iv } = evpBytesToKey(Buffer.from(PII_SECRET_KEY, 'utf8'), salt);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8') || trimmed;
  } catch {
    return trimmed;
  }
}

function hashPassword(plain: string): string {
  return plain ? bcrypt.hashSync(plain, 10) : '';
}

function comparePassword(plain: string, stored?: string): boolean {
  if (!plain || !stored || !/^\$2[aby]\$\d{2}\$/.test(stored)) return false;
  try {
    return bcrypt.compareSync(plain, stored);
  } catch {
    return false;
  }
}

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') return res.status(statusCode).json(data);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function handleCors(req: any, res: any): boolean {
  const origin = req.headers?.origin || req.headers?.referer || '';
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true;
  }
  return false;
}

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {}
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function verifySessionToken(token: string): any | null {
  if (!token || typeof token !== 'string' || !token.startsWith('ses_')) return null;
  const parts = token.slice(4).split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  try {
    if (signature.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

function signSessionToken(payload: Record<string, any>): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 7 * 24 * 60 * 60 * 1000;
  const data = Buffer.from(JSON.stringify({ ...payload, issuedAt, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `ses_${data}.${signature}`;
}

function extractPersonalPin(acc: { pinOtoritas?: string; pinEncrypted?: string } | null | undefined): string {
  if (!acc) return '';
  if (acc.pinEncrypted) {
    const dec = decryptSensitiveData(acc.pinEncrypted).trim();
    if (/^\d{6}$/.test(dec)) return dec;
  }
  if (acc.pinOtoritas && /^\d{6}$/.test(acc.pinOtoritas.trim())) return acc.pinOtoritas.trim();
  return '';
}

async function resolveGlobalPins() {
  let sbUpdatedAt = -1, sbSuperPin = '', sbSuperHash = '', sbDevPin = '', sbDevHash = '';
  try {
    const { data } = await supabase.from('app_settings').select('data').eq('id', 'global').maybeSingle();
    if (data?.data && typeof data.data === 'object') {
      const d = data.data as Record<string, any>;
      sbUpdatedAt = Number(d.pinSecurityUpdatedAt || 0);
      const decSuper = d.superadminPinEncrypted ? decryptSensitiveData(String(d.superadminPinEncrypted)) : String(d.superadminPin || '');
      const decDev = d.developerPinEncrypted ? decryptSensitiveData(String(d.developerPinEncrypted)) : String(d.developerPin || '');
      if (/^\d{6}$/.test(decSuper.trim())) sbSuperPin = decSuper.trim();
      if (/^\d{6}$/.test(decDev.trim())) sbDevPin = decDev.trim();
      if (d.superadminPinHash) sbSuperHash = d.superadminPinHash;
      if (d.developerPinHash) sbDevHash = d.developerPinHash;
    }
  } catch {}

  let fsUpdatedAt = -1, fsSuperPin = '', fsSuperHash = '', fsDevPin = '', fsDevHash = '';
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'app_settings', 'global'));
    if (snap.exists()) {
      const d = snap.data() as Record<string, any>;
      fsUpdatedAt = Number(d.pinSecurityUpdatedAt || 0);
      const decSuper = d.superadminPinEncrypted ? decryptSensitiveData(String(d.superadminPinEncrypted)) : String(d.superadminPin || '');
      const decDev = d.developerPinEncrypted ? decryptSensitiveData(String(d.developerPinEncrypted)) : String(d.developerPin || '');
      if (/^\d{6}$/.test(decSuper.trim())) fsSuperPin = decSuper.trim();
      if (/^\d{6}$/.test(decDev.trim())) fsDevPin = decDev.trim();
      if (d.superadminPinHash) fsSuperHash = d.superadminPinHash;
      if (d.developerPinHash) fsDevHash = d.developerPinHash;
    }
  } catch {}

  const preferFsSuper = fsSuperPin || fsSuperHash ? fsUpdatedAt > sbUpdatedAt || (!sbSuperPin && !sbSuperHash) : false;
  const preferFsDev = fsDevPin || fsDevHash ? fsUpdatedAt > sbUpdatedAt || (!sbDevPin && !sbDevHash) : false;
  return {
    superadminPin: preferFsSuper ? fsSuperPin || sbSuperPin || '150109' : sbSuperPin || fsSuperPin || '150109',
    superadminPinHash: preferFsSuper ? fsSuperHash || sbSuperHash : sbSuperHash || fsSuperHash,
    developerPin: preferFsDev ? fsDevPin || sbDevPin || '150109' : sbDevPin || fsDevPin || '150109',
    developerPinHash: preferFsDev ? fsDevHash || sbDevHash : sbDevHash || fsDevHash,
  };
}

async function findPrivilegedAccount(identifiers: string[], expectedRole: string) {
  const cleanIds = Array.from(new Set(identifiers.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)));
  if (cleanIds.length === 0) return null;
  const table = expectedRole === 'developer' ? 'dev_accounts' : 'superadmin_accounts';
  const candidates: any[] = [];

  for (const ident of cleanIds) {
    try {
      let { data } = await supabase.from(table).select('*').eq('id', ident).limit(1).maybeSingle();
      if (!data) {
        const byU = await supabase.from(table).select('*').ilike('username', ident.toLowerCase()).limit(1).maybeSingle();
        if (byU.data) data = byU.data;
      }
      if (data) {
        const rest = data.data && typeof data.data === 'object' ? data.data : {};
        candidates.push({
          id: data.id,
          username: data.username || rest.username || data.id,
          namaAdmin: data.namaAdmin || rest.namaAdmin || data.username || data.id,
          wilayahTugas: data.wilayahTugas || rest.wilayahTugas || (expectedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
          statusActive: data.statusActive || rest.statusActive || 'SAH_TERDAFTAR',
          statusAkun: data.statusAkun || rest.statusAkun || 'AKTIF',
          isFrozen: data.isFrozen === true || rest.isFrozen === true,
          allowedPillars: Array.isArray(data.allowedPillars) ? data.allowedPillars : Array.isArray(rest.allowedPillars) ? rest.allowedPillars : ['all'],
          allowedKepahlawanan: Array.isArray(data.allowedKepahlawanan) ? data.allowedKepahlawanan : Array.isArray(rest.allowedKepahlawanan) ? rest.allowedKepahlawanan : ['all'],
          pinEncrypted: String(data.pinEncrypted || rest.pinEncrypted || '').trim(),
          pinHash: String(data.pinHash || rest.pinHash || '').trim(),
          pinOtoritas: String(data.pinOtoritas || rest.pinOtoritas || '').trim(),
          lastUpdatedTimestamp: Number(data.lastUpdatedTimestamp || rest.lastUpdatedTimestamp || 0),
          rawData: rest,
          rawRow: data,
        });
      }
    } catch {}
  }

  try {
    const db = getDb();
    for (const ident of cleanIds) {
      const snap = await getDoc(doc(db, table, ident));
      if (snap.exists()) {
        const d = snap.data();
        candidates.push({
          id: snap.id,
          username: d.username || snap.id,
          namaAdmin: d.namaAdmin || d.username || snap.id,
          wilayahTugas: d.wilayahTugas || (expectedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
          statusActive: d.statusActive || 'SAH_TERDAFTAR',
          statusAkun: d.statusAkun || 'AKTIF',
          isFrozen: d.isFrozen === true,
          allowedPillars: Array.isArray(d.allowedPillars) ? d.allowedPillars : ['all'],
          allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan) ? d.allowedKepahlawanan : ['all'],
          pinEncrypted: String(d.pinEncrypted || '').trim(),
          pinHash: String(d.pinHash || '').trim(),
          pinOtoritas: String(d.pinOtoritas || '').trim(),
          lastUpdatedTimestamp: Number(d.lastUpdatedTimestamp || 0),
          rawData: d,
        });
      }
      const qSnap = await getDocs(query(collection(db, table), where('username', '==', ident.toLowerCase())));
      if (!qSnap.empty) {
        const docSnap = qSnap.docs[0];
        const d = docSnap.data();
        candidates.push({
          id: docSnap.id,
          username: d.username || docSnap.id,
          namaAdmin: d.namaAdmin || d.username || docSnap.id,
          wilayahTugas: d.wilayahTugas || (expectedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
          statusActive: d.statusActive || 'SAH_TERDAFTAR',
          statusAkun: d.statusAkun || 'AKTIF',
          isFrozen: d.isFrozen === true,
          allowedPillars: Array.isArray(d.allowedPillars) ? d.allowedPillars : ['all'],
          allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan) ? d.allowedKepahlawanan : ['all'],
          pinEncrypted: String(d.pinEncrypted || '').trim(),
          pinHash: String(d.pinHash || '').trim(),
          pinOtoritas: String(d.pinOtoritas || '').trim(),
          lastUpdatedTimestamp: Number(d.lastUpdatedTimestamp || 0),
          rawData: d,
        });
      }
    }
  } catch {}

  candidates.sort((a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0));
  return candidates[0] || null;
}

const DEFAULT_ROOT = [
  { id: 'adm-super', username: 'superadmin jabar', namaAdmin: 'Super Admin Dinsos Jabar', role: 'superadmin', wilayahTugas: 'PROVINSI JAWA BARAT', passwordHash: '$2b$10$B7ARJFwaXeU8CWUqGfu2ye5nsB3xNCxDsWFIz//n3aoanD4uNGr1u' },
  { id: 'adm-dev', username: 'ilhamfazril', namaAdmin: 'Developer System', role: 'developer', wilayahTugas: 'Pusat Developer Jabar', passwordHash: '$2b$10$t30kcIcKMvSLvy.UjpqNkec5j52dqLCXX7F6hffvdYyWe7cbYeKji' },
];

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Metode HTTP tidak diizinkan.' });

  try {
    const body = await parseBody(req);
    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    const token = (typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '') || (req.headers?.['x-session-token'] as string) || body?.sessionToken || '';
    const authSession = token ? verifySessionToken(token) : null;
    const { newPin, pinType, userId, username, currentPin } = body || {};

    if (!newPin || typeof newPin !== 'string' || !/^\d{6}$/.test(newPin.trim())) {
      return sendJson(res, 400, { success: false, message: 'PIN baru wajib berupa tepat 6 digit angka.' });
    }

    const cleanPin = newPin.trim();
    const requestedRole = pinType === 'developer' ? 'developer' : 'superadmin';
    let actorRole: 'developer' | 'superadmin' = 'superadmin';
    let actorName = '';
    let targetId = '';
    let targetUname = '';

    if (authSession) {
      if (authSession.role !== 'superadmin' && authSession.role !== 'developer') {
        return sendJson(res, 403, { success: false, message: 'Otoritas tidak mencukupi (Wajib Superadmin atau Developer).' });
      }
      if (requestedRole === 'developer' && authSession.role !== 'developer') {
        return sendJson(res, 403, { success: false, message: 'Hanya Developer Utama yang berwenang mengubah PIN Developer.' });
      }
      actorRole = authSession.role;
      actorName = authSession.namaAdmin || authSession.username;
      if (authSession.role === 'developer') {
        targetId = requestedRole === 'superadmin' ? (userId || 'adm-super') : (userId || authSession.id);
        targetUname = requestedRole === 'superadmin' ? (username || (userId ? '' : 'superadmin jabar')) : (username || authSession.username);
      } else {
        targetId = authSession.id;
        targetUname = authSession.username;
      }
    } else {
      const cleanCurrent = typeof currentPin === 'string' ? currentPin.trim() : '';
      if (!/^\d{6}$/.test(cleanCurrent)) {
        return sendJson(res, 401, { success: false, message: 'Sesi otentikasi tidak valid. Silakan verifikasi ulang.' });
      }
      const lookupAcc = await findPrivilegedAccount([userId, username].filter(Boolean), requestedRole);
      const existingPersonalPin = extractPersonalPin(lookupAcc);
      const matchesHash = Boolean(lookupAcc?.pinHash && comparePassword(cleanCurrent, lookupAcc.pinHash));
      const globalPins = await resolveGlobalPins();
      const globalExpected = requestedRole === 'developer' ? globalPins.developerPin : globalPins.superadminPin;
      const globalExpectedHash = requestedRole === 'developer' ? globalPins.developerPinHash : globalPins.superadminPinHash;
      const globalMatches = cleanCurrent === globalExpected || Boolean(globalExpectedHash && comparePassword(cleanCurrent, globalExpectedHash));
      const verifiedPin = existingPersonalPin || lookupAcc?.pinHash ? cleanCurrent === existingPersonalPin || matchesHash || globalMatches : globalMatches;
      if (!verifiedPin) return sendJson(res, 401, { success: false, message: 'Verifikasi sesi/PIN saat ini tidak valid.' });
      actorRole = requestedRole;
      actorName = lookupAcc?.namaAdmin || lookupAcc?.username || String(username || userId || requestedRole);
      targetId = lookupAcc?.id || String(userId || '').trim();
      targetUname = lookupAcc?.username || String(username || '').trim();
    }

    const targetAcc = await findPrivilegedAccount([targetId, targetUname].filter(Boolean), requestedRole);
    const defMatch = DEFAULT_ROOT.find((a) => (targetId && a.id.toLowerCase() === String(targetId).toLowerCase()) || (targetUname && a.username.toLowerCase() === String(targetUname).toLowerCase()));
    const resolvedId = targetAcc?.id || defMatch?.id || String(targetId || (requestedRole === 'developer' ? 'adm-dev' : 'adm-super'));
    const resolvedUsername = targetAcc?.username || defMatch?.username || String(targetUname || (requestedRole === 'developer' ? 'ilhamfazril' : 'superadmin jabar'));
    const resolvedNama = targetAcc?.namaAdmin || defMatch?.namaAdmin || actorName || resolvedUsername;
    const resolvedWilayah = requestedRole === 'developer' ? 'Pusat Developer Jabar' : targetAcc?.wilayahTugas || defMatch?.wilayahTugas || 'PROVINSI JAWA BARAT';
    const saveTable = requestedRole === 'developer' ? 'dev_accounts' : 'superadmin_accounts';

    const encPin = encryptSensitiveData(cleanPin);
    const hashedPin = hashPassword(cleanPin);
    const nowMs = Date.now();
    const isSelf = Boolean(authSession ? resolvedId === authSession.id : true);

    const refreshedSessionToken = signSessionToken({
      id: resolvedId,
      username: resolvedUsername,
      role: requestedRole,
      namaAdmin: resolvedNama,
      wilayahTugas: resolvedWilayah,
      statusActive: targetAcc?.statusActive || 'SAH_TERDAFTAR',
      allowedPillars: targetAcc?.allowedPillars || (requestedRole === 'superadmin' ? ['all'] : undefined),
      allowedKepahlawanan: targetAcc?.allowedKepahlawanan || (requestedRole === 'superadmin' ? ['all'] : undefined),
      pinOtoritas: cleanPin,
    });

    const existingJsonData: Record<string, any> = targetAcc?.rawData && typeof targetAcc.rawData === 'object' ? { ...targetAcc.rawData } : {};
    delete existingJsonData.pinOtoritas;
    delete existingJsonData.passwordPolos;
    delete existingJsonData.superadminPin;
    delete existingJsonData.developerPin;
    delete existingJsonData._previousUsername;

    const nextDataJson = {
      ...existingJsonData,
      username: resolvedUsername,
      namaAdmin: resolvedNama,
      role: requestedRole,
      wilayahTugas: resolvedWilayah,
      statusActive: targetAcc?.statusActive || 'SAH_TERDAFTAR',
      statusAkun: targetAcc?.statusAkun || 'AKTIF',
      isFrozen: targetAcc?.isFrozen === true,
      ...(targetAcc?.allowedPillars ? { allowedPillars: targetAcc.allowedPillars } : requestedRole === 'superadmin' ? { allowedPillars: ['all'] } : {}),
      ...(targetAcc?.allowedKepahlawanan ? { allowedKepahlawanan: targetAcc.allowedKepahlawanan } : requestedRole === 'superadmin' ? { allowedKepahlawanan: ['all'] } : {}),
      ...(targetAcc?.rawRow?.passwordHash || existingJsonData.passwordHash || defMatch?.passwordHash ? { passwordHash: targetAcc?.rawRow?.passwordHash || existingJsonData.passwordHash || defMatch?.passwordHash } : {}),
      pinEncrypted: encPin,
      pinHash: hashedPin,
      lastUpdatedTimestamp: nowMs,
      lastEditedBy: actorName || resolvedUsername,
      lastEditedByRole: actorRole,
      isSelfUpdate: isSelf,
    };

    try {
      await supabase.from(saveTable).upsert({
        id: resolvedId,
        username: resolvedUsername,
        namaAdmin: resolvedNama,
        role: requestedRole,
        statusActive: targetAcc?.statusActive || 'SAH_TERDAFTAR',
        wilayahTugas: resolvedWilayah,
        passwordHash: nextDataJson.passwordHash || '',
        sessionToken: refreshedSessionToken,
        data: nextDataJson,
      }, { onConflict: 'id' });
      if (resolvedId) await supabase.from('admin_accounts').delete().eq('id', resolvedId);
      if (resolvedUsername) await supabase.from('admin_accounts').delete().ilike('username', resolvedUsername.toLowerCase().trim());
    } catch {}

    try {
      const db = getDb();
      await setDoc(doc(db, saveTable, resolvedId), nextDataJson, { merge: true });
      try {
        await deleteDoc(doc(db, 'admin_accounts', resolvedId));
      } catch {}
    } catch {}

    const isRootAccount = resolvedId === 'adm-super' || resolvedId === 'adm-dev' || ['superadmin', 'superadmin jabar', 'ilhamfazril'].includes(resolvedUsername.toLowerCase().trim());
    if (requestedRole === 'developer' || (actorRole === 'developer' && !userId && !username) || isRootAccount) {
      try {
        const { data: existingGlobal } = await supabase.from('app_settings').select('data').eq('id', 'global').maybeSingle();
        const baseGlobal = existingGlobal?.data && typeof existingGlobal.data === 'object' ? { ...existingGlobal.data } : {};
        delete baseGlobal.superadminPin;
        delete baseGlobal.developerPin;
        await supabase.from('app_settings').upsert({
          id: 'global',
          data: {
            ...baseGlobal,
            ...(requestedRole === 'developer' ? { developerPinEncrypted: encPin, developerPinHash: hashedPin } : { superadminPinEncrypted: encPin, superadminPinHash: hashedPin }),
            pinSecurityUpdatedAt: nowMs,
          },
        }, { onConflict: 'id' });
      } catch {}
      try {
        const db = getDb();
        await setDoc(doc(db, 'app_settings', 'global'), {
          ...(requestedRole === 'developer' ? { developerPinEncrypted: encPin, developerPinHash: hashedPin, developerPin: deleteField() } : { superadminPinEncrypted: encPin, superadminPinHash: hashedPin, superadminPin: deleteField() }),
          pinSecurityUpdatedAt: nowMs,
        }, { merge: true });
      } catch {}
    }

    return sendJson(res, 200, {
      success: true,
      pinOtoritas: cleanPin,
      pinEncrypted: encPin,
      pinHash: hashedPin,
      sessionToken: refreshedSessionToken,
      lastUpdatedTimestamp: nowMs,
      updatedAccountId: resolvedId,
      message: `PIN ${requestedRole === 'developer' ? 'Developer' : 'Superadmin'} berhasil diperbarui aman (terenkripsi) & disinkronkan!`,
    });
  } catch (err: any) {
    console.error('[Vercel Update PIN Error]:', err);
    return sendJson(res, 500, { success: false, message: 'Gagal memperbarui PIN di server.' });
  }
}
