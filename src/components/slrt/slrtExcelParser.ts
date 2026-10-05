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

  // Skip headers or summary words
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

  // 2. Identify Column Layout Dynamically (Never match count columns containing "JUMLAH")
  let colKab = -1;
  let colKec = -1;
  let colKel = -1;
  let colDesa = -1;
  let headerRowIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c]).toLowerCase().trim();
      if (!cellVal) continue;

      // Skip title banners
      if (cellVal.includes('data pusat') || cellVal.includes('provinsi jawa barat') || cellVal.includes('rekapitulasi')) {
        continue;
      }

      const isJumlahCol = cellVal.includes('jumlah') || cellVal.includes('total');

      // Kabupaten / Kota column
      if (!isJumlahCol && (cellVal.includes('kabupaten') || cellVal === 'kab/kota' || cellVal.includes('kabupaten/ kota') || cellVal === 'wilayah')) {
        if (colKab === -1) colKab = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }

      // Kecamatan column (must NOT be "jumlah kecamatan")
      if (!isJumlahCol && (cellVal.includes('kecamatan') || cellVal === 'kec')) {
        if (colKec === -1 || cellVal === 'kecamatan') {
          colKec = c;
          headerRowIdx = Math.max(headerRowIdx, r);
        }
      }

      // Kelurahan column (must NOT be "jumlah kelurahan" and NOT "kelurahan dan desa")
      if (!isJumlahCol && cellVal.includes('kelurahan') && !cellVal.includes('kelurahan dan desa') && !cellVal.includes('desa/kelurahan')) {
        if (colKel === -1 || cellVal.includes('membentuk')) {
          colKel = c;
          headerRowIdx = Math.max(headerRowIdx, r);
        }
      }

      // Desa column (must NOT be "jumlah desa" and NOT "kelurahan dan desa" and NOT "desa/kelurahan")
      if (!isJumlahCol && cellVal.includes('desa') && !cellVal.includes('kelurahan dan desa') && !cellVal.includes('desa/kelurahan') && !cellVal.includes('desa/ kelurahan')) {
        if (colDesa === -1 || cellVal.includes('membentuk')) {
          colDesa = c;
          headerRowIdx = Math.max(headerRowIdx, r);
        }
      }
    }
  }

  // Fallback defaults for standard government WPS layout if not detected by header text:
  const maxRowLen = Math.max(...rows.slice(0, 10).map((r) => r.length));
  if (colKab === -1 && maxRowLen > 6) colKab = 1;
  if (colKec === -1) colKec = maxRowLen > 6 ? 7 : (maxRowLen >= 4 ? 1 : 0);
  if (colKel === -1) colKel = maxRowLen > 6 ? 9 : (maxRowLen >= 4 ? 2 : 1);
  if (colDesa === -1) colDesa = maxRowLen > 6 ? 11 : (maxRowLen >= 4 ? 3 : 2);

  // Helper to extract non-numeric text from a column or its adjacent column (for paired number+name cells)
  const getCellCandidates = (row: any[], primaryCol: number, minOffset = -1, maxOffset = 2): string => {
    if (primaryCol < 0) return '';
    for (let offset = minOffset; offset <= maxOffset; offset++) {
      const idx = primaryCol + offset;
      if (idx >= 0 && idx < row.length) {
        const val = String(row[idx] || '').trim();
        if (val && !isHeaderOrSummaryString(val)) {
          const clean = cleanPuskesosName(val);
          // Must not be a pure number, and must have length >= 2
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

  // Strict check for sub-number row (e.g. 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10).
  // CRITICAL: NEVER skip a row if it contains ANY letters (like "KABUPATEN BANDUNG" or "CILEUNYI")!
  for (let r = dataStartRow; r < Math.min(dataStartRow + 3, rows.length); r++) {
    const row = rows[r];
    const nonEmp = row.map((c) => String(c).trim()).filter((c) => c !== '');
    if (nonEmp.length >= 3) {
      const hasLetters = nonEmp.some((c) => /[a-zA-Z]/.test(c));
      const allNumbers = nonEmp.every((c) => /^\d+$/.test(c) && Number(c) <= 25);
      if (!hasLetters && allNumbers) {
        dataStartRow = r + 1;
        break;
      }
    }
  }

  // 3. Process Rows with Top-Down Streaming Memory
  let currentKabKota: string | null = null;
  let currentKecamatan: string | null = null;

  const allRecords: Omit<PSKSDataRecord, 'id'>[] = [];
  const regionsData: Record<string, SlrtRegionData> = {};

  for (let r = dataStartRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Check if entire row is empty or summary/footer
    const rowStr = row.map((cell) => String(cell).trim()).join(' ');
    if (!rowStr) continue;
    if (/^(total|jumlah|subtotal|rekapitulasi|catatan|keterangan)\b/i.test(rowStr)) continue;

    // A. Detect new Kabupaten / Kota in this row
    // 1. Check colKab first
    if (colKab !== -1 && colKab < row.length) {
      const detected = normalizeSlrtRegion(row[colKab]);
      if (detected) {
        currentKabKota = detected;
      }
    }
    // 2. Scan first 4 columns for any West Java region name
    for (let c = 0; c < Math.min(row.length, 5); c++) {
      const detected = normalizeSlrtRegion(row[c]);
      if (detected) {
        currentKabKota = detected;
        break;
      }
    }

    // Determine the effective region of this row
    const rowRegion = currentKabKota || (targetRegionFilter ? normalizeSlrtRegion(targetRegionFilter) : null);
    if (!rowRegion) {
      // Still no region detected, skip until region is identified
      continue;
    }

    // CRITICAL FIX FOR SKENARIO B:
    // If targetRegionFilter is active (e.g. user clicked "Import Khusus Wilayah Ini" in Kab. Bogor),
    // we MUST verify that this row actually belongs to targetRegionFilter!
    // If current row has a detected region (e.g. Kab. Bandung) that does NOT match targetRegionFilter, SKIP IT!
    if (targetRegionFilter && !isSameWilayah(rowRegion, targetRegionFilter)) {
      continue;
    }

    // B. Detect new Kecamatan
    let candidateKec = '';
    if (colKec !== -1) {
      candidateKec = getCellCandidates(row, colKec, 0, 1);
    }
    if (!candidateKec && colKec > 0) {
      candidateKec = getCellCandidates(row, colKec - 1, 0, 0);
    }

    if (candidateKec) {
      currentKecamatan = candidateKec;
    }

    // C. Detect Kelurahan Name
    let candidateKel = '';
    if (colKel !== -1) {
      candidateKel = getCellCandidates(row, colKel, 0, 1);
    }
    if (!candidateKel && colKel > 0) {
      candidateKel = getCellCandidates(row, colKel - 1, 0, 0);
    }

    // D. Detect Desa Name
    let candidateDesa = '';
    if (colDesa !== -1) {
      candidateDesa = getCellCandidates(row, colDesa, 0, 1);
    }
    if (!candidateDesa && colDesa > 0) {
      candidateDesa = getCellCandidates(row, colDesa - 1, 0, 0);
    }

    // If candidateKel and candidateDesa are the same string (e.g. from overlapping search range), disambiguate
    if (candidateKel && candidateDesa && candidateKel.toLowerCase() === candidateDesa.toLowerCase()) {
      candidateDesa = '';
    }

    // If row has neither Kelurahan nor Desa, continue
    if (!candidateKel && !candidateDesa) continue;

    // Helper to store record and update hierarchical region structure
    const recordPuskesos = (name: string, jenis: 'Desa' | 'Kelurahan') => {
      if (!name || isHeaderOrSummaryString(name)) return;

      const kecName = currentKecamatan || 'Kecamatan Terpadu';
      const recordTitle = `Puskesos ${jenis === 'Kelurahan' ? 'Kel.' : 'Desa'} ${name}`;

      const rec: Omit<PSKSDataRecord, 'id'> = {
        pillarId: 'slrt_puskesos',
        wilayah: rowRegion,
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
      if (!regionsData[rowRegion]) {
        regionsData[rowRegion] = {
          regionName: rowRegion,
          kecamatanList: [],
          totalKecamatan: 0,
          totalKelurahan: 0,
          totalDesa: 0,
          totalTerbentuk: 0,
          records: [],
        };
      }

      const regEntry = regionsData[rowRegion];
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
    const errorPrefix = targetRegionFilter ? `untuk wilayah "${targetRegionFilter}" ` : '';
    throw new Error(
      `Tidak ditemukan data Desa atau Kelurahan ${errorPrefix}pada sheet "${targetSheetName}". Pastikan baris data memiliki nama Kecamatan serta nama Desa atau Kelurahan yang sesuai.`
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
