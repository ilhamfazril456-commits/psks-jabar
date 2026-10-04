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
 * Checks if a cell string is a header, title, or summary row text (must never be treated as data)
 */
export const isHeaderOrSummaryString = (val?: any): boolean => {
  if (val === undefined || val === null) return true;
  const s = String(val).toLowerCase().trim();
  if (!s) return true;
  if (/^\d+$/.test(s)) return true; // Just a number
  if (s.includes('puskesos') && (s.includes('membentuk') || s.includes('data pusat') || s.includes('rincian'))) return true;
  if (s.includes('wilayah administratif')) return true;
  if (s.includes('kabupaten') && s.includes('kota')) return true;
  if (s.includes('jumlah kecamatan') || s.includes('jumlah kelurahan') || s.includes('jumlah desa')) return true;
  if (s.startsWith('update :') || s.startsWith('update:')) return true;
  if (s.includes('menurut kabupaten/kota')) return true;
  if (s === 'ket.' || s === 'keterangan' || s.includes('telah membentuk') || s.includes('100% desa/kel')) return true;
  if (s === 'no' || s === 'no.' || s === 'nomor') return true;
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
  // Capitalize properly if it's all uppercase
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
    // Prefer sheet containing 'rincian', 'puskesos', 'desa', or choose the sheet with most rows
    const preferredSheet = workbook.SheetNames.find((s) =>
      /rincian|puskesos|desa|detail|data/i.test(s)
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
  if (!rows || rows.length < 3) {
    throw new Error('Format file Excel terlalu pendek atau tidak memiliki baris data.');
  }

  // 2. Identify Column Layout (WPS Government format with Merged/Split columns)
  // Let's locate the columns by scanning header rows
  let colKab = 1; // Default Col B
  let colKec = 6; // Default Col G (No) or Col H (Name)
  let colKel = 8; // Default Col I (No) or Col J (Name)
  let colDesa = 10; // Default Col K (No) or Col L (Name)

  let headerRowIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c]).toLowerCase().trim();

      if (cellVal.includes('kabupaten') || cellVal === 'kab/kota' || cellVal.includes('kabupaten/ kota')) {
        colKab = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }
      if (cellVal === 'kecamatan') {
        colKec = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }
      if (cellVal.includes('kelurahan yang telah membentuk') || (cellVal.includes('kelurahan') && cellVal.includes('membentuk'))) {
        colKel = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }
      if (cellVal.includes('desa yang telah membentuk') || (cellVal.includes('desa') && cellVal.includes('membentuk'))) {
        colDesa = c;
        headerRowIdx = Math.max(headerRowIdx, r);
      }
    }
  }

  // Determine starting data row (after header and subheader numbers row 1..10)
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

  // 3. Process Rows with Smart Paired-Column Scanner (Top-Down Streaming)
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

    // A. Detect new Kabupaten / Kota
    // Check cell in colKab and surrounding cells
    for (let c = Math.max(0, colKab - 1); c <= Math.min(row.length - 1, colKab + 1); c++) {
      const cellVal = row[c];
      const detectedRegion = normalizeSlrtRegion(cellVal);
      if (detectedRegion) {
        currentKabKota = detectedRegion;
        break;
      }
    }

    // B. Detect new Kecamatan
    // In WPS Office: Col G (colKec) is often the number (e.g. 1), and Col H (colKec + 1) is the Name (e.g. CILEUNYI)
    let candidateKec = '';
    // Check colKec and colKec + 1
    for (let offset = 0; offset <= 2; offset++) {
      const c = colKec + offset;
      if (c < row.length) {
        const val = String(row[c]).trim();
        if (val && !isHeaderOrSummaryString(val)) {
          const cleanK = cleanPuskesosName(val);
          // Ensure it's not a pure number
          if (cleanK && !/^\d+$/.test(cleanK) && cleanK.length > 2) {
            candidateKec = cleanK;
            break;
          }
        }
      }
    }

    if (candidateKec) {
      currentKecamatan = candidateKec;
    }

    // C. Detect Kelurahan Name
    // In WPS Office: Col I is number, Col J is Name (e.g. CIBEUNYING, PADASUKA)
    let candidateKel = '';
    for (let offset = 0; offset <= 2; offset++) {
      const c = colKel + offset;
      if (c < row.length && c !== colDesa && c !== colDesa + 1) {
        const val = String(row[c]).trim();
        if (val && !isHeaderOrSummaryString(val)) {
          const cleanK = cleanPuskesosName(val);
          if (cleanK && !/^\d+$/.test(cleanK) && cleanK.length > 2) {
            candidateKel = cleanK;
            break;
          }
        }
      }
    }

    // D. Detect Desa Name
    // In WPS Office: Col K is number, Col L or M is Name (e.g. CILEUNYI KULON, CILEUNYI WETAN, CIMEKAR...)
    let candidateDesa = '';
    for (let offset = 0; offset <= 3; offset++) {
      const c = colDesa + offset;
      if (c < row.length) {
        const val = String(row[c]).trim();
        if (val && !isHeaderOrSummaryString(val)) {
          const cleanD = cleanPuskesosName(val);
          if (cleanD && !/^\d+$/.test(cleanD) && cleanD.length > 2) {
            candidateDesa = cleanD;
            break;
          }
        }
      }
    }

    // E. Verify effective region
    const effectiveRegion = currentKabKota || (targetRegionFilter ? normalizeSlrtRegion(targetRegionFilter) : null);
    if (!effectiveRegion) continue;

    // If Skenario B (single region filter), ignore rows from other regions
    if (targetRegionFilter && !isSameWilayah(effectiveRegion, targetRegionFilter)) {
      continue;
    }

    // Helper to store record and update hierarchical region structure
    const recordPuskesos = (name: string, jenis: 'Desa' | 'Kelurahan') => {
      if (!name || isHeaderOrSummaryString(name)) return;

      const kecName = currentKecamatan || 'Kecamatan Terpadu';
      const recordTitle = `Puskesos ${jenis === 'Kelurahan' ? 'Kel.' : 'Desa'} ${name}`;

      const rec: Omit<PSKSDataRecord, 'id'> = {
        pillarId: 'slrt_puskesos',
        wilayah: effectiveRegion,
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
      if (!regionsData[effectiveRegion]) {
        regionsData[effectiveRegion] = {
          regionName: effectiveRegion,
          kecamatanList: [],
          totalKecamatan: 0,
          totalKelurahan: 0,
          totalDesa: 0,
          totalTerbentuk: 0,
          records: [],
        };
      }

      const regEntry = regionsData[effectiveRegion];
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
      `Tidak ditemukan data Desa atau Kelurahan pada sheet "${targetSheetName}". Pastikan kolom Kecamatan, Kelurahan, atau Desa memiliki data.`
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
