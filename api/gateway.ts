import {
  DEFAULT_ROOT_ACCOUNTS,
  comparePassword,
  decryptSensitiveData,
  encryptSensitiveData,
  extractTokenFromReq,
  findPrivilegedAccount,
  getClientIp,
  getServerFirestore,
  handleCors,
  hashPassword,
  hashSearchableField,
  parseBody,
  sendJson,
  signSessionToken,
  supabase,
  verifySessionToken,
} from './_authHelper';

async function handleClientIp(req: any, res: any) {
  const ip = getClientIp(req);
  const isLocalOrPrivate =
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
  return sendJson(res, 200, { ip, isPublic: !isLocalOrPrivate, timestamp: Date.now() });
}

async function handleUpdatePassword(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
  const body = await parseBody(req);
  const token = extractTokenFromReq(req, body);
  const authSession = token ? verifySessionToken(token) : null;

  const { oldPassword, newPassword, userId: bodyUserId, username: bodyUsername, role: bodyRole } = body || {};
  const oldTrim = typeof oldPassword === 'string' ? oldPassword.trim() : '';
  const newTrim = typeof newPassword === 'string' ? newPassword.trim() : '';

  if (!oldTrim) return sendJson(res, 400, { success: false, message: 'Kata sandi saat ini wajib diisi.' });
  if (!newTrim) return sendJson(res, 400, { success: false, message: 'Kata sandi baru wajib diisi.' });
  if (oldTrim === newTrim) {
    return sendJson(res, 400, { success: false, message: '❌ Kata sandi baru tidak boleh sama dengan kata sandi lama!' });
  }

  const identifiers = authSession
    ? [authSession.id, authSession.username].filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    : [bodyUserId, bodyUsername].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  if (identifiers.length === 0) {
    return sendJson(res, 401, { success: false, message: 'Sesi otentikasi tidak ditemukan. Silakan login ulang.' });
  }

  const hintedRole = ((authSession?.role || bodyRole || '') as string).toLowerCase().trim();
  const preferredTable =
    hintedRole === 'developer'
      ? 'dev_accounts'
      : hintedRole === 'superadmin'
      ? 'superadmin_accounts'
      : hintedRole === 'user'
      ? 'user_accounts'
      : 'admin_accounts';

  const tablesToSearch = Array.from(
    new Set([preferredTable, 'dev_accounts', 'superadmin_accounts', 'admin_accounts', 'user_accounts'])
  );

  let matchedRow: any = null;
  let matchedTable = preferredTable;

  for (const tbl of tablesToSearch) {
    for (const ident of identifiers) {
      const cleanIdent = ident.trim();
      const lowerIdent = cleanIdent.toLowerCase();
      try {
        const { data: byId, error: byIdErr } = await supabase.from(tbl).select('*').eq('id', cleanIdent).limit(1).maybeSingle();
        if (!byIdErr && byId) {
          matchedRow = byId;
          matchedTable = tbl;
          break;
        }
        const { data: byUname, error: byUnameErr } = await supabase.from(tbl).select('*').ilike('username', lowerIdent).limit(1).maybeSingle();
        if (!byUnameErr && byUname) {
          matchedRow = byUname;
          matchedTable = tbl;
          break;
        }
      } catch {}
    }
    if (matchedRow) break;
  }

  if (!matchedRow) {
    try {
      const { firestore, db } = await getServerFirestore();
      for (const colName of tablesToSearch) {
        for (const ident of identifiers) {
          const cleanIdent = ident.trim();
          try {
            const directSnap = await firestore.getDoc(firestore.doc(db, colName, cleanIdent));
            if (directSnap.exists()) {
              const d = directSnap.data();
              matchedRow = { id: directSnap.id, ...d, data: d };
              matchedTable = colName;
              break;
            }
            const q = firestore.query(firestore.collection(db, colName), firestore.where('username', '==', cleanIdent.toLowerCase()));
            const snap = await firestore.getDocs(q);
            if (!snap.empty) {
              const dSnap = snap.docs[0];
              const d = dSnap.data();
              matchedRow = { id: dSnap.id, ...d, data: d };
              matchedTable = colName;
              break;
            }
          } catch {}
        }
        if (matchedRow) break;
      }
    } catch {}
  }

  let defMatch: any = null;
  if (!matchedRow) {
    defMatch = DEFAULT_ROOT_ACCOUNTS.find(
      (a) =>
        identifiers.some((idVal) => idVal.toLowerCase().trim() === a.id.toLowerCase().trim()) ||
        identifiers.some((idVal) => idVal.toLowerCase().trim() === a.username.toLowerCase().trim())
    );
  }

  if (!matchedRow && !defMatch) {
    return sendJson(res, 404, { success: false, message: '❌ Data akun Anda tidak ditemukan di database.' });
  }

  const existingDataObj = matchedRow?.data && typeof matchedRow.data === 'object' ? { ...matchedRow.data } : {};
  if (
    matchedRow?.isFrozen === true ||
    existingDataObj.isFrozen === true ||
    matchedRow?.statusAkun === 'DIBEKUKAN' ||
    existingDataObj.statusAkun === 'DIBEKUKAN' ||
    matchedRow?.statusActive === 'FROZEN' ||
    existingDataObj.statusActive === 'FROZEN'
  ) {
    return sendJson(res, 403, { success: false, message: '❌ AKUN DIBEKUKAN! Akun Anda sedang dinonaktifkan oleh Administrator.' });
  }

  const currentHash: string = matchedRow?.passwordHash || existingDataObj.passwordHash || defMatch?.passwordHash || '';
  if (!currentHash || !comparePassword(oldTrim, currentHash)) {
    return sendJson(res, 401, { success: false, message: '❌ Kata sandi saat ini yang Anda masukkan salah!' });
  }

  const targetId = matchedRow?.id || defMatch?.id || authSession?.id || String(bodyUserId || '').trim();
  const targetUsername =
    matchedRow?.username || existingDataObj.username || defMatch?.username || authSession?.username || String(bodyUsername || '').trim();
  const rawRole = matchedRow?.role || existingDataObj.role || defMatch?.role || authSession?.role || hintedRole || 'user';
  const targetRole =
    targetId === 'adm-dev' || (targetUsername || '').toLowerCase().trim() === 'ilhamfazril'
      ? 'developer'
      : targetId === 'adm-super' || matchedTable === 'superadmin_accounts' || (targetUsername || '').toLowerCase().includes('superadmin')
      ? 'superadmin'
      : (rawRole as 'user' | 'admin' | 'superadmin' | 'developer');

  if (targetRole === 'superadmin' || targetRole === 'developer') {
    if (newTrim.length < 12) {
      return sendJson(res, 400, { success: false, message: '❌ Kata sandi Superadmin/Developer minimal 12 karakter.' });
    }
    if (!/[A-Z]/.test(newTrim) || !/[a-z]/.test(newTrim) || !/[0-9]/.test(newTrim)) {
      return sendJson(res, 400, {
        success: false,
        message: '❌ Kata sandi wajib kombinasi huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9).',
      });
    }
  } else if (newTrim.length < 6) {
    return sendJson(res, 400, { success: false, message: '❌ Kata sandi baru minimal 6 karakter.' });
  }

  const prevHashes: string[] = Array.isArray(existingDataObj.previousPasswordHashes)
    ? existingDataObj.previousPasswordHashes.filter((h: any) => typeof h === 'string' && h.length > 0)
    : [];
  if (comparePassword(newTrim, currentHash) || prevHashes.some((h) => comparePassword(newTrim, h))) {
    return sendJson(res, 400, {
      success: false,
      message: '❌ Kata sandi lama tidak boleh digunakan kembali! Gunakan kata sandi baru yang berbeda.',
    });
  }

  const newHash = hashPassword(newTrim);
  const encPassword = encryptSensitiveData(newTrim);
  const nowMs = Date.now();
  const updatedPrevHashes = [currentHash, ...prevHashes].slice(0, 5);

  const targetNama = matchedRow?.namaAdmin || existingDataObj.namaAdmin || defMatch?.namaAdmin || authSession?.namaAdmin || targetUsername;
  const targetWilayah =
    targetRole === 'superadmin'
      ? 'PROVINSI JAWA BARAT'
      : targetRole === 'developer'
      ? 'Pusat Developer Jabar'
      : matchedRow?.wilayahTugas || existingDataObj.wilayahTugas || defMatch?.wilayahTugas || authSession?.wilayahTugas || '';
  const targetStatusActive = matchedRow?.statusActive || existingDataObj.statusActive || 'SAH_TERDAFTAR';
  const targetAllowedPillars = Array.isArray(matchedRow?.allowedPillars)
    ? matchedRow.allowedPillars
    : Array.isArray(existingDataObj.allowedPillars)
    ? existingDataObj.allowedPillars
    : targetRole === 'superadmin'
    ? ['all']
    : undefined;
  const targetAllowedKepahlawanan = Array.isArray(matchedRow?.allowedKepahlawanan)
    ? matchedRow.allowedKepahlawanan
    : Array.isArray(existingDataObj.allowedKepahlawanan)
    ? existingDataObj.allowedKepahlawanan
    : targetRole === 'superadmin'
    ? ['all']
    : undefined;

  const rawPinEncrypted = matchedRow?.pinEncrypted || existingDataObj.pinEncrypted || '';
  const decryptedPinFromRow = rawPinEncrypted ? decryptSensitiveData(rawPinEncrypted) : '';
  const targetPinOtoritas =
    (/^\d{6}$/.test(decryptedPinFromRow) ? decryptedPinFromRow : '') ||
    matchedRow?.pinOtoritas ||
    existingDataObj.pinOtoritas ||
    authSession?.pinOtoritas ||
    undefined;
  const preservedPinEncrypted = rawPinEncrypted || (targetPinOtoritas ? encryptSensitiveData(targetPinOtoritas) : undefined);
  const preservedPinHash = matchedRow?.pinHash || existingDataObj.pinHash || (targetPinOtoritas ? hashPassword(targetPinOtoritas) : undefined);

  const saveTable =
    targetRole === 'developer'
      ? 'dev_accounts'
      : targetRole === 'superadmin'
      ? 'superadmin_accounts'
      : targetRole === 'user'
      ? 'user_accounts'
      : matchedTable;

  const refreshedSessionToken = signSessionToken({
    id: targetId,
    username: targetUsername,
    role: targetRole,
    namaAdmin: targetNama,
    wilayahTugas: targetWilayah,
    statusActive: targetStatusActive,
    allowedPillars: targetAllowedPillars,
    allowedKepahlawanan: targetAllowedKepahlawanan,
    pinOtoritas: targetPinOtoritas,
  });

  delete existingDataObj.passwordPolos;
  delete existingDataObj.pinOtoritas;
  delete existingDataObj.superadminPin;
  delete existingDataObj.developerPin;
  delete existingDataObj._previousUsername;

  const nextDataJson = {
    ...existingDataObj,
    username: targetUsername,
    namaAdmin: targetNama,
    role: targetRole,
    wilayahTugas: targetWilayah,
    statusActive: targetStatusActive,
    ...(targetAllowedPillars ? { allowedPillars: targetAllowedPillars } : {}),
    ...(targetAllowedKepahlawanan ? { allowedKepahlawanan: targetAllowedKepahlawanan } : {}),
    ...(preservedPinEncrypted ? { pinEncrypted: preservedPinEncrypted } : {}),
    ...(preservedPinHash ? { pinHash: preservedPinHash } : {}),
    passwordHash: newHash,
    passwordEncrypted: encPassword,
    previousPasswordHashes: updatedPrevHashes,
    resetTicket: null,
    lastUpdatedTimestamp: nowMs,
    lastEditedBy: targetUsername || targetNama,
    lastEditedByRole: targetRole,
    isSelfUpdate: true,
  };

  const { error: sbSaveErr } = await supabase.from(saveTable).upsert(
    {
      id: targetId,
      username: targetUsername,
      namaAdmin: targetNama,
      role: targetRole,
      statusActive: targetStatusActive,
      wilayahTugas: targetWilayah,
      passwordHash: newHash,
      sessionToken: refreshedSessionToken,
      data: nextDataJson,
    },
    { onConflict: 'id' }
  );

  if (sbSaveErr) {
    return sendJson(res, 500, { success: false, message: 'Gagal memperbarui kata sandi di database.' });
  }

  if ((saveTable === 'superadmin_accounts' || saveTable === 'dev_accounts') && targetId) {
    try {
      await supabase.from('admin_accounts').delete().eq('id', targetId);
      if (targetUsername) await supabase.from('admin_accounts').delete().ilike('username', targetUsername.toLowerCase().trim());
    } catch {}
  }

  try {
    const { firestore, db } = await getServerFirestore();
    await firestore.setDoc(
      firestore.doc(db, saveTable, targetId),
      { id: targetId, ...nextDataJson },
      { merge: true }
    );
    if (saveTable === 'superadmin_accounts' || saveTable === 'dev_accounts') {
      try {
        await firestore.deleteDoc(firestore.doc(db, 'admin_accounts', targetId));
      } catch {}
    }
  } catch {}

  return sendJson(res, 200, {
    success: true,
    updatedAccountId: targetId,
    username: targetUsername,
    role: targetRole,
    sessionToken: refreshedSessionToken,
    passwordHash: newHash,
    passwordEncrypted: encPassword,
    previousPasswordHashes: updatedPrevHashes,
    lastUpdatedTimestamp: nowMs,
    message: '✅ Kata sandi berhasil diperbarui secara aman dan langsung tersinkron ke Manajemen Superadmin!',
  });
}

async function handleSaveSuperadmin(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
  const body = await parseBody(req);
  const token = extractTokenFromReq(req, body);
  const actor = token ? verifySessionToken(token) : null;
  if (!actor || actor.role !== 'developer') {
    return sendJson(res, 403, { success: false, message: 'Akses ditolak: Hanya Developer yang berwenang mengelola akun Superadmin.' });
  }

  const {
    id,
    _previousUsername,
    namaAdmin,
    username,
    password,
    pin,
    nik,
    noWhatsapp,
    allowedPillars,
    allowedKepahlawanan,
    isFrozen,
    statusAkun,
  } = body || {};

  const namaClean = typeof namaAdmin === 'string' ? namaAdmin.trim() : '';
  const unameClean = typeof username === 'string' ? username.trim().toLowerCase().replace(/\s+/g, '_') : '';
  const pinClean = typeof pin === 'string' ? pin.trim() : '';
  const passClean = typeof password === 'string' ? password.trim() : '';

  if (!namaClean) return sendJson(res, 400, { success: false, message: 'Nama lengkap Superadmin wajib diisi.' });
  if (!unameClean || unameClean.length < 4) return sendJson(res, 400, { success: false, message: 'Username minimal 4 karakter.' });
  if (!/^\d{6}$/.test(pinClean)) return sendJson(res, 400, { success: false, message: 'PIN Otoritas wajib berupa tepat 6 digit angka.' });

  const targetId = typeof id === 'string' && id.trim() ? id.trim() : `adm-super-${Date.now()}`;
  const existingAcc = await findPrivilegedAccount(
    [targetId, _previousUsername, unameClean].filter((v): v is string => typeof v === 'string' && v.trim().length > 0),
    'superadmin'
  );
  const defMatch = DEFAULT_ROOT_ACCOUNTS.find((a) => a.id === targetId || a.username.toLowerCase() === unameClean);
  const existingDataObj: Record<string, any> =
    existingAcc?.rawData && typeof existingAcc.rawData === 'object' ? { ...existingAcc.rawData } : {};

  const existingHash = existingAcc?.rawRow?.passwordHash || existingDataObj.passwordHash || defMatch?.passwordHash || '';
  const existingEncryptedPass = existingDataObj.passwordEncrypted || '';
  let existingDecryptedPass = '';
  if (existingEncryptedPass) {
    try {
      existingDecryptedPass = decryptSensitiveData(existingEncryptedPass);
    } catch {}
  }

  const isCreating = !existingAcc && !defMatch && !(typeof id === 'string' && id.trim());
  const isPasswordChanged = Boolean(passClean && passClean !== existingDecryptedPass);

  if (isCreating || isPasswordChanged || (!existingHash && passClean)) {
    if (passClean.length < 12 || !/[A-Z]/.test(passClean) || !/[a-z]/.test(passClean) || !/[0-9]/.test(passClean)) {
      return sendJson(res, 400, {
        success: false,
        message: 'Kata sandi Superadmin minimal 12 karakter kombinasi huruf besar (A-Z), huruf kecil (a-z), dan angka (0-9).',
      });
    }
  } else if (!existingHash && !passClean) {
    return sendJson(res, 400, { success: false, message: 'Kata sandi wajib diisi untuk akun Superadmin baru.' });
  }

  const prevHashes: string[] = Array.isArray(existingDataObj.previousPasswordHashes)
    ? existingDataObj.previousPasswordHashes.filter((h: any) => typeof h === 'string' && h.length > 0)
    : [];
  const nextPasswordHash = isPasswordChanged || !existingHash ? hashPassword(passClean) : existingHash;
  const nextPasswordEncrypted =
    isPasswordChanged || !existingEncryptedPass
      ? passClean
        ? encryptSensitiveData(passClean)
        : existingEncryptedPass
      : existingEncryptedPass;
  const nextPrevHashes =
    isPasswordChanged && existingHash && !comparePassword(passClean, existingHash)
      ? [existingHash, ...prevHashes].slice(0, 5)
      : prevHashes;

  const encPin = encryptSensitiveData(pinClean);
  const hashedPin = hashPassword(pinClean);
  const nowMs = Date.now();

  const rawNik = typeof nik === 'string' ? nik.trim() : '';
  const rawWa = typeof noWhatsapp === 'string' ? noWhatsapp.trim() : '';
  const encNik = rawNik ? encryptSensitiveData(rawNik) : existingDataObj.nik || '';
  const nikHash = rawNik ? hashSearchableField(rawNik) : existingDataObj.nikHash || '';
  const encWa = rawWa ? encryptSensitiveData(rawWa) : existingDataObj.noWhatsapp || '';

  const finalAllowedPillars = Array.isArray(allowedPillars)
    ? allowedPillars
    : Array.isArray(existingAcc?.allowedPillars)
    ? existingAcc.allowedPillars
    : ['all'];
  const finalAllowedKepahlawanan = Array.isArray(allowedKepahlawanan)
    ? allowedKepahlawanan
    : Array.isArray(existingAcc?.allowedKepahlawanan)
    ? existingAcc.allowedKepahlawanan
    : ['all'];

  delete existingDataObj.passwordPolos;
  delete existingDataObj.pinOtoritas;
  delete existingDataObj.superadminPin;
  delete existingDataObj.developerPin;
  delete existingDataObj._previousUsername;

  const nextDataJson = {
    ...existingDataObj,
    id: targetId,
    username: unameClean,
    namaAdmin: namaClean,
    role: 'superadmin',
    wilayahTugas: 'PROVINSI JAWA BARAT',
    statusActive: 'SAH_TERDAFTAR',
    statusAkun: statusAkun || (isFrozen ? 'DIBEKUKAN' : 'AKTIF'),
    isFrozen: Boolean(isFrozen),
    passwordHash: nextPasswordHash,
    ...(nextPasswordEncrypted ? { passwordEncrypted: nextPasswordEncrypted } : {}),
    previousPasswordHashes: nextPrevHashes,
    pinEncrypted: encPin,
    pinHash: hashedPin,
    allowedPillars: finalAllowedPillars,
    allowedKepahlawanan: finalAllowedKepahlawanan,
    ...(encNik ? { nik: encNik, nikHash } : {}),
    ...(encWa ? { noWhatsapp: encWa } : {}),
    lastUpdatedTimestamp: nowMs,
    lastEditedBy: actor.namaAdmin || actor.username || 'Lead Developer',
    lastEditedByRole: 'developer',
    isSelfUpdate: false,
  };

  const { error: sbErr } = await supabase.from('superadmin_accounts').upsert(
    {
      id: targetId,
      username: unameClean,
      namaAdmin: namaClean,
      role: 'superadmin',
      statusActive: 'SAH_TERDAFTAR',
      wilayahTugas: 'PROVINSI JAWA BARAT',
      passwordHash: nextPasswordHash,
      sessionToken: existingAcc?.rawRow?.sessionToken || '',
      ...(encNik ? { nik: encNik, nikHash } : {}),
      ...(encWa ? { noWhatsapp: encWa } : {}),
      data: nextDataJson,
    },
    { onConflict: 'id' }
  );

  if (sbErr) {
    return sendJson(res, 500, { success: false, message: 'Gagal menyimpan data Superadmin ke database.' });
  }

  try {
    await supabase.from('admin_accounts').delete().eq('id', targetId);
    if (unameClean) await supabase.from('admin_accounts').delete().ilike('username', unameClean);
    if (typeof _previousUsername === 'string' && _previousUsername.trim()) {
      await supabase.from('admin_accounts').delete().ilike('username', _previousUsername.trim().toLowerCase());
    }
  } catch {}

  try {
    const { firestore, db } = await getServerFirestore();
    await firestore.setDoc(firestore.doc(db, 'superadmin_accounts', targetId), nextDataJson, { merge: true });
    try {
      await firestore.deleteDoc(firestore.doc(db, 'admin_accounts', targetId));
    } catch {}
  } catch {}

  const isRootSuper =
    targetId === 'adm-super' || unameClean === 'superadmin' || unameClean === 'superadmin_jabar' || unameClean === 'superadmin jabar';
  if (isRootSuper) {
    try {
      const { data: existingGlobal } = await supabase.from('app_settings').select('data').eq('id', 'global').maybeSingle();
      const baseGlobal = existingGlobal?.data && typeof existingGlobal.data === 'object' ? { ...existingGlobal.data } : {};
      delete baseGlobal.superadminPin;
      await supabase.from('app_settings').upsert(
        {
          id: 'global',
          data: {
            ...baseGlobal,
            superadminPinEncrypted: encPin,
            superadminPinHash: hashedPin,
            pinSecurityUpdatedAt: nowMs,
          },
        },
        { onConflict: 'id' }
      );
    } catch {}
    try {
      const { firestore, db } = await getServerFirestore();
      await firestore.setDoc(
        firestore.doc(db, 'app_settings', 'global'),
        {
          superadminPinEncrypted: encPin,
          superadminPinHash: hashedPin,
          superadminPin: firestore.deleteField(),
          pinSecurityUpdatedAt: nowMs,
        },
        { merge: true }
      );
    } catch {}
  }

  return sendJson(res, 200, {
    success: true,
    lastUpdatedTimestamp: nowMs,
    account: {
      ...nextDataJson,
      pinOtoritas: pinClean,
      passwordPolos: '',
    },
    message: 'Akun Superadmin berhasil disimpan aman ke database dengan enkripsi penuh.',
  });
}

async function handleSettingsUpdate(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, 405, { success: false, message: 'Method Not Allowed' });
  const body = await parseBody(req);
  const token = extractTokenFromReq(req, body);
  const actor = token ? verifySessionToken(token) : null;
  if (!actor || (actor.role !== 'superadmin' && actor.role !== 'developer')) {
    return sendJson(res, 401, { success: false, error: 'Akses ditolak: Token sesi tidak sah atau otoritas tidak mencukupi.' });
  }

  const { id, data } = body || {};
  if (!id || !data || typeof data !== 'object') {
    return sendJson(res, 400, { success: false, message: 'ID dan data pengaturan wajib diisi.' });
  }

  const sanitized = { ...data };
  if (typeof sanitized.superadminPin === 'string' && /^\d{6}$/.test(sanitized.superadminPin.trim())) {
    sanitized.superadminPinEncrypted = encryptSensitiveData(sanitized.superadminPin.trim());
    sanitized.superadminPinHash = hashPassword(sanitized.superadminPin.trim());
  }
  if (typeof sanitized.developerPin === 'string' && /^\d{6}$/.test(sanitized.developerPin.trim())) {
    sanitized.developerPinEncrypted = encryptSensitiveData(sanitized.developerPin.trim());
    sanitized.developerPinHash = hashPassword(sanitized.developerPin.trim());
  }
  delete sanitized.superadminPin;
  delete sanitized.developerPin;
  delete sanitized.passwordPolos;
  delete sanitized.pinOtoritas;

  await supabase.from('app_settings').upsert({ id, data: sanitized }, { onConflict: 'id' });
  try {
    const { firestore, db } = await getServerFirestore();
    await firestore.setDoc(
      firestore.doc(db, 'app_settings', id),
      {
        ...sanitized,
        superadminPin: firestore.deleteField(),
        developerPin: firestore.deleteField(),
      },
      { merge: true }
    );
  } catch {}

  return sendJson(res, 200, { success: true, message: 'Pengaturan sistem berhasil diperbarui dengan aman!' });
}

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, 'GET, POST, OPTIONS')) return;

  try {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    const action = (req.query?.action as string) || urlObj.searchParams.get('action') || '';

    if (action === 'client-ip') return await handleClientIp(req, res);
    if (action === 'update-password') return await handleUpdatePassword(req, res);
    if (action === 'save-superadmin') return await handleSaveSuperadmin(req, res);
    if (action === 'settings-update') return await handleSettingsUpdate(req, res);

    return sendJson(res, 404, { success: false, message: 'Endpoint API tidak ditemukan.' });
  } catch (err: any) {
    console.error('[Vercel Gateway Error]:', err);
    return sendJson(res, 500, { success: false, message: 'Terjadi kesalahan server.' });
  }
}
