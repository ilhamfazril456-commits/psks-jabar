import * as XLSX from 'xlsx';
import { PSKSDataRecord, UserSession, PillarInfo } from '../types';
import { JABAR_ADMIN_WILAYAH_MASTER } from '../components/slrt/slrtExcelParser';

/**
 * Format date string cleanly for Excel cells
 */
function formatMasaBerlaku(raw?: string | null): string {
  if (!raw) return '-';
  const str = String(raw).trim();
  if (!str || str === '-') return '-';
  if (str.includes('GMT') || str.includes('00:00:00') || !isNaN(Date.parse(str))) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
  }
  return str;
}

/**
 * Sanitize cell values against CSV/Formula Injection (OWASP mitigation).
 * Prevents Excel/LibreOffice from executing malicious formulas starting with =, +, -, @, tab, or newline.
 */
function sanitizeCellForExcel(val: any): any {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^[=+@\t\r\-]/.test(trimmed)) {
      // If it's a valid negative number (e.g. -123 or -123.45), don't escape
      if (/^-\d+(\.\d+)?$/.test(trimmed)) {
        return val;
      }
      return `'${val}`;
    }
  }
  return val;
}

export interface ExportPillarExcelParams {
  pillarId: string;
  pillar: PillarInfo;
  records: PSKSDataRecord[];
  session: UserSession;
  filterWilayah?: string;
}

export const exportPillarToExcel = ({
  pillarId,
  pillar,
  records,
  session,
  filterWilayah,
}: ExportPillarExcelParams): void => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // =========================================================================
  // KHUSUS PILAR SLRT PUSKESOS: FORMAT RESMI 10 KOLOM BERTINGKAT PEMPROV JABAR
  // =========================================================================
  if (pillarId === 'slrt_puskesos') {
    const regionMap: Record<string, PSKSDataRecord[]> = {};
    records.forEach((r) => {
      const reg = r.wilayah?.trim() || filterWilayah || 'Jawa Barat';
      if (!regionMap[reg]) regionMap[reg] = [];
      regionMap[reg].push(r);
    });

    const regionsList = Object.keys(regionMap);
    const targetRegionTitle = filterWilayah || (regionsList.length === 1 ? regionsList[0] : 'SE-JAWA BARAT');

    const aoaRows: any[][] = [
      ['PEMERINTAH DAERAH PROVINSI JAWA BARAT - DINAS SOSIAL'],
      [`DATA REKAPITULASI PEMBENTUKAN PUSAT KESEJAHTERAAN SOSIAL (PUSKESOS) DESA/KELURAHAN WILAYAH ${targetRegionTitle.toUpperCase()}`],
      [],
      [
        'WILAYAH ADMINISTRATIF',
        '',
        '',
        '',
        '',
        '',
        '',
        'DESA/KELURAHAN YANG TELAH MEMBENTUK PUSKESOS',
        '',
        '',
      ],
      [
        'NO.',
        'KABUPATEN/ KOTA',
        'JUMLAH KECAMATAN',
        'JUMLAH KELURAHAN',
        'JUMLAH DESA',
        'JUMLAH KELURAHAN DAN DESA',
        'JUMLAH TERBENTUK',
        'KECAMATAN',
        'KELURAHAN YANG TELAH MEMBENTUK PUSKESOS',
        'DESA YANG TELAH MEMBENTUK PUSKESOS',
      ],
      ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)', '(7)', '(8)', '(9)', '(10)'],
    ];

    regionsList.forEach((regName, regIdx) => {
      const regRecords = regionMap[regName];
      const master = JABAR_ADMIN_WILAYAH_MASTER[regName];

      const uniqueKec = new Set<string>();
      let kelCount = 0;
      let desaCount = 0;

      regRecords.forEach((r) => {
        if (r.kec && r.kec.trim()) uniqueKec.add(r.kec.trim());
        const isKel =
          r.jenisWilayah === 'Kelurahan' ||
          (r.nama && r.nama.toLowerCase().includes('kel.')) ||
          (r.kelDesa && r.kelDesa.toLowerCase().includes('kelurahan'));
        if (isKel) kelCount++;
        else desaCount++;
      });

      const jmlKec = master?.jmlKecamatan || (uniqueKec.size > 0 ? uniqueKec.size : 0);
      const jmlKel = master?.jmlKelurahan ?? kelCount;
      const jmlDesa = master?.jmlDesa ?? desaCount;
      const jmlTotal = master?.jmlTotal ?? (jmlKel + jmlDesa);
      const jmlTerbentuk = kelCount + desaCount;

      // Group by Kecamatan
      const kecMap: Record<string, { kelurahans: PSKSDataRecord[]; desas: PSKSDataRecord[] }> = {};
      regRecords.forEach((r) => {
        const kecName = r.kec?.trim() || 'Pusat Wilayah';
        if (!kecMap[kecName]) kecMap[kecName] = { kelurahans: [], desas: [] };
        const isKel =
          r.jenisWilayah === 'Kelurahan' ||
          (r.nama && r.nama.toLowerCase().includes('kel.')) ||
          (r.kelDesa && r.kelDesa.toLowerCase().includes('kelurahan'));
        if (isKel) kecMap[kecName].kelurahans.push(r);
        else kecMap[kecName].desas.push(r);
      });

      const kecEntries = Object.entries(kecMap);
      let runningKel = 0;
      let runningDesa = 0;
      let isFirstRowOfRegion = true;

      kecEntries.forEach(([kecName, group], kecIdx) => {
        const rowCount = Math.max(group.kelurahans.length, group.desas.length, 1);
        for (let rIdx = 0; rIdx < rowCount; rIdx++) {
          const kelRec = group.kelurahans[rIdx];
          const desaRec = group.desas[rIdx];

          if (kelRec) runningKel++;
          if (desaRec) runningDesa++;

          const col1 = isFirstRowOfRegion ? regIdx + 1 : '';
          const col2 = isFirstRowOfRegion ? regName.toUpperCase() : '';
          const col3 = isFirstRowOfRegion ? jmlKec : '';
          const col4 = isFirstRowOfRegion ? jmlKel : '';
          const col5 = isFirstRowOfRegion ? jmlDesa : '';
          const col6 = isFirstRowOfRegion ? jmlTotal : '';
          const col7 = isFirstRowOfRegion ? jmlTerbentuk : '';
          const col8 = rIdx === 0 ? `${kecIdx + 1} ${kecName.toUpperCase()}` : '';
          const col9 = kelRec ? `${runningKel} ${kelRec.kelDesa || kelRec.nama}` : '';
          const col10 = desaRec ? `${runningDesa} ${desaRec.kelDesa || desaRec.nama}` : '';

          aoaRows.push([col1, col2, col3, col4, col5, col6, col7, col8, col9, col10]);
          isFirstRowOfRegion = false;
        }
      });
    });

    // Sanitize values
    const sanitizedAoa = aoaRows.map((row) => row.map((cell) => sanitizeCellForExcel(cell)));
    const worksheet = XLSX.utils.aoa_to_sheet(sanitizedAoa);

    // Merges
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Row 1 Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Row 2 Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // WILAYAH ADMINISTRATIF (Col A-G)
      { s: { r: 3, c: 7 }, e: { r: 3, c: 9 } }, // DESA/KELURAHAN YANG TELAH MEMBENTUK PUSKESOS (Col H-J)
    ];

    // Column widths
    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 25 }, // KABUPATEN/ KOTA
      { wch: 18 }, // JUMLAH KECAMATAN
      { wch: 18 }, // JUMLAH KELURAHAN
      { wch: 16 }, // JUMLAH DESA
      { wch: 26 }, // JUMLAH KELURAHAN DAN DESA
      { wch: 20 }, // JUMLAH TERBENTUK
      { wch: 26 }, // KECAMATAN
      { wch: 35 }, // KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
      { wch: 35 }, // DESA YANG TELAH MEMBENTUK PUSKESOS
    ];

    const workbook = XLSX.utils.book_new();
    const sheetName = 'Puskesos Rekapitulasi';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const cleanRegName = (filterWilayah || 'Jabar').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Rekapitulasi_Puskesos_${cleanRegName}_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    return;
  }

  // Build clean, typed table row objects for other pillars
  let dataRows: Record<string, any>[] = [];

  if (pillarId === 'peksos') {
    dataRows = records.map((item, idx) => {
      const isGov =
        item.statusPeksos === 'Pemerintah' ||
        item.lembaga === 'Lembaga Pemerintah' ||
        item.lembaga === 'Pemerintah' ||
        (item.instansiBertugas &&
          !item.instansiBertugas.toLowerCase().includes('lks') &&
          !item.instansiBertugas.toLowerCase().includes('masyarakat'));
      const statusLabel = isGov ? 'Pemerintah' : 'Masyarakat';
      const jenjangGov = isGov ? (item.jenjangJabatanPemerintah || item.jenjangJabatan || 'Ahli Pertama') : '-';
      const certNum = item.noTglSertifikasi || item.noTglSertifikatKompetensi || item.sertifikasi || '-';
      const certKomp = item.sertifikasiKompetensi || 'Pekerja Sosial Generalis';
      const genderStr = item.jenisKelamin ? (item.jenisKelamin.toLowerCase().startsWith('l') ? 'Laki-laki' : 'Perempuan') : 'Laki-laki';

      return {
        'No': idx + 1,
        'Kabupaten / Kota': item.wilayah || '-',
        'Nama Lengkap': item.nama || '-',
        'NIK': item.nik ? String(item.nik) : '-',
        'Jenis Kelamin': genderStr,
        'Pendidikan Terakhir': item.pendidikan || 'S1 Kesejahteraan Sosial',
        'Nomor / Tanggal Sertifikasi': certNum,
        'Sertifikasi Kompetensi': certKomp,
        'Jenjang Jabatan': item.jenjangJabatan || 'Peksos Ahli Pertama',
        'Tempat Bertugas': item.tempatBertugas || item.kec || '-',
        'Instansi Tempat Bertugas': item.instansiBertugas || 'Dinas Sosial',
        'Status Peksos': statusLabel,
        'Jenjang Jabatan Pemerintah': jenjangGov,
        'Nomor Handphone': item.hp ? String(item.hp) : '-',
        'Alamat Email': item.email || '-',
        'Status Keaktifan': item.statusKeaktifan || item.status || 'Aktif',
      };
    });
  } else if (pillarId === 'psm') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Nama Anggota PSM': item.nama || '-',
      'Desa / Kelurahan': item.kelDesa || '-',
      'Kecamatan': item.kec || '-',
      'Masa Bakti': item.masaBakti || '-',
      'Nomor SK Pengangkatan': item.noSk || item.sertifikasi || '-',
      'Nomor Handphone': item.hp ? String(item.hp) : '-',
      'Status Aktif': item.statusAktif || item.status || 'Aktif',
    }));
  } else if (pillarId === 'tagana') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Nama Personil TAGANA': item.nama || '-',
      'Nomor Induk Anggota (NIA)': item.nomorInduk ? String(item.nomorInduk) : '-',
      'Sertifikat / Kompetensi': item.sertifikat || item.sertifikasi || '-',
      'Keahlian Khusus': item.keahlian || '-',
      'Pelatihan Terakhir': item.pelatihan || '-',
      'Status Aktif': item.statusAktif || item.status || 'Aktif',
    }));
  } else if (pillarId === 'lks') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Nama Lembaga Kesejahteraan Sosial (LKS)': item.namaLks || item.nama || '-',
      'Bidang Pelayanan': item.bidangPelayanan || '-',
      'Nama Ketua / Pengurus': item.ketua || '-',
      'Alamat Lembaga': item.alamat || item.kec || '-',
      'Nomor Tanda Daftar LKS': item.nomorTandaDaftar || item.sertifikasi || '-',
      'Masa Berlaku': formatMasaBerlaku(item.masaBerlaku),
    }));
  } else if (pillarId === 'karangtaruna') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Nama Karang Taruna': item.namaKarangTaruna || item.nama || '-',
      'Desa / Kelurahan': item.kelDesa || '-',
      'Kecamatan': item.kec || '-',
      'Nama Ketua': item.ketua || '-',
      'Nomor SK Legalitas': item.noSk || item.sertifikasi || '-',
      'Tahun Berdiri': item.tahunBerdiri || '-',
    }));
  } else if (pillarId === 'lk3') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Nama Lembaga (LK3)': item.namaLk3 || item.nama || '-',
      'Nama Ketua': item.ketua || '-',
      'Alamat Kantor': item.alamat || item.kec || '-',
      'Nomor Kontak': item.kontak || item.hp ? String(item.kontak || item.hp) : '-',
      'Jenis Layanan Konsultasi': item.jenisLayanan || item.sertifikasi || '-',
      'Status Keaktifan': item.statusAktif || item.status || 'Aktif',
    }));
  } else if (pillarId === 'pensos') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota (Wilayah Kerja)': item.wilayahKerja || item.wilayah || '-',
      'Nama Penyuluh Sosial': item.nama || '-',
      'Instansi Pembina': item.instansi || '-',
      'Jenjang Jabatan': item.jabatan || '-',
      'Nomor Sertifikasi': item.sertifikasi || '-',
      'Status Keaktifan': item.status || 'Aktif',
    }));
  } else if (pillarId === 'tksk') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Kecamatan Tugas': item.kec || '-',
      'Nama Personil TKSK': item.nama || '-',
      'SK Pengangkatan': item.skPengangkatan || item.sertifikasi || '-',
      'Pendidikan Terakhir': item.pendidikan || '-',
      'Nomor Handphone': item.hp ? String(item.hp) : '-',
      'Masa Tugas': item.masaTugas || '-',
    }));
  } else if (pillarId === 'badanusaha') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Nama Badan Usaha / KUBE': item.namaBadanUsaha || item.nama || '-',
      'Jenis Usaha / Sektor': item.jenisUsaha || '-',
      'Bentuk Kontribusi CSR': item.bentukCsr || item.sertifikasi || '-',
      'Bidang Bantuan Sosial': item.bidangBantuan || '-',
      'Nomor Kontak PIC': item.kontak || item.hp ? String(item.kontak || item.hp) : '-',
    }));
  } else if (pillarId === 'slrt_puskesos') {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Nama SLRT_PUSKESOS': item.namaSlrt || item.nama || '-',
      'Desa / Kelurahan': item.kelDesa || '-',
      'Kecamatan': item.kec || '-',
      'Tahun Berdiri': item.tahunBerdiri || '-',
      'Nama Operator Puskesos': item.operator || item.sertifikasi || '-',
      'Status Keaktifan': item.statusAktif || item.status || 'Aktif',
    }));
  } else {
    dataRows = records.map((item, idx) => ({
      'No': idx + 1,
      'Kabupaten / Kota': item.wilayah || '-',
      'Kecamatan': item.kec || '-',
      'Nama Lengkap': item.nama || '-',
      'NIK': item.nik ? String(item.nik) : '-',
      'Sertifikasi / SK': item.sertifikasi || '-',
      'Nomor Handphone': item.hp ? String(item.hp) : '-',
      'Status': item.status || 'Aktif',
    }));
  }

  // Sanitize all cell contents to mitigate CSV / Formula Injection
  const sanitizedRows = dataRows.map((row) => {
    const cleanRow: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      cleanRow[key] = sanitizeCellForExcel(val);
    }
    return cleanRow;
  });

  // Create worksheet from sanitized json data
  const worksheet = XLSX.utils.json_to_sheet(sanitizedRows);

  // Auto-calculate column widths so text is never truncated or squeezed in Excel
  if (dataRows.length > 0) {
    const colKeys = Object.keys(dataRows[0]);
    const colWidths = colKeys.map((key) => {
      let maxLen = key.length;
      for (const row of dataRows) {
        const valStr = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      }
      // Add padding for comfortable cell breathing room
      return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
    });
    // Set No column narrow
    colWidths[0] = { wch: 6 };
    worksheet['!cols'] = colWidths;
  }

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  const sheetName = (pillar.shortName || 'Data').substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Trigger instant native Excel file download
  const cleanShortName = pillar.shortName.replace(/[^a-zA-Z0-9]/g, '_');
  const scopeSuffix = filterWilayah && filterWilayah !== 'Semua' && filterWilayah !== 'Semua Wilayah'
    ? `_${filterWilayah.replace(/[^a-zA-Z0-9]/g, '_')}`
    : (session.role === 'admin' && session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah')
      ? `_${session.wilayah.replace(/[^a-zA-Z0-9]/g, '_')}`
      : '_Se_Jawa_Barat';
  const fileName = `Laporan_Data_${cleanShortName}${scopeSuffix}_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
