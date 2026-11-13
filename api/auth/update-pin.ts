import {
  DEFAULT_ROOT_ACCOUNTS,
  comparePassword,
  encryptSensitiveData,
  extractPersonalPin,
  extractTokenFromReq,
  findPrivilegedAccount,
  getServerFirestore,
  handleCors,
  hashPassword,
  parseBody,
  resolveGlobalPinsFromDatabases,
  sendJson,
  signSessionToken,
  supabase,
  verifySessionToken,
} from '../_authHelper';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, 'POST, OPTIONS')) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Metode HTTP tidak diizinkan.' });
  }

  try {
    const body = await parseBody(req);
    const token = extractTokenFromReq(req, body);
    const authSession = token ? verifySessionToken(token) : null;
    const { newPin, pinType, userId, username, currentPin } = body || {};

    if (!newPin || typeof newPin !== 'string' || !/^\d{6}$/.test(newPin.trim())) {
      return sendJson(res, 400, { success: false, message: 'PIN baru wajib berupa tepat 6 digit angka.' });
    }

    const cleanPin = newPin.trim();
    const requestedRole = pinType === 'developer' ? 'developer' : 'superadmin';

    let actorRole: 'developer' | 'superadmin' = 'superadmin';
    let actorName = '';
    let targetId = '';
    let targetUname = '';

    if (authSession) {
      if (authSession.role !== 'superadmin' && authSession.role !== 'developer') {
        return sendJson(res, 403, { success: false, message: 'Otoritas tidak mencukupi (Wajib Superadmin atau Developer).' });
      }
      if (requestedRole === 'developer' && authSession.role !== 'developer') {
        return sendJson(res, 403, { success: false, message: 'Hanya Developer Utama yang berwenang mengubah PIN Developer.' });
      }
      actorRole = authSession.role;
      actorName = authSession.namaAdmin || authSession.username;
      if (authSession.role === 'developer') {
        if (requestedRole === 'superadmin') {
          targetId = userId || 'adm-super';
          targetUname = username || (userId ? '' : 'superadmin jabar');
        } else {
          targetId = userId || authSession.id;
          targetUname = username || authSession.username;
        }
      } else {
        targetId = authSession.id;
        targetUname = authSession.username;
      }
    } else {
      const cleanCurrent = typeof currentPin === 'string' ? currentPin.trim() : '';
      if (!/^\d{6}$/.test(cleanCurrent)) {
        return sendJson(res, 401, { success: false, message: 'Sesi otentikasi tidak valid. Silakan verifikasi ulang.' });
      }
      const lookupAcc = await findPrivilegedAccount(
        [userId, username].filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
        requestedRole
      );
      const existingPersonalPin = extractPersonalPin(lookupAcc);
      const matchesHash = Boolean(lookupAcc?.pinHash && comparePassword(cleanCurrent, lookupAcc.pinHash));
      const globalPins = await resolveGlobalPinsFromDatabases();
      const globalExpected = requestedRole === 'developer' ? globalPins.developerPin : globalPins.superadminPin;
      const globalExpectedHash = requestedRole === 'developer' ? globalPins.developerPinHash : globalPins.superadminPinHash;
      const globalMatches =
        cleanCurrent === globalExpected || Boolean(globalExpectedHash && comparePassword(cleanCurrent, globalExpectedHash));
      const verifiedPin =
        existingPersonalPin || lookupAcc?.pinHash
          ? cleanCurrent === existingPersonalPin || matchesHash || globalMatches
          : globalMatches;

      if (!verifiedPin) {
        return sendJson(res, 401, { success: false, message: 'Verifikasi sesi/PIN saat ini tidak valid.' });
      }
      actorRole = requestedRole;
      actorName = lookupAcc?.namaAdmin || lookupAcc?.username || String(username || userId || requestedRole);
      targetId = lookupAcc?.id || String(userId || '').trim();
      targetUname = lookupAcc?.username || String(username || '').trim();
    }

    const targetRoleForLookup = requestedRole === 'developer' ? 'developer' : 'superadmin';
    const targetAcc = await findPrivilegedAccount(
      [targetId, targetUname].filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
      targetRoleForLookup
    );

    const defMatch = DEFAULT_ROOT_ACCOUNTS.find(
      (a) =>
        (targetId && a.id.toLowerCase() === String(targetId).toLowerCase()) ||
        (targetUname && a.username.toLowerCase() === String(targetUname).toLowerCase())
    );

    const resolvedId = targetAcc?.id || defMatch?.id || String(targetId || (requestedRole === 'developer' ? 'adm-dev' : 'adm-super'));
    const resolvedUsername =
      targetAcc?.username || defMatch?.username || String(targetUname || (requestedRole === 'developer' ? 'ilhamfazril' : 'superadmin jabar'));
    const resolvedNama = targetAcc?.namaAdmin || defMatch?.namaAdmin || actorName || resolvedUsername;
    const resolvedWilayah =
      requestedRole === 'developer'
        ? 'Pusat Developer Jabar'
        : targetAcc?.wilayahTugas || defMatch?.wilayahTugas || 'PROVINSI JAWA BARAT';
    const saveTable = requestedRole === 'developer' ? 'dev_accounts' : 'superadmin_accounts';

    const encPin = encryptSensitiveData(cleanPin);
    const hashedPin = hashPassword(cleanPin);
    const nowMs = Date.now();
    const isSelf = Boolean(authSession ? resolvedId === authSession.id : true);

    const refreshedSessionToken = signSessionToken({
      id: resolvedId,
      username: resolvedUsername,
      role: targetRoleForLookup,
      namaAdmin: resolvedNama,
      wilayahTugas: resolvedWilayah,
      statusActive: targetAcc?.statusActive || 'SAH_TERDAFTAR',
      allowedPillars: targetAcc?.allowedPillars || (targetRoleForLookup === 'superadmin' ? ['all'] : undefined),
      allowedKepahlawanan: targetAcc?.allowedKepahlawanan || (targetRoleForLookup === 'superadmin' ? ['all'] : undefined),
      pinOtoritas: cleanPin,
    });

    const existingJsonData: Record<string, any> =
      targetAcc?.rawData && typeof targetAcc.rawData === 'object' ? { ...targetAcc.rawData } : {};
    delete existingJsonData.pinOtoritas;
    delete existingJsonData.passwordPolos;
    delete existingJsonData.superadminPin;
    delete existingJsonData.developerPin;
    delete existingJsonData._previousUsername;

    const nextDataJson = {
      ...existingJsonData,
      username: resolvedUsername,
      namaAdmin: resolvedNama,
      role: targetRoleForLookup,
      wilayahTugas: resolvedWilayah,
      statusActive: targetAcc?.statusActive || 'SAH_TERDAFTAR',
      statusAkun: targetAcc?.statusAkun || 'AKTIF',
      isFrozen: targetAcc?.isFrozen === true,
      ...(targetAcc?.allowedPillars
        ? { allowedPillars: targetAcc.allowedPillars }
        : targetRoleForLookup === 'superadmin'
        ? { allowedPillars: ['all'] }
        : {}),
      ...(targetAcc?.allowedKepahlawanan
        ? { allowedKepahlawanan: targetAcc.allowedKepahlawanan }
        : targetRoleForLookup === 'superadmin'
        ? { allowedKepahlawanan: ['all'] }
        : {}),
      ...(targetAcc?.rawRow?.passwordHash || existingJsonData.passwordHash || defMatch?.passwordHash
        ? { passwordHash: targetAcc?.rawRow?.passwordHash || existingJsonData.passwordHash || defMatch?.passwordHash }
        : {}),
      pinEncrypted: encPin,
      pinHash: hashedPin,
      lastUpdatedTimestamp: nowMs,
      lastEditedBy: actorName || resolvedUsername,
      lastEditedByRole: actorRole,
      isSelfUpdate: isSelf,
    };

    const upsertPayload = {
      id: resolvedId,
      username: resolvedUsername,
      namaAdmin: resolvedNama,
      role: targetRoleForLookup,
      statusActive: targetAcc?.statusActive || 'SAH_TERDAFTAR',
      wilayahTugas: resolvedWilayah,
      passwordHash: nextDataJson.passwordHash || '',
      sessionToken: refreshedSessionToken,
      data: nextDataJson,
    };

    try {
      await supabase.from(saveTable).upsert(upsertPayload, { onConflict: 'id' });
      if (resolvedId) await supabase.from('admin_accounts').delete().eq('id', resolvedId);
      if (resolvedUsername) await supabase.from('admin_accounts').delete().ilike('username', resolvedUsername.toLowerCase().trim());
    } catch {}

    try {
      const { firestore, db } = await getServerFirestore();
      await firestore.setDoc(firestore.doc(db, saveTable, resolvedId), nextDataJson, { merge: true });
      try {
        await firestore.deleteDoc(firestore.doc(db, 'admin_accounts', resolvedId));
      } catch {}
    } catch {}

    const isRootAccount =
      resolvedId === 'adm-super' ||
      resolvedId === 'adm-dev' ||
      resolvedUsername.toLowerCase().trim() === 'superadmin' ||
      resolvedUsername.toLowerCase().trim() === 'superadmin jabar' ||
      resolvedUsername.toLowerCase().trim() === 'ilhamfazril';

    if (requestedRole === 'developer' || (actorRole === 'developer' && !userId && !username) || isRootAccount) {
      try {
        const { data: existingGlobal } = await supabase.from('app_settings').select('data').eq('id', 'global').maybeSingle();
        const baseGlobal = existingGlobal?.data && typeof existingGlobal.data === 'object' ? { ...existingGlobal.data } : {};
        delete baseGlobal.superadminPin;
        delete baseGlobal.developerPin;
        const mergedGlobalData = {
          ...baseGlobal,
          ...(requestedRole === 'developer'
            ? { developerPinEncrypted: encPin, developerPinHash: hashedPin }
            : { superadminPinEncrypted: encPin, superadminPinHash: hashedPin }),
          pinSecurityUpdatedAt: nowMs,
        };
        await supabase.from('app_settings').upsert({ id: 'global', data: mergedGlobalData }, { onConflict: 'id' });
      } catch {}

      try {
        const { firestore, db } = await getServerFirestore();
        await firestore.setDoc(
          firestore.doc(db, 'app_settings', 'global'),
          {
            ...(requestedRole === 'developer'
              ? { developerPinEncrypted: encPin, developerPinHash: hashedPin, developerPin: firestore.deleteField() }
              : { superadminPinEncrypted: encPin, superadminPinHash: hashedPin, superadminPin: firestore.deleteField() }),
            pinSecurityUpdatedAt: nowMs,
          },
          { merge: true }
        );
      } catch {}
    }

    return sendJson(res, 200, {
      success: true,
      pinOtoritas: cleanPin,
      pinEncrypted: encPin,
      pinHash: hashedPin,
      sessionToken: refreshedSessionToken,
      lastUpdatedTimestamp: nowMs,
      updatedAccountId: resolvedId,
      message: `PIN ${requestedRole === 'developer' ? 'Developer' : 'Superadmin'} berhasil diperbarui aman (terenkripsi) & disinkronkan!`,
    });
  } catch (err: any) {
    console.error('[Vercel Update PIN Error]:', err);
    return sendJson(res, 500, { success: false, message: 'Gagal memperbarui PIN di server.' });
  }
}
