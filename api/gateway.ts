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

function hashSearchableField(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const raw = decryptSensitiveData(plainText).trim();
  if (!raw) return '';
  return crypto.createHash('sha256').update(`psks_field_${raw}`).digest('hex');
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
  const rawForwarded = req.headers?.['x-forwarded-for'];
  const cf = req.headers?.['cf-connecting-ip'];
  const xReal = req.headers?.['x-real-ip'];
  let ip = '';
  if (typeof rawForwarded === 'string' && rawForwarded.trim()) ip = rawForwarded.split(',')[0].trim();
  else if (typeof cf === 'string' && cf.trim()) ip = cf.trim();
  else if (typeof xReal === 'string' && xReal.trim()) ip = xReal.trim();
  else ip = req.socket?.remoteAddress || '127.0.0.1';
  return ip.startsWith('::ffff:') ? ip.substring(7) : ip;
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

function extractToken(req: any, body?: any): string {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const bearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  return bearer || (req.headers?.['x-session-token'] as string) || body?.sessionToken || '';
}

const DEFAULT_ROOT = [
  { id: 'adm-super', username: 'superadmin jabar', namaAdmin: 'Super Admin Dinsos Jabar', role: 'superadmin', wilayahTugas: 'PROVINSI JAWA BARAT', passwordHash: '$2b$10$B7ARJFwaXeU8CWUqGfu2ye5nsB3xNCxDsWFIz//n3aoanD4uNGr1u' },
  { id: 'adm-dev', username: 'ilhamfazril', namaAdmin: 'Developer System', role: 'developer', wilayahTugas: 'Pusat Developer Jabar', passwordHash: '$2b$10$t30kcIcKMvSLvy.UjpqNkec5j52dqLCXX7F6hffvdYyWe7cbYeKji' },
];

async function handleClientIp(req: any, res: any) {
  const ip = getClientIp(req);
  const isLocalOrPrivate =
    !ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
  return sendJson(res, 200, { ip, isPublic: !isLocalOrPrivate, timestamp: Date.now() });
}

async function handleUpdatePassword(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
  const body = await parseBody(req);
  const authSession = verifySessionToken(extractToken(req, body));
  const { oldPassword, newPassword, userId: bodyUserId, username: bodyUsername, role: bodyRole } = body || {};
  const oldTrim = typeof oldPassword === 'string' ? oldPassword.trim() : '';
  const newTrim = typeof newPassword === 'string' ? newPassword.trim() : '';
  if (!oldTrim) return sendJson(res, 400, { success: false, message: 'Kata sandi saat ini wajib diisi.' });
  if (!newTrim) return sendJson(res, 400, { success: false, message: 'Kata sandi baru wajib diisi.' });
  if (oldTrim === newTrim) return sendJson(res, 400, { success: false, message: '❌ Kata sandi baru tidak boleh sama dengan kata sandi lama!' });

  const identifiers = authSession
    ? [authSession.id, authSession.username].filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [bodyUserId, bodyUsername].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  if (identifiers.length === 0) return sendJson(res, 401, { success: false, message: 'Sesi otentikasi tidak ditemukan. Silakan login ulang.' });

  const hintedRole = ((authSession?.role || bodyRole || '') as string).toLowerCase().trim();
  const preferredTable = hintedRole === 'developer' ? 'dev_accounts' : hintedRole === 'superadmin' ? 'superadmin_accounts' : hintedRole === 'user' ? 'user_accounts' : 'admin_accounts';
  const tablesToSearch = Array.from(new Set([preferredTable, 'dev_accounts', 'superadmin_accounts', 'admin_accounts', 'user_accounts']));

  let matchedRow: any = null;
  let matchedTable = preferredTable;

  for (const tbl of tablesToSearch) {
    for (const ident of identifiers) {
      try {
        const { data: byId } = await supabase.from(tbl).select('*').eq('id', ident.trim()).limit(1).maybeSingle();
        if (byId) { matchedRow = byId; matchedTable = tbl; break; }
        const { data: byU } = await supabase.from(tbl).select('*').ilike('username', ident.trim().toLowerCase()).limit(1).maybeSingle();
        if (byU) { matchedRow = byU; matchedTable = tbl; break; }
      } catch {}
    }
    if (matchedRow) break;
  }

  if (!matchedRow) {
    try {
      const db = getDb();
      for (const colName of tablesToSearch) {
        for (const ident of identifiers) {
          const directSnap = await getDoc(doc(db, colName, ident.trim()));
          if (directSnap.exists()) { const d = directSnap.data(); matchedRow = { id: directSnap.id, ...d, data: d }; matchedTable = colName; break; }
          const snap = await getDocs(query(collection(db, colName), where('username', '==', ident.trim().toLowerCase())));
          if (!snap.empty) { const d = snap.docs[0].data(); matchedRow = { id: snap.docs[0].id, ...d, data: d }; matchedTable = colName; break; }
        }
        if (matchedRow) break;
      }
    } catch {}
  }

  const defMatch = !matchedRow ? DEFAULT_ROOT.find((a) => identifiers.some((idVal) => idVal.toLowerCase().trim() === a.id || idVal.toLowerCase().trim() === a.username)) : null;
  if (!matchedRow && !defMatch) return sendJson(res, 404, { success: false, message: '❌ Data akun Anda tidak ditemukan di database.' });

  const existingDataObj = matchedRow?.data && typeof matchedRow.data === 'object' ? { ...matchedRow.data } : {};
  if (matchedRow?.isFrozen === true || existingDataObj.isFrozen === true || matchedRow?.statusAkun === 'DIBEKUKAN' || existingDataObj.statusAkun === 'DIBEKUKAN') {
    return sendJson(res, 403, { success: false, message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan oleh Administrator.' });
  }

  const currentHash = matchedRow?.passwordHash || existingDataObj.passwordHash || defMatch?.passwordHash || '';
  if (!currentHash || !comparePassword(oldTrim, currentHash)) {
    return sendJson(res, 401, { success: false, message: '❌ Kata sandi saat ini yang Anda masukkan salah!' });
  }

  const targetId = matchedRow?.id || defMatch?.id || authSession?.id || String(bodyUserId || '').trim();
  const targetUsername = matchedRow?.username || existingDataObj.username || defMatch?.username || authSession?.username || String(bodyUsername || '').trim();
  const rawRole = matchedRow?.role || existingDataObj.role || defMatch?.role || authSession?.role || hintedRole || 'user';
  const targetRole = targetId === 'adm-dev' || targetUsername.toLowerCase() === 'ilhamfazril' ? 'developer' : targetId === 'adm-super' || matchedTable === 'superadmin_accounts' || targetUsername.toLowerCase().includes('superadmin') ? 'superadmin' : rawRole;

  if (targetRole === 'superadmin' || targetRole === 'developer') {
    if (newTrim.length < 12) return sendJson(res, 400, { success: false, message: '❌ Kata sandi Superadmin/Developer minimal 12 karakter.' });
    if (!/[A-Z]/.test(newTrim) || !/[a-z]/.test(newTrim) || !/[0-9]/.test(newTrim)) {
      return sendJson(res, 400, { success: false, message: '❌ Kata sandi wajib kombinasi huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9).' });
    }
  } else if (newTrim.length < 6) {
    return sendJson(res, 400, { success: false, message: '❌ Kata sandi baru minimal 6 karakter.' });
  }

  const prevHashes: string[] = Array.isArray(existingDataObj.previousPasswordHashes) ? existingDataObj.previousPasswordHashes.filter((h: any) => typeof h === 'string' && h.length > 0) : [];
  if (comparePassword(newTrim, currentHash) || prevHashes.some((h) => comparePassword(newTrim, h))) {
    return sendJson(res, 400, { success: false, message: '❌ Kata sandi lama tidak boleh digunakan kembali! Gunakan kata sandi baru yang berbeda.' });
  }

  const newHash = hashPassword(newTrim);
  const encPassword = encryptSensitiveData(newTrim);
  const nowMs = Date.now();
  const updatedPrevHashes = [currentHash, ...prevHashes].slice(0, 5);
  const targetNama = matchedRow?.namaAdmin || existingDataObj.namaAdmin || defMatch?.namaAdmin || authSession?.namaAdmin || targetUsername;
  const targetWilayah = targetRole === 'superadmin' ? 'PROVINSI JAWA BARAT' : targetRole === 'developer' ? 'Pusat Developer Jabar' : matchedRow?.wilayahTugas || existingDataObj.wilayahTugas || '';
  const targetAllowedPillars = Array.isArray(matchedRow?.allowedPillars) ? matchedRow.allowedPillars : Array.isArray(existingDataObj.allowedPillars) ? existingDataObj.allowedPillars : targetRole === 'superadmin' ? ['all'] : undefined;
  const targetAllowedKepahlawanan = Array.isArray(matchedRow?.allowedKepahlawanan) ? matchedRow.allowedKepahlawanan : Array.isArray(existingDataObj.allowedKepahlawanan) ? existingDataObj.allowedKepahlawanan : targetRole === 'superadmin' ? ['all'] : undefined;
  const rawPinEncrypted = matchedRow?.pinEncrypted || existingDataObj.pinEncrypted || '';
  const decPin = rawPinEncrypted ? decryptSensitiveData(rawPinEncrypted) : '';
  const targetPinOtoritas = (/^\d{6}$/.test(decPin) ? decPin : '') || matchedRow?.pinOtoritas || existingDataObj.pinOtoritas || authSession?.pinOtoritas || undefined;
  const preservedPinEncrypted = rawPinEncrypted || (targetPinOtoritas ? encryptSensitiveData(targetPinOtoritas) : undefined);
  const preservedPinHash = matchedRow?.pinHash || existingDataObj.pinHash || (targetPinOtoritas ? hashPassword(targetPinOtoritas) : undefined);
  const saveTable = targetRole === 'developer' ? 'dev_accounts' : targetRole === 'superadmin' ? 'superadmin_accounts' : targetRole === 'user' ? 'user_accounts' : matchedTable;

  const refreshedSessionToken = signSessionToken({
    id: targetId, username: targetUsername, role: targetRole, namaAdmin: targetNama, wilayahTugas: targetWilayah,
    statusActive: matchedRow?.statusActive || existingDataObj.statusActive || 'SAH_TERDAFTAR',
    allowedPillars: targetAllowedPillars, allowedKepahlawanan: targetAllowedKepahlawanan, pinOtoritas: targetPinOtoritas,
  });

  delete existingDataObj.passwordPolos; delete existingDataObj.pinOtoritas; delete existingDataObj.superadminPin; delete existingDataObj.developerPin;
  const nextDataJson = {
    ...existingDataObj,
    username: targetUsername, namaAdmin: targetNama, role: targetRole, wilayahTugas: targetWilayah,
    statusActive: matchedRow?.statusActive || existingDataObj.statusActive || 'SAH_TERDAFTAR',
    ...(targetAllowedPillars ? { allowedPillars: targetAllowedPillars } : {}),
    ...(targetAllowedKepahlawanan ? { allowedKepahlawanan: targetAllowedKepahlawanan } : {}),
    ...(preservedPinEncrypted ? { pinEncrypted: preservedPinEncrypted } : {}),
    ...(preservedPinHash ? { pinHash: preservedPinHash } : {}),
    passwordHash: newHash, passwordEncrypted: encPassword, previousPasswordHashes: updatedPrevHashes, resetTicket: null,
    lastUpdatedTimestamp: nowMs, lastEditedBy: targetUsername || targetNama, lastEditedByRole: targetRole, isSelfUpdate: true,
  };

  const { error: sbSaveErr } = await supabase.from(saveTable).upsert({
    id: targetId, username: targetUsername, namaAdmin: targetNama, role: targetRole,
    statusActive: nextDataJson.statusActive, wilayahTugas: targetWilayah, passwordHash: newHash, sessionToken: refreshedSessionToken, data: nextDataJson,
  }, { onConflict: 'id' });
  if (sbSaveErr) return sendJson(res, 500, { success: false, message: 'Gagal memperbarui kata sandi di database.' });

  if ((saveTable === 'superadmin_accounts' || saveTable === 'dev_accounts') && targetId) {
    try { await supabase.from('admin_accounts').delete().eq('id', targetId); } catch {}
  }
  try {
    const db = getDb();
    await setDoc(doc(db, saveTable, targetId), { id: targetId, ...nextDataJson }, { merge: true });
    if (saveTable === 'superadmin_accounts' || saveTable === 'dev_accounts') { try { await deleteDoc(doc(db, 'admin_accounts', targetId)); } catch {} }
  } catch {}

  return sendJson(res, 200, {
    success: true, updatedAccountId: targetId, username: targetUsername, role: targetRole, sessionToken: refreshedSessionToken,
    passwordHash: newHash, passwordEncrypted: encPassword, previousPasswordHashes: updatedPrevHashes, lastUpdatedTimestamp: nowMs,
    message: '✅ Kata sandi berhasil diperbarui secara aman dan langsung tersinkron ke Manajemen Superadmin!',
  });
}

async function handleSaveSuperadmin(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
  const body = await parseBody(req);
  const actor = verifySessionToken(extractToken(req, body));
  if (!actor || actor.role !== 'developer') {
    return sendJson(res, 403, { success: false, message: 'Akses ditolak: Hanya Developer yang berwenang mengelola akun Superadmin.' });
  }

  const { id, _previousUsername, namaAdmin, username, password, pin, nik, noWhatsapp, allowedPillars, allowedKepahlawanan, isFrozen, statusAkun } = body || {};
  const namaClean = typeof namaAdmin === 'string' ? namaAdmin.trim() : '';
  const unameClean = typeof username === 'string' ? username.trim().toLowerCase().replace(/\s+/g, '_') : '';
  const pinClean = typeof pin === 'string' ? pin.trim() : '';
  const passClean = typeof password === 'string' ? password.trim() : '';
  if (!namaClean) return sendJson(res, 400, { success: false, message: 'Nama lengkap Superadmin wajib diisi.' });
  if (!unameClean || unameClean.length < 4) return sendJson(res, 400, { success: false, message: 'Username minimal 4 karakter.' });
  if (!/^\d{6}$/.test(pinClean)) return sendJson(res, 400, { success: false, message: 'PIN Otoritas wajib berupa tepat 6 digit angka.' });

  const targetId = typeof id === 'string' && id.trim() ? id.trim() : `adm-super-${Date.now()}`;
  let existingRow: any = null;
  for (const ident of [targetId, _previousUsername, unameClean].filter(Boolean)) {
    const { data } = await supabase.from('superadmin_accounts').select('*').or(`id.eq.${ident},username.ilike.${String(ident).toLowerCase()}`).limit(1).maybeSingle();
    if (data) { existingRow = data; break; }
  }
  const existingDataObj: Record<string, any> = existingRow?.data && typeof existingRow.data === 'object' ? { ...existingRow.data } : {};
  const defMatch = DEFAULT_ROOT.find((a) => a.id === targetId || a.username === unameClean);
  const existingHash = existingRow?.passwordHash || existingDataObj.passwordHash || defMatch?.passwordHash || '';
  const existingDecryptedPass = existingDataObj.passwordEncrypted ? decryptSensitiveData(existingDataObj.passwordEncrypted) : '';
  const isCreating = !existingRow && !defMatch && !(typeof id === 'string' && id.trim());
  const isPasswordChanged = Boolean(passClean && passClean !== existingDecryptedPass);

  if (isCreating || isPasswordChanged || (!existingHash && passClean)) {
    if (passClean.length < 12 || !/[A-Z]/.test(passClean) || !/[a-z]/.test(passClean) || !/[0-9]/.test(passClean)) {
      return sendJson(res, 400, { success: false, message: 'Kata sandi Superadmin minimal 12 karakter kombinasi huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9).' });
    }
  } else if (!existingHash && !passClean) {
    return sendJson(res, 400, { success: false, message: 'Kata sandi wajib diisi untuk akun Superadmin baru.' });
  }

  const prevHashes: string[] = Array.isArray(existingDataObj.previousPasswordHashes) ? existingDataObj.previousPasswordHashes : [];
  const nextPasswordHash = isPasswordChanged || !existingHash ? hashPassword(passClean) : existingHash;
  const nextPasswordEncrypted = isPasswordChanged || !existingDataObj.passwordEncrypted ? (passClean ? encryptSensitiveData(passClean) : '') : existingDataObj.passwordEncrypted;
  const nextPrevHashes = isPasswordChanged && existingHash && !comparePassword(passClean, existingHash) ? [existingHash, ...prevHashes].slice(0, 5) : prevHashes;
  const encPin = encryptSensitiveData(pinClean);
  const hashedPin = hashPassword(pinClean);
  const nowMs = Date.now();
  const encNik = typeof nik === 'string' && nik.trim() ? encryptSensitiveData(nik.trim()) : existingDataObj.nik || '';
  const nikHash = typeof nik === 'string' && nik.trim() ? hashSearchableField(nik.trim()) : existingDataObj.nikHash || '';
  const encWa = typeof noWhatsapp === 'string' && noWhatsapp.trim() ? encryptSensitiveData(noWhatsapp.trim()) : existingDataObj.noWhatsapp || '';
  const finalAllowedPillars = Array.isArray(allowedPillars) ? allowedPillars : Array.isArray(existingDataObj.allowedPillars) ? existingDataObj.allowedPillars : ['all'];
  const finalAllowedKepahlawanan = Array.isArray(allowedKepahlawanan) ? allowedKepahlawanan : Array.isArray(existingDataObj.allowedKepahlawanan) ? existingDataObj.allowedKepahlawanan : ['all'];

  delete existingDataObj.passwordPolos; delete existingDataObj.pinOtoritas; delete existingDataObj.superadminPin; delete existingDataObj.developerPin;
  const nextDataJson = {
    ...existingDataObj,
    id: targetId, username: unameClean, namaAdmin: namaClean, role: 'superadmin', wilayahTugas: 'PROVINSI JAWA BARAT',
    statusActive: 'SAH_TERDAFTAR', statusAkun: statusAkun || (isFrozen ? 'DIBEKUKAN' : 'AKTIF'), isFrozen: Boolean(isFrozen),
    passwordHash: nextPasswordHash, ...(nextPasswordEncrypted ? { passwordEncrypted: nextPasswordEncrypted } : {}),
    previousPasswordHashes: nextPrevHashes, pinEncrypted: encPin, pinHash: hashedPin,
    allowedPillars: finalAllowedPillars, allowedKepahlawanan: finalAllowedKepahlawanan,
    ...(encNik ? { nik: encNik, nikHash } : {}), ...(encWa ? { noWhatsapp: encWa } : {}),
    lastUpdatedTimestamp: nowMs, lastEditedBy: actor.namaAdmin || actor.username || 'Lead Developer', lastEditedByRole: 'developer', isSelfUpdate: false,
  };

  const { error: sbErr } = await supabase.from('superadmin_accounts').upsert({
    id: targetId, username: unameClean, namaAdmin: namaClean, role: 'superadmin', statusActive: 'SAH_TERDAFTAR', wilayahTugas: 'PROVINSI JAWA BARAT',
    passwordHash: nextPasswordHash, sessionToken: existingRow?.sessionToken || '', ...(encNik ? { nik: encNik, nikHash } : {}), ...(encWa ? { noWhatsapp: encWa } : {}), data: nextDataJson,
  }, { onConflict: 'id' });
  if (sbErr) return sendJson(res, 500, { success: false, message: 'Gagal menyimpan data Superadmin ke database.' });

  try {
    const db = getDb();
    await setDoc(doc(db, 'superadmin_accounts', targetId), nextDataJson, { merge: true });
    if (targetId === 'adm-super' || unameClean === 'superadmin' || unameClean === 'superadmin_jabar' || unameClean === 'superadmin jabar') {
      const { data: eg } = await supabase.from('app_settings').select('data').eq('id', 'global').maybeSingle();
      const bg = eg?.data && typeof eg.data === 'object' ? { ...eg.data } : {};
      delete bg.superadminPin;
      await supabase.from('app_settings').upsert({ id: 'global', data: { ...bg, superadminPinEncrypted: encPin, superadminPinHash: hashedPin, pinSecurityUpdatedAt: nowMs } }, { onConflict: 'id' });
      await setDoc(doc(db, 'app_settings', 'global'), { superadminPinEncrypted: encPin, superadminPinHash: hashedPin, superadminPin: deleteField(), pinSecurityUpdatedAt: nowMs }, { merge: true });
    }
  } catch {}

  return sendJson(res, 200, {
    success: true, lastUpdatedTimestamp: nowMs, account: { ...nextDataJson, pinOtoritas: pinClean, passwordPolos: '' },
    message: 'Akun Superadmin berhasil disimpan aman ke database dengan enkripsi penuh.',
  });
}

async function handleSettingsUpdate(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
  const body = await parseBody(req);
  const actor = verifySessionToken(extractToken(req, body));
  if (!actor || (actor.role !== 'superadmin' && actor.role !== 'developer')) {
    return sendJson(res, 401, { success: false, error: 'Akses ditolak: Token sesi tidak sah atau otoritas tidak mencukupi.' });
  }
  const { id, data } = body || {};
  if (!id || !data || typeof data !== 'object') return sendJson(res, 400, { success: false, message: 'ID dan data pengaturan wajib diisi.' });
  const sanitized = { ...data };
  if (typeof sanitized.superadminPin === 'string' && /^\d{6}$/.test(sanitized.superadminPin.trim())) {
    sanitized.superadminPinEncrypted = encryptSensitiveData(sanitized.superadminPin.trim());
    sanitized.superadminPinHash = hashPassword(sanitized.superadminPin.trim());
  }
  if (typeof sanitized.developerPin === 'string' && /^\d{6}$/.test(sanitized.developerPin.trim())) {
    sanitized.developerPinEncrypted = encryptSensitiveData(sanitized.developerPin.trim());
    sanitized.developerPinHash = hashPassword(sanitized.developerPin.trim());
  }
  delete sanitized.superadminPin; delete sanitized.developerPin; delete sanitized.passwordPolos; delete sanitized.pinOtoritas;
  await supabase.from('app_settings').upsert({ id, data: sanitized }, { onConflict: 'id' });
  try {
    const db = getDb();
    await setDoc(doc(db, 'app_settings', id), { ...sanitized, superadminPin: deleteField(), developerPin: deleteField() }, { merge: true });
  } catch {}
  return sendJson(res, 200, { success: true, message: 'Pengaturan sistem berhasil diperbarui dengan aman!' });
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  try {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    const action = (req.query?.action as string) || urlObj.searchParams.get('action') || '';
    if (action === 'client-ip') return await handleClientIp(req, res);
    if (action === 'update-password') return await handleUpdatePassword(req, res);
    if (action === 'save-superadmin') return await handleSaveSuperadmin(req, res);
    if (action === 'settings-update') return await handleSettingsUpdate(req, res);
    return sendJson(res, 404, { success: false, message: 'Endpoint API tidak ditemukan.' });
  } catch (err: any) {
    console.error('[Vercel Gateway Error]:', err);
    return sendJson(res, 500, { success: false, message: 'Terjadi kesalahan server.' });
  }
}
