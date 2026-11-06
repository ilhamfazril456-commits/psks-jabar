import { PSKSDataRecord } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';

export interface RegionalSummaryItem {
  total: number;
  byPillar: Record<string, number>;
}

export type RegionalSummaryMap = Record<string, RegionalSummaryItem>;

// Baseline real-world distribution data for all 27 Kabupaten/Kota in Jawa Barat
// Calibrated to authentic West Java Social Services snapshot (6,731 official records)
// so newly opened devices, public guests, and refreshing tabs immediately load
// exact real data (0ms lag) without flickering or showing outdated baseline numbers.
export const DEFAULT_PILLAR_SUMMARY_COUNTS: Record<string, number> = {
  slrt_puskesos: 3920,
  lks: 2768,
  peksos: 11,
  tagana: 7,
  psm: 6,
  karangtaruna: 5,
  tksk: 4,
  pensos: 4,
  badanusaha: 3,
  lk3: 3,
};

export const DEFAULT_REGIONAL_BASELINE: RegionalSummaryMap = {
  'Kota Bekasi': {
    total: 470,
    byPillar: { peksos: 1, slrt_puskesos: 12, lks: 457 }
  },
  'Kota Bogor': {
    total: 214,
    byPillar: { slrt_puskesos: 68, lks: 146 }
  },
  'Kab. Bogor': {
    total: 565,
    byPillar: { tagana: 1, lks: 149, slrt_puskesos: 413, peksos: 1, pensos: 1 }
  },
  'Kab. Bekasi': {
    total: 41,
    byPillar: { lks: 18, slrt_puskesos: 23 }
  },
  'Kab. Pangandaran': {
    total: 27,
    byPillar: { slrt_puskesos: 10, lks: 17 }
  },
  'Kab. Sumedang': {
    total: 317,
    byPillar: { slrt_puskesos: 277, karangtaruna: 1, lks: 39 }
  },
  'Kab. Garut': {
    total: 696,
    byPillar: { pensos: 1, tksk: 1, psm: 1, lks: 252, slrt_puskesos: 436, lk3: 1, karangtaruna: 1, badanusaha: 1, peksos: 1, tagana: 1 }
  },
  'Kab. Tasikmalaya': {
    total: 88,
    byPillar: { slrt_puskesos: 30, lks: 58 }
  },
  'Kab. Sukabumi': {
    total: 31,
    byPillar: { slrt_puskesos: 2, lks: 27, peksos: 1, psm: 1 }
  },
  'Kab. Kuningan': {
    total: 188,
    byPillar: { lks: 138, slrt_puskesos: 50 }
  },
  'Kota Bandung': {
    total: 299,
    byPillar: { karangtaruna: 1, pensos: 1, badanusaha: 1, lk3: 1, tksk: 1, psm: 1, lks: 136, peksos: 5, tagana: 1, slrt_puskesos: 151 }
  },
  'Kota Sukabumi': {
    total: 100,
    byPillar: { lks: 67, slrt_puskesos: 33 }
  },
  'Kota Tasikmalaya': {
    total: 48,
    byPillar: { slrt_puskesos: 2, lks: 46 }
  },
  'Kab. Cianjur': {
    total: 407,
    byPillar: { lks: 47, slrt_puskesos: 359, tagana: 1 }
  },
  'Kab. Bandung Barat': {
    total: 216,
    byPillar: { slrt_puskesos: 165, lks: 51 }
  },
  'Kab. Purwakarta': {
    total: 63,
    byPillar: { slrt_puskesos: 4, lks: 59 }
  },
  'Kab. Bandung': {
    total: 432,
    byPillar: { lks: 152, slrt_puskesos: 280 }
  },
  'Kab. Subang': {
    total: 98,
    byPillar: { lks: 32, slrt_puskesos: 66 }
  },
  'Kota Cirebon': {
    total: 56,
    byPillar: { lks: 34, slrt_puskesos: 22 }
  },
  'Kab. Karawang': {
    total: 411,
    byPillar: { slrt_puskesos: 309, lks: 102 }
  },
  'Kota Banjar': {
    total: 36,
    byPillar: { lks: 11, slrt_puskesos: 25 }
  },
  'Kab. Majalengka': {
    total: 288,
    byPillar: { lks: 147, slrt_puskesos: 141 }
  },
  'Kota Cimahi': {
    total: 43,
    byPillar: { peksos: 2, tagana: 3, psm: 3, karangtaruna: 2, badanusaha: 1, lks: 13, tksk: 2, pensos: 1, lk3: 1, slrt_puskesos: 15 }
  },
  'Kab. Ciamis': {
    total: 475,
    byPillar: { lks: 210, slrt_puskesos: 265 }
  },
  'Kab. Cirebon': {
    total: 490,
    byPillar: { lks: 67, slrt_puskesos: 423 }
  },
  'Kab. Indramayu': {
    total: 376,
    byPillar: { slrt_puskesos: 317, lks: 59 }
  },
  'Kota Depok': {
    total: 256,
    byPillar: { slrt_puskesos: 22, lks: 234 }
  }
};

/**
 * Normalizes any regional string into one of the canonical 27 Kab/Kota names.
 */
export function normalizeRegionName(raw: string): string {
  const s = (raw || '').trim();
  if (!s || s === 'Prov. Jabar' || s === 'Semua Wilayah' || s.toLowerCase() === 'jawa barat') {
    return 'Kota Bandung';
  }

  // Direct match
  const direct = KAB_KOTA_ONLY.find((k) => k.toLowerCase() === s.toLowerCase());
  if (direct) return direct;

  // Partial match stripped of Kab. / Kota
  const cleanedS = s.replace(/kabupaten\s|kab\.\s|kota\s/i, '').trim().toLowerCase();
  const partial = KAB_KOTA_ONLY.find((k) => {
    const cleanedK = k.replace(/kab\.\s|kota\s/i, '').trim().toLowerCase();
    return cleanedK === cleanedS || cleanedS.includes(cleanedK) || cleanedK.includes(cleanedS);
  });
  if (partial) return partial;

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
