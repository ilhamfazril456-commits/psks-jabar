import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';

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

function verifySessionToken(token: string): VerifiedSessionPayload | null {
  if (!token || typeof token !== 'string' || !token.startsWith('ses_')) return null;
  const tokenBody = token.slice(4);
  const parts = tokenBody.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!data || !signature) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  
  // Timing-safe signature comparison to prevent timing side-channel attacks
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  try {
    const { sessionToken } = req.body || {};
    if (!sessionToken || typeof sessionToken !== 'string') {
      return res.status(401).json({ valid: false, message: 'Token sesi tidak ditemukan.' });
    }

    const verified = verifySessionToken(sessionToken);
    if (!verified) {
      return res.status(401).json({ valid: false, message: 'Token sesi tidak sah atau telah kedaluwarsa.' });
    }

    return res.status(200).json({
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
    return res.status(500).json({ valid: false, message: 'Gagal memverifikasi sesi.' });
  }
}
