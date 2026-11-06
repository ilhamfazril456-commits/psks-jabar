import crypto from 'crypto';

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';
const SUPERADMIN_SECRET_TOKEN = 'ENC::SA-8F2B9D4C1E';
const DEVELOPER_SECRET_TOKEN = 'ENC::DEV-7A3C5F9B2D';

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

function signCardChallengeToken(role: 'superadmin' | 'developer'): string {
  const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes challenge window
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ role, nonce, expiresAt });
  const data = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(`card_${data}`).digest('base64url');
  return `ch_${data}.${sig}`;
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

export default async function handler(req: any, res: any) {
  const isHandled = handleCors(req, res);
  if (isHandled) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
    const { payload } = body || {};
    if (!payload || typeof payload !== 'string') {
      return sendJson(res, 400, { valid: false, message: 'Data QR Code tidak valid atau kosong.' });
    }

    const cleanPayload = payload.trim();
    const upperPayload = cleanPayload.toUpperCase();

    // 1. Check Superadmin Card (Permanent physical card token)
    if (
      cleanPayload === SUPERADMIN_SECRET_TOKEN ||
      upperPayload === SUPERADMIN_SECRET_TOKEN.toUpperCase() ||
      upperPayload.includes('SA-8F2B9D4C1E')
    ) {
      const challengeToken = signCardChallengeToken('superadmin');
      return sendJson(res, 200, {
        valid: true,
        requiresPin: true,
        role: 'superadmin',
        nama: 'Superadmin Jabar',
        wilayah: 'PROVINSI JAWA BARAT',
        challengeToken,
        message: 'Kartu Akses Fisik Superadmin Terverifikasi! Silakan masukkan 6 Digit PIN Otoritas.',
      });
    }

    // 2. Check Developer Card (Permanent physical card token)
    if (
      cleanPayload === DEVELOPER_SECRET_TOKEN ||
      upperPayload === DEVELOPER_SECRET_TOKEN.toUpperCase() ||
      upperPayload.includes('DEV-7A3C5F9B2D')
    ) {
      const challengeToken = signCardChallengeToken('developer');
      return sendJson(res, 200, {
        valid: true,
        requiresPin: true,
        role: 'developer',
        nama: 'Ilham Fazril',
        wilayah: 'Pusat Developer Jabar',
        challengeToken,
        message: 'Kartu Akses Fisik Developer Terverifikasi! Silakan masukkan 6 Digit PIN Otoritas.',
      });
    }

    // 3. JSON Wrapper Check (Containing permanent tokens)
    try {
      const json = JSON.parse(cleanPayload);
      if (json && (json.token || json.access_key || json.code || json.key)) {
        const token = (json.token || json.access_key || json.code || json.key || '').toString();
        const tokenUpper = token.toUpperCase();

        if (token === SUPERADMIN_SECRET_TOKEN || tokenUpper.includes('SA-8F2B9D4C1E')) {
          const challengeToken = signCardChallengeToken('superadmin');
          return sendJson(res, 200, {
            valid: true,
            requiresPin: true,
            role: 'superadmin',
            nama: 'Superadmin Jabar',
            wilayah: 'PROVINSI JAWA BARAT',
            challengeToken,
            message: 'Kartu Akses Fisik Superadmin Terverifikasi! Silakan masukkan 6 Digit PIN Otoritas.',
          });
        }
        if (token === DEVELOPER_SECRET_TOKEN || tokenUpper.includes('DEV-7A3C5F9B2D')) {
          const challengeToken = signCardChallengeToken('developer');
          return sendJson(res, 200, {
            valid: true,
            requiresPin: true,
            role: 'developer',
            nama: 'Ilham Fazril',
            wilayah: 'Pusat Developer Jabar',
            challengeToken,
            message: 'Kartu Akses Fisik Developer Terverifikasi! Silakan masukkan 6 Digit PIN Otoritas.',
          });
        }
      }
    } catch {}

    return sendJson(res, 200, {
      valid: false,
      message: 'Kartu QR tidak dikenali atau bukan Kartu Akses Resmi Dinsos Jabar.',
    });
  } catch (err: any) {
    return sendJson(res, 500, { valid: false, message: 'Gagal memvalidasi QR Code.' });
  }
}
