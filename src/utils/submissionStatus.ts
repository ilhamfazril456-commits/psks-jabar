import { PillarRegistrationSubmission } from '../types';

export const normalizeWilayah = (w?: string): string => {
  if (!w) return '';
  return w
    .toLowerCase()
    .replace(/^kabupaten\s+/i, 'kab. ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const isSameWilayah = (w1?: string, w2?: string): boolean => {
  if (!w1 || !w2) return false;
  const n1 = normalizeWilayah(w1);
  const n2 = normalizeWilayah(w2);
  if (n1 === n2) return true;

  // Handle Prov. Jabar aliases
  const isJabar1 = /^(prov\.|provinsi|jabar|jawa barat|tingkat provinsi|pusat|semua wilayah)$/i.test(n1);
  const isJabar2 = /^(prov\.|provinsi|jabar|jawa barat|tingkat provinsi|pusat|semua wilayah)$/i.test(n2);
  if (isJabar1 && isJabar2) return true;

  const clean1 = n1.replace(/^(kab\.|kota|prov\.)\s*/, '').trim();
  const clean2 = n2.replace(/^(kab\.|kota|prov\.)\s*/, '').trim();

  if (clean1 === clean2) {
    const isKota1 = n1.startsWith('kota');
    const isKota2 = n2.startsWith('kota');
    const isKab1 = n1.startsWith('kab.');
    const isKab2 = n2.startsWith('kab.');

    if (isKota1 && isKab2) return false;
    if (isKab1 && isKota2) return false;
    return true;
  }

  return false;
};

export const normalizeSuperadminStatus = (
  status?: string
): 'DISETUJUI_WILAYAH' | 'PENDING' | 'SAH_TERDAFTAR' | 'REJECTED' => {
  if (!status) return 'PENDING';
  const s = status.toUpperCase().trim();
  if (
    s === 'DISETUJUI_WILAYAH' ||
    (s.includes('WILAYAH') && s.includes('SETUJU')) ||
    s.includes('MENUNGGU_PENGESAHAN')
  ) {
    return 'DISETUJUI_WILAYAH';
  }
  if (
    s === 'SAH_TERDAFTAR' ||
    s === 'APPROVED' ||
    s === 'ACC' ||
    s.includes('SAH') ||
    s.includes('DITERIMA')
  ) {
    return 'SAH_TERDAFTAR';
  }
  if (
    s.includes('TOLAK') ||
    s.includes('REJECT') ||
    s.includes('BATAL') ||
    s.includes('DITOLAK')
  ) {
    return 'REJECTED';
  }
  return 'PENDING';
};

export const normalizeRegionalStatus = (
  status?: string
): 'PENDING' | 'DISETUJUI_WILAYAH' | 'SAH_TERDAFTAR' | 'REJECTED' => {
  if (!status) return 'PENDING';
  const s = status.toUpperCase().trim();
  if (s === 'DISETUJUI_WILAYAH') return 'DISETUJUI_WILAYAH';
  if (s === 'SAH_TERDAFTAR' || s === 'APPROVED' || s === 'SELESAI_SAH') return 'SAH_TERDAFTAR';
  if (s.includes('REJ') || s.includes('TOLAK') || s.includes('BATAL')) return 'REJECTED';
  return 'PENDING';
};

/**
 * Cek apakah berkas masih pending untuk Superadmin & Developer (Pengesahan & Penerimaan Anggota)
 */
export const isSubmissionPendingSuperadmin = (sub: PillarRegistrationSubmission): boolean => {
  const norm = normalizeSuperadminStatus(sub.status);
  return norm === 'DISETUJUI_WILAYAH' || norm === 'PENDING';
};

/**
 * Cek apakah berkas masih pending untuk Admin Wilayah (Verifikasi Berkas Wilayah)
 */
export const isSubmissionPendingWilayah = (
  sub: PillarRegistrationSubmission,
  adminWilayah?: string,
  isAllRegionAdmin?: boolean
): boolean => {
  const targetWilayah = adminWilayah || 'Semua Wilayah';
  const allAccess =
    isAllRegionAdmin ||
    targetWilayah === 'Prov. Jabar' ||
    targetWilayah === 'Semua Wilayah';

  if (!allAccess && !isSameWilayah(sub.wilayah, targetWilayah)) {
    return false;
  }

  const norm = normalizeRegionalStatus(sub.status);
  return norm === 'PENDING';
};
