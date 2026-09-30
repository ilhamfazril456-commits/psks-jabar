import { JABAR_REGIONS } from '../data/initialData';
import { PSKSDataRecord } from '../types';

/**
 * Returns index of region in JABAR_REGIONS hierarchy:
 * 0: Prov. Jabar
 * 1: Kab. Bogor
 * ...
 * 27: Kota Banjar
 */
export const getRegionSortIndex = (wilayahStr?: string): number => {
  if (!wilayahStr) return 999;
  const wLower = wilayahStr.toLowerCase().trim();

  // Match Prov Jabar / Provinsi Jabar / Pusat
  if (
    wLower === 'prov. jabar' ||
    wLower === 'provinsi jabar' ||
    wLower === 'provinsi jawa barat' ||
    wLower === 'jawa barat' ||
    wLower.includes('provinsi jabar') ||
    wLower.includes('pusat developer') ||
    wLower.includes('pusat superadmin')
  ) {
    return 0;
  }

  // Exact matching against JABAR_REGIONS
  for (let i = 0; i < JABAR_REGIONS.length; i++) {
    if (wLower === JABAR_REGIONS[i].toLowerCase()) {
      return i;
    }
  }

  // Clean matching without 'Kab.' / 'Kota' prefix
  const cleanW = wLower
    .replace('kabupaten ', '')
    .replace('kab. ', '')
    .replace('kota ', '')
    .trim();

  for (let i = 0; i < JABAR_REGIONS.length; i++) {
    const cleanR = JABAR_REGIONS[i]
      .toLowerCase()
      .replace('kabupaten ', '')
      .replace('kab. ', '')
      .replace('kota ', '')
      .trim();
    if (cleanW === cleanR) {
      return i;
    }
  }

  // Substring matching
  for (let i = 0; i < JABAR_REGIONS.length; i++) {
    const cleanR = JABAR_REGIONS[i]
      .toLowerCase()
      .replace('kabupaten ', '')
      .replace('kab. ', '')
      .replace('kota ', '')
      .trim();
    if (wLower.includes(cleanR)) {
      return i;
    }
  }

  return 999;
};

/**
 * Robustly matches any string or text snippet against the 27 West Java regencies/cities
 */
export const matchJabarRegion = (rawStr: any): string | null => {
  if (!rawStr || typeof rawStr !== 'string') return null;
  const raw = rawStr.toLowerCase().trim();
  if (!raw) return null;

  // Exact match
  for (const reg of JABAR_REGIONS) {
    if (reg.toLowerCase() === raw) return reg;
  }

  // Specific multi-word checks
  if (raw.includes('bandung barat') || raw.includes('kbb')) return 'Kab. Bandung Barat';
  if (raw.includes('kota bandung')) return 'Kota Bandung';
  if (raw.includes('kab. bandung') || raw.includes('kabupaten bandung')) return 'Kab. Bandung';

  if (raw.includes('kota bogor')) return 'Kota Bogor';
  if (raw.includes('kab. bogor') || raw.includes('kabupaten bogor')) return 'Kab. Bogor';

  if (raw.includes('kota bekasi')) return 'Kota Bekasi';
  if (raw.includes('kab. bekasi') || raw.includes('kabupaten bekasi')) return 'Kab. Bekasi';

  if (raw.includes('kota cirebon')) return 'Kota Cirebon';
  if (raw.includes('kab. cirebon') || raw.includes('kabupaten cirebon')) return 'Kab. Cirebon';

  if (raw.includes('kota sukabumi')) return 'Kota Sukabumi';
  if (raw.includes('kab. sukabumi') || raw.includes('kabupaten sukabumi')) return 'Kab. Sukabumi';

  if (raw.includes('kota tasikmalaya') || raw.includes('kota tasik')) return 'Kota Tasikmalaya';
  if (raw.includes('kab. tasikmalaya') || raw.includes('kabupaten tasikmalaya') || raw.includes('kab. tasik')) return 'Kab. Tasikmalaya';

  if (raw.includes('cimahi')) return 'Kota Cimahi';
  if (raw.includes('depok')) return 'Kota Depok';
  if (raw.includes('banjar')) return 'Kota Banjar';

  if (raw.includes('cianjur')) return 'Kab. Cianjur';
  if (raw.includes('garut')) return 'Kab. Garut';
  if (raw.includes('ciamis')) return 'Kab. Ciamis';
  if (raw.includes('kuningan')) return 'Kab. Kuningan';
  if (raw.includes('majalengka')) return 'Kab. Majalengka';
  if (raw.includes('sumedang')) return 'Kab. Sumedang';
  if (raw.includes('indramayu')) return 'Kab. Indramayu';
  if (raw.includes('subang')) return 'Kab. Subang';
  if (raw.includes('purwakarta')) return 'Kab. Purwakarta';
  if (raw.includes('karawang')) return 'Kab. Karawang';
  if (raw.includes('pangandaran')) return 'Kab. Pangandaran';

  if (raw.includes('bandung')) return 'Kota Bandung';
  if (raw.includes('bogor')) return 'Kab. Bogor';
  if (raw.includes('bekasi')) return 'Kota Bekasi';
  if (raw.includes('cirebon')) return 'Kab. Cirebon';
  if (raw.includes('sukabumi')) return 'Kab. Sukabumi';
  if (raw.includes('tasik')) return 'Kab. Tasikmalaya';

  if (raw.includes('prov') || raw.includes('jabar') || raw.includes('jawa barat')) return 'Prov. Jabar';

  return null;
};

/**
 * Sorts data records hierarchically by West Java regions (Prov. Jabar -> Kab. Bogor -> ... -> Kota Banjar).
 * Within the same region, insertion/chronological order (orderIndex) is preserved.
 */
export const sortRecordsByJabarRegion = (records?: PSKSDataRecord[] | null): PSKSDataRecord[] => {
  if (!records || !Array.isArray(records)) return [];

  return [...records]
    .filter((r): r is PSKSDataRecord => Boolean(r && typeof r === 'object'))
    .sort((a, b) => {
      // 1. Urutan utama: Pengelompokan hierarki 27 Kabupaten/Kota Jawa Barat (Kab. Bogor -> ... -> Kota Banjar)
      const indexA = getRegionSortIndex(a.wilayah);
      const indexB = getRegionSortIndex(b.wilayah);
      if (indexA !== indexB) {
        return indexA - indexB;
      }

      // 2. Di dalam wilayah yang sama, pertahankan urutan baris asli (orderIndex / createdAt)
      const ordA = typeof (a as any).orderIndex === 'number' ? (a as any).orderIndex : 999999;
      const ordB = typeof (b as any).orderIndex === 'number' ? (b as any).orderIndex : 999999;
      if (ordA !== ordB) {
        return ordA - ordB;
      }

      const timeA = (a as any).createdAt || 0;
      const timeB = (b as any).createdAt || 0;
      if (timeA && timeB && timeA !== timeB) {
        return timeA - timeB;
      }

      return a.id.localeCompare(b.id);
    });
};
