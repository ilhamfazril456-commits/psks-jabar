import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

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
    const dec = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    return dec || trimmed;
  } catch {
    return trimmed;
  }
}

function comparePassword(plainText: string, storedHash?: string): boolean {
  if (!plainText || !storedHash) return false;
  if (!/^\$2[aby]\$\d{2}\$/.test(storedHash)) return false;
  try {
    return bcrypt.compareSync(plainText, storedHash);
  } catch {
    return false;
  }
}

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.run\.app$/,
  /^https:\/\/ai\.studio$/,
  /^https:\/\/.*\.jabarprov\.go\.id$/,
  /^https:\/\/.*\.dinsos\.jabarprov\.go\.id$/,
];

function handleCors(req: any, res: any): boolean {
  const origin = req.headers?.origin || req.headers?.referer || '';
  let matchedOrigin = '';
  if (origin) {
    try {
      const url = origin.startsWith('http') ? new URL(origin) : null;
      const testOrigin = url ? url.origin : origin;
      if (ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(testOrigin))) matchedOrigin = testOrigin;
    } catch {}
  }
  res.setHeader('Access-Control-Allow-Origin', matchedOrigin || '*');
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

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

function verifyCardChallengeToken(token: string, expectedRole?: string): boolean {
  if (!token || typeof token !== 'string' || !token.startsWith('ch_')) return false;
  const parts = token.slice(3).split('.');
  if (parts.length !== 2) return false;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(`card_${data}`).digest('base64url');
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.expiresAt && Date.now() > payload.expiresAt) return false;
    if (expectedRole && payload.role !== expectedRole) return false;
    return true;
  } catch {
    return false;
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

async function resolveGlobalPinsFromDatabases() {
  let sbUpdatedAt = -1;
  let sbSuperPin = '';
  let sbSuperHash = '';
  let sbDevPin = '';
  let sbDevHash = '';

  try {
    const { data } = await supabase.from('app_settings').select('data').eq('id', 'global').maybeSingle();
    if (data && data.data && typeof data.data === 'object') {
      const d = data.data as Record<string, any>;
      sbUpdatedAt = Number(d.pinSecurityUpdatedAt || 0);
      const decSuper = d.superadminPinEncrypted
        ? decryptSensitiveData(String(d.superadminPinEncrypted))
        : String(d.superadminPin || '');
      const decDev = d.developerPinEncrypted
        ? decryptSensitiveData(String(d.developerPinEncrypted))
        : String(d.developerPin || '');
      if (decSuper && /^\d{6}$/.test(decSuper.trim())) sbSuperPin = decSuper.trim();
      if (decDev && /^\d{6}$/.test(decDev.trim())) sbDevPin = decDev.trim();
      if (typeof d.superadminPinHash === 'string' && d.superadminPinHash) sbSuperHash = d.superadminPinHash;
      if (typeof d.developerPinHash === 'string' && d.developerPinHash) sbDevHash = d.developerPinHash;
    }
  } catch {}

  let fsUpdatedAt = -1;
  let fsSuperPin = '';
  let fsSuperHash = '';
  let fsDevPin = '';
  let fsDevHash = '';

  try {
    const db = getDb();
    const snap = await getDoc(doc(db, 'app_settings', 'global'));
    if (snap.exists()) {
      const fsData = snap.data() as Record<string, any>;
      fsUpdatedAt = Number(fsData.pinSecurityUpdatedAt || 0);
      const decSuper = fsData.superadminPinEncrypted
        ? decryptSensitiveData(String(fsData.superadminPinEncrypted))
        : String(fsData.superadminPin || '');
      const decDev = fsData.developerPinEncrypted
        ? decryptSensitiveData(String(fsData.developerPinEncrypted))
        : String(fsData.developerPin || '');
      if (decSuper && /^\d{6}$/.test(decSuper.trim())) fsSuperPin = decSuper.trim();
      if (decDev && /^\d{6}$/.test(decDev.trim())) fsDevPin = decDev.trim();
      if (typeof fsData.superadminPinHash === 'string' && fsData.superadminPinHash) fsSuperHash = fsData.superadminPinHash;
      if (typeof fsData.developerPinHash === 'string' && fsData.developerPinHash) fsDevHash = fsData.developerPinHash;
    }
  } catch {}

  const preferFsSuper = fsSuperPin || fsSuperHash ? fsUpdatedAt > sbUpdatedAt || (!sbSuperPin && !sbSuperHash) : false;
  const preferFsDev = fsDevPin || fsDevHash ? fsUpdatedAt > sbUpdatedAt || (!sbDevPin && !sbDevHash) : false;

  const fallbackSuper = process.env.SUPERADMIN_PIN || '150109';
  const fallbackDev = process.env.DEVELOPER_PIN || '150109';

  return {
    superadminPin: preferFsSuper ? fsSuperPin || sbSuperPin || fallbackSuper : sbSuperPin || fsSuperPin || fallbackSuper,
    superadminPinHash: preferFsSuper ? fsSuperHash || sbSuperHash : sbSuperHash || fsSuperHash,
    developerPin: preferFsDev ? fsDevPin || sbDevPin || fallbackDev : sbDevPin || fsDevPin || fallbackDev,
    developerPinHash: preferFsDev ? fsDevHash || sbDevHash : sbDevHash || fsDevHash,
    updatedAt: Math.max(sbUpdatedAt, fsUpdatedAt, 0),
  };
}

async function findActiveSuperadminByPin(cleanPin: string) {
  const mergedMap = new Map<string, any>();
  const pushRow = (row: any) => {
    if (!row || !row.id) return;
    const d = row.data && typeof row.data === 'object' ? row.data : row;
    const uname = String(row.username || d.username || '').trim();
    const passHash = String(row.passwordHash || d.passwordHash || '').trim();
    if (uname === row.id && !passHash && !d.pinEncrypted && !d.pinHash) return;
    const nextTs = Number(row.lastUpdatedTimestamp || d.lastUpdatedTimestamp || 0);
    const prev = mergedMap.get(row.id);
    if (!prev || nextTs >= Number(prev?.lastUpdatedTimestamp || 0)) {
      mergedMap.set(row.id, {
        id: row.id,
        username: uname || row.id,
        namaAdmin: row.namaAdmin || d.namaAdmin || uname || row.id,
        wilayahTugas: row.wilayahTugas || d.wilayahTugas || 'PROVINSI JAWA BARAT',
        isFrozen: row.isFrozen === true || d.isFrozen === true,
        statusAkun: row.statusAkun || d.statusAkun || 'AKTIF',
        statusActive: row.statusActive || d.statusActive || 'SAH_TERDAFTAR',
        allowedPillars: Array.isArray(row.allowedPillars) ? row.allowedPillars : Array.isArray(d.allowedPillars) ? d.allowedPillars : ['all'],
        allowedKepahlawanan: Array.isArray(row.allowedKepahlawanan) ? row.allowedKepahlawanan : Array.isArray(d.allowedKepahlawanan) ? d.allowedKepahlawanan : ['all'],
        pinEncrypted: String(row.pinEncrypted || d.pinEncrypted || '').trim(),
        pinHash: String(row.pinHash || d.pinHash || '').trim(),
        pinOtoritas: String(row.pinOtoritas || d.pinOtoritas || '').trim(),
        lastUpdatedTimestamp: nextTs,
      });
    }
  };

  try {
    const { data } = await supabase.from('superadmin_accounts').select('*');
    if (Array.isArray(data)) data.forEach(pushRow);
  } catch {}

  try {
    const db = getDb();
    const snap = await getDocs(collection(db, 'superadmin_accounts'));
    snap.forEach((docSnap) => pushRow({ id: docSnap.id, ...docSnap.data() }));
  } catch {}

  const list = Array.from(mergedMap.values()).sort((a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0));
  for (const acc of list) {
    if (acc.isFrozen || acc.statusAkun === 'DIBEKUKAN' || acc.statusActive === 'FROZEN') continue;
    const pPin = extractPersonalPin(acc);
    const pHashMatch = Boolean(acc.pinHash && comparePassword(cleanPin, acc.pinHash));
    if ((pPin && pPin === cleanPin) || pHashMatch) return acc;
  }
  return null;
}

async function findPrivilegedAccount(identifiers: string[], expectedRole?: string) {
  const cleanIds = Array.from(new Set(identifiers.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)));
  if (cleanIds.length === 0) return null;

  const primaryTables =
    expectedRole === 'developer'
      ? ['dev_accounts']
      : expectedRole === 'superadmin'
      ? ['superadmin_accounts']
      : ['dev_accounts', 'superadmin_accounts', 'admin_accounts'];

  const candidates: Array<any> = [];
  const resolveTs = (obj: any, restObj?: any) => Number(obj?.lastUpdatedTimestamp || restObj?.lastUpdatedTimestamp || 0);
  const resolveRoleFrom = (col: string, rawRole?: string, id?: string, uname?: string) => {
    const r = (rawRole || '').toLowerCase().trim();
    const u = (uname || '').toLowerCase().trim();
    if (col === 'dev_accounts' || id === 'adm-dev' || u === 'ilhamfazril') return 'developer';
    if (col === 'superadmin_accounts' || id === 'adm-super' || u.includes('superadmin')) return 'superadmin';
    if (r === 'developer' || r === 'superadmin' || r === 'admin' || r === 'user') return r;
    return 'admin';
  };
  const pushCandidate = (cand: any) => {
    if (!cand) return;
    if (expectedRole && cand.role !== expectedRole) return;
    const hasRealCreds = Boolean(cand.pinEncrypted || cand.pinHash || cand.pinOtoritas || cand.rawData?.passwordHash || cand.rawRow?.passwordHash);
    if (!hasRealCreds && (!cand.username || cand.username === cand.id)) return;
    candidates.push(cand);
  };

  const scanTables = async (tablesToCheck: string[]) => {
    for (const table of tablesToCheck) {
      for (const ident of cleanIds) {
        try {
          let { data, error } = await supabase.from(table).select('*').eq('id', ident).limit(1).maybeSingle();
          if (error || !data) {
            const byUname = await supabase.from(table).select('*').ilike('username', ident.toLowerCase()).limit(1).maybeSingle();
            if (!byUname.error && byUname.data) {
              data = byUname.data;
              error = null;
            }
          }
          if (!error && data) {
            const rest = data.data && typeof data.data === 'object' ? data.data : {};
            const resolvedRole = resolveRoleFrom(table, data.role || rest.role, data.id, data.username || rest.username);
            pushCandidate({
              id: data.id,
              table,
              sourcePriority: table === 'admin_accounts' ? 1 : 2,
              lastUpdatedTimestamp: resolveTs(data, rest),
              username: data.username || rest.username || data.id,
              namaAdmin: data.namaAdmin || rest.namaAdmin || data.username || data.id,
              role: resolvedRole,
              statusActive: data.statusActive || rest.statusActive || 'SAH_TERDAFTAR',
              wilayahTugas: data.wilayahTugas || rest.wilayahTugas || (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
              isFrozen: data.isFrozen === true || rest.isFrozen === true,
              statusAkun: data.statusAkun || rest.statusAkun || 'AKTIF',
              allowedPillars: Array.isArray(data.allowedPillars) ? data.allowedPillars : Array.isArray(rest.allowedPillars) ? rest.allowedPillars : resolvedRole === 'superadmin' ? ['all'] : undefined,
              allowedKepahlawanan: Array.isArray(data.allowedKepahlawanan) ? data.allowedKepahlawanan : Array.isArray(rest.allowedKepahlawanan) ? rest.allowedKepahlawanan : resolvedRole === 'superadmin' ? ['all'] : undefined,
              pinEncrypted: String(data.pinEncrypted || rest.pinEncrypted || '').trim(),
              pinHash: String(data.pinHash || rest.pinHash || '').trim(),
              pinOtoritas: String(data.pinOtoritas || rest.pinOtoritas || '').trim(),
              rawData: rest,
              rawRow: data,
            });
          }
        } catch {}
      }
    }

    try {
      const db = getDb();
      for (const colName of tablesToCheck) {
        let foundInCol = false;
        for (const ident of cleanIds) {
          try {
            const directSnap = await getDoc(doc(db, colName, ident));
            if (directSnap.exists()) {
              const d = directSnap.data();
              const resolvedRole = resolveRoleFrom(colName, d.role, directSnap.id, d.username);
              foundInCol = true;
              pushCandidate({
                id: directSnap.id,
                table: colName,
                sourcePriority: colName === 'admin_accounts' ? 1 : 2,
                lastUpdatedTimestamp: resolveTs(d),
                username: d.username || directSnap.id,
                namaAdmin: d.namaAdmin || d.username || directSnap.id,
                role: resolvedRole,
                statusActive: d.statusActive || 'SAH_TERDAFTAR',
                wilayahTugas: d.wilayahTugas || (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
                isFrozen: d.isFrozen === true,
                statusAkun: d.statusAkun || 'AKTIF',
                allowedPillars: Array.isArray(d.allowedPillars) ? d.allowedPillars : resolvedRole === 'superadmin' ? ['all'] : undefined,
                allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan) ? d.allowedKepahlawanan : resolvedRole === 'superadmin' ? ['all'] : undefined,
                pinEncrypted: String(d.pinEncrypted || '').trim(),
                pinHash: String(d.pinHash || '').trim(),
                pinOtoritas: String(d.pinOtoritas || '').trim(),
                rawData: d,
              });
            }
            const snap = await getDocs(query(collection(db, colName), where('username', '==', ident.toLowerCase())));
            if (!snap.empty) {
              foundInCol = true;
              const docSnap = snap.docs[0];
              const d = docSnap.data();
              const resolvedRole = resolveRoleFrom(colName, d.role, docSnap.id, d.username);
              pushCandidate({
                id: docSnap.id,
                table: colName,
                sourcePriority: colName === 'admin_accounts' ? 1 : 2,
                lastUpdatedTimestamp: resolveTs(d),
                username: d.username || docSnap.id,
                namaAdmin: d.namaAdmin || d.username || docSnap.id,
                role: resolvedRole,
                statusActive: d.statusActive || 'SAH_TERDAFTAR',
                wilayahTugas: d.wilayahTugas || (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
                isFrozen: d.isFrozen === true,
                statusAkun: d.statusAkun || 'AKTIF',
                allowedPillars: Array.isArray(d.allowedPillars) ? d.allowedPillars : resolvedRole === 'superadmin' ? ['all'] : undefined,
                allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan) ? d.allowedKepahlawanan : resolvedRole === 'superadmin' ? ['all'] : undefined,
                pinEncrypted: String(d.pinEncrypted || '').trim(),
                pinHash: String(d.pinHash || '').trim(),
                pinOtoritas: String(d.pinOtoritas || '').trim(),
                rawData: d,
              });
            }
          } catch {}
        }
        if (!foundInCol && (colName === 'dev_accounts' || colName === 'superadmin_accounts')) {
          try {
            const allSnap = await getDocs(collection(db, colName));
            const lowerSet = new Set(cleanIds.map((id) => id.toLowerCase()));
            allSnap.forEach((docSnap) => {
              const d = docSnap.data();
              const unameLower = String(d.username || '').toLowerCase().trim();
              if (lowerSet.has(docSnap.id.toLowerCase().trim()) || (unameLower && lowerSet.has(unameLower))) {
                const resolvedRole = resolveRoleFrom(colName, d.role, docSnap.id, d.username);
                pushCandidate({
                  id: docSnap.id,
                  table: colName,
                  sourcePriority: 2,
                  lastUpdatedTimestamp: resolveTs(d),
                  username: d.username || docSnap.id,
                  namaAdmin: d.namaAdmin || d.username || docSnap.id,
                  role: resolvedRole,
                  statusActive: d.statusActive || 'SAH_TERDAFTAR',
                  wilayahTugas: d.wilayahTugas || (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
                  isFrozen: d.isFrozen === true,
                  statusAkun: d.statusAkun || 'AKTIF',
                  allowedPillars: Array.isArray(d.allowedPillars) ? d.allowedPillars : resolvedRole === 'superadmin' ? ['all'] : undefined,
                  allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan) ? d.allowedKepahlawanan : resolvedRole === 'superadmin' ? ['all'] : undefined,
                  pinEncrypted: String(d.pinEncrypted || '').trim(),
                  pinHash: String(d.pinHash || '').trim(),
                  pinOtoritas: String(d.pinOtoritas || '').trim(),
                  rawData: d,
                });
              }
            });
          } catch {}
        }
      }
    } catch {}
  };

  await scanTables(primaryTables);
  if (candidates.length === 0 && (expectedRole === 'developer' || expectedRole === 'superadmin')) {
    await scanTables(['admin_accounts']);
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if ((b.lastUpdatedTimestamp || 0) !== (a.lastUpdatedTimestamp || 0)) {
      return (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0);
    }
    if ((b.sourcePriority || 0) !== (a.sourcePriority || 0)) {
      return (b.sourcePriority || 0) - (a.sourcePriority || 0);
    }
    return (b.pinEncrypted ? 1 : 0) - (a.pinEncrypted ? 1 : 0);
  });

  return candidates[0];
}

const pinRateLimitMap = new Map<string, { attempts: number; firstAttempt: number; lockUntil: number }>();

function checkPinRateLimit(key: string) {
  const now = Date.now();
  const record = pinRateLimitMap.get(key);
  if (!record) return { locked: false, waitSeconds: 0, remaining: 5 };
  if (record.lockUntil > now) return { locked: true, waitSeconds: Math.ceil((record.lockUntil - now) / 1000), remaining: 0 };
  if (now > record.firstAttempt + 15 * 60 * 1000) {
    pinRateLimitMap.delete(key);
    return { locked: false, waitSeconds: 0, remaining: 5 };
  }
  return { locked: false, waitSeconds: 0, remaining: Math.max(0, 5 - record.attempts) };
}

function recordFailedPinAttempt(key: string) {
  const now = Date.now();
  let record = pinRateLimitMap.get(key);
  if (!record) {
    record = { attempts: 0, firstAttempt: now, lockUntil: 0 };
    pinRateLimitMap.set(key, record);
  }
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000;
    return { locked: true, waitSeconds: 900, remaining: 0 };
  }
  return { locked: false, waitSeconds: 0, remaining: Math.max(0, 5 - record.attempts) };
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });

  try {
    const body = await parseBody(req);
    const { pin, targetRole, challengeToken, username, userId, nama } = body || {};
    const ip = getClientIp(req);
    const rateLimitKey = `${ip}:${String(targetRole || 'any').toLowerCase().trim()}:${String(username || userId || 'card').toLowerCase().trim()}`;

    const rateCheck = checkPinRateLimit(rateLimitKey);
    if (rateCheck.locked) {
      return sendJson(res, 429, {
        valid: false,
        locked: true,
        lockoutRemaining: rateCheck.waitSeconds,
        message: `⚠️ Terlalu banyak percobaan PIN salah. Akses PIN dikunci sementara demi keamanan. Coba lagi dalam ${rateCheck.waitSeconds} detik.`,
      });
    }

    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
      return sendJson(res, 400, { valid: false, message: 'PIN wajib berupa tepat 6 digit angka.' });
    }

    if (challengeToken && typeof challengeToken === 'string') {
      if (!verifyCardChallengeToken(challengeToken, targetRole)) {
        return sendJson(res, 401, {
          valid: false,
          message: 'Token kartu akses fisik telah kedaluwarsa atau tidak sah. Silakan tap/scan ulang kartu fisik Anda.',
        });
      }
    }

    const cleanPin = pin.trim();
    const globalPins = await resolveGlobalPinsFromDatabases();
    const isGlobalSuperMatch =
      cleanPin === globalPins.superadminPin ||
      Boolean(globalPins.superadminPinHash && comparePassword(cleanPin, globalPins.superadminPinHash));
    const isGlobalDevMatch =
      cleanPin === globalPins.developerPin ||
      Boolean(globalPins.developerPinHash && comparePassword(cleanPin, globalPins.developerPinHash));

    const hasExplicitIdentity = Boolean(
      (typeof userId === 'string' && userId.trim().length > 0) ||
      (typeof username === 'string' && username.trim().length > 0)
    );

    const lookupIdentifiers = hasExplicitIdentity
      ? [userId, username].filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      : [nama].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

    let matchedAcc = await findPrivilegedAccount(lookupIdentifiers, targetRole);

    if (matchedAcc && (matchedAcc.isFrozen || matchedAcc.statusAkun === 'DIBEKUKAN' || matchedAcc.statusActive === 'FROZEN')) {
      return sendJson(res, 403, { valid: false, message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan oleh Administrator.' });
    }

    const personalPin = extractPersonalPin(matchedAcc);
    const personalPinHashMatch = Boolean(matchedAcc?.pinHash && comparePassword(cleanPin, matchedAcc.pinHash));
    const hasPersonalPin = Boolean(personalPin || matchedAcc?.pinHash);
    const accTs = Number(matchedAcc?.lastUpdatedTimestamp || 0);
    const isGlobalNewerThanAcc = globalPins.updatedAt > accTs;
    const isRootDevAcc = !matchedAcc || matchedAcc.id === 'adm-dev' || String(matchedAcc.username || '').toLowerCase() === 'ilhamfazril';
    const isRootSuperAcc =
      !matchedAcc ||
      matchedAcc.id === 'adm-super' ||
      ['superadmin', 'superadmin jabar', 'superadmin_jabar'].includes(String(matchedAcc.username || '').toLowerCase());

    let isMatch = false;
    let authorizedRole = '';

    if (targetRole === 'developer') {
      const personalMatches = cleanPin === personalPin || personalPinHashMatch;
      isMatch = hasPersonalPin ? personalMatches || (isRootDevAcc && isGlobalNewerThanAcc && isGlobalDevMatch) : isGlobalDevMatch;
      if (!isMatch && !hasExplicitIdentity && isGlobalDevMatch) isMatch = true;
      authorizedRole = 'developer';
    } else if (targetRole === 'superadmin') {
      if (hasExplicitIdentity) {
        const personalMatches = cleanPin === personalPin || personalPinHashMatch;
        isMatch = hasPersonalPin ? personalMatches || (isRootSuperAcc && isGlobalNewerThanAcc && isGlobalSuperMatch) : isGlobalSuperMatch;
      } else {
        if (hasPersonalPin && (cleanPin === personalPin || personalPinHashMatch)) {
          isMatch = true;
        } else if (isGlobalSuperMatch) {
          isMatch = true;
        } else {
          const matchedSuperByPin = await findActiveSuperadminByPin(cleanPin);
          if (matchedSuperByPin) {
            matchedAcc = matchedSuperByPin;
            isMatch = true;
          }
        }
      }
      authorizedRole = 'superadmin';
    } else {
      const superMatch = hasPersonalPin ? cleanPin === personalPin || personalPinHashMatch : isGlobalSuperMatch;
      if (isGlobalDevMatch) {
        isMatch = true;
        authorizedRole = 'developer';
      } else if (superMatch) {
        isMatch = true;
        authorizedRole = 'superadmin';
      } else if (!hasExplicitIdentity) {
        const matchedSuperByPin = await findActiveSuperadminByPin(cleanPin);
        if (matchedSuperByPin) {
          matchedAcc = matchedSuperByPin;
          isMatch = true;
          authorizedRole = 'superadmin';
        }
      }
    }

    if (!isMatch) {
      const failRecord = recordFailedPinAttempt(rateLimitKey);
      if (failRecord.locked) {
        return sendJson(res, 429, {
          valid: false,
          locked: true,
          lockoutRemaining: failRecord.waitSeconds,
          message: '⚠️ 5 kali percobaan PIN salah berturut-turut! Sistem otorisasi dibekukan selama 15 menit demi mencegah brute force.',
        });
      }
      return sendJson(res, 401, {
        valid: false,
        locked: false,
        remainingAttempts: failRecord.remaining,
        message: `❌ 6 Digit PIN Otoritas salah. Sisa kesempatan sebelum dibekukan: ${failRecord.remaining} kali.`,
      });
    }

    pinRateLimitMap.delete(rateLimitKey);

    let finalAcc = matchedAcc;
    if (!finalAcc) {
      finalAcc = await findPrivilegedAccount(
        authorizedRole === 'developer' ? ['adm-dev', 'ilhamfazril'] : ['adm-super', 'superadmin jabar', 'superadmin'],
        authorizedRole
      );
    }

    const resolvedId = finalAcc?.id || (authorizedRole === 'developer' ? 'adm-dev' : 'adm-super');
    const resolvedUsername = finalAcc?.username || (authorizedRole === 'developer' ? 'ilhamfazril' : 'superadmin jabar');
    const resolvedNama = finalAcc?.namaAdmin || nama || (authorizedRole === 'developer' ? 'Ilham Fazril' : 'Superadmin Jabar');
    const resolvedWilayah = finalAcc?.wilayahTugas || (authorizedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT');
    const resolvedAllowedPillars =
      authorizedRole === 'superadmin' ? (Array.isArray(finalAcc?.allowedPillars) ? finalAcc.allowedPillars : ['all']) : undefined;
    const resolvedAllowedKepahlawanan =
      authorizedRole === 'superadmin' ? (Array.isArray(finalAcc?.allowedKepahlawanan) ? finalAcc.allowedKepahlawanan : ['all']) : undefined;
    const resolvedPinOtoritas = extractPersonalPin(finalAcc) || cleanPin;

    const authorityToken = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${authorizedRole}_${resolvedId}_${Date.now() + 30 * 60 * 1000}`)
      .digest('hex');

    const sessionToken = signSessionToken({
      id: resolvedId,
      username: resolvedUsername,
      role: authorizedRole,
      namaAdmin: resolvedNama,
      wilayahTugas: resolvedWilayah,
      statusActive: 'SAH_TERDAFTAR',
      allowedPillars: resolvedAllowedPillars,
      allowedKepahlawanan: resolvedAllowedKepahlawanan,
      pinOtoritas: resolvedPinOtoritas,
    });

    return sendJson(res, 200, {
      valid: true,
      role: authorizedRole,
      id: resolvedId,
      username: resolvedUsername,
      authorityToken,
      sessionToken,
      nama: resolvedNama,
      wilayah: resolvedWilayah,
      allowedPillars: resolvedAllowedPillars,
      allowedKepahlawanan: resolvedAllowedKepahlawanan,
      pinOtoritas: resolvedPinOtoritas,
      message: `Verifikasi PIN 6 digit sah. Otoritas ${authorizedRole} disetujui.`,
    });
  } catch (err: any) {
    console.error('[Vercel Verify PIN Error]:', err);
    return sendJson(res, 500, { valid: false, message: 'Terjadi kesalahan sistem saat memvalidasi PIN.' });
  }
}
