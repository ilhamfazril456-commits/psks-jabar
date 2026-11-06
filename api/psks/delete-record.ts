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

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
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
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
    const { id } = body || {};

    if (!id) {
      return sendJson(res, 400, { success: false, message: 'ID record wajib diisi.' });
    }

    const { error } = await supabase.from('psks_records').delete().eq('id', id);
    if (error) {
      return sendJson(res, 500, { success: false, message: error.message });
    }

    return sendJson(res, 200, { success: true, message: 'Record berhasil dihapus.' });
  } catch (err: any) {
    return sendJson(res, 500, { success: false, message: err?.message || 'Gagal menghapus record.' });
  }
}
