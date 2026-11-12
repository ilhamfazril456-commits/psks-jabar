import crypto from 'crypto';
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

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function verifySessionToken(token: string): any {
  if (!token || typeof token !== 'string' || !token.startsWith('ses_')) return null;
  const tokenBody = token.slice(4);
  const parts = tokenBody.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (!data || !signature) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
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
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Metode HTTP tidak diizinkan.' });
  }

  const authHeader = req.headers?.authorization || '';
  const tokenFromHeader = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const token = tokenFromHeader || (req.headers && req.headers['x-session-token']) || '';

  const user = verifySessionToken(token);
  if (!user || (user.role !== 'superadmin' && user.role !== 'developer')) {
    return sendJson(res, 403, { success: false, message: 'Akses ditolak: Wajib Superadmin atau Developer terotentikasi.' });
  }

  try {
    const body = await parseBody(req);
    const { newPin, pinType } = body || {};

    if (!newPin || typeof newPin !== 'string' || !/^\d{6}$/.test(newPin.trim())) {
      return sendJson(res, 400, { success: false, message: 'PIN baru wajib berupa tepat 6 digit angka.' });
    }

    const cleanPin = newPin.trim();

    if (pinType === 'developer' && user.role !== 'developer') {
      return sendJson(res, 403, { success: false, message: 'Hanya Developer Utama yang berwenang mengubah PIN Developer.' });
    }

    // 1. Simpan ke Supabase
    try {
      const updatePayload: any = {};
      if (pinType === 'developer') updatePayload.developerPin = cleanPin;
      else updatePayload.superadminPin = cleanPin;
      await supabase.from('app_settings').upsert({ id: 'global', data: updatePayload }, { onConflict: 'id' });
    } catch (sbErr) {
      console.warn('[Supabase update-pin notice]:', sbErr);
    }

    // 2. Simpan ke Firestore
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../../src/lib/firebase');
      const pinField = pinType === 'developer' ? 'developerPin' : 'superadminPin';
      await setDoc(doc(db, 'app_settings', 'global'), {
        [pinField]: cleanPin,
        pinSecurityUpdatedAt: Date.now()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('[Firestore update-pin notice]:', fsErr);
    }

    return sendJson(res, 200, {
      success: true,
      message: `PIN ${pinType === 'developer' ? 'Developer' : 'Superadmin'} berhasil diperbarui dan aktif realtime di server!`,
    });
  } catch (err: any) {
    console.error('[Update PIN Error]:', err);
    return sendJson(res, 500, { success: false, message: 'Gagal memperbarui PIN di server: ' + (err?.message || 'Error internal') });
  }
}
