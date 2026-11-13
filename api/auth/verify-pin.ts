import crypto from 'crypto';
import {
  SESSION_SECRET,
  comparePassword,
  extractPersonalPin,
  findActiveSuperadminByPin,
  findPrivilegedAccount,
  getClientIp,
  handleCors,
  parseBody,
  resolveGlobalPinsFromDatabases,
  sendJson,
  signSessionToken,
  verifyCardChallengeToken,
} from '../_authHelper';

interface PinRateRecord {
  attempts: number;
  firstAttempt: number;
  lockUntil: number;
}
const pinRateLimitMap = new Map<string, PinRateRecord>();

function checkPinRateLimit(key: string): { locked: boolean; waitSeconds: number; remaining: number } {
  const now = Date.now();
  const record = pinRateLimitMap.get(key);
  if (!record) return { locked: false, waitSeconds: 0, remaining: 5 };
  if (record.lockUntil > now) {
    return { locked: true, waitSeconds: Math.ceil((record.lockUntil - now) / 1000), remaining: 0 };
  }
  if (now > record.firstAttempt + 15 * 60 * 1000) {
    pinRateLimitMap.delete(key);
    return { locked: false, waitSeconds: 0, remaining: 5 };
  }
  return { locked: false, waitSeconds: 0, remaining: Math.max(0, 5 - record.attempts) };
}

function recordFailedPinAttempt(key: string): { locked: boolean; waitSeconds: number; remaining: number } {
  const now = Date.now();
  let record = pinRateLimitMap.get(key);
  if (!record) {
    record = { attempts: 0, firstAttempt: now, lockUntil: 0 };
    pinRateLimitMap.set(key, record);
  }
  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockUntil = now + 15 * 60 * 1000;
    return { locked: true, waitSeconds: 900, remaining: 0 };
  }
  return { locked: false, waitSeconds: 0, remaining: Math.max(0, 5 - record.attempts) };
}

function clearPinRateLimit(key: string) {
  pinRateLimitMap.delete(key);
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { valid: false, message: 'Method Not Allowed' });
  }

  try {
    const body = await parseBody(req);
    const { pin, targetRole, challengeToken, username, userId, nama } = body || {};
    const ip = getClientIp(req);
    const rateLimitKey = `${ip}:${String(targetRole || 'any').toLowerCase().trim()}:${String(username || userId || 'card').toLowerCase().trim()}`;

    const rateCheck = checkPinRateLimit(rateLimitKey);
    if (rateCheck.locked) {
      return sendJson(res, 429, {
        valid: false,
        locked: true,
        lockoutRemaining: rateCheck.waitSeconds,
        message: `⚠️ Terlalu banyak percobaan PIN salah. Akses PIN dikunci sementara demi keamanan. Coba lagi dalam ${rateCheck.waitSeconds} detik.`,
      });
    }

    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin.trim())) {
      return sendJson(res, 400, { valid: false, message: 'PIN wajib berupa tepat 6 digit angka.' });
    }

    if (challengeToken && typeof challengeToken === 'string') {
      const isChallengeValid = verifyCardChallengeToken(challengeToken, targetRole);
      if (!isChallengeValid) {
        return sendJson(res, 401, {
          valid: false,
          message: 'Token kartu akses fisik telah kedaluwarsa atau tidak sah. Silakan tap/scan ulang kartu fisik Anda.',
        });
      }
    }

    const cleanPin = pin.trim();
    const globalPins = await resolveGlobalPinsFromDatabases();
    const isGlobalSuperMatch =
      cleanPin === globalPins.superadminPin ||
      Boolean(globalPins.superadminPinHash && comparePassword(cleanPin, globalPins.superadminPinHash));
    const isGlobalDevMatch =
      cleanPin === globalPins.developerPin ||
      Boolean(globalPins.developerPinHash && comparePassword(cleanPin, globalPins.developerPinHash));

    const hasExplicitIdentity = Boolean(
      (typeof userId === 'string' && userId.trim().length > 0) ||
      (typeof username === 'string' && username.trim().length > 0)
    );

    const lookupIdentifiers = hasExplicitIdentity
      ? [userId, username].filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      : [nama].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

    let matchedAcc = await findPrivilegedAccount(lookupIdentifiers, targetRole);

    if (matchedAcc && (matchedAcc.isFrozen || matchedAcc.statusAkun === 'DIBEKUKAN' || matchedAcc.statusActive === 'FROZEN')) {
      return sendJson(res, 403, {
        valid: false,
        message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan oleh Administrator.',
      });
    }

    const personalPin = extractPersonalPin(matchedAcc);
    const personalPinHashMatch = Boolean(matchedAcc?.pinHash && comparePassword(cleanPin, matchedAcc.pinHash));
    const hasPersonalPin = Boolean(personalPin || matchedAcc?.pinHash);
    const accTs = Number(matchedAcc?.lastUpdatedTimestamp || 0);
    const isGlobalNewerThanAcc = globalPins.updatedAt > accTs;
    const isRootDevAcc =
      !matchedAcc || matchedAcc.id === 'adm-dev' || String(matchedAcc.username || '').toLowerCase() === 'ilhamfazril';
    const isRootSuperAcc =
      !matchedAcc ||
      matchedAcc.id === 'adm-super' ||
      ['superadmin', 'superadmin jabar', 'superadmin_jabar'].includes(String(matchedAcc.username || '').toLowerCase());

    let isMatch = false;
    let authorizedRole = '';
    let usedPin = cleanPin;

    if (targetRole === 'developer') {
      const personalMatches = cleanPin === personalPin || personalPinHashMatch;
      isMatch = hasPersonalPin
        ? personalMatches || (isRootDevAcc && isGlobalNewerThanAcc && isGlobalDevMatch)
        : isGlobalDevMatch;
      if (!isMatch && !hasExplicitIdentity && isGlobalDevMatch) {
        isMatch = true;
      }
      authorizedRole = 'developer';
    } else if (targetRole === 'superadmin') {
      if (hasExplicitIdentity) {
        const personalMatches = cleanPin === personalPin || personalPinHashMatch;
        isMatch = hasPersonalPin
          ? personalMatches || (isRootSuperAcc && isGlobalNewerThanAcc && isGlobalSuperMatch)
          : isGlobalSuperMatch;
      } else {
        if (hasPersonalPin && (cleanPin === personalPin || personalPinHashMatch)) {
          isMatch = true;
        } else if (isGlobalSuperMatch) {
          isMatch = true;
        } else {
          const matchedSuperByPin = await findActiveSuperadminByPin(cleanPin);
          if (matchedSuperByPin) {
            matchedAcc = matchedSuperByPin;
            isMatch = true;
          }
        }
      }
      authorizedRole = 'superadmin';
    } else {
      const superMatch = hasPersonalPin ? cleanPin === personalPin || personalPinHashMatch : isGlobalSuperMatch;
      if (isGlobalDevMatch) {
        isMatch = true;
        authorizedRole = 'developer';
      } else if (superMatch) {
        isMatch = true;
        authorizedRole = 'superadmin';
      } else if (!hasExplicitIdentity) {
        const matchedSuperByPin = await findActiveSuperadminByPin(cleanPin);
        if (matchedSuperByPin) {
          matchedAcc = matchedSuperByPin;
          isMatch = true;
          authorizedRole = 'superadmin';
        }
      }
    }

    if (!isMatch) {
      const failRecord = recordFailedPinAttempt(rateLimitKey);
      if (failRecord.locked) {
        return sendJson(res, 429, {
          valid: false,
          locked: true,
          lockoutRemaining: failRecord.waitSeconds,
          message: '⚠️ 5 kali percobaan PIN salah berturut-turut! Sistem otorisasi dibekukan selama 15 menit demi mencegah brute force.',
        });
      }
      return sendJson(res, 401, {
        valid: false,
        locked: false,
        remainingAttempts: failRecord.remaining,
        message: `❌ 6 Digit PIN Otoritas salah. Sisa kesempatan sebelum dibekukan: ${failRecord.remaining} kali.`,
      });
    }

    clearPinRateLimit(rateLimitKey);

    let finalAcc = matchedAcc;
    if (!finalAcc) {
      finalAcc = await findPrivilegedAccount(
        authorizedRole === 'developer' ? ['adm-dev', 'ilhamfazril'] : ['adm-super', 'superadmin jabar', 'superadmin'],
        authorizedRole
      );
    }

    const resolvedId = finalAcc?.id || (authorizedRole === 'developer' ? 'adm-dev' : 'adm-super');
    const resolvedUsername = finalAcc?.username || (authorizedRole === 'developer' ? 'ilhamfazril' : 'superadmin jabar');
    const resolvedNama =
      finalAcc?.namaAdmin || nama || (authorizedRole === 'developer' ? 'Ilham Fazril' : 'Superadmin Jabar');
    const resolvedWilayah =
      finalAcc?.wilayahTugas || (authorizedRole === 'developer' ? 'Pusat Developer Jabar' : 'PROVINSI JAWA BARAT');
    const resolvedAllowedPillars =
      authorizedRole === 'superadmin'
        ? Array.isArray(finalAcc?.allowedPillars)
          ? finalAcc.allowedPillars
          : ['all']
        : undefined;
    const resolvedAllowedKepahlawanan =
      authorizedRole === 'superadmin'
        ? Array.isArray(finalAcc?.allowedKepahlawanan)
          ? finalAcc.allowedKepahlawanan
          : ['all']
        : undefined;
    const resolvedPinOtoritas = extractPersonalPin(finalAcc) || usedPin;

    const authorityToken = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${authorizedRole}_${resolvedId}_${Date.now() + 30 * 60 * 1000}`)
      .digest('hex');

    const sessionToken = signSessionToken({
      id: resolvedId,
      username: resolvedUsername,
      role: authorizedRole as 'developer' | 'superadmin',
      namaAdmin: resolvedNama,
      wilayahTugas: resolvedWilayah,
      statusActive: 'SAH_TERDAFTAR',
      allowedPillars: resolvedAllowedPillars,
      allowedKepahlawanan: resolvedAllowedKepahlawanan,
      pinOtoritas: resolvedPinOtoritas,
    });

    return sendJson(res, 200, {
      valid: true,
      role: authorizedRole,
      id: resolvedId,
      username: resolvedUsername,
      authorityToken,
      sessionToken,
      nama: resolvedNama,
      wilayah: resolvedWilayah,
      allowedPillars: resolvedAllowedPillars,
      allowedKepahlawanan: resolvedAllowedKepahlawanan,
      pinOtoritas: resolvedPinOtoritas,
      message: `Verifikasi PIN 6 digit sah. Otoritas ${authorizedRole} disetujui.`,
    });
  } catch (err: any) {
    console.error('[Vercel Verify PIN Error]:', err);
    return sendJson(res, 500, { valid: false, message: 'Terjadi kesalahan sistem saat memvalidasi PIN.' });
  }
}
