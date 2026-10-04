import * as XLSX from 'xlsx';
import { PSKSDataRecord } from '../../types';
import { KAB_KOTA_ONLY } from '../../data/initialData';
import { isSameWilayah } from '../../utils/submissionStatus';

export interface SlrtAdminCounts {
  jmlKecamatan?: number;
  jmlKelurahan?: number;
  jmlDesa?: number;
  jmlTotalKelDesa?: number;
  jmlTerbentuk?: number;
}

export interface SlrtParsedResult {
  records: Omit<PSKSDataRecord, 'id'>[];
  regionsSummary: Record<
    string,
    {
      recordCount: number;
      kecamatanList: string[];
      kelurahanCount: number;
      desaCount: number;
      adminCounts?: SlrtAdminCounts;
    }
  >;
  totalRecords: number;
  fileName: string;
}

/**
 * Normalizes any text representation of West Java Kabupaten / Kota
 * Handles formats like "KAB. BANDUNG", "KABUPATEN BANDUNG", "KAB. BANDUNG BARAT", "KOTA CIMAHI", etc.
 */
export const normalizeSlrtRegion = (rawText?: any): string | null => {
  if (!rawText) return null;
  const str = String(rawText).trim();
  if (!str) return null;

  // Skip header titles or totals
  if (/^(no|jumlah|total|rekap|wilayah|provinsi|jawa barat|desa|kelurahan|kecamatan)/i.test(str)) {
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
  targetRegionFilter?: string | null
): Promise<SlrtParsedResult> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Read first active sheet
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error('Lembar kerja (sheet) pada file Excel kosong atau tidak terbaca.');
  }

  // Convert to 2D array (row by row)
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows || rows.length < 3) {
    throw new Error('Format file Excel terlalu pendek atau tidak memiliki baris data.');
  }

  // Step 1: Detect Header Row and Columns
  let headerRowIdx = -1;
  let colKab = -1;
  let colJmlKec = -1;
  let colJmlKel = -1;
  let colJmlDesa = -1;
  let colJmlTotalKelDesa = -1;
  let colKec = -1;
  let colKel = -1;
  let colDesa = -1;
  let colJmlTerbentuk = -1;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    const rowStr = row.map((cell) => String(cell).toLowerCase().trim()).join(' ');

    if (
      rowStr.includes('kabupaten') ||
      rowStr.includes('wilayah administratif') ||
      rowStr.includes('membentuk puskesos') ||
      (rowStr.includes('kecamatan') && (rowStr.includes('desa') || rowStr.includes('kelurahan')))
    ) {
      headerRowIdx = r;
      break;
    }
  }

  // If header found, check columns in header row and subsequent sub-header rows
  if (headerRowIdx !== -1) {
    for (let r = headerRowIdx; r <= Math.min(headerRowIdx + 3, rows.length - 1); r++) {
      const row = rows[r];
      row.forEach((cell, c) => {
        const val = String(cell).toLowerCase().trim();
        if (colKab === -1 && (val.includes('kabupaten') || val === 'kab/kota' || val.includes('kabupaten/ kota'))) {
          colKab = c;
        }
        if (colJmlKec === -1 && val.includes('jumlah kecamatan')) {
          colJmlKec = c;
        }
        if (colJmlKel === -1 && val.includes('jumlah kelurahan') && !val.includes('desa')) {
          colJmlKel = c;
        }
        if (colJmlDesa === -1 && val.includes('jumlah desa') && !val.includes('kelurahan')) {
          colJmlDesa = c;
        }
        if (colJmlTotalKelDesa === -1 && (val.includes('kelurahan dan desa') || val.includes('desa dan kelurahan'))) {
          colJmlTotalKelDesa = c;
        }
        if (colKec === -1 && val === 'kecamatan') {
          colKec = c;
        }
        if (colKel === -1 && val.includes('kelurahan yang telah membentuk')) {
          colKel = c;
        }
        if (colDesa === -1 && val.includes('desa yang telah membentuk')) {
          colDesa = c;
        }
        if (colJmlTerbentuk === -1 && val.includes('jumlah') && val.includes('membentuk')) {
          colJmlTerbentuk = c;
        }
      });
    }
  }

  // Fallback default columns matching official government layout in WPS screenshot:
  // Col 0: NO (A)
  // Col 1: KABUPATEN/ KOTA (B)
  // Col 2: JUMLAH KECAMATAN (C)
  // Col 3: JUMLAH KELURAHAN (D)
  // Col 4: JUMLAH DESA (E)
  // Col 5: JUMLAH KELURAHAN DAN DESA (F)
  // Col 6: KECAMATAN (G)
  // Col 7: KELURAHAN YANG TELAH MEMBENTUK PUSKESOS (H)
  // Col 8: DESA YANG TELAH MEMBENTUK PUSKESOS (I)
  // Col 9: JUMLAH DESA/ KELURAHAN YANG TELAH MEMBENTUK PUSKESOS (J)
  if (colKab === -1) colKab = 1;
  if (colJmlKec === -1) colJmlKec = 2;
  if (colJmlKel === -1) colJmlKel = 3;
  if (colJmlDesa === -1) colJmlDesa = 4;
  if (colJmlTotalKelDesa === -1) colJmlTotalKelDesa = 5;
  if (colKec === -1) colKec = 6;
  if (colKel === -1) colKel = 7;
  if (colDesa === -1) colDesa = 8;
  if (colJmlTerbentuk === -1) colJmlTerbentuk = 9;

  const dataStartRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;

  let currentKabKota: string | null = targetRegionFilter ? normalizeSlrtRegion(targetRegionFilter) : null;
  let currentKecamatan: string | null = null;
  let currentAdminCounts: Record<string, SlrtAdminCounts> = {};

  const parsedRecords: Omit<PSKSDataRecord, 'id'>[] = [];
  const regionsSummary: SlrtParsedResult['regionsSummary'] = {};

  for (let r = dataStartRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Check if row is sub-number header row like: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
    const isSubHeaderNumbers = row.slice(0, 10).every((cell, idx) => {
      const s = String(cell).trim();
      return !s || s === String(idx + 1);
    });
    if (isSubHeaderNumbers && r <= dataStartRow + 2) continue;

    // Check if cell in colKab has a new Kabupaten / Kota
    const rawKabCell = row[colKab] !== undefined ? row[colKab] : '';
    const detectedRegion = normalizeSlrtRegion(rawKabCell);

    if (detectedRegion) {
      // If a region filter is specified (Skenario B) and doesn't match, we still track currentKabKota
      currentKabKota = detectedRegion;

      // Also extract administrative numbers if present in this header row
      const numKec = parseInt(String(row[colJmlKec]).replace(/\D/g, ''), 10);
      const numKel = parseInt(String(row[colJmlKel]).replace(/\D/g, ''), 10);
      const numDesa = parseInt(String(row[colJmlDesa]).replace(/\D/g, ''), 10);
      const numTotal = parseInt(String(row[colJmlTotalKelDesa]).replace(/\D/g, ''), 10);
      const numTerbentuk = parseInt(String(row[colJmlTerbentuk]).replace(/\D/g, ''), 10);

      currentAdminCounts[detectedRegion] = {
        jmlKecamatan: !isNaN(numKec) ? numKec : undefined,
        jmlKelurahan: !isNaN(numKel) ? numKel : undefined,
        jmlDesa: !isNaN(numDesa) ? numDesa : undefined,
        jmlTotalKelDesa: !isNaN(numTotal) ? numTotal : undefined,
        jmlTerbentuk: !isNaN(numTerbentuk) ? numTerbentuk : undefined,
      };
    }

    // Check if cell in colKec has a new Kecamatan
    const rawKecCell = row[colKec] !== undefined ? String(row[colKec]).trim() : '';
    if (rawKecCell && !/^(kecamatan|jumlah|total)/i.test(rawKecCell)) {
      const cleanKec = cleanPuskesosName(rawKecCell);
      if (cleanKec && !/^\d+$/.test(cleanKec)) {
        currentKecamatan = cleanKec;
      }
    }

    // Check Kelurahan cell
    const rawKelCell = row[colKel] !== undefined ? String(row[colKel]).trim() : '';
    const cleanKel = cleanPuskesosName(rawKelCell);

    // Check Desa cell
    const rawDesaCell = row[colDesa] !== undefined ? String(row[colDesa]).trim() : '';
    const cleanDesa = cleanPuskesosName(rawDesaCell);

    // Skip if row has no region yet or is a total summary footer
    const effectiveRegion = currentKabKota || (targetRegionFilter ? normalizeSlrtRegion(targetRegionFilter) : null);
    if (!effectiveRegion) continue;

    // If Skenario B (single region filter), ignore rows from other regions
    if (targetRegionFilter && !isSameWilayah(effectiveRegion, targetRegionFilter)) {
      continue;
    }

    // Helper to push a new record
    const addRecord = (name: string, jenis: 'Desa' | 'Kelurahan') => {
      if (!name || /^(desa|kelurahan|jumlah|total|-)$/i.test(name)) return;

      const kecName = currentKecamatan || 'Pusat Wilayah';
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

      parsedRecords.push(rec);

      // Initialize summary record
      if (!regionsSummary[effectiveRegion]) {
        regionsSummary[effectiveRegion] = {
          recordCount: 0,
          kecamatanList: [],
          kelurahanCount: 0,
          desaCount: 0,
          adminCounts: currentAdminCounts[effectiveRegion],
        };
      }

      regionsSummary[effectiveRegion].recordCount += 1;
      if (jenis === 'Kelurahan') regionsSummary[effectiveRegion].kelurahanCount += 1;
      if (jenis === 'Desa') regionsSummary[effectiveRegion].desaCount += 1;
      if (kecName && !regionsSummary[effectiveRegion].kecamatanList.includes(kecName)) {
        regionsSummary[effectiveRegion].kecamatanList.push(kecName);
      }
    };

    // Emit Kelurahan if present
    if (cleanKel && !/^\d+$/.test(cleanKel)) {
      addRecord(cleanKel, 'Kelurahan');
    }

    // Emit Desa if present
    if (cleanDesa && !/^\d+$/.test(cleanDesa)) {
      addRecord(cleanDesa, 'Desa');
    }
  }

  if (parsedRecords.length === 0) {
    throw new Error(
      'Tidak ditemukan data Desa atau Kelurahan yang valid pada file ini. Pastikan format kolom sesuai dengan data pembentukan Puskesos.'
    );
  }

  return {
    records: parsedRecords,
    regionsSummary,
    totalRecords: parsedRecords.length,
    fileName: file.name,
  };
};
