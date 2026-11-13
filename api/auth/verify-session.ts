import { handleCors, parseBody, sendJson, verifySessionToken } from '../_authHelper';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, 'GET, POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
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
        allowedPillars: verified.allowedPillars,
        allowedKepahlawanan: verified.allowedKepahlawanan,
        pinOtoritas: verified.pinOtoritas,
        sessionToken,
      },
    });
  } catch {
    return sendJson(res, 500, { valid: false, message: 'Gagal memverifikasi sesi.' });
  }
}
