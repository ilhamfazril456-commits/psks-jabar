import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  setDiskominfoCorsHeaders,
  getClientIp,
  checkRateLimit,
  recordFailedRateLimitAttempt,
  clearRateLimit,
} from '../securityHelper';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zwjbjmafxixudhlvaxef.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_-Q49NtwnUsY9oF3jpRXEmw_J82UN4Uy';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const SESSION_SECRET = process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';

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

export default async function handler(req: any, res: any) {
  const isHandled = setDiskominfoCorsHeaders(req, res);
  if (isHandled) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  const clientIp = getClientIp(req);

  // Anti Brute-Force Rate Limiting (Diskominfo Standard: Max 5 PIN attempts per 5 mins per IP)
  const rateLimit = checkRateLimit('pin', clientIp, 5, 5 * 60 * 1000, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      valid: false,
      locked: true,
      lockoutRemaining: rateLimit.waitSeconds,
      message: `⚠️ Terlalu banyak percobaan PIN salah dari alamat IP ini. Akses dibekukan sementara selama ${rateLimit.waitSeconds} detik demi standar keamanan Diskominfo.`,
    });
  }

  try {
    const { pin, targetRole, challengeToken } = req.body || {};
    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
      return res.status(400).json({ valid: false, message: 'PIN wajib berupa tepat 6 digit angka.' });
    }

    // If challengeToken is provided from physical card scan, verify its signature
    if (challengeToken && typeof challengeToken === 'string') {
      const isChallengeValid = verifyCardChallengeToken(challengeToken, targetRole);
      if (!isChallengeValid) {
        return res.status(401).json({
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

    const validSuperadminPin = (currentSettings?.superadminPin || '150109').trim();
    const validDeveloperPin = (currentSettings?.developerPin || '150109').trim();

    let isMatch = false;
    let authorizedRole = '';

    if (targetRole === 'developer') {
      isMatch = cleanPin === validDeveloperPin;
      authorizedRole = 'developer';
    } else if (targetRole === 'superadmin') {
      isMatch = cleanPin === validSuperadminPin || cleanPin === validDeveloperPin;
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
      const failResult = recordFailedRateLimitAttempt('pin', clientIp, 5, 5 * 60 * 1000);
      if (failResult.locked) {
        return res.status(429).json({
          valid: false,
          locked: true,
          lockoutRemaining: failResult.waitSeconds,
          message: '⚠️ 5 kali percobaan PIN salah berturut-turut! Sistem otorisasi dibekukan selama 5 menit.',
        });
      }
      return res.status(401).json({
        valid: false,
        remainingAttempts: failResult.remaining,
        message: `❌ 6 Digit PIN Otoritas salah. Sisa kesempatan sebelum dibekukan: ${failResult.remaining} kali.`,
      });
    }

    // Successful PIN: clear failed attempts
    clearRateLimit('pin', clientIp);

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

    return res.status(200).json({
      valid: true,
      role: authorizedRole,
      authorityToken,
      sessionToken,
      message: `Verifikasi PIN 6 digit sah. Otoritas ${authorizedRole} disetujui.`,
    });
  } catch (err: any) {
    return res.status(500).json({ valid: false, message: 'Terjadi kesalahan sistem saat memvalidasi PIN.' });
  }
}
