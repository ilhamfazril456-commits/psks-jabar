import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

function comparePassword(plainText: string, storedHash?: string): boolean {
  if (!plainText || !storedHash) return false;
  const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(storedHash);
  if (isBcrypt) {
    try {
      return bcrypt.compareSync(plainText, storedHash);
    } catch {
      return false;
    }
  }
  return false;
}

export default async function handler(req: any, res: any) {
  // Enforce Diskominfo-compliant restricted CORS
  const isHandled = setDiskominfoCorsHeaders(req, res);
  if (isHandled) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  const clientIp = getClientIp(req);

  // Anti Brute-Force Rate Limiting (Diskominfo Standard: Max 5 attempts per 5 mins per IP)
  const rateLimit = checkRateLimit('login', clientIp, 5, 5 * 60 * 1000, 5 * 60 * 1000);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      valid: false,
      locked: true,
      lockoutRemaining: rateLimit.waitSeconds,
      message: `⚠️ Terlalu banyak percobaan login gagal dari alamat IP ini. Akses dibekukan sementara selama ${rateLimit.waitSeconds} detik demi standar keamanan Diskominfo.`,
    });
  }

  try {
    const { username, password } = req.body || {};
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ valid: false, message: 'Nama Pengguna dan Kata Sandi wajib diisi.' });
    }

    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    // 1. Query Supabase (checking segregated tables first)
    let matchedAccount: any = null;
    const sbTablesToCheck = ['dev_accounts', 'superadmin_accounts', 'admin_accounts', 'user_accounts'];
    for (const t of sbTablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(t)
          .select('*')
          .or(`username.ilike.${uClean},id.eq.${uClean}`)
          .maybeSingle();

        if (!error && data) {
          const restData = data.data && typeof data.data === 'object' ? data.data : {};
          matchedAccount = {
            id: data.id,
            sbTableSource: t,
            username: data.username || restData.username || data.id,
            namaAdmin: data.namaAdmin || restData.namaAdmin || data.username,
            role: data.role || restData.role || (t === 'user_accounts' ? 'user' : t === 'superadmin_accounts' ? 'superadmin' : t === 'dev_accounts' ? 'developer' : 'admin'),
            statusActive: data.statusActive || restData.statusActive || 'SAH_TERDAFTAR',
            wilayahTugas: data.wilayahTugas || restData.wilayahTugas || '',
            passwordHash: data.passwordHash || restData.passwordHash || '',
            isFrozen: data.isFrozen === true || restData.isFrozen === true,
            statusAkun: data.statusAkun || restData.statusAkun || 'AKTIF',
            statusVerval: data.statusVerval || restData.statusVerval || '',
            alasanPenolakan: data.alasanPenolakan || restData.alasanPenolakan || '',
            noRegistrasi: data.noRegistrasi || restData.noRegistrasi || '',
            resetTicket: data.resetTicket || restData.resetTicket || null,
            nik: data.nik || restData.nik || '',
            nikHash: data.nikHash || restData.nikHash || '',
            noWhatsapp: data.noWhatsapp || restData.noWhatsapp || '',
          };
          break;
        }
      } catch (dbErr) {
        // Table might not exist yet, continue checking others
      }
    }

    if (!matchedAccount) {
      const failResult = recordFailedRateLimitAttempt('login', clientIp, 5, 5 * 60 * 1000);
      if (failResult.locked) {
        return res.status(429).json({
          valid: false,
          locked: true,
          lockoutRemaining: failResult.waitSeconds,
          message: '⚠️ 5 kali percobaan login gagal berturut-turut! Akses login dibekukan sementara selama 5 menit demi keamanan.',
        });
      }
      return res.status(401).json({
        valid: false,
        notFound: true,
        remainingAttempts: failResult.remaining,
        message: `Kombinasi Nama Pengguna atau Kata Sandi salah. Sisa kesempatan: ${failResult.remaining} kali.`,
      });
    }

    if (matchedAccount.isFrozen === true || matchedAccount.statusAkun === 'DIBEKUKAN' || matchedAccount.statusActive === 'FROZEN') {
      return res.status(403).json({
        valid: false,
        message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan/dibekukan oleh Administrator.',
      });
    }

    // 2. Validate Password (Strictly Bcrypt hash or approved temporary reset ticket)
    const tempResetPass = matchedAccount.resetTicket?.status === 'DISETUJUI' ? matchedAccount.resetTicket?.temporaryPassword : '';
    let isValid = false;

    if (tempResetPass && pClean === tempResetPass) {
      isValid = true;
    } else if (matchedAccount.passwordHash) {
      isValid = comparePassword(pClean, matchedAccount.passwordHash);
    }

    if (!isValid) {
      const failResult = recordFailedRateLimitAttempt('login', clientIp, 5, 5 * 60 * 1000);
      if (failResult.locked) {
        return res.status(429).json({
          valid: false,
          locked: true,
          lockoutRemaining: failResult.waitSeconds,
          message: '⚠️ 5 kali percobaan login gagal berturut-turut! Akses login dibekukan sementara selama 5 menit demi keamanan.',
        });
      }
      return res.status(401).json({
        valid: false,
        remainingAttempts: failResult.remaining,
        message: `Kombinasi Nama Pengguna atau Kata Sandi salah. Sisa kesempatan: ${failResult.remaining} kali.`,
      });
    }

    // Successful login: clear failed attempts
    clearRateLimit('login', clientIp);

    // 3. User verification status check
    if (matchedAccount.role === 'user') {
      const isPending = matchedAccount.statusVerval === 'MENUNGGU_VERIFIKASI' || matchedAccount.statusActive === 'PENDING_VERIFIKASI';
      const isRejected = matchedAccount.statusVerval === 'DITOLAK' || matchedAccount.statusActive === 'DITOLAK';

      if (isPending) {
        return res.status(403).json({
          valid: false,
          isPending: true,
          message: '⏳ AKUN MENUNGGU VERIFIKASI: Pendaftaran akun Anda sedang dalam proses verifikasi oleh Superadmin Dinsos Jabar.',
          ticket: {
            username: matchedAccount.username,
            wilayah: matchedAccount.wilayahTugas,
            noRegistrasi: matchedAccount.noRegistrasi || `REG-PSKS-${(matchedAccount.id || '').slice(-6)}`,
          },
        });
      }

      if (isRejected) {
        return res.status(403).json({
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
      finalRole === 'superadmin'
        ? 'PROVINSI JAWA BARAT'
        : finalRole === 'developer'
        ? 'Pusat Developer Jabar'
        : matchedAccount.wilayahTugas || 'Jawa Barat';

    // 4. Generate HMAC session token
    const sessionToken = signSessionToken({
      id: matchedAccount.id,
      username: matchedAccount.username,
      role: finalRole,
      namaAdmin: matchedAccount.namaAdmin,
      wilayahTugas: finalWilayah,
      statusActive: matchedAccount.statusActive,
    });

    return res.status(200).json({
      valid: true,
      session: {
        id: matchedAccount.id,
        username: matchedAccount.username,
        namaAdmin: matchedAccount.namaAdmin,
        role: finalRole,
        wilayahTugas: finalWilayah,
        statusActive: matchedAccount.statusActive,
        sessionToken,
      },
      message: `Otentikasi berhasil! Selamat datang, ${matchedAccount.namaAdmin}.`,
    });
  } catch (err: any) {
    console.error('[Vercel Auth Error]:', err);
    return res.status(500).json({ valid: false, message: 'Terjadi kesalahan sistem saat memproses login.' });
  }
}
