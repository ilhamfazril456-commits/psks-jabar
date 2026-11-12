import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';

// Universal JSON Response Helper
function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

// Inlined CORS Handler
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
      if (ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(testOrigin))) {
        matchedOrigin = testOrigin;
      }
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

function signSessionToken(payload: {
  id: string;
  username: string;
  role: string;
  namaAdmin: string;
  wilayahTugas: string;
  statusActive: string;
}): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 7 * 24 * 60 * 60 * 1000;
  const fullPayload = { ...payload, issuedAt, expiresAt };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `ses_${data}.${signature}`;
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

// Anti-Brute-Force Rate Limiting & Lockout Store (5 attempts -> 15-minute / 900-second lockout)
interface PinRateRecord {
  attempts: number;
  firstAttempt: number;
  lockUntil: number;
}
const pinRateLimitMap = new Map<string, PinRateRecord>();

function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function checkPinRateLimit(ip: string): { locked: boolean; waitSeconds: number; remaining: number } {
  const now = Date.now();
  const record = pinRateLimitMap.get(ip);
  if (!record) {
    return { locked: false, waitSeconds: 0, remaining: 5 };
  }
  if (record.lockUntil > now) {
    const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { locked: true, waitSeconds, remaining: 0 };
  }
  // Reset window if 15 minutes passed since first attempt
  if (now > record.firstAttempt + 15 * 60 * 1000) {
    pinRateLimitMap.delete(ip);
    return { locked: false, waitSeconds: 0, remaining: 5 };
  }
  const remaining = Math.max(0, 5 - record.attempts);
  return { locked: false, waitSeconds: 0, remaining };
}

function recordFailedPinAttempt(ip: string): { locked: boolean; waitSeconds: number; remaining: number } {
  const now = Date.now();
  let record = pinRateLimitMap.get(ip);
  if (!record) {
    record = { attempts: 0, firstAttempt: now, lockUntil: 0 };
    pinRateLimitMap.set(ip, record);
  }
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000; // 15 menit lockout
    const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { locked: true, waitSeconds, remaining: 0 };
  }
  return { locked: false, waitSeconds: 0, remaining: Math.max(0, 5 - record.attempts) };
}

function clearPinRateLimit(ip: string) {
  pinRateLimitMap.delete(ip);
}

export default async function handler(req: any, res: any) {
  const isHandled = handleCors(req, res);
  if (isHandled) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });
  }

  const clientIp = getClientIp(req);
  const rateCheck = checkPinRateLimit(clientIp);

  if (rateCheck.locked) {
    return sendJson(res, 429, {
      valid: false,
      locked: true,
      lockoutRemaining: rateCheck.waitSeconds,
      message: `⚠️ Terlalu banyak percobaan PIN salah. Akses verifikasi PIN dibekukan selama ${Math.ceil(rateCheck.waitSeconds / 60)} menit (${rateCheck.waitSeconds} detik) demi keamanan.`,
    });
  }

  try {
    const body = await parseBody(req);
    const { pin, targetRole, challengeToken } = body || {};
    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
      return sendJson(res, 400, { valid: false, message: 'PIN wajib berupa tepat 6 digit angka.' });
    }

    // If challengeToken is provided from physical card scan, verify its signature
    if (challengeToken && typeof challengeToken === 'string') {
      const isChallengeValid = verifyCardChallengeToken(challengeToken, targetRole);
      if (!isChallengeValid) {
        return sendJson(res, 401, {
          valid: false,
          message: 'Token kartu akses fisik telah kedaluwarsa atau tidak sah. Silakan tap/scan ulang kartu fisik Anda.',
        });
      }
    }

    const cleanPin = pin.trim();

    let currentSettings: any = null;
    try {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 'global').maybeSingle();
      if (data && data.data) currentSettings = data.data;
    } catch {}

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../src/lib/firebase');
      const snap = await getDoc(doc(db, 'app_settings', 'global'));
      if (snap.exists()) {
        const fsData = snap.data();
        currentSettings = { ...currentSettings, ...fsData };
      }
    } catch {}

    const validSuperadminPin = (currentSettings?.superadminPin || '123456').trim();
    const validDeveloperPin = (currentSettings?.developerPin || '992211').trim();

    let isMatch = false;
    let authorizedRole = '';

    if (targetRole === 'developer') {
      isMatch = cleanPin === validDeveloperPin;
      authorizedRole = 'developer';
    } else if (targetRole === 'superadmin') {
      isMatch = cleanPin === validSuperadminPin;
      authorizedRole = 'superadmin';
    } else {
      if (cleanPin === validDeveloperPin) {
        isMatch = true;
        authorizedRole = 'developer';
      } else if (cleanPin === validSuperadminPin) {
        isMatch = true;
        authorizedRole = 'superadmin';
      }
    }

    if (!isMatch) {
      const failRecord = recordFailedPinAttempt(clientIp);
      if (failRecord.locked) {
        return sendJson(res, 429, {
          valid: false,
          locked: true,
          lockoutRemaining: failRecord.waitSeconds,
          message: '⚠️ 5 kali percobaan PIN salah berturut-turut! Sistem otorisasi dibekukan selama 15 menit demi mencegah serangan brute force.',
        });
      }
      return sendJson(res, 401, {
        valid: false,
        locked: false,
        remainingAttempts: failRecord.remaining,
        message: `❌ 6 Digit PIN Otoritas salah. Sisa kesempatan sebelum dibekukan: ${failRecord.remaining} kali.`,
      });
    }

    // Success: clear rate limit counter
    clearPinRateLimit(clientIp);

    const authorityToken = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${authorizedRole}_${Date.now() + 30 * 60 * 1000}`)
      .digest('hex');

    const sessionToken = signSessionToken({
      id: authorizedRole === 'developer' ? 'adm-dev' : 'adm-super',
      username: authorizedRole === 'developer' ? 'ilhamfazril' : 'superadmin',
      role: authorizedRole,
      namaAdmin: authorizedRole === 'developer' ? 'Ilham Fazril' : 'Superadmin Jabar',
      wilayahTugas: authorizedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT',
      statusActive: 'SAH_TERDAFTAR',
    });

    return sendJson(res, 200, {
      valid: true,
      role: authorizedRole,
      authorityToken,
      sessionToken,
      message: `Verifikasi PIN 6 digit sah. Otoritas ${authorizedRole} disetujui.`,
    });
  } catch (err: any) {
    return sendJson(res, 500, { valid: false, message: 'Terjadi kesalahan sistem saat memvalidasi PIN.' });
  }
}
