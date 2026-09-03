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
 * Sorts data records hierarchically by West Java regions (Prov. Jabar -> Kab. Bogor -> ... -> Kota Banjar).
 * Within the same region, insertion/chronological order is preserved.
 */
export const sortRecordsByJabarRegion = (records: PSKSDataRecord[]): PSKSDataRecord[] => {
  return [...records].sort((a, b) => {
    const indexA = getRegionSortIndex(a.wilayah);
    const indexB = getRegionSortIndex(b.wilayah);
    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return 0;
  });
};
