import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://zwjbjmafxixudhlvaxef.supabase.co';

export const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_-Q49NtwnUsY9oF3jpRXEmw_J82UN4Uy';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

export const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.VITE_SESSION_SECRET ||
  'psks_jabar_production_auth_secret_2026_super_secure_key';

const PII_SECRET_KEY =
  process.env.PII_SECRET_KEY ||
  process.env.VITE_PII_SECRET_KEY ||
  process.env.SESSION_SECRET ||
  process.env.VITE_SESSION_SECRET ||
  'PSKS_JABAR_AES256_PII_SECRET_KEY_998822';

const SALT_ROUNDS = 10;

export function hashPassword(plainText: string): string {
  if (!plainText) return '';
  return bcrypt.hashSync(plainText, SALT_ROUNDS);
}

export function comparePassword(plainText: string, storedHash?: string): boolean {
  if (!plainText || !storedHash) return false;
  const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(storedHash);
  if (!isBcrypt) return false;
  try {
    return bcrypt.compareSync(plainText, storedHash);
  } catch {
    return false;
  }
}

export function encryptSensitiveData(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('ENC::')) return trimmed;
  try {
    const encrypted = CryptoJS.AES.encrypt(trimmed, PII_SECRET_KEY).toString();
    return `ENC::${encrypted}`;
  } catch {
    return trimmed;
  }
}

export function decryptSensitiveData(cipherOrPlain: string): string {
  if (!cipherOrPlain || typeof cipherOrPlain !== 'string') return '';
  const trimmed = cipherOrPlain.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('ENC::')) return trimmed;
  try {
    const cipherBody = trimmed.slice(5);
    const bytes = CryptoJS.AES.decrypt(cipherBody, PII_SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || trimmed;
  } catch {
    return trimmed;
  }
}

export function hashSearchableField(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const raw = decryptSensitiveData(plainText).trim();
  if (!raw) return '';
  return CryptoJS.SHA256(`psks_field_${raw}`).toString(CryptoJS.enc.Hex);
}

export function sendJson(res: any, statusCode: number, data: any) {
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

export function handleCors(req: any, res: any, methods: string = 'GET, POST, OPTIONS'): boolean {
  const origin = req.headers?.origin || req.headers?.referer || '';
  let matchedOrigin = '';
  if (origin) {
    try {
      const url = origin.startsWith('http') ? new URL(origin) : null;
      const testOrigin = url ? url.origin : origin;
      if (ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(testOrigin))) {
        matchedOrigin = testOrigin;
      }
    } catch {}
  }

  res.setHeader('Access-Control-Allow-Origin', matchedOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
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

export async function parseBody(req: any): Promise<any> {
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

export function getClientIp(req: any): string {
  const rawForwarded = req.headers?.['x-forwarded-for'];
  const xRealIp = req.headers?.['x-real-ip'];
  const cfConnectingIp = req.headers?.['cf-connecting-ip'];
  const xClientIp = req.headers?.['x-client-ip'];

  let ip = '';
  if (typeof rawForwarded === 'string' && rawForwarded.trim()) {
    ip = rawForwarded.split(',')[0].trim();
  } else if (Array.isArray(rawForwarded) && rawForwarded.length > 0) {
    ip = String(rawForwarded[0]).trim();
  } else if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
    ip = cfConnectingIp.trim();
  } else if (typeof xRealIp === 'string' && xRealIp.trim()) {
    ip = xRealIp.trim();
  } else if (typeof xClientIp === 'string' && xClientIp.trim()) {
    ip = xClientIp.trim();
  } else {
    ip = req.socket?.remoteAddress || '127.0.0.1';
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
}

export interface VerifiedSessionPayload {
  id: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin' | 'developer';
  namaAdmin: string;
  wilayahTugas: string;
  statusActive: string;
  issuedAt: number;
  expiresAt: number;
  allowedPillars?: string[];
  allowedKepahlawanan?: string[];
  pinOtoritas?: string;
}

export function signSessionToken(payload: Omit<VerifiedSessionPayload, 'issuedAt' | 'expiresAt'>): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 7 * 24 * 60 * 60 * 1000;
  const fullPayload: VerifiedSessionPayload = { ...payload, issuedAt, expiresAt };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `ses_${data}.${signature}`;
}

export function verifySessionToken(token: string): VerifiedSessionPayload | null {
  if (!token || typeof token !== 'string' || !token.startsWith('ses_')) return null;
  const tokenBody = token.slice(4);
  const parts = tokenBody.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!data || !signature) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload: VerifiedSessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractTokenFromReq(req: any, body?: any): string {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const tokenFromHeader =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return (
    tokenFromHeader ||
    (typeof req.headers?.['x-session-token'] === 'string' ? req.headers['x-session-token'].trim() : '') ||
    (body && typeof body.sessionToken === 'string' ? body.sessionToken.trim() : '')
  );
}

export function verifyCardChallengeToken(token: string, expectedRole?: string): boolean {
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

let cachedFirestoreModule: { firestore: typeof import('firebase/firestore'); db: any } | null = null;

export async function getServerFirestore() {
  if (cachedFirestoreModule) return cachedFirestoreModule;
  const appMod = await import('firebase/app');
  const fsMod = await import('firebase/firestore');

  let firebaseConfig: Record<string, any> = {};
  const candidates = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(process.cwd(), '..', 'firebase-applet-config.json'),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        break;
      }
    } catch {}
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    try {
      const mod = await import('../firebase-applet-config.json', { with: { type: 'json' } } as any);
      firebaseConfig = (mod as any).default || mod;
    } catch {}
  }

  const app = !appMod.getApps().length ? appMod.initializeApp(firebaseConfig) : appMod.getApp();
  const databaseId = firebaseConfig.firestoreDatabaseId;
  const db = databaseId ? fsMod.getFirestore(app, databaseId) : fsMod.getFirestore(app);
  cachedFirestoreModule = { firestore: fsMod, db };
  return cachedFirestoreModule;
}

export const DEFAULT_ROOT_ACCOUNTS = [
  {
    id: 'adm-super',
    username: 'superadmin jabar',
    namaAdmin: 'Super Admin Dinsos Jabar',
    role: 'superadmin' as const,
    wilayahTugas: 'PROVINSI JAWA BARAT',
    passwordHash: '$2b$10$B7ARJFwaXeU8CWUqGfu2ye5nsB3xNCxDsWFIz//n3aoanD4uNGr1u',
  },
  {
    id: 'adm-dev',
    username: 'ilhamfazril',
    namaAdmin: 'Developer System',
    role: 'developer' as const,
    wilayahTugas: 'Pusat Developer Jabar',
    passwordHash: '$2b$10$t30kcIcKMvSLvy.UjpqNkec5j52dqLCXX7F6hffvdYyWe7cbYeKji',
  },
];

export async function resolveGlobalPinsFromDatabases() {
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
    const { firestore, db } = await getServerFirestore();
    const snap = await firestore.getDoc(firestore.doc(db, 'app_settings', 'global'));
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

export function extractPersonalPin(acc: { pinOtoritas?: string; pinEncrypted?: string } | null | undefined): string {
  if (!acc) return '';
  if (acc.pinEncrypted) {
    try {
      const dec = decryptSensitiveData(acc.pinEncrypted).trim();
      if (/^\d{6}$/.test(dec)) return dec;
    } catch {}
  }
  if (acc.pinOtoritas && /^\d{6}$/.test(acc.pinOtoritas.trim())) {
    return acc.pinOtoritas.trim();
  }
  return '';
}

export async function findActiveSuperadminByPin(cleanPin: string) {
  const mergedMap = new Map<string, any>();
  const pushRow = (row: any) => {
    if (!row || !row.id) return;
    const d = row.data && typeof row.data === 'object' ? row.data : row;
    const uname = String(row.username || d.username || '').trim();
    const passHash = String(row.passwordHash || d.passwordHash || '').trim();
    if (uname === row.id && !passHash && !d.pinEncrypted && !d.pinHash) return;
    const nextTs = Number(row.lastUpdatedTimestamp || d.lastUpdatedTimestamp || 0);
    const prev = mergedMap.get(row.id);
    const prevTs = Number(prev?.lastUpdatedTimestamp || 0);
    if (!prev || nextTs >= prevTs) {
      mergedMap.set(row.id, {
        id: row.id,
        username: uname || row.id,
        namaAdmin: row.namaAdmin || d.namaAdmin || uname || row.id,
        wilayahTugas: row.wilayahTugas || d.wilayahTugas || 'PROVINSI JAWA BARAT',
        isFrozen: row.isFrozen === true || d.isFrozen === true,
        statusAkun: row.statusAkun || d.statusAkun || 'AKTIF',
        statusActive: row.statusActive || d.statusActive || 'SAH_TERDAFTAR',
        allowedPillars: Array.isArray(row.allowedPillars)
          ? row.allowedPillars
          : Array.isArray(d.allowedPillars)
          ? d.allowedPillars
          : ['all'],
        allowedKepahlawanan: Array.isArray(row.allowedKepahlawanan)
          ? row.allowedKepahlawanan
          : Array.isArray(d.allowedKepahlawanan)
          ? d.allowedKepahlawanan
          : ['all'],
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
    const { firestore, db } = await getServerFirestore();
    const snap = await firestore.getDocs(firestore.collection(db, 'superadmin_accounts'));
    snap.forEach((docSnap) => pushRow({ id: docSnap.id, ...docSnap.data() }));
  } catch {}

  const list = Array.from(mergedMap.values()).sort(
    (a, b) => (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0)
  );

  for (const acc of list) {
    if (acc.isFrozen || acc.statusAkun === 'DIBEKUKAN' || acc.statusActive === 'FROZEN') continue;
    const pPin = extractPersonalPin(acc);
    const pHashMatch = Boolean(acc.pinHash && comparePassword(cleanPin, acc.pinHash));
    if ((pPin && pPin === cleanPin) || pHashMatch) {
      return acc;
    }
  }
  return null;
}

export async function findPrivilegedAccount(identifiers: string[], expectedRole?: 'developer' | 'superadmin' | string) {
  const cleanIds = Array.from(
    new Set(identifiers.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean))
  );
  if (cleanIds.length === 0) return null;

  const primaryTables =
    expectedRole === 'developer'
      ? ['dev_accounts']
      : expectedRole === 'superadmin'
      ? ['superadmin_accounts']
      : ['dev_accounts', 'superadmin_accounts', 'admin_accounts'];

  const candidates: Array<any> = [];

  const resolveTs = (obj: any, restObj?: any) =>
    Number(obj?.lastUpdatedTimestamp || restObj?.lastUpdatedTimestamp || 0);

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
    const hasRealCreds = Boolean(
      cand.pinEncrypted || cand.pinHash || cand.pinOtoritas || cand.rawData?.passwordHash || cand.rawRow?.passwordHash
    );
    if (!hasRealCreds && (!cand.username || cand.username === cand.id)) return;
    candidates.push(cand);
  };

  const scanTables = async (tablesToCheck: string[]) => {
    for (const table of tablesToCheck) {
      for (const ident of cleanIds) {
        const lower = ident.toLowerCase();
        try {
          let { data, error } = await supabase.from(table).select('*').eq('id', ident).limit(1).maybeSingle();
          if (error || !data) {
            const byUname = await supabase.from(table).select('*').ilike('username', lower).limit(1).maybeSingle();
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
              wilayahTugas:
                data.wilayahTugas ||
                rest.wilayahTugas ||
                (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
              isFrozen: data.isFrozen === true || rest.isFrozen === true,
              statusAkun: data.statusAkun || rest.statusAkun || 'AKTIF',
              allowedPillars: Array.isArray(data.allowedPillars)
                ? data.allowedPillars
                : Array.isArray(rest.allowedPillars)
                ? rest.allowedPillars
                : resolvedRole === 'superadmin'
                ? ['all']
                : undefined,
              allowedKepahlawanan: Array.isArray(data.allowedKepahlawanan)
                ? data.allowedKepahlawanan
                : Array.isArray(rest.allowedKepahlawanan)
                ? rest.allowedKepahlawanan
                : resolvedRole === 'superadmin'
                ? ['all']
                : undefined,
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
      const { firestore, db } = await getServerFirestore();
      for (const colName of tablesToCheck) {
        let foundInCol = false;
        for (const ident of cleanIds) {
          try {
            const directSnap = await firestore.getDoc(firestore.doc(db, colName, ident));
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
                wilayahTugas:
                  d.wilayahTugas || (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
                isFrozen: d.isFrozen === true,
                statusAkun: d.statusAkun || 'AKTIF',
                allowedPillars: Array.isArray(d.allowedPillars)
                  ? d.allowedPillars
                  : resolvedRole === 'superadmin'
                  ? ['all']
                  : undefined,
                allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan)
                  ? d.allowedKepahlawanan
                  : resolvedRole === 'superadmin'
                  ? ['all']
                  : undefined,
                pinEncrypted: String(d.pinEncrypted || '').trim(),
                pinHash: String(d.pinHash || '').trim(),
                pinOtoritas: String(d.pinOtoritas || '').trim(),
                rawData: d,
              });
            }
            const q = firestore.query(
              firestore.collection(db, colName),
              firestore.where('username', '==', ident.toLowerCase())
            );
            const snap = await firestore.getDocs(q);
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
                wilayahTugas:
                  d.wilayahTugas || (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
                isFrozen: d.isFrozen === true,
                statusAkun: d.statusAkun || 'AKTIF',
                allowedPillars: Array.isArray(d.allowedPillars)
                  ? d.allowedPillars
                  : resolvedRole === 'superadmin'
                  ? ['all']
                  : undefined,
                allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan)
                  ? d.allowedKepahlawanan
                  : resolvedRole === 'superadmin'
                  ? ['all']
                  : undefined,
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
            const allSnap = await firestore.getDocs(firestore.collection(db, colName));
            const lowerSet = new Set(cleanIds.map((id) => id.toLowerCase()));
            allSnap.forEach((docSnap) => {
              const d = docSnap.data();
              const unameLower = String(d.username || '').toLowerCase().trim();
              const idLower = docSnap.id.toLowerCase().trim();
              if (lowerSet.has(idLower) || (unameLower && lowerSet.has(unameLower))) {
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
                  wilayahTugas:
                    d.wilayahTugas || (resolvedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT'),
                  isFrozen: d.isFrozen === true,
                  statusAkun: d.statusAkun || 'AKTIF',
                  allowedPillars: Array.isArray(d.allowedPillars)
                    ? d.allowedPillars
                    : resolvedRole === 'superadmin'
                    ? ['all']
                    : undefined,
                  allowedKepahlawanan: Array.isArray(d.allowedKepahlawanan)
                    ? d.allowedKepahlawanan
                    : resolvedRole === 'superadmin'
                    ? ['all']
                    : undefined,
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
