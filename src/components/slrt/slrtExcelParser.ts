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
  totalKelurahan: number; // Jumlah Kelurahan yang telah membentuk Puskesos
  totalDesa: number; // Jumlah Desa yang telah membentuk Puskesos
  totalTerbentuk: number; // Otomatis terhitung = totalKelurahan + totalDesa
  adminKecamatan?: number; // Total administratif resmi
  adminKelurahan?: number; // Total administratif resmi
  adminDesa?: number; // Total administratif resmi
  adminTotal?: number; // Total administratif resmi
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
 * Master data administratif resmi Provinsi Jawa Barat (27 Kab/Kota)
 * Digunakan sebagai referensi standar indikator wilayah administratif
 */
export const JABAR_ADMIN_WILAYAH_MASTER: Record<
  string,
  { jmlKecamatan: number; jmlKelurahan: number; jmlDesa: number; jmlTotal: number }
> = {
  'Kab. Bogor': { jmlKecamatan: 40, jmlKelurahan: 19, jmlDesa: 416, jmlTotal: 435 },
  'Kab. Sukabumi': { jmlKecamatan: 47, jmlKelurahan: 5, jmlDesa: 381, jmlTotal: 386 },
  'Kab. Cianjur': { jmlKecamatan: 32, jmlKelurahan: 6, jmlDesa: 354, jmlTotal: 360 },
  'Kab. Bandung': { jmlKecamatan: 31, jmlKelurahan: 10, jmlDesa: 270, jmlTotal: 280 },
  'Kab. Garut': { jmlKecamatan: 42, jmlKelurahan: 21, jmlDesa: 421, jmlTotal: 442 },
  'Kab. Tasikmalaya': { jmlKecamatan: 39, jmlKelurahan: 0, jmlDesa: 351, jmlTotal: 351 },
  'Kab. Ciamis': { jmlKecamatan: 27, jmlKelurahan: 7, jmlDesa: 258, jmlTotal: 265 },
  'Kab. Kuningan': { jmlKecamatan: 32, jmlKelurahan: 15, jmlDesa: 361, jmlTotal: 376 },
  'Kab. Cirebon': { jmlKecamatan: 40, jmlKelurahan: 12, jmlDesa: 412, jmlTotal: 424 },
  'Kab. Majalengka': { jmlKecamatan: 26, jmlKelurahan: 13, jmlDesa: 330, jmlTotal: 343 },
  'Kab. Sumedang': { jmlKecamatan: 26, jmlKelurahan: 7, jmlDesa: 270, jmlTotal: 277 },
  'Kab. Indramayu': { jmlKecamatan: 31, jmlKelurahan: 8, jmlDesa: 309, jmlTotal: 317 },
  'Kab. Subang': { jmlKecamatan: 30, jmlKelurahan: 8, jmlDesa: 245, jmlTotal: 253 },
  'Kab. Purwakarta': { jmlKecamatan: 17, jmlKelurahan: 9, jmlDesa: 183, jmlTotal: 192 },
  'Kab. Karawang': { jmlKecamatan: 30, jmlKelurahan: 12, jmlDesa: 297, jmlTotal: 309 },
  'Kab. Bekasi': { jmlKecamatan: 23, jmlKelurahan: 8, jmlDesa: 179, jmlTotal: 187 },
  'Kab. Bandung Barat': { jmlKecamatan: 16, jmlKelurahan: 0, jmlDesa: 165, jmlTotal: 165 },
  'Kab. Pangandaran': { jmlKecamatan: 10, jmlKelurahan: 0, jmlDesa: 93, jmlTotal: 93 },
  'Kota Bogor': { jmlKecamatan: 6, jmlKelurahan: 68, jmlDesa: 0, jmlTotal: 68 },
  'Kota Sukabumi': { jmlKecamatan: 7, jmlKelurahan: 33, jmlDesa: 0, jmlTotal: 33 },
  'Kota Bandung': { jmlKecamatan: 30, jmlKelurahan: 151, jmlDesa: 0, jmlTotal: 151 },
  'Kota Cirebon': { jmlKecamatan: 5, jmlKelurahan: 22, jmlDesa: 0, jmlTotal: 22 },
  'Kota Bekasi': { jmlKecamatan: 12, jmlKelurahan: 56, jmlDesa: 0, jmlTotal: 56 },
  'Kota Depok': { jmlKecamatan: 11, jmlKelurahan: 63, jmlDesa: 0, jmlTotal: 63 },
  'Kota Cimahi': { jmlKecamatan: 3, jmlKelurahan: 15, jmlDesa: 0, jmlTotal: 15 },
  'Kota Tasikmalaya': { jmlKecamatan: 10, jmlKelurahan: 69, jmlDesa: 0, jmlTotal: 69 },
  'Kota Banjar': { jmlKecamatan: 4, jmlKelurahan: 9, jmlDesa: 16, jmlTotal: 25 },
};

/**
 * Checks if a cell string is a header, title, sub-number, or summary row text
 */
export const isHeaderOrSummaryString = (val?: any): boolean => {
  if (val === undefined || val === null) return true;
  const s = String(val).toLowerCase().trim();
  if (!s || s === '-' || s === '0') return true;
  if (/^\d+$/.test(s)) return true; // Pure number like 1, 2, 3
  if (s.startsWith('update :') || s.startsWith('update:')) return true;
  if (
    s.includes('puskesos') &&
    (s.includes('membentuk') ||
      s.includes('data pusat') ||
      s.includes('rincian') ||
      s.includes('rekapitulasi'))
  )
    return true;
  if (s.includes('wilayah administratif')) return true;
  if (s.includes('kabupaten') && s.includes('kota')) return true;
  if (s.includes('jumlah kecamatan') || s.includes('jumlah kelurahan') || s.includes('jumlah desa'))
    return true;
  if (
    s.includes('jumlah kelurahan dan desa') ||
    s.includes('jumlah desa/kelurahan') ||
    s.includes('jumlah desa/ kelurahan')
  )
    return true;
  if (s.includes('menurut kabupaten/kota') || s.includes('provinsi jawa barat')) return true;
  if (s.includes('jumlah terbentuk') || s.includes('total terbentuk')) return true;
  if (s === 'ket.' || s === 'keterangan' || s.includes('100% desa/kel') || s.includes('100%'))
    return true;
  if (s === 'no' || s === 'no.' || s === 'nomor') return true;
  if (/^(total|jumlah|subtotal|rekap|rekapitulasi|catatan|keterangan)\b/i.test(s)) return true;
  return false;
};

/**
 * Normalizes any text representation of West Java Kabupaten / Kota
 * Guaranteed not to match general title rows like "Provinsi Jawa Barat"
 */
export const normalizeSlrtRegion = (rawText?: any): string | null => {
  if (!rawText) return null;
  const str = String(rawText).trim();
  if (!str) return null;

  const sLower = str.toLowerCase();

  // Guard against title rows or header text
  if (
    sLower.includes('provinsi') ||
    sLower.includes('pemerintah') ||
    sLower.includes('rekapitulasi') ||
    sLower.includes('rekap') ||
    sLower.includes('data pusat') ||
    sLower.includes('format') ||
    sLower.includes('wilayah administratif') ||
    sLower.includes('laporan') ||
    sLower.includes('daftar') ||
    sLower.includes('se-jawa barat') ||
    sLower.includes('se-provinsi')
  ) {
    return null;
  }

  // Remove leading numbers, dots, dashes, e.g. "1. ", "1 ", "NO. 1 "
  const clean = str
    .replace(/^no\.?\s*\d*[\.\s\-]*/i, '')
    .replace(/^\d+[\.\s\-]*/, '')
    .replace(/^kabupaten\b/i, 'kab.')
    .replace(/^kab\b/i, 'kab.')
    .replace(/^kota\b/i, 'kota')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return null;

  // Exact comparison first
  for (const reg of KAB_KOTA_ONLY) {
    if (reg.toLowerCase() === clean.toLowerCase()) return reg;
  }

  // Handle Kota Cirebon / Kab Cirebon specifically
  if (clean.toLowerCase().includes('cirebon')) {
    if (clean.toLowerCase().includes('kota')) return 'Kota Cirebon';
    if (clean.toLowerCase().includes('kab')) return 'Kab. Cirebon';
  }

  // Sort candidates by length descending so "Kab. Bandung Barat" is checked before "Kab. Bandung"
  const sortedCandidates = [...KAB_KOTA_ONLY].sort((a, b) => b.length - a.length);

  for (const reg of sortedCandidates) {
    const regCore = reg.toLowerCase().replace(/^(kab\.|kota)\s+/, '').trim();
    const cleanLower = clean.toLowerCase();

    // Check if cleanLower matches the core region name
    const regCoreWords = regCore.split(/\s+/);
    const matchAllWords = regCoreWords.every((w) => cleanLower.includes(w));
    if (matchAllWords) {
      const isKota = cleanLower.includes('kota');
      if (isKota && reg.startsWith('Kota')) return reg;
      if (!isKota && reg.startsWith('Kab.')) return reg;
    }
  }

  return null;
};

/**
 * Cleans leading numbering and prefix words from name cells
 * e.g. "1 CILEUNYI KULON" -> "Cileunyi Kulon", "Desa Cikoneng" -> "Cikoneng"
 */
export const cleanPuskesosName = (raw?: any): string => {
  if (!raw) return '';
  let str = String(raw).trim();
  if (!str || str === '-' || str === '0') return '';

  // Strip leading number and separator: "1.", "1 ", "1 -", "(1)", "1) "
  str = str.replace(/^(\d+[\.\s\-–—\)]+|\(\d+\))\s*/, '').trim();

  // Strip prefixes like "Desa ", "Kelurahan ", "Kel. ", "Puskesos "
  str = str.replace(/^(puskesos|desa|kelurahan|kel\.)\s+/i, '').trim();

  if (!str || isHeaderOrSummaryString(str)) return '';

  // Never allow a Kabupaten name to be treated as a Puskesos name
  if (normalizeSlrtRegion(str) !== null) return '';

  // Convert ALL CAPS to clean Title Case
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
 * Grounded in the official West Java WPS Office format (14 columns A-N)
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

  // Convert sheet to 2D array
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows || rows.length < 2) {
    throw new Error('Format file Excel terlalu pendek atau tidak memiliki baris data.');
  }

  // 2. Identify Sub-number Row and Data Start Row
  // In the official WPS Office spreadsheet:
  // Row 6 (index 5): WILAYAH ADMINISTRATIF & DESA/KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
  // Row 7 (index 6): NO., KABUPATEN/ KOTA, JUMLAH KECAMATAN, ... KECAMATAN, KELURAHAN ..., DESA ...
  // Row 8 (index 7): 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
  // Row 9 (index 8): 1 | KAB. BANDUNG | 30 | 10 | 270 | 280 | 1 | CILEUNYI | | | 1 | CILEUNYI KULON | 280
  let subNumberRowIdx = -1;
  let dataStartRow = -1;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    if (!row) continue;
    const nonEmp = row.map((c) => String(c).trim()).filter((c) => c !== '');
    if (nonEmp.length >= 4) {
      const hasLetters = nonEmp.some((c) => /[a-zA-Z]/.test(c));
      const allSeqNumbers = nonEmp.every((c) => /^\d+$/.test(c) && Number(c) <= 25);
      if (!hasLetters && allSeqNumbers) {
        subNumberRowIdx = r;
        dataStartRow = r + 1;
        break;
      }
    }
  }

  if (dataStartRow === -1) {
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      if (!row || row.length < 2) continue;
      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();

      if (/^\d+[\.]?$/.test(c0) && normalizeSlrtRegion(c1)) {
        dataStartRow = r;
        break;
      }
      if (normalizeSlrtRegion(c0)) {
        dataStartRow = r;
        break;
      }
    }
  }

  if (dataStartRow === -1) {
    dataStartRow = 8; // Default to Row 9 in WPS
  }

  // 3. Determine Layout Columns
  // Check maximum row length to distinguish 14-column layout (WPS Office paired columns) vs 10-column layout
  const maxCols = Math.max(...rows.slice(dataStartRow, dataStartRow + 10).map((r) => r.length), 10);
  const isWpsPairedLayout = maxCols >= 12;

  // Official WPS Office Column Mapping:
  // Col A (0): NO
  // Col B (1): KABUPATEN/ KOTA
  // Col C (2): JUMLAH KECAMATAN
  // Col D (3): JUMLAH KELURAHAN
  // Col E (4): JUMLAH DESA
  // Col F (5): JUMLAH KELURAHAN DAN DESA
  // Col G & H (6 & 7): KECAMATAN (G = No, H = Nama Kecamatan)
  // Col I & J (8 & 9): KELURAHAN YANG TELAH MEMBENTUK PUSKESOS (I = No, J = Nama Kelurahan)
  // Col K & L (10 & 11): DESA YANG TELAH MEMBENTUK PUSKESOS (K = No, L = Nama Desa)
  // Col M (12): JUMLAH TERBENTUK (280)
  // Col N (13): KET
  let colKab = 1;
  let colJmlKec = 2;
  let colJmlKel = 3;
  let colJmlDesa = 4;
  let colJmlTotal = 5;

  let colKecNum = isWpsPairedLayout ? 6 : -1;
  let colKecName = isWpsPairedLayout ? 7 : 6;

  let colKelNum = isWpsPairedLayout ? 8 : -1;
  let colKelName = isWpsPairedLayout ? 9 : 7;

  let colDesaNum = isWpsPairedLayout ? 10 : -1;
  let colDesaName = isWpsPairedLayout ? 11 : 8;

  let colTerbentuk = isWpsPairedLayout ? 12 : 9;

  // Helper to extract non-numeric text strictly for Kecamatan, Kelurahan, or Desa
  const extractCellText = (row: any[], nameCol: number, numCol: number): string => {
    if (nameCol >= 0 && nameCol < row.length) {
      const val = String(row[nameCol] || '').trim();
      if (val && !isHeaderOrSummaryString(val) && !/^\d+$/.test(val)) {
        const cleaned = cleanPuskesosName(val);
        if (cleaned && normalizeSlrtRegion(cleaned) === null) {
          return cleaned;
        }
      }
    }
    // Fallback: check numCol in case text was written there
    if (numCol >= 0 && numCol < row.length) {
      const val = String(row[numCol] || '').trim();
      if (val && !isHeaderOrSummaryString(val) && !/^\d+$/.test(val)) {
        const cleaned = cleanPuskesosName(val);
        if (cleaned && normalizeSlrtRegion(cleaned) === null) {
          return cleaned;
        }
      }
    }
    return '';
  };

  // 4. Initialize All 27 West Java Regions
  const regionsData: Record<string, SlrtRegionData> = {};
  const allRecords: Omit<PSKSDataRecord, 'id'>[] = [];

  // In Skenario A, guarantee all 27 West Java Kabupaten/Kota are present
  if (!targetRegionFilter) {
    for (const reg of KAB_KOTA_ONLY) {
      const master = JABAR_ADMIN_WILAYAH_MASTER[reg];
      regionsData[reg] = {
        regionName: reg,
        kecamatanList: [],
        totalKecamatan: master?.jmlKecamatan || 0,
        totalKelurahan: 0,
        totalDesa: 0,
        totalTerbentuk: 0,
        adminKecamatan: master?.jmlKecamatan || 0,
        adminKelurahan: master?.jmlKelurahan || 0,
        adminDesa: master?.jmlDesa || 0,
        adminTotal: master?.jmlTotal || 0,
        records: [],
      };
    }
  }

  // 5. Process Rows with Top-Down Streaming Memory
  let currentKabKota: string | null = null;
  let currentKecamatan: string | null = null;

  for (let r = dataStartRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rowStr = row.map((cell) => String(cell || '').trim()).join(' ');
    if (!rowStr) continue;

    // Skip summary or footer rows
    if (/^(total|jumlah|subtotal|rekapitulasi|catatan|keterangan)\b/i.test(rowStr)) continue;

    // A. Detect new Kabupaten / Kota
    let detectedRegion: string | null = null;
    if (colKab >= 0 && colKab < row.length) {
      detectedRegion = normalizeSlrtRegion(row[colKab]);
    }
    if (!detectedRegion) {
      for (let c = 0; c < Math.min(row.length, 3); c++) {
        const candidate = normalizeSlrtRegion(row[c]);
        if (candidate) {
          detectedRegion = candidate;
          break;
        }
      }
    }

    if (detectedRegion) {
      currentKabKota = detectedRegion;
      currentKecamatan = null; // New region resets current kecamatan

      if (!regionsData[currentKabKota]) {
        const master = JABAR_ADMIN_WILAYAH_MASTER[currentKabKota];
        const pKec =
          colJmlKec >= 0 && Number(row[colJmlKec]) > 0
            ? Number(row[colJmlKec])
            : master?.jmlKecamatan || 0;
        const pKel =
          colJmlKel >= 0 && Number(row[colJmlKel]) >= 0
            ? Number(row[colJmlKel])
            : master?.jmlKelurahan || 0;
        const pDesa =
          colJmlDesa >= 0 && Number(row[colJmlDesa]) >= 0
            ? Number(row[colJmlDesa])
            : master?.jmlDesa || 0;
        const pTotal =
          colJmlTotal >= 0 && Number(row[colJmlTotal]) > 0
            ? Number(row[colJmlTotal])
            : master?.jmlTotal || pKel + pDesa;

        regionsData[currentKabKota] = {
          regionName: currentKabKota,
          kecamatanList: [],
          totalKecamatan: pKec,
          totalKelurahan: 0,
          totalDesa: 0,
          totalTerbentuk: 0,
          adminKecamatan: pKec,
          adminKelurahan: pKel,
          adminDesa: pDesa,
          adminTotal: pTotal,
          records: [],
        };
      }
    }

    // Determine effective region
    const effectiveRegion =
      currentKabKota || (targetRegionFilter ? normalizeSlrtRegion(targetRegionFilter) : null);
    if (!effectiveRegion) continue;

    // Skenario B Filter: if targetRegionFilter is set, strictly skip records from other regions
    if (targetRegionFilter && !isSameWilayah(effectiveRegion, targetRegionFilter)) {
      continue;
    }

    // Ensure region entry exists
    if (!regionsData[effectiveRegion]) {
      const master = JABAR_ADMIN_WILAYAH_MASTER[effectiveRegion];
      regionsData[effectiveRegion] = {
        regionName: effectiveRegion,
        kecamatanList: [],
        totalKecamatan: master?.jmlKecamatan || 0,
        totalKelurahan: 0,
        totalDesa: 0,
        totalTerbentuk: 0,
        adminKecamatan: master?.jmlKecamatan || 0,
        adminKelurahan: master?.jmlKelurahan || 0,
        adminDesa: master?.jmlDesa || 0,
        adminTotal: master?.jmlTotal || 0,
        records: [],
      };
    }

    // B. Detect Kecamatan (Col H / index 7, or Col G / index 6)
    const detectedKec = extractCellText(row, colKecName, colKecNum);
    if (detectedKec) {
      currentKecamatan = detectedKec;
    }

    // C. Detect Kelurahan (Col J / index 9, or Col I / index 8)
    const detectedKel = extractCellText(row, colKelName, colKelNum);

    // D. Detect Desa (Col L / index 11, or Col K / index 10)
    const detectedDesa = extractCellText(row, colDesaName, colDesaNum);

    // If both Kelurahan and Desa are empty, continue (Kabupaten & Kecamatan are retained in streaming memory)
    if (!detectedKel && !detectedDesa) continue;

    const finalRegion = effectiveRegion;

    // Helper to store record and update hierarchical region structure
    const recordPuskesos = (name: string, jenis: 'Desa' | 'Kelurahan') => {
      if (!name || isHeaderOrSummaryString(name)) return;
      if (normalizeSlrtRegion(name) !== null) return; // Strict rejection of Kabupaten names

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

      const regEntry = regionsData[finalRegion];
      regEntry.records.push(rec);
      if (jenis === 'Kelurahan') regEntry.totalKelurahan += 1;
      if (jenis === 'Desa') regEntry.totalDesa += 1;
      regEntry.totalTerbentuk = regEntry.totalKelurahan + regEntry.totalDesa;

      // Find or create Kecamatan item
      let kecItem = regEntry.kecamatanList.find(
        (k) => k.kecamatan.toLowerCase() === kecName.toLowerCase()
      );
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
    };

    // Emit Kelurahan if present
    if (detectedKel) {
      recordPuskesos(detectedKel, 'Kelurahan');
    }

    // Emit Desa if present
    if (detectedDesa) {
      recordPuskesos(detectedDesa, 'Desa');
    }
  }

  // In Skenario B, only keep targetRegion
  if (targetRegionFilter) {
    const normTarget = normalizeSlrtRegion(targetRegionFilter);
    for (const regKey of Object.keys(regionsData)) {
      if (!isSameWilayah(regKey, targetRegionFilter) && regKey !== normTarget) {
        delete regionsData[regKey];
      }
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
