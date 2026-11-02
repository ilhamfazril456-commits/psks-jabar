import crypto from 'crypto';
import {
  setDiskominfoCorsHeaders,
  getClientIp,
  checkRateLimit,
} from '../securityHelper';

const SESSION_SECRET = process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';
const SUPERADMIN_SECRET_TOKEN = 'ENC::SA-8F2B9D4C1E';
const DEVELOPER_SECRET_TOKEN = 'ENC::DEV-7A3C5F9B2D';

/**
 * Generates a short-lived cryptographically signed challenge token (2 minutes expiry)
 * requiring 2FA PIN verification before granting full session access.
 */
function signCardChallengeToken(role: 'superadmin' | 'developer'): string {
  const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes challenge window
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ role, nonce, expiresAt });
  const data = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(`card_${data}`).digest('base64url');
  return `ch_${data}.${sig}`;
}

export default async function handler(req: any, res: any) {
  const isHandled = setDiskominfoCorsHeaders(req, res);
  if (isHandled) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit('qr_scan', clientIp, 15, 60 * 1000, 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      valid: false,
      message: `⚠️ Terlalu banyak percobaan pemindaian kartu dalam 1 menit. Coba lagi dalam ${rateLimit.waitSeconds} detik.`,
    });
  }

  try {
    const { payload } = req.body || {};
    if (!payload || typeof payload !== 'string') {
      return res.status(400).json({ valid: false, message: 'Data QR Code tidak valid atau kosong.' });
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
      return res.status(200).json({
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
      return res.status(200).json({
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
          return res.status(200).json({
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
          return res.status(200).json({
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

    return res.status(200).json({
      valid: false,
      message: 'Kartu QR tidak dikenali atau bukan Kartu Akses Resmi Dinsos Jabar.',
    });
  } catch (err: any) {
    return res.status(500).json({ valid: false, message: 'Gagal memvalidasi QR Code.' });
  }
}
