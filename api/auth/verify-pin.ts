import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zwjbjmafxixudhlvaxef.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_-Q49NtwnUsY9oF3jpRXEmw_J82UN4Uy';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const SESSION_SECRET = process.env.SESSION_SECRET || 'psks_jabar_production_auth_secret_2026_super_secure_key';

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
    const { pin, targetRole } = req.body || {};
    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
      return res.status(400).json({ valid: false, message: 'PIN wajib berupa tepat 6 digit angka.' });
    }

    const cleanPin = pin.trim();

    let currentSettings: any = null;
    try {
      const { data } = await supabase.from('app_settings').select('*').eq('id', 'global').maybeSingle();
      if (data && data.data) currentSettings = data.data;
    } catch {}

    const validSuperadminPin = (currentSettings?.superadminPin || '123456').trim();
    const validDeveloperPin = (currentSettings?.developerPin || '992211').trim();

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
      return res.status(401).json({
        valid: false,
        message: '❌ 6 Digit PIN Otoritas salah. Silakan periksa kembali PIN Anda.',
      });
    }

    const authorityToken = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${authorizedRole}_${Date.now() + 30 * 60 * 1000}`)
      .digest('hex');

    return res.status(200).json({
      valid: true,
      role: authorizedRole,
      authorityToken,
      message: `Verifikasi PIN 6 digit sah. Otoritas ${authorizedRole} disetujui.`,
    });
  } catch (err: any) {
    return res.status(500).json({ valid: false, message: 'Terjadi kesalahan sistem saat memvalidasi PIN.' });
  }
}
