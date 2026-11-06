import crypto from 'crypto';

const SESSION_SECRET =
  process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';

interface VerifiedSessionPayload {
  id: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin' | 'developer';
  namaAdmin: string;
  wilayahTugas: string;
  statusActive: string;
  issuedAt: number;
  expiresAt: number;
}

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
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

function verifySessionToken(token: string): VerifiedSessionPayload | null {
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

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }
    const { sessionToken } = body || {};
    if (!sessionToken || typeof sessionToken !== 'string') {
      return sendJson(res, 401, { valid: false, message: 'Token sesi tidak ditemukan.' });
    }

    const verified = verifySessionToken(sessionToken);
    if (!verified) {
      return sendJson(res, 401, { valid: false, message: 'Token sesi tidak sah atau telah kedaluwarsa.' });
    }

    return sendJson(res, 200, {
      valid: true,
      session: {
        id: verified.id,
        username: verified.username,
        role: verified.role,
        namaAdmin: verified.namaAdmin,
        wilayahTugas: verified.wilayahTugas,
        statusActive: verified.statusActive,
        sessionToken,
      },
    });
  } catch (err: any) {
    return sendJson(res, 500, { valid: false, message: 'Gagal memverifikasi sesi.' });
  }
}
