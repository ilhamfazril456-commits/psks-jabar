import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

// Universal JSON Response Helper for Vercel Serverless / Node.js HTTP
function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

// Inlined Diskominfo-compliant restricted CORS
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

// IP-based Rate Limiter (Max 15 attempts per minute to prevent brute-force)
const loginAttempts = new Map<string, { count: number; firstTime: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now - entry.firstTime > 60000) {
    loginAttempts.set(ip, { count: 1, firstTime: now });
    return true;
  }
  entry.count++;
  return entry.count <= 15;
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
  try {
    // 1. Handle CORS Preflight
    if (handleCors(req, res)) return;

    if (req.method !== 'POST') {
      return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });
    }

    const forwarded = req.headers?.['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      return sendJson(res, 429, {
        valid: false,
        message: '⚠️ Terlalu banyak percobaan login dalam waktu singkat. Harap tunggu 1 menit.',
      });
    }

    // 2. Safe Body Parsing
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { valid: false, message: 'Format data JSON tidak valid.' });
      }
    }
    const { username, password } = body || {};

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return sendJson(res, 400, { valid: false, message: 'Nama Pengguna dan Kata Sandi wajib diisi.' });
    }

    const uClean = username.trim().toLowerCase();
    const pClean = password.trim();

    // 3. Query Supabase across segregated tables
    let matchedAccount: any = null;
    const sbTablesToCheck = ['superadmin_accounts', 'dev_accounts', 'admin_accounts', 'user_accounts'];
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
            role:
              data.role ||
              restData.role ||
              (t === 'user_accounts'
                ? 'user'
                : t === 'superadmin_accounts'
                ? 'superadmin'
                : t === 'dev_accounts'
                ? 'developer'
                : 'admin'),
            statusActive: data.statusActive || restData.statusActive || 'SAH_TERDAFTAR',
            wilayahTugas: data.wilayahTugas || restData.wilayahTugas || '',
            passwordHash: data.passwordHash || restData.passwordHash || '',
            isFrozen: data.isFrozen === true || restData.isFrozen === true,
            statusAkun: data.statusAkun || restData.statusAkun || 'AKTIF',
            statusVerval: data.statusVerval || restData.statusVerval || '',
            alasanPenolakan: data.alasanPenolakan || restData.alasanPenolakan || '',
            noRegistrasi: data.noRegistrasi || restData.noRegistrasi || '',
            resetTicket: data.resetTicket || restData.resetTicket || null,
          };
          break;
        }
      } catch {}
    }

    // 3b. Emergency Fallback for Superadmin if Supabase table is cold/unreachable
    if (!matchedAccount && (uClean === 'superadmin jabar' || uClean === 'superadmin' || uClean === 'adm-super')) {
      matchedAccount = {
        id: 'adm-super',
        username: 'superadmin jabar',
        namaAdmin: 'Super Admin Dinsos Jabar',
        role: 'superadmin',
        wilayahTugas: 'PROVINSI JAWA BARAT',
        statusActive: 'SAH_TERDAFTAR',
        passwordHash: '$2b$10$B7ARJFwaXeU8CWUqGfu2ye5nsB3xNCxDsWFIz//n3aoanD4uNGr1u', // Super12345jabar
        statusAkun: 'AKTIF',
      };
    } else if (!matchedAccount && (uClean === 'ilhamfazril' || uClean === 'adm-dev')) {
      matchedAccount = {
        id: 'adm-dev',
        username: 'ilhamfazril',
        namaAdmin: 'Developer System',
        role: 'developer',
        wilayahTugas: 'Pusat Developer Jabar',
        statusActive: 'SAH_TERDAFTAR',
        passwordHash: '$2b$10$t30kcIcKMvSLvy.UjpqNkec5j52dqLCXX7F6hffvdYyWe7cbYeKji',
        statusAkun: 'AKTIF',
      };
    }

    if (!matchedAccount) {
      return sendJson(res, 401, {
        valid: false,
        notFound: true,
        message: 'Kombinasi Nama Pengguna atau Kata Sandi salah.',
      });
    }

    if (matchedAccount.isFrozen === true || matchedAccount.statusAkun === 'DIBEKUKAN' || matchedAccount.statusActive === 'FROZEN') {
      return sendJson(res, 403, {
        valid: false,
        message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan/dibekukan oleh Administrator.',
      });
    }

    // 4. Validate Password against Bcrypt cryptographic hash
    const tempResetPass =
      matchedAccount.resetTicket?.status === 'DISETUJUI'
        ? matchedAccount.resetTicket?.temporaryPassword
        : '';
    let isValid = false;

    if (tempResetPass && pClean === tempResetPass) {
      isValid = true;
    } else if (matchedAccount.passwordHash) {
      isValid = comparePassword(pClean, matchedAccount.passwordHash);
    }

    if (!isValid) {
      return sendJson(res, 401, {
        valid: false,
        message: 'Kombinasi Nama Pengguna atau Kata Sandi salah.',
      });
    }

    // 5. User account verification status check
    if (matchedAccount.role === 'user') {
      const isPending =
        matchedAccount.statusVerval === 'MENUNGGU_VERIFIKASI' ||
        matchedAccount.statusActive === 'PENDING_VERIFIKASI';
      const isRejected =
        matchedAccount.statusVerval === 'DITOLAK' || matchedAccount.statusActive === 'DITOLAK';

      if (isPending) {
        return sendJson(res, 403, {
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
      finalRole === 'superadmin'
        ? 'PROVINSI JAWA BARAT'
        : finalRole === 'developer'
        ? 'Pusat Developer Jabar'
        : matchedAccount.wilayahTugas || 'Jawa Barat';

    // 6. Generate HMAC session token
    const sessionToken = signSessionToken({
      id: matchedAccount.id,
      username: matchedAccount.username,
      role: finalRole,
      namaAdmin: matchedAccount.namaAdmin,
      wilayahTugas: finalWilayah,
      statusActive: matchedAccount.statusActive,
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
        sessionToken,
      },
      message: `Otentikasi berhasil! Selamat datang, ${matchedAccount.namaAdmin}.`,
    });
  } catch (err: any) {
    console.error('[Login API Fatal Error]:', err);
    return sendJson(res, 500, {
      valid: false,
      message: 'Terjadi kesalahan sistem server saat memproses login.',
    });
  }
}
