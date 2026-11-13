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
  if (typeof res.status === 'function') return res.status(statusCode).json(data);
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

function signSessionToken(payload: Record<string, any>): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 7 * 24 * 60 * 60 * 1000;
  const data = Buffer.from(JSON.stringify({ ...payload, issuedAt, expiresAt })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `ses_${data}.${signature}`;
}

const DEFAULT_ROOT_ACCOUNTS = [
  {
    id: 'adm-super',
    username: 'superadmin jabar',
    namaAdmin: 'Super Admin Dinsos Jabar',
    role: 'superadmin',
    wilayahTugas: 'PROVINSI JAWA BARAT',
    passwordHash: '$2b$10$B7ARJFwaXeU8CWUqGfu2ye5nsB3xNCxDsWFIz//n3aoanD4uNGr1u',
  },
  {
    id: 'adm-dev',
    username: 'ilhamfazril',
    namaAdmin: 'Developer System',
    role: 'developer',
    wilayahTugas: 'Pusat Developer Jabar',
    passwordHash: '$2b$10$t30kcIcKMvSLvy.UjpqNkec5j52dqLCXX7F6hffvdYyWe7cbYeKji',
  },
];

const loginAttempts = new Map<string, { count: number; firstTime: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstTime > 60000) {
    loginAttempts.set(ip, { count: 1, firstTime: now });
    return true;
  }
  entry.count++;
  return entry.count <= 60;
}

export default async function handler(req: any, res: any) {
  try {
    if (handleCors(req, res)) return;
    if (req.method !== 'POST') return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });

    const clientIp = getClientIp(req);
    if (!checkRateLimit(clientIp)) {
      return sendJson(res, 429, { valid: false, message: '⚠️ Terlalu banyak percobaan login dalam waktu singkat. Harap tunggu 1 menit.' });
    }

    const body = await parseBody(req);
    const { username, password } = body || {};
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return sendJson(res, 400, { valid: false, message: 'Nama Pengguna dan Kata Sandi wajib diisi.' });
    }

    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();
    const loginCandidates: Array<any> = [];
    const sbTablesToCheck = ['dev_accounts', 'superadmin_accounts', 'admin_accounts', 'user_accounts'];

    for (const t of sbTablesToCheck) {
      try {
        let { data, error } = await supabase.from(t).select('*').ilike('username', uClean).limit(1).maybeSingle();
        if (error || !data) {
          const byId = await supabase.from(t).select('*').eq('id', uClean).limit(1).maybeSingle();
          if (!byId.error && byId.data) {
            data = byId.data;
            error = null;
          }
        }
        if (!error && data) {
          const restData = data.data && typeof data.data === 'object' ? data.data : {};
          const pinEnc = data.pinEncrypted || restData.pinEncrypted || '';
          const decPin = pinEnc ? decryptSensitiveData(String(pinEnc)) : '';
          const resolvedPin = (/^\d{6}$/.test(decPin) ? decPin : '') || data.pinOtoritas || restData.pinOtoritas || '';
          const passHash = data.passwordHash || restData.passwordHash || '';
          if (!passHash && !pinEnc && !data.username && !restData.username) continue;
          loginCandidates.push({
            id: data.id,
            sourcePriority: t === 'admin_accounts' ? 1 : 2,
            lastUpdatedTimestamp: Number(data.lastUpdatedTimestamp || restData.lastUpdatedTimestamp || 0),
            username: data.username || restData.username || data.id,
            namaAdmin: data.namaAdmin || restData.namaAdmin || data.username,
            role: data.role || restData.role || (t === 'user_accounts' ? 'user' : t === 'superadmin_accounts' ? 'superadmin' : t === 'dev_accounts' ? 'developer' : 'admin'),
            statusActive: data.statusActive || restData.statusActive || 'SAH_TERDAFTAR',
            wilayahTugas: data.wilayahTugas || restData.wilayahTugas || '',
            passwordHash: passHash,
            statusVerval: data.statusVerval || restData.statusVerval || (data.statusActive === 'PENDING_VERIFIKASI' ? 'MENUNGGU_VERIFIKASI' : ''),
            alasanPenolakan: data.alasanPenolakan || restData.alasanPenolakan || '',
            noRegistrasi: data.noRegistrasi || restData.noRegistrasi || '',
            isFrozen: data.isFrozen === true || restData.isFrozen === true,
            statusAkun: data.statusAkun || restData.statusAkun || 'AKTIF',
            resetTicket: data.resetTicket || restData.resetTicket || null,
            allowedPillars: Array.isArray(data.allowedPillars) ? data.allowedPillars : Array.isArray(restData.allowedPillars) ? restData.allowedPillars : ['all'],
            allowedKepahlawanan: Array.isArray(data.allowedKepahlawanan) ? data.allowedKepahlawanan : Array.isArray(restData.allowedKepahlawanan) ? restData.allowedKepahlawanan : ['all'],
            pinOtoritas: resolvedPin,
          });
        }
      } catch {}
    }

    try {
      const db = getDb();
      for (const colName of sbTablesToCheck) {
        let foundInCol = false;
        const mapFsCandidate = (docId: string, data: any) => {
          const pinEnc = data.pinEncrypted || '';
          const decPin = pinEnc ? decryptSensitiveData(String(pinEnc)) : '';
          const resolvedPin = (/^\d{6}$/.test(decPin) ? decPin : '') || data.pinOtoritas || '';
          const passHash = data.passwordHash || '';
          if (!passHash && !pinEnc && !data.username) return;
          foundInCol = true;
          loginCandidates.push({
            id: docId,
            sourcePriority: colName === 'admin_accounts' ? 1 : 2,
            lastUpdatedTimestamp: Number(data.lastUpdatedTimestamp || 0),
            username: data.username || docId,
            namaAdmin: data.namaAdmin || data.username || docId,
            role: data.role || (colName === 'dev_accounts' ? 'developer' : colName === 'superadmin_accounts' ? 'superadmin' : colName === 'user_accounts' ? 'user' : 'admin'),
            statusActive: data.statusActive || 'SAH_TERDAFTAR',
            wilayahTugas: data.wilayahTugas || '',
            passwordHash: passHash,
            statusVerval: data.statusVerval || (data.statusActive === 'PENDING_VERIFIKASI' ? 'MENUNGGU_VERIFIKASI' : ''),
            alasanPenolakan: data.alasanPenolakan || '',
            noRegistrasi: data.noRegistrasi || '',
            isFrozen: data.isFrozen === true,
            statusAkun: data.statusAkun || 'AKTIF',
            resetTicket: data.resetTicket || null,
            allowedPillars: Array.isArray(data.allowedPillars) ? data.allowedPillars : ['all'],
            allowedKepahlawanan: Array.isArray(data.allowedKepahlawanan) ? data.allowedKepahlawanan : ['all'],
            pinOtoritas: resolvedPin,
          });
        };

        const directDoc = await getDoc(doc(db, colName, uClean));
        if (directDoc.exists()) mapFsCandidate(directDoc.id, directDoc.data());
        const snap = await getDocs(query(collection(db, colName), where('username', '==', uClean)));
        if (!snap.empty) mapFsCandidate(snap.docs[0].id, snap.docs[0].data());
        if (!foundInCol && (colName === 'dev_accounts' || colName === 'superadmin_accounts')) {
          const allSnap = await getDocs(collection(db, colName));
          allSnap.forEach((docSnap) => {
            const d = docSnap.data();
            if (String(d.username || '').toLowerCase().trim() === uClean || docSnap.id.toLowerCase() === uClean) {
              mapFsCandidate(docSnap.id, d);
            }
          });
        }
      }
    } catch {}

    loginCandidates.sort((a, b) => {
      if ((b.lastUpdatedTimestamp || 0) !== (a.lastUpdatedTimestamp || 0)) {
        return (b.lastUpdatedTimestamp || 0) - (a.lastUpdatedTimestamp || 0);
      }
      return (b.sourcePriority || 0) - (a.sourcePriority || 0);
    });

    let matchedAccount: any = loginCandidates[0] || null;
    if (!matchedAccount) {
      const def = DEFAULT_ROOT_ACCOUNTS.find((a) => a.username.toLowerCase() === uClean || a.id.toLowerCase() === uClean);
      if (def) {
        matchedAccount = {
          ...def,
          statusActive: 'SAH_TERDAFTAR',
          statusAkun: 'AKTIF',
          allowedPillars: def.role === 'superadmin' ? ['all'] : undefined,
          allowedKepahlawanan: def.role === 'superadmin' ? ['all'] : undefined,
        };
      }
    }

    if (!matchedAccount) {
      return sendJson(res, 401, { valid: false, notFound: true, message: 'Kombinasi Nama Pengguna atau Kata Sandi salah.' });
    }
    if (matchedAccount.isFrozen === true || matchedAccount.statusAkun === 'DIBEKUKAN' || matchedAccount.statusActive === 'FROZEN') {
      return sendJson(res, 403, { valid: false, message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan/dibekukan oleh Administrator.' });
    }

    const tempResetPass = matchedAccount.resetTicket?.status === 'DISETUJUI' ? matchedAccount.resetTicket?.temporaryPassword : '';
    let isValid = false;
    if (tempResetPass && pClean === tempResetPass) isValid = true;
    else if (matchedAccount.passwordHash) isValid = comparePassword(pClean, matchedAccount.passwordHash);

    if (!isValid) {
      return sendJson(res, 401, { valid: false, message: 'Kombinasi Nama Pengguna atau Kata Sandi salah.' });
    }

    if (matchedAccount.role === 'user') {
      const isPending = matchedAccount.statusVerval === 'MENUNGGU_VERIFIKASI' || matchedAccount.statusActive === 'PENDING_VERIFIKASI';
      const isRejected = matchedAccount.statusVerval === 'DITOLAK' || matchedAccount.statusActive === 'DITOLAK';
      if (isPending) {
        return sendJson(res, 403, {
          valid: false,
          isPending: true,
          message: '⏳ AKUN MENUNGGU VERIFIKASI: Pendaftaran akun Anda sedang dalam proses verifikasi oleh Superadmin Dinas Sosial Provinsi Jawa Barat.',
          ticket: {
            username: matchedAccount.username,
            wilayah: matchedAccount.wilayahTugas,
            noRegistrasi: matchedAccount.noRegistrasi || `REG-PSKS-${(matchedAccount.id || '').slice(-6)}`,
          },
        });
      }
      if (isRejected) {
        return sendJson(res, 403, {
          valid: false,
          isRejected: true,
          message: `❌ PENDAFTARAN DITOLAK: Pengajuan akun Anda ditolak oleh Superadmin (${matchedAccount.alasanPenolakan || 'Belum memenuhi syarat'}).`,
        });
      }
    }

    const finalRole =
      matchedAccount.id === 'adm-dev' || uClean === 'ilhamfazril'
        ? 'developer'
        : matchedAccount.id === 'adm-super' || uClean.includes('superadmin')
        ? 'superadmin'
        : matchedAccount.role || 'admin';
    const finalWilayah =
      finalRole === 'superadmin' ? 'PROVINSI JAWA BARAT' : finalRole === 'developer' ? 'Pusat Developer Jabar' : matchedAccount.wilayahTugas || 'Jawa Barat';
    const finalAllowedPillars = Array.isArray(matchedAccount.allowedPillars)
      ? matchedAccount.allowedPillars
      : finalRole === 'superadmin'
      ? ['all']
      : undefined;
    const finalAllowedKepahlawanan = Array.isArray(matchedAccount.allowedKepahlawanan)
      ? matchedAccount.allowedKepahlawanan
      : finalRole === 'superadmin'
      ? ['all']
      : undefined;

    const sessionToken = signSessionToken({
      id: matchedAccount.id,
      username: matchedAccount.username,
      role: finalRole,
      namaAdmin: matchedAccount.namaAdmin,
      wilayahTugas: finalWilayah,
      statusActive: matchedAccount.statusActive,
      allowedPillars: finalAllowedPillars,
      allowedKepahlawanan: finalAllowedKepahlawanan,
      pinOtoritas: matchedAccount.pinOtoritas,
    });

    return sendJson(res, 200, {
      valid: true,
      session: {
        id: matchedAccount.id,
        username: matchedAccount.username,
        namaAdmin: matchedAccount.namaAdmin,
        role: finalRole,
        wilayahTugas: finalWilayah,
        statusActive: matchedAccount.statusActive,
        allowedPillars: finalAllowedPillars,
        allowedKepahlawanan: finalAllowedKepahlawanan,
        pinOtoritas: matchedAccount.pinOtoritas,
        sessionToken,
      },
      message: `Otentikasi berhasil! Selamat datang, ${matchedAccount.namaAdmin}.`,
    });
  } catch (err: any) {
    console.error('[Vercel Login API Fatal Error]:', err);
    return sendJson(res, 500, { valid: false, message: 'Terjadi kesalahan sistem server saat memproses login.' });
  }
}
