import { PSKSDataRecord } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';
import { matchJabarRegion } from '../utils/regionSort';

export interface RegionalSummaryItem {
  total: number;
  byPillar: Record<string, number>;
}

export type RegionalSummaryMap = Record<string, RegionalSummaryItem>;

// Baseline real-world distribution data for all 27 Kabupaten/Kota in Jawa Barat
// Calibrated to exact audited West Java Social Services database (23,929 records; PSM = 10,450)
// before live sync resolves so initial render is accurate with zero flicker.
export const DEFAULT_PILLAR_SUMMARY_COUNTS: Record<string, number> = {
  peksos: 71,
  psm: 10450,
  tagana: 1681,
  lks: 2768,
  karangtaruna: 4222,
  lk3: 6,
  pensos: 17,
  tksk: 576,
  badanusaha: 218,
  slrt_puskesos: 3920,
};

export const DEFAULT_REGIONAL_BASELINE: RegionalSummaryMap = {
  'Kab. Bogor': {
    total: 2876,
    byPillar: { badanusaha: 20, karangtaruna: 283, lks: 149, psm: 1878, slrt_puskesos: 413, tagana: 96, tksk: 37 }
  },
  'Kota Bogor': {
    total: 336,
    byPillar: { badanusaha: 11, karangtaruna: 38, lk3: 1, lks: 146, psm: 2, slrt_puskesos: 68, tagana: 64, tksk: 6 }
  },
  'Kota Depok': {
    total: 693,
    byPillar: { badanusaha: 19, karangtaruna: 47, lks: 234, psm: 329, slrt_puskesos: 22, tagana: 31, tksk: 11 }
  },
  'Kab. Sukabumi': {
    total: 672,
    byPillar: { badanusaha: 1, karangtaruna: 286, lk3: 1, lks: 27, psm: 269, slrt_puskesos: 2, tagana: 40, tksk: 46 }
  },
  'Kota Sukabumi': {
    total: 217,
    byPillar: { karangtaruna: 27, lk3: 1, lks: 67, psm: 37, slrt_puskesos: 33, tagana: 46, tksk: 6 }
  },
  'Kab. Cianjur': {
    total: 1278,
    byPillar: { badanusaha: 1, karangtaruna: 305, lks: 47, psm: 431, slrt_puskesos: 359, tagana: 104, tksk: 31 }
  },
  'Kab. Bekasi': {
    total: 501,
    byPillar: { badanusaha: 23, karangtaruna: 95, lks: 18, psm: 245, slrt_puskesos: 23, tagana: 77, tksk: 20 }
  },
  'Kota Bekasi': {
    total: 888,
    byPillar: { badanusaha: 18, karangtaruna: 49, lks: 457, psm: 258, slrt_puskesos: 12, tagana: 83, tksk: 11 }
  },
  'Kab. Karawang': {
    total: 1723,
    byPillar: { badanusaha: 13, karangtaruna: 237, lks: 102, psm: 1004, slrt_puskesos: 309, tagana: 29, tksk: 29 }
  },
  'Kab. Purwakarta': {
    total: 413,
    byPillar: { badanusaha: 4, karangtaruna: 153, lks: 59, psm: 151, slrt_puskesos: 4, tagana: 25, tksk: 17 }
  },
  'Kab. Subang': {
    total: 581,
    byPillar: { badanusaha: 2, karangtaruna: 256, lk3: 1, lks: 32, psm: 118, slrt_puskesos: 66, tagana: 87, tksk: 19 }
  },
  'Kab. Bandung': {
    total: 2079,
    byPillar: { badanusaha: 17, karangtaruna: 125, lks: 152, psm: 1375, slrt_puskesos: 280, tagana: 100, tksk: 30 }
  },
  'Kota Bandung': {
    total: 1526,
    byPillar: { badanusaha: 52, karangtaruna: 169, lks: 136, peksos: 71, pensos: 17, psm: 856, slrt_puskesos: 151, tagana: 46, tksk: 28 }
  },
  'Kab. Bandung Barat': {
    total: 634,
    byPillar: { badanusaha: 4, karangtaruna: 113, lks: 51, psm: 226, slrt_puskesos: 165, tagana: 60, tksk: 15 }
  },
  'Kota Cimahi': {
    total: 104,
    byPillar: { badanusaha: 1, karangtaruna: 5, lks: 13, psm: 11, slrt_puskesos: 15, tagana: 56, tksk: 3 }
  },
  'Kab. Garut': {
    total: 1656,
    byPillar: { badanusaha: 3, karangtaruna: 234, lks: 252, psm: 631, slrt_puskesos: 436, tagana: 63, tksk: 37 }
  },
  'Kab. Sumedang': {
    total: 816,
    byPillar: { badanusaha: 1, karangtaruna: 148, lks: 39, psm: 255, slrt_puskesos: 277, tagana: 72, tksk: 24 }
  },
  'Kab. Majalengka': {
    total: 1136,
    byPillar: { badanusaha: 1, karangtaruna: 242, lks: 147, psm: 505, slrt_puskesos: 141, tagana: 76, tksk: 24 }
  },
  'Kab. Kuningan': {
    total: 505,
    byPillar: { badanusaha: 2, karangtaruna: 98, lks: 138, psm: 83, slrt_puskesos: 50, tagana: 103, tksk: 31 }
  },
  'Kab. Indramayu': {
    total: 1032,
    byPillar: { karangtaruna: 221, lks: 59, psm: 353, slrt_puskesos: 317, tagana: 57, tksk: 25 }
  },
  'Kab. Cirebon': {
    total: 1637,
    byPillar: { badanusaha: 6, karangtaruna: 464, lks: 67, psm: 580, slrt_puskesos: 423, tagana: 59, tksk: 38 }
  },
  'Kota Cirebon': {
    total: 224,
    byPillar: { badanusaha: 13, karangtaruna: 12, lks: 34, psm: 108, slrt_puskesos: 22, tagana: 31, tksk: 4 }
  },
  'Kab. Ciamis': {
    total: 945,
    byPillar: { karangtaruna: 204, lk3: 1, lks: 210, psm: 166, slrt_puskesos: 265, tagana: 73, tksk: 26 }
  },
  'Kab. Tasikmalaya': {
    total: 696,
    byPillar: { badanusaha: 4, karangtaruna: 227, lks: 58, psm: 274, slrt_puskesos: 30, tagana: 65, tksk: 38 }
  },
  'Kota Tasikmalaya': {
    total: 242,
    byPillar: { badanusaha: 2, karangtaruna: 68, lk3: 1, lks: 46, psm: 69, slrt_puskesos: 2, tagana: 46, tksk: 8 }
  },
  'Kab. Pangandaran': {
    total: 391,
    byPillar: { karangtaruna: 97, lks: 17, psm: 201, slrt_puskesos: 10, tagana: 57, tksk: 9 }
  },
  'Kota Banjar': {
    total: 128,
    byPillar: { karangtaruna: 19, lks: 11, psm: 35, slrt_puskesos: 25, tagana: 35, tksk: 3 }
  },
};

/**
 * Normalizes any regional string into one of the canonical 27 Kab/Kota names.
 */
export function normalizeRegionName(raw: string): string {
  const s = (raw || '').trim();
  const lower = s.toLowerCase();
  if (
    !s ||
    lower === 'prov. jabar' ||
    lower === 'provinsi jabar' ||
    lower === 'provinsi jawa barat' ||
    lower === 'pemprov jabar' ||
    lower === 'semua wilayah' ||
    lower === 'semua kabupaten/kota' ||
    lower === 'semua kab/kota' ||
    lower === 'jawa barat'
  ) {
    return 'Kota Bandung';
  }

  // Exact match
  const direct = KAB_KOTA_ONLY.find((k) => k.toLowerCase() === lower);
  if (direct) return direct;

  // Specific disambiguated matching (prevents Kab. Bandung Barat matching Kab. Bandung)
  const matched = matchJabarRegion(s);
  if (matched) {
    if (matched === 'Prov. Jabar') return 'Kota Bandung';
    if (KAB_KOTA_ONLY.includes(matched)) return matched;
  }

  if (s.startsWith('Kabupaten ')) return s.replace('Kabupaten ', 'Kab. ');
  return s;
}

/**
 * Checks whether allPillarData has genuine populated records from Firestore / Excel
 * instead of just the 30 dummy initial seed records.
 */
export function isRealDataLoaded(allPillarData: Record<string, PSKSDataRecord[]>): boolean {
  if (!allPillarData || typeof allPillarData !== 'object') return false;
  let totalCount = 0;
  let hasRealDocId = false;

  for (const records of Object.values(allPillarData)) {
    if (Array.isArray(records)) {
      totalCount += records.length;
      for (const rec of records) {
        if (rec && rec.id && !rec.id.match(/^(bu|kt|peksos|psm|tagana|lks|lk3|pensos|tksk|slrt)-[1-3]$/)) {
          hasRealDocId = true;
          break;
        }
      }
    }
  }

  return totalCount > 35 || hasRealDocId;
}

/**
 * Computes exact 27-region counts and breakdowns from allPillarData.
 */
export function computeRegionalSummaryFromPillars(
  allPillarData: Record<string, PSKSDataRecord[]>
): RegionalSummaryMap {
  const result: RegionalSummaryMap = {};

  // Initialize with zeros for all 27 Kab/Kota
  KAB_KOTA_ONLY.forEach((reg) => {
    result[reg] = { total: 0, byPillar: {} };
  });

  if (!allPillarData || typeof allPillarData !== 'object') {
    return result;
  }

  for (const [pillarKey, records] of Object.entries(allPillarData)) {
    if (!Array.isArray(records)) continue;

    for (const rec of records) {
      if (!rec || typeof rec !== 'object') continue;
      const reg = normalizeRegionName(rec.wilayah || '');
      if (result[reg]) {
        result[reg].total += 1;
        result[reg].byPillar[pillarKey] = (result[reg].byPillar[pillarKey] || 0) + 1;
      }
    }
  }

  return result;
}

/**
 * Retrieve saved regional summary from localStorage or fallback to calibrated baseline.
 */
export function getInitialRegionalSummary(): RegionalSummaryMap {
  try {
    const raw = localStorage.getItem('psks_regional_distribution');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        let validKeys = 0;
        let totalSum = 0;
        for (const reg of KAB_KOTA_ONLY) {
          if (parsed[reg] && typeof parsed[reg].total === 'number') {
            validKeys++;
            totalSum += parsed[reg].total;
          }
        }
        // Accept valid saved regional distribution (calibrated 6.731 baseline or full 21.963+ database records)
        if (validKeys >= 25 && totalSum >= 5000) {
          return parsed as RegionalSummaryMap;
        }
      }
    }
  } catch {}

  return { ...DEFAULT_REGIONAL_BASELINE };
}

/**
 * Persists regional summary to localStorage (< 3 KB).
 */
export function saveRegionalSummary(data: RegionalSummaryMap): void {
  try {
    localStorage.setItem('psks_regional_distribution', JSON.stringify(data));
  } catch {}
}
