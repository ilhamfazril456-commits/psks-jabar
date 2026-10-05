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
  if (s.includes('puskesos') && (s.includes('membentuk') || s.includes('data pusat') || s.includes('rincian') || s.includes('rekapitulasi'))) return true;
  if (s.includes('wilayah administratif')) return true;
  if (s.includes('kabupaten') && s.includes('kota')) return true;
  if (s.includes('jumlah kecamatan') || s.includes('jumlah kelurahan') || s.includes('jumlah desa')) return true;
  if (s.includes('jumlah kelurahan dan desa') || s.includes('jumlah desa/kelurahan') || s.includes('jumlah desa/ kelurahan')) return true;
  if (s.includes('menurut kabupaten/kota') || s.includes('provinsi jawa barat')) return true;
  if (s.includes('jumlah terbentuk') || s.includes('total terbentuk')) return true;
  if (s === 'ket.' || s === 'keterangan' || s.includes('100% desa/kel') || s.includes('100%')) return true;
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

  // Sort candidates by length descending so "Kab. Bandung Barat" is checked before "Kab. Bandung"
  const sortedCandidates = [...KAB_KOTA_ONLY].sort((a, b) => b.length - a.length);

  // Exact comparison first
  for (const reg of sortedCandidates) {
    if (reg.toLowerCase() === clean.toLowerCase()) return reg;
  }

  // Substring comparison
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

  // 2. Dynamic Column Header Detection
  // Scans across the top 10 header rows to locate the exact column index for each field
  const maxCols = Math.max(...rows.slice(0, 12).map((r) => r.length), 10);
  const colHeaderTexts: string[] = [];

  for (let c = 0; c < maxCols; c++) {
    const combined = rows
      .slice(0, 8)
      .map((r) => String(r[c] || '').toLowerCase().trim())
      .filter(Boolean)
      .join(' ');
    colHeaderTexts[c] = combined;
  }

  let colKab = -1;
  let colJmlKec = -1;
  let colJmlKel = -1;
  let colJmlDesa = -1;
  let colJmlTotal = -1;
  let colTerbentuk = -1;
  let colKec = -1;
  let colKel = -1;
  let colDesa = -1;

  for (let c = 0; c < maxCols; c++) {
    const text = colHeaderTexts[c];
    if (!text) continue;

    if (text.includes('kabupaten') || (text.includes('kota') && !text.includes('kecamatan'))) {
      if (!text.includes('jumlah') && colKab === -1) colKab = c;
    }
    if (text.includes('jumlah') && text.includes('kecamatan') && colJmlKec === -1) {
      colJmlKec = c;
    }
    if (text.includes('jumlah') && text.includes('kelurahan') && !text.includes('desa') && colJmlKel === -1) {
      colJmlKel = c;
    }
    if (text.includes('jumlah') && text.includes('desa') && !text.includes('kelurahan') && colJmlDesa === -1) {
      colJmlDesa = c;
    }
    if (
      text.includes('jumlah') &&
      (text.includes('kelurahan dan desa') ||
        text.includes('desa/kelurahan') ||
        text.includes('kelurahan/desa') ||
        text.includes('desa dan kelurahan')) &&
      colJmlTotal === -1
    ) {
      colJmlTotal = c;
    }
    if (text.includes('terbentuk') && colTerbentuk === -1) {
      colTerbentuk = c;
    }
    if (text.includes('kecamatan') && !text.includes('jumlah') && colKec === -1) {
      colKec = c;
    }
    if (text.includes('kelurahan') && !text.includes('jumlah') && colKel === -1) {
      colKel = c;
    }
    if (text.includes('desa') && !text.includes('jumlah') && !text.includes('kelurahan') && colDesa === -1) {
      colDesa = c;
    }
  }

  // Fallback defaults grounded in official 10-column WPS format (Screenshot 3)
  // Col 0: NO
  // Col 1: KABUPATEN / KOTA
  // Col 2: JUMLAH KECAMATAN
  // Col 3: JUMLAH KELURAHAN
  // Col 4: JUMLAH DESA
  // Col 5: JUMLAH KELURAHAN DAN DESA
  // Col 6: KECAMATAN
  // Col 7: KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
  // Col 8: DESA YANG TELAH MEMBENTUK PUSKESOS
  // Col 9: JUMLAH TERBENTUK
  if (colKab === -1) colKab = maxCols >= 8 ? 1 : 0;
  if (colJmlKec === -1 && maxCols >= 8) colJmlKec = 2;
  if (colJmlKel === -1 && maxCols >= 8) colJmlKel = 3;
  if (colJmlDesa === -1 && maxCols >= 8) colJmlDesa = 4;
  if (colJmlTotal === -1 && maxCols >= 8) colJmlTotal = 5;
  if (colKec === -1) colKec = maxCols >= 8 ? 6 : 1;
  if (colKel === -1) colKel = maxCols >= 8 ? 7 : 2;
  if (colDesa === -1) colDesa = maxCols >= 8 ? 8 : 3;
  if (colTerbentuk === -1 && maxCols >= 10) colTerbentuk = 9;

  // 3. Identify the EXACT Data Starting Row
  let dataStartRow = -1;

  // Check for the sub-number row: "1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10"
  for (let r = 0; r < Math.min(rows.length, 12); r++) {
    const row = rows[r];
    if (!row) continue;
    const nonEmp = row.map((c) => String(c).trim()).filter((c) => c !== '');
    if (nonEmp.length >= 4) {
      const hasLetters = nonEmp.some((c) => /[a-zA-Z]/.test(c));
      const allSeqNumbers = nonEmp.every((c) => /^\d+$/.test(c) && Number(c) <= 20);
      if (!hasLetters && allSeqNumbers) {
        dataStartRow = r + 1;
        break;
      }
    }
  }

  // If sub-number row was not found, search for the row starting with "1" and a valid Kabupaten/Kota
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
    dataStartRow = 3; // Standard fallback
  }

  // Helper to extract non-numeric text strictly from target column and its adjacent cell
  const getCellText = (row: any[], targetCol: number): string => {
    if (targetCol < 0 || targetCol >= row.length) return '';
    const exact = String(row[targetCol] || '').trim();
    if (exact && !isHeaderOrSummaryString(exact) && !/^\d+$/.test(exact)) {
      return cleanPuskesosName(exact);
    }
    // If empty or number, check targetCol + 1 (in case number was in targetCol and name is in targetCol + 1)
    if (targetCol + 1 < row.length) {
      const adjacent = String(row[targetCol + 1] || '').trim();
      if (adjacent && !isHeaderOrSummaryString(adjacent) && !/^\d+$/.test(adjacent)) {
        return cleanPuskesosName(adjacent);
      }
    }
    return '';
  };

  // 4. Process Rows with Top-Down Streaming Memory
  let currentKabKota: string | null = null;
  let currentKecamatan: string | null = null;

  const allRecords: Omit<PSKSDataRecord, 'id'>[] = [];
  const regionsData: Record<string, SlrtRegionData> = {};

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
      for (let c = 0; c < Math.min(row.length, 4); c++) {
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

      // Initialize region entry immediately
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

    // B. Detect Kecamatan
    const detectedKec = getCellText(row, colKec);
    if (detectedKec) {
      currentKecamatan = detectedKec;
    }

    // C. Detect Kelurahan
    const detectedKel = getCellText(row, colKel);

    // D. Detect Desa
    const detectedDesa = getCellText(row, colDesa);

    // If both Kelurahan and Desa are empty, continue (Kabupaten & Kecamatan are retained in streaming memory)
    if (!detectedKel && !detectedDesa) continue;

    const finalRegion = effectiveRegion;

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

  // Remove empty regions that had no records parsed
  for (const regKey of Object.keys(regionsData)) {
    if (regionsData[regKey].records.length === 0) {
      delete regionsData[regKey];
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
