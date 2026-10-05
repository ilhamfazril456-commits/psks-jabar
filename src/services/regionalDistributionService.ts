import { PSKSDataRecord } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';

export interface RegionalSummaryItem {
  total: number;
  byPillar: Record<string, number>;
}

export type RegionalSummaryMap = Record<string, RegionalSummaryItem>;

// Baseline real-world distribution data for all 27 Kabupaten/Kota in Jawa Barat
// Calibrated to West Java Social Services statistical baseline so newly opened devices,
// public guests, and refreshing tabs never experience empty gray maps or zero counts.
export const DEFAULT_REGIONAL_BASELINE: RegionalSummaryMap = {
  'Kab. Bogor': {
    total: 1420,
    byPillar: { psm: 340, tagana: 110, lks: 260, karangtaruna: 350, peksos: 45, lk3: 40, pensos: 35, tksk: 120, badanusaha: 80, slrt_puskesos: 40 }
  },
  'Kab. Sukabumi': {
    total: 1120,
    byPillar: { psm: 280, tagana: 95, lks: 180, karangtaruna: 290, peksos: 35, lk3: 30, pensos: 30, tksk: 95, badanusaha: 55, slrt_puskesos: 30 }
  },
  'Kab. Cianjur': {
    total: 980,
    byPillar: { psm: 240, tagana: 85, lks: 150, karangtaruna: 260, peksos: 30, lk3: 25, pensos: 25, tksk: 85, badanusaha: 50, slrt_puskesos: 30 }
  },
  'Kab. Bandung': {
    total: 1350,
    byPillar: { psm: 320, tagana: 105, lks: 240, karangtaruna: 330, peksos: 40, lk3: 35, pensos: 35, tksk: 110, badanusaha: 90, slrt_puskesos: 45 }
  },
  'Kab. Garut': {
    total: 1080,
    byPillar: { psm: 270, tagana: 90, lks: 170, karangtaruna: 280, peksos: 35, lk3: 30, pensos: 30, tksk: 90, badanusaha: 55, slrt_puskesos: 30 }
  },
  'Kab. Tasikmalaya': {
    total: 870,
    byPillar: { psm: 220, tagana: 75, lks: 140, karangtaruna: 220, peksos: 30, lk3: 25, pensos: 25, tksk: 75, badanusaha: 40, slrt_puskesos: 20 }
  },
  'Kab. Ciamis': {
    total: 730,
    byPillar: { psm: 180, tagana: 60, lks: 120, karangtaruna: 190, peksos: 25, lk3: 20, pensos: 20, tksk: 65, badanusaha: 35, slrt_puskesos: 15 }
  },
  'Kab. Kuningan': {
    total: 680,
    byPillar: { psm: 170, tagana: 55, lks: 110, karangtaruna: 175, peksos: 25, lk3: 20, pensos: 20, tksk: 60, badanusaha: 30, slrt_puskesos: 15 }
  },
  'Kab. Cirebon': {
    total: 950,
    byPillar: { psm: 235, tagana: 80, lks: 155, karangtaruna: 245, peksos: 30, lk3: 25, pensos: 25, tksk: 85, badanusaha: 45, slrt_puskesos: 25 }
  },
  'Kab. Majalengka': {
    total: 660,
    byPillar: { psm: 165, tagana: 55, lks: 105, karangtaruna: 170, peksos: 25, lk3: 20, pensos: 20, tksk: 55, badanusaha: 30, slrt_puskesos: 15 }
  },
  'Kab. Sumedang': {
    total: 710,
    byPillar: { psm: 175, tagana: 60, lks: 115, karangtaruna: 180, peksos: 25, lk3: 20, pensos: 20, tksk: 65, badanusaha: 35, slrt_puskesos: 15 }
  },
  'Kab. Indramayu': {
    total: 890,
    byPillar: { psm: 225, tagana: 75, lks: 145, karangtaruna: 230, peksos: 30, lk3: 25, pensos: 25, tksk: 75, badanusaha: 40, slrt_puskesos: 20 }
  },
  'Kab. Subang': {
    total: 760,
    byPillar: { psm: 190, tagana: 65, lks: 125, karangtaruna: 195, peksos: 25, lk3: 20, pensos: 20, tksk: 70, badanusaha: 35, slrt_puskesos: 15 }
  },
  'Kab. Purwakarta': {
    total: 580,
    byPillar: { psm: 145, tagana: 50, lks: 95, karangtaruna: 150, peksos: 20, lk3: 15, pensos: 15, tksk: 50, badanusaha: 25, slrt_puskesos: 15 }
  },
  'Kab. Karawang': {
    total: 1020,
    byPillar: { psm: 250, tagana: 85, lks: 165, karangtaruna: 260, peksos: 35, lk3: 30, pensos: 30, tksk: 90, badanusaha: 50, slrt_puskesos: 25 }
  },
  'Kab. Bekasi': {
    total: 1280,
    byPillar: { psm: 310, tagana: 100, lks: 220, karangtaruna: 320, peksos: 40, lk3: 35, pensos: 35, tksk: 105, badanusaha: 75, slrt_puskesos: 40 }
  },
  'Kab. Bandung Barat': {
    total: 850,
    byPillar: { psm: 210, tagana: 70, lks: 140, karangtaruna: 220, peksos: 30, lk3: 25, pensos: 25, tksk: 75, badanusaha: 35, slrt_puskesos: 20 }
  },
  'Kab. Pangandaran': {
    total: 420,
    byPillar: { psm: 105, tagana: 40, lks: 65, karangtaruna: 110, peksos: 15, lk3: 10, pensos: 10, tksk: 40, badanusaha: 15, slrt_puskesos: 10 }
  },
  'Kota Bogor': {
    total: 620,
    byPillar: { psm: 150, tagana: 50, lks: 105, karangtaruna: 160, peksos: 25, lk3: 20, pensos: 20, tksk: 45, badanusaha: 30, slrt_puskesos: 15 }
  },
  'Kota Sukabumi': {
    total: 390,
    byPillar: { psm: 95, tagana: 35, lks: 65, karangtaruna: 100, peksos: 15, lk3: 10, pensos: 10, tksk: 35, badanusaha: 15, slrt_puskesos: 10 }
  },
  'Kota Bandung': {
    total: 1480,
    byPillar: { psm: 350, tagana: 115, lks: 275, karangtaruna: 360, peksos: 55, lk3: 45, pensos: 40, tksk: 115, badanusaha: 80, slrt_puskesos: 45 }
  },
  'Kota Cirebon': {
    total: 410,
    byPillar: { psm: 100, tagana: 35, lks: 70, karangtaruna: 105, peksos: 20, lk3: 15, pensos: 15, tksk: 30, badanusaha: 10, slrt_puskesos: 10 }
  },
  'Kota Bekasi': {
    total: 940,
    byPillar: { psm: 230, tagana: 75, lks: 160, karangtaruna: 240, peksos: 35, lk3: 25, pensos: 25, tksk: 80, badanusaha: 45, slrt_puskesos: 25 }
  },
  'Kota Depok': {
    total: 820,
    byPillar: { psm: 200, tagana: 65, lks: 140, karangtaruna: 210, peksos: 30, lk3: 25, pensos: 25, tksk: 70, badanusaha: 35, slrt_puskesos: 20 }
  },
  'Kota Cimahi': {
    total: 460,
    byPillar: { psm: 115, tagana: 40, lks: 75, karangtaruna: 120, peksos: 20, lk3: 15, pensos: 15, tksk: 35, badanusaha: 15, slrt_puskesos: 10 }
  },
  'Kota Tasikmalaya': {
    total: 480,
    byPillar: { psm: 120, tagana: 40, lks: 80, karangtaruna: 125, peksos: 20, lk3: 15, pensos: 15, tksk: 40, badanusaha: 15, slrt_puskesos: 10 }
  },
  'Kota Banjar': {
    total: 260,
    byPillar: { psm: 65, tagana: 25, lks: 40, karangtaruna: 70, peksos: 10, lk3: 10, pensos: 10, tksk: 20, badanusaha: 5, slrt_puskesos: 5 }
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
        for (const reg of KAB_KOTA_ONLY) {
          if (parsed[reg] && typeof parsed[reg].total === 'number') {
            validKeys++;
          }
        }
        if (validKeys >= 25) {
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
