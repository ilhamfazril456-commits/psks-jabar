import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zwjbjmafxixudhlvaxef.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_-Q49NtwnUsY9oF3jpRXEmw_J82UN4Uy';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

function comparePassword(plainText: string, storedHashOrPlain?: string): boolean {
  if (!plainText || !storedHashOrPlain) return false;
  const isBcrypt = /^\$2[aby]\$\d{2}\$/.test(storedHashOrPlain);
  if (isBcrypt) {
    try {
      return bcrypt.compareSync(plainText, storedHashOrPlain);
    } catch {
      return false;
    }
  }
  return plainText === storedHashOrPlain;
}

export default async function handler(req: any, res: any) {
  // CORS configuration
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
    const { username, password } = req.body || {};
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ valid: false, message: 'Nama Pengguna dan Kata Sandi wajib diisi.' });
    }

    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    // 1. Query Supabase
    let matchedAccount: any = null;
    try {
      const { data, error } = await supabase
        .from('admin_accounts')
        .select('*')
        .or(`username.ilike.${uClean},id.eq.${uClean}`)
        .maybeSingle();

      if (!error && data) {
        const restData = data.data && typeof data.data === 'object' ? data.data : {};
        matchedAccount = {
          id: data.id,
          username: data.username || restData.username || data.id,
          namaAdmin: data.namaAdmin || restData.namaAdmin || data.username,
          role: data.role || restData.role || 'admin',
          statusActive: data.statusActive || restData.statusActive || 'SAH_TERDAFTAR',
          wilayahTugas: data.wilayahTugas || restData.wilayahTugas || '',
          passwordHash: data.passwordHash || restData.passwordHash || '',
          passwordPolos: restData.passwordPolos || '',
          isFrozen: data.isFrozen === true || restData.isFrozen === true,
          statusAkun: data.statusAkun || restData.statusAkun || 'AKTIF',
          statusVerval: data.statusVerval || restData.statusVerval || '',
          alasanPenolakan: data.alasanPenolakan || restData.alasanPenolakan || '',
          noRegistrasi: data.noRegistrasi || restData.noRegistrasi || '',
          resetTicket: data.resetTicket || restData.resetTicket || null,
        };
      }
    } catch (dbErr) {
      console.warn('[Vercel Auth] Supabase lookup error:', dbErr);
    }

    if (!matchedAccount) {
      return res.status(401).json({ valid: false, notFound: true, message: 'Kombinasi Nama Pengguna atau Kata Sandi salah.' });
    }

    if (matchedAccount.isFrozen === true || matchedAccount.statusAkun === 'DIBEKUKAN' || matchedAccount.statusActive === 'FROZEN') {
      return res.status(403).json({
        valid: false,
        message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan/dibekukan oleh Administrator.',
      });
    }

    // 2. Validate Password
    const tempResetPass = matchedAccount.resetTicket?.status === 'DISETUJUI' ? matchedAccount.resetTicket?.temporaryPassword : '';
    let isValid = false;

    if (tempResetPass && pClean === tempResetPass) {
      isValid = true;
    } else if (matchedAccount.passwordHash) {
      isValid = comparePassword(pClean, matchedAccount.passwordHash);
    } else if (matchedAccount.passwordPolos) {
      isValid = (pClean === matchedAccount.passwordPolos);
    }

    if (!isValid) {
      return res.status(401).json({ valid: false, message: 'Kombinasi Nama Pengguna atau Kata Sandi salah.' });
    }

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
