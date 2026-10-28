import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';
const SUPERADMIN_SECRET_TOKEN = 'ENC::SA-8F2B9D4C1E';
const DEVELOPER_SECRET_TOKEN = 'ENC::DEV-7A3C5F9B2D';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method Not Allowed' });
  }

  try {
    const { payload } = req.body || {};
    if (!payload || typeof payload !== 'string') {
      return res.status(400).json({ valid: false, message: 'Data QR Code tidak valid atau kosong.' });
    }

    const cleanPayload = payload.trim();
    const upperPayload = cleanPayload.toUpperCase();

    if (
      cleanPayload === SUPERADMIN_SECRET_TOKEN ||
      upperPayload === SUPERADMIN_SECRET_TOKEN.toUpperCase() ||
      upperPayload.includes('SA-8F2B9D4C1E')
    ) {
      const sessionToken = signSessionToken({
        id: 'adm-super',
        username: 'superadmin',
        role: 'superadmin',
        namaAdmin: 'Superadmin Jabar',
        wilayahTugas: 'PROVINSI JAWA BARAT',
        statusActive: 'SAH_TERDAFTAR',
      });
      return res.status(200).json({
        valid: true,
        role: 'superadmin',
        nama: 'Superadmin Jabar',
        wilayah: 'PROVINSI JAWA BARAT',
        sessionToken,
        message: 'Akses Diterima! Selamat Datang Superadmin Provinsi Jawa Barat.',
      });
    }

    if (
      cleanPayload === DEVELOPER_SECRET_TOKEN ||
      upperPayload === DEVELOPER_SECRET_TOKEN.toUpperCase() ||
      upperPayload.includes('DEV-7A3C5F9B2D')
    ) {
      const sessionToken = signSessionToken({
        id: 'adm-dev',
        username: 'ilhamfazril',
        role: 'developer',
        namaAdmin: 'Ilham Fazril',
        wilayahTugas: 'Pusat Developer Jabar',
        statusActive: 'SAH_TERDAFTAR',
      });
      return res.status(200).json({
        valid: true,
        role: 'developer',
        nama: 'Ilham Fazril',
        wilayah: 'Pusat Developer Jabar',
        sessionToken,
        message: 'Akses Diterima! Selamat Datang Developer Utama PSKS Jabar.',
      });
    }

    return res.status(200).json({
      valid: false,
      message: 'Kartu QR tidak dikenali atau bukan Kartu Akses Resmi Dinsos Jabar.',
    });
  } catch (err: any) {
    return res.status(500).json({ valid: false, message: 'Gagal memvalidasi QR Code.' });
  }
}
