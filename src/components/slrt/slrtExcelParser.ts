import * as XLSX from 'xlsx';
import { PSKSDataRecord } from '../../types';
import { KAB_KOTA_ONLY } from '../../data/initialData';
import { isSameWilayah } from '../../utils/submissionStatus';

export interface SlrtKecamatanItem {
  kecamatan: string;
  kelurahans: string[];
  desas: string[];
  totalTerbentuk: number; // Otomatis terhitung = kelurahans.length + desas.length
}

export interface SlrtRegionData {
  regionName: string;
  kecamatanList: SlrtKecamatanItem[];
  totalKecamatan: number;
  totalKelurahan: number;
  totalDesa: number;
  totalTerbentuk: number; // Otomatis terhitung
  records: Omit<PSKSDataRecord, 'id'>[];
}

export interface SlrtParsedResult {
  records: Omit<PSKSDataRecord, 'id'>[];
  regions: Record<string, SlrtRegionData>;
  totalRecords: number;
  fileName: string;
  sheetName: string;
  availableSheets: string[];
}

/**
 * Checks if a cell string is a header, title, sub-number, or summary row text (never treated as data)
 */
export const isHeaderOrSummaryString = (val?: any): boolean => {
  if (val === undefined || val === null) return true;
  const s = String(val).toLowerCase().trim();
  if (!s) return true;
  if (/^\d+$/.test(s)) return true; // Pure number like 1, 2, 3
  if (s.startsWith('update :') || s.startsWith('update:')) return true;
  if (s.includes('puskesos') && (s.includes('membentuk') || s.includes('data pusat') || s.includes('rincian') || s.includes('rekapitulasi'))) return true;
  if (s.includes('wilayah administratif')) return true;
  if (s.includes('kabupaten') && s.includes('kota')) return true;
  if (s.includes('jumlah kecamatan') || s.includes('jumlah kelurahan') || s.includes('jumlah desa')) return true;
  if (s.includes('jumlah kelurahan dan desa') || s.includes('jumlah desa/kelurahan') || s.includes('jumlah desa/ kelurahan')) return true;
  if (s.includes('menurut kabupaten/kota') || s.includes('provinsi jawa barat')) return true;
  if (s === 'ket.' || s === 'keterangan' || s.includes('100% desa/kel') || s.includes('100%')) return true;
  if (s === 'no' || s === 'no.' || s === 'nomor') return true;
  if (/^(total|jumlah|subtotal|rekap|rekapitulasi)\b/i.test(s)) return true;
  return false;
};

/**
 * Normalizes any text representation of West Java Kabupaten / Kota
 */
export const normalizeSlrtRegion = (rawText?: any): string | null => {
  if (!rawText) return null;
  const str = String(rawText).trim();
  if (!str) return null;

  // Skip header titles or totals
  if (/^(no|jumlah|total|rekap|wilayah|provinsi|jawa barat|desa|kelurahan|kecamatan|update|data)/i.test(str)) {
    return null;
  }

  // Clean common prefixes
  const clean = str
    .replace(/^no\.?\s*\d+[\.\s]*/i, '')
    .replace(/^kabupaten\b/i, 'kab.')
    .replace(/^kab\b/i, 'kab.')
    .replace(/^kota\b/i, 'kota')
    .replace(/\s+/g, ' ')
    .trim();

  // Sort candidate list by length descending so "Kab. Bandung Barat" is checked before "Kab. Bandung"
  const sortedCandidates = [...KAB_KOTA_ONLY].sort((a, b) => b.length - a.length);

  for (const reg of sortedCandidates) {
    if (reg.toLowerCase() === clean.toLowerCase()) return reg;
  }

  for (const reg of sortedCandidates) {
    const regCore = reg.toLowerCase().replace(/^(kab\.|kota)\s+/, '').trim();
    const cleanLower = clean.toLowerCase();
    if (cleanLower.includes(regCore)) {
      const isKota = cleanLower.includes('kota');
      if (isKota && reg.startsWith('Kota')) return reg;
      if (!isKota && reg.startsWith('Kab.')) return reg;
    }
  }

  return null;
};

/**
 * Cleans leading numbering from name cells (e.g. "1 CILEUNYI" -> "Cileunyi", "2 PADASUKA" -> "Padasuka")
 */
export const cleanPuskesosName = (raw?: any): string => {
  if (!raw) return '';
  let str = String(raw).trim();
  // Strip leading numbering: "1.", "1 ", "(1)", "1 - ", etc.
  str = str.replace(/^(\d+[\.\s\-–—\)]+|\(\d+\))\s*/, '').trim();
  // If it still starts with "Desa " or "Kelurahan " or "Kel. ", we can keep or format
  if (str === str.toUpperCase() && str.length > 2) {
    str = str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return str;
};

/**
 * Smart Auto-Forwarding Parser for SLRT / Puskesos Government Excel format (Scenario A & B)
 */
export const parseSlrtExcelFile = async (
  file: File,
  targetRegionFilter?: string | null,
  selectedSheetName?: string
): Promise<SlrtParsedResult> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }

  // 1. Smart Sheet Detection
  let targetSheetName = selectedSheetName || '';
  if (!targetSheetName) {
    const preferredSheet = workbook.SheetNames.find((s) =>
      /rincian|puskesos|desa|detail|data|slrt/i.test(s)
    );

    if (preferredSheet) {
      targetSheetName = preferredSheet;
    } else {
      // Find sheet with maximum row count
      let maxRows = -1;
      let bestSheet = workbook.SheetNames[0];
      for (const sName of workbook.SheetNames) {
        const sh = workbook.Sheets[sName];
        if (sh && sh['!ref']) {
          const range = XLSX.utils.decode_range(sh['!ref']);
          const numRows = range.e.r - range.s.r + 1;
          if (numRows > maxRows) {
            maxRows = numRows;
            bestSheet = sName;
          }
        }
      }
      targetSheetName = bestSheet;
    }
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error(`Lembar kerja "${targetSheetName}" tidak dapat dibuka.`);
  }

  // Convert to 2D array (row by row)
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows || rows.length < 2) {
    throw new Error('Format file Excel terlalu pendek atau tidak memiliki baris data.');
  }

  // 2. Identify Column Layout Dynamically
  let colKab = -1;
  let colKec = -1;
  let colKel = -1;
  let colDesa = -1;
  let headerRowIdx = -1;

  // Scan the first 15 rows to find header labels
  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c]).toLowerCase().trim();
      if (!cellVal) continue;

      // Kabupaten / Kota column
      if (cellVal.includes('kabupaten') || cellVal === 'kab/kota' || cellVal.includes('kabupaten/ kota') || cellVal === 'wilayah') {
        if (colKab === -1) colKab = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }

      // Kecamatan column
      if (cellVal.includes('kecamatan') || cellVal === 'kec') {
        if (colKec === -1 || cellVal === 'kecamatan') colKec = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }

      // Kelurahan column (e.g. "Kelurahan Yang Telah Membentuk Puskesos", "Kelurahan", "Kel")
      if (cellVal.includes('kelurahan') || cellVal === 'kel') {
        if (colKel === -1 || cellVal.includes('membentuk')) colKel = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }

      // Desa column (e.g. "Desa Yang Telah Membentuk Puskesos", "Desa", "Des")
      if (cellVal.includes('desa') && !cellVal.includes('kelurahan dan desa') && !cellVal.includes('desa/kelurahan') && !cellVal.includes('desa/ kelurahan')) {
        if (colDesa === -1 || cellVal.includes('membentuk')) colDesa = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }
    }
  }

  // If columns are not found by header text, fallback by layout:
  // If user uploaded a 4 or 5-column table without recognized headers:
  const maxRowLen = Math.max(...rows.slice(0, 10).map((r) => r.length));
  
  if (colKec === -1 && colKel === -1 && colDesa === -1) {
    if (maxRowLen <= 6) {
      // Simple format: [No, Kecamatan, Kelurahan, Desa, Jumlah] or [Kecamatan, Kelurahan, Desa, Jumlah]
      if (maxRowLen >= 4) {
        const hasNoCol = rows.some((r) => /^\d+$/.test(String(r[0]).trim()));
        if (hasNoCol) {
          colKec = 1;
          colKel = 2;
          colDesa = 3;
        } else {
          colKec = 0;
          colKel = 1;
          colDesa = 2;
        }
      }
    } else {
      // Default to standard government 14-col layout
      colKab = 1;
      colKec = 7;
      colKel = 9;
      colDesa = 11;
    }
  }

  // If government merged paired columns: check if colKec, colKel, colDesa are pointing to number column
  // (e.g. Col 6 is number, Col 7 is Name). If so, we check both column and column + 1.
  const getCellCandidates = (row: any[], primaryCol: number, maxOffset = 2): string => {
    if (primaryCol < 0 || primaryCol >= row.length) return '';
    // Check primaryCol and primaryCol + 1
    for (let offset = 0; offset <= maxOffset; offset++) {
      const idx = primaryCol + offset;
      if (idx < row.length) {
        const val = String(row[idx] || '').trim();
        if (val && !isHeaderOrSummaryString(val)) {
          const clean = cleanPuskesosName(val);
          if (clean && !/^\d+$/.test(clean) && clean.length >= 2) {
            return clean;
          }
        }
      }
    }
    return '';
  };

  // Determine starting data row
  let dataStartRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;

  // Skip sub-number rows (1 | 2 | 3 | 4 | 5...) if present
  for (let r = dataStartRow; r < Math.min(dataStartRow + 3, rows.length); r++) {
    const row = rows[r];
    const hasNumbersSequence = row.some((cell, idx) => String(cell).trim() === String(idx + 1));
    if (hasNumbersSequence) {
      dataStartRow = r + 1;
      break;
    }
  }

  // 3. Process Rows with Smart Auto-Forwarding Streaming
  let currentKabKota: string | null = targetRegionFilter ? normalizeSlrtRegion(targetRegionFilter) : null;
  let currentKecamatan: string | null = null;

  const allRecords: Omit<PSKSDataRecord, 'id'>[] = [];
  const regionsData: Record<string, SlrtRegionData> = {};

  for (let r = dataStartRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Check if entire row is empty or summary/footer
    const rowStr = row.map((cell) => String(cell).trim()).join(' ');
    if (!rowStr) continue;
    if (/^(total|jumlah|rekapitulasi|catatan|keterangan)\b/i.test(rowStr)) continue;

    // A. Detect new Kabupaten / Kota (Skenario A or if column exists)
    if (!targetRegionFilter) {
      // First check colKab if defined
      if (colKab !== -1 && colKab < row.length) {
        const detected = normalizeSlrtRegion(row[colKab]);
        if (detected) {
          currentKabKota = detected;
        }
      }
      // Also scan first 3 columns for any region name
      if (!currentKabKota || colKab === -1) {
        for (let c = 0; c < Math.min(row.length, 4); c++) {
          const detected = normalizeSlrtRegion(row[c]);
          if (detected) {
            currentKabKota = detected;
            break;
          }
        }
      }
    }

    // Effective region
    const effectiveRegion = targetRegionFilter
      ? normalizeSlrtRegion(targetRegionFilter)
      : currentKabKota;

    // B. Detect new Kecamatan
    let candidateKec = '';
    if (colKec !== -1) {
      candidateKec = getCellCandidates(row, colKec, 1);
    }
    // If no candidateKec found, check if row has text in first 2 columns that could be kecamatan
    if (!candidateKec && colKec === -1 && row.length > 0) {
      candidateKec = cleanPuskesosName(row[0]);
    }

    if (candidateKec) {
      currentKecamatan = candidateKec;
    }

    // C. Detect Kelurahan Name
    let candidateKel = '';
    if (colKel !== -1) {
      candidateKel = getCellCandidates(row, colKel, 1);
    }

    // D. Detect Desa Name
    let candidateDesa = '';
    if (colDesa !== -1) {
      candidateDesa = getCellCandidates(row, colDesa, 1);
    }

    // If candidateKel and candidateDesa are the same string (e.g. from overlapping columns), disambiguate
    if (candidateKel && candidateDesa && candidateKel.toLowerCase() === candidateDesa.toLowerCase()) {
      candidateDesa = '';
    }

    // If nothing found in Kel or Desa, continue
    if (!candidateKel && !candidateDesa) continue;

    // Must have an effective region
    const finalRegion = effectiveRegion || 'Jawa Barat';

    // If Skenario B (single region filter), ignore rows from other regions
    if (targetRegionFilter && !isSameWilayah(finalRegion, targetRegionFilter)) {
      continue;
    }

    // Helper to store record and update hierarchical region structure
    const recordPuskesos = (name: string, jenis: 'Desa' | 'Kelurahan') => {
      if (!name || isHeaderOrSummaryString(name)) return;

      const kecName = currentKecamatan || 'Kecamatan Terpadu';
      const recordTitle = `Puskesos ${jenis === 'Kelurahan' ? 'Kel.' : 'Desa'} ${name}`;

      const rec: Omit<PSKSDataRecord, 'id'> = {
        pillarId: 'slrt_puskesos',
        wilayah: finalRegion,
        kec: kecName,
        kelDesa: name,
        jenisWilayah: jenis,
        nama: recordTitle,
        namaSlrt: recordTitle,
        nik: `REG-SLRT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Aktif',
        statusAktif: 'Aktif',
        sertifikasi: 'SK Pembentukan Puskesos Desa/Kelurahan',
        hp: '-',
      };

      allRecords.push(rec);

      // Initialize region entry
      if (!regionsData[finalRegion]) {
        regionsData[finalRegion] = {
          regionName: finalRegion,
          kecamatanList: [],
          totalKecamatan: 0,
          totalKelurahan: 0,
          totalDesa: 0,
          totalTerbentuk: 0,
          records: [],
        };
      }

      const regEntry = regionsData[finalRegion];
      regEntry.records.push(rec);
      if (jenis === 'Kelurahan') regEntry.totalKelurahan += 1;
      if (jenis === 'Desa') regEntry.totalDesa += 1;
      regEntry.totalTerbentuk = regEntry.totalKelurahan + regEntry.totalDesa;

      // Find or create Kecamatan item
      let kecItem = regEntry.kecamatanList.find((k) => k.kecamatan.toLowerCase() === kecName.toLowerCase());
      if (!kecItem) {
        kecItem = {
          kecamatan: kecName,
          kelurahans: [],
          desas: [],
          totalTerbentuk: 0,
        };
        regEntry.kecamatanList.push(kecItem);
      }

      if (jenis === 'Kelurahan' && !kecItem.kelurahans.includes(name)) {
        kecItem.kelurahans.push(name);
      }
      if (jenis === 'Desa' && !kecItem.desas.includes(name)) {
        kecItem.desas.push(name);
      }
      kecItem.totalTerbentuk = kecItem.kelurahans.length + kecItem.desas.length;
      regEntry.totalKecamatan = regEntry.kecamatanList.length;
    };

    // Emit Kelurahan if present
    if (candidateKel) {
      recordPuskesos(candidateKel, 'Kelurahan');
    }

    // Emit Desa if present
    if (candidateDesa) {
      recordPuskesos(candidateDesa, 'Desa');
    }
  }

  if (allRecords.length === 0) {
    throw new Error(
      `Tidak ditemukan data Desa atau Kelurahan pada sheet "${targetSheetName}". Pastikan baris data memiliki nama Kecamatan serta nama Desa atau Kelurahan.`
    );
  }

  return {
    records: allRecords,
    regions: regionsData,
    totalRecords: allRecords.length,
    fileName: file.name,
    sheetName: targetSheetName,
    availableSheets: workbook.SheetNames,
  };
};
