import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PSKSDataRecord, UserSession, PillarInfo } from '../types';
import { JABAR_ADMIN_WILAYAH_MASTER } from '../components/slrt/slrtExcelParser';

export interface ExportPillarPDFParams {
  pillarId: string;
  pillar: PillarInfo;
  records: PSKSDataRecord[];
  session: UserSession;
  filterWilayah?: string;
}

const formatMasaBerlaku = (raw?: string | null): string => {
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
};

export const exportPillarToPDF = ({
  pillarId,
  pillar,
  records,
  session,
  filterWilayah,
}: ExportPillarPDFParams): void => {
  // Initialize jsPDF in landscape format (A4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const printedAt = now.toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const pillarDisplayName = pillar.title || pillar.shortName;

  // 1. Header & Kop Surat (Tunggal di Halaman 1)
  doc.setFillColor(4, 62, 46); // #043e2e Deep Emerald
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent bar below header
  doc.setFillColor(212, 175, 55); // #d4af37 Gold
  doc.rect(0, 28, pageWidth, 2.5, 'F');

  // Header Typography
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('PEMERINTAH DAERAH PROVINSI JAWA BARAT', pageWidth / 2, 8, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(212, 175, 55);
  doc.text('DINAS SOSIAL PROVINSI JAWA BARAT', pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(240, 253, 244);
  doc.text('SISTEM INFORMASI POTENSI & SUMBER KESEJAHTERAAN SOSIAL (PSKS JABAR)', pageWidth / 2, 19.5, { align: 'center' });
  doc.text('Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522 | Website: dinsos.jabarprov.go.id', pageWidth / 2, 24.5, { align: 'center' });

  // 2. Document Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(4, 62, 46);
  
  if (pillarId === 'slrt_puskesos') {
    doc.text(
      `DATA REKAPITULASI PEMBENTUKAN PUSAT KESEJAHTERAAN SOSIAL (PUSKESOS) DESA/KELURAHAN`,
      14,
      37
    );
  } else {
    doc.text(
      `LAPORAN RESMI DATA PILAR: ${pillarDisplayName.toUpperCase()} (${pillar.shortName.toUpperCase()})`,
      14,
      37
    );
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const targetRegionScope = filterWilayah && filterWilayah !== 'Semua' && filterWilayah !== 'Semua Wilayah'
    ? filterWilayah
    : (session.role === 'admin' && session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah')
      ? session.wilayah
      : null;

  const scopeInfo = targetRegionScope
    ? `Wilayah / Cakupan: ${targetRegionScope.toUpperCase()}`
    : 'Cakupan: Seluruh Kabupaten/Kota se-Jawa Barat (27 Wilayah)';

  doc.text(scopeInfo, 14, 42);
  doc.text(`Dicetak Oleh: ${session.nama || session.username || 'Administrator'} (${session.role.toUpperCase()})`, 14, 47);
  doc.text(`Waktu Cetak: ${printedAt} WIB`, pageWidth - 14, 42, { align: 'right' });
  doc.text(`Total Rekaman: ${records.length} Data`, pageWidth - 14, 47, { align: 'right' });

  // 3. Table Column Headers & Data Mapping for all 10 Pillars
  let head: string[][] = [];
  let body: (string | number)[][] = [];

  if (pillarId === 'peksos') {
    head = [[
      'No',
      'Kab/Kota',
      'Nama',
      'NIK',
      'L/P',
      'Pendidikan',
      'No/Tgl Sertifikasi',
      'Sertifikasi Kompetensi',
      'Jenjang Jabatan',
      'Tempat Bertugas',
      'Instansi',
      'Status Peksos',
      'Jenjang Gov',
      'No HP',
      'Status',
    ]];

    body = records.map((item, idx) => {
      const isGov =
        item.statusPeksos === 'Pemerintah' ||
        item.lembaga === 'Lembaga Pemerintah' ||
        item.lembaga === 'Pemerintah' ||
        (item.instansiBertugas && !item.instansiBertugas.toLowerCase().includes('lks') && !item.instansiBertugas.toLowerCase().includes('masyarakat'));
      const statusLabel = isGov ? 'Pemerintah' : 'Masyarakat';
      const jenjangGov = isGov ? (item.jenjangJabatanPemerintah || item.jenjangJabatan || 'Ahli Pertama') : '-';
      const certNum = item.noTglSertifikasi || item.noTglSertifikatKompetensi || item.sertifikasi || '-';
      const certKomp = item.sertifikasiKompetensi || 'Peksos Generalis';
      const genderCode = item.jenisKelamin ? (item.jenisKelamin.toLowerCase().startsWith('l') ? 'L' : 'P') : 'L';

      return [
        idx + 1,
        item.wilayah || '-',
        item.nama || '-',
        item.nik || '-',
        genderCode,
        item.pendidikan || 'S1 Kessos',
        certNum,
        certKomp,
        item.jenjangJabatan || 'Peksos Ahli',
        item.tempatBertugas || item.kec || '-',
        item.instansiBertugas || 'Dinas Sosial',
        statusLabel,
        jenjangGov,
        item.hp || '-',
        item.statusKeaktifan || item.status || 'Aktif',
      ];
    });
  } else if (pillarId === 'psm') {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Nama Anggota PSM',
      'Desa/Kelurahan',
      'Kecamatan',
      'Masa Bakti',
      'Nomor SK',
      'Nomor HP',
      'Status',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.nama || '-',
      item.kelDesa || '-',
      item.kec || '-',
      item.masaBakti || '-',
      item.noSk || item.sertifikasi || '-',
      item.hp || '-',
      item.statusAktif || item.status || 'Aktif',
    ]);
  } else if (pillarId === 'tagana') {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Nama Personil TAGANA',
      'Nomor Induk Anggota',
      'Sertifikat / Kompetensi',
      'Keahlian Lapangan',
      'Pelatihan yang Diikuti',
      'Status Aktif',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.nama || '-',
      item.nomorInduk || '-',
      item.sertifikat || item.sertifikasi || '-',
      item.keahlian || '-',
      item.pelatihan || '-',
      item.statusAktif || item.status || 'Aktif',
    ]);
  } else if (pillarId === 'lks') {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Nama Lembaga Kesejahteraan Sosial (LKS)',
      'Bidang Pelayanan',
      'Nama Ketua',
      'Alamat Lembaga',
      'Nomor Tanda Daftar',
      'Masa Berlaku',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.namaLks || item.nama || '-',
      item.bidangPelayanan || '-',
      item.ketua || '-',
      item.alamat || item.kec || '-',
      item.nomorTandaDaftar || item.sertifikasi || '-',
      formatMasaBerlaku(item.masaBerlaku),
    ]);
  } else if (pillarId === 'karangtaruna') {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Nama Karang Taruna',
      'Desa/Kelurahan',
      'Kecamatan',
      'Nama Ketua',
      'Nomor SK Legalitas',
      'Tahun Berdiri',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.namaKarangTaruna || item.nama || '-',
      item.kelDesa || '-',
      item.kec || '-',
      item.ketua || '-',
      item.noSk || item.sertifikasi || '-',
      item.tahunBerdiri || '-',
    ]);
  } else if (pillarId === 'lk3') {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Nama LK3',
      'Nama Ketua',
      'Alamat Kantor',
      'Nomor Kontak',
      'Jenis Layanan Konsultasi',
      'Status Keaktifan',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.namaLk3 || item.nama || '-',
      item.ketua || '-',
      item.alamat || item.kec || '-',
      item.kontak || item.hp || '-',
      item.jenisLayanan || item.sertifikasi || '-',
      item.statusAktif || item.status || 'Aktif',
    ]);
  } else if (pillarId === 'pensos') {
    head = [[
      'No',
      'Kabupaten/Kota / Wilayah Kerja',
      'Nama Penyuluh Sosial',
      'Instansi Pembina',
      'Jenjang Jabatan',
      'Nomor Sertifikasi',
      'Status Keaktifan',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayahKerja || item.wilayah || '-',
      item.nama || '-',
      item.instansi || '-',
      item.jabatan || '-',
      item.sertifikasi || '-',
      item.status || 'Aktif',
    ]);
  } else if (pillarId === 'tksk') {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Kecamatan Tugas',
      'Nama Personil TKSK',
      'SK Pengangkatan',
      'Pendidikan Terakhir',
      'Nomor Handphone',
      'Masa Tugas',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.kec || '-',
      item.nama || '-',
      item.skPengangkatan || item.sertifikasi || '-',
      item.pendidikan || '-',
      item.hp || '-',
      item.masaTugas || '-',
    ]);
  } else if (pillarId === 'badanusaha') {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Nama Perusahaan / Badan Usaha',
      'Jenis Usaha / Sektor',
      'Bentuk Kontribusi CSR',
      'Bidang Bantuan Kessos',
      'Nomor Kontak PIC',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.namaBadanUsaha || item.nama || '-',
      item.jenisUsaha || '-',
      item.bentukCsr || item.sertifikasi || '-',
      item.bidangBantuan || '-',
      item.kontak || item.hp || '-',
    ]);
  } else if (pillarId === 'slrt_puskesos') {
    // 10-Column Multi-Level Header (Format Resmi Rekapitulasi Pembentukan Puskesos Jabar)
    head = [
      [
        {
          content: 'WILAYAH ADMINISTRATIF',
          colSpan: 7,
          styles: { halign: 'center', fillColor: [254, 249, 195], textColor: [113, 63, 18], fontStyle: 'bold' },
        },
        {
          content: 'DESA/KELURAHAN YANG TELAH MEMBENTUK PUSKESOS',
          colSpan: 3,
          styles: { halign: 'center', fillColor: [254, 215, 170], textColor: [124, 45, 18], fontStyle: 'bold' },
        },
      ],
      [
        { content: 'NO.', styles: { halign: 'center', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'KABUPATEN/ KOTA', styles: { halign: 'left', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'JUMLAH KECAMATAN', styles: { halign: 'center', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'JUMLAH KELURAHAN', styles: { halign: 'center', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'JUMLAH DESA', styles: { halign: 'center', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'JUMLAH KELURAHAN DAN DESA', styles: { halign: 'center', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'JUMLAH TERBENTUK', styles: { halign: 'center', fillColor: [20, 59, 125], textColor: [255, 255, 255] } },
        { content: 'KECAMATAN', styles: { halign: 'left', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'KELURAHAN YANG TELAH MEMBENTUK PUSKESOS', styles: { halign: 'left', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
        { content: 'DESA YANG TELAH MEMBENTUK PUSKESOS', styles: { halign: 'left', fillColor: [15, 43, 92], textColor: [255, 255, 255] } },
      ],
      [
        { content: '1', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '2', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '3', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '4', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '5', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '6', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '7 (Otomatis)', styles: { halign: 'center', fillColor: [24, 69, 139], textColor: [254, 240, 138], fontSize: 6.5 } },
        { content: '8', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '9', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
        { content: '10', styles: { halign: 'center', fillColor: [30, 58, 138], textColor: [191, 219, 254], fontSize: 6.5 } },
      ],
    ] as any;

    // Group records by region
    const regionMap: Record<string, PSKSDataRecord[]> = {};
    records.forEach((r) => {
      const reg = r.wilayah?.trim() || filterWilayah || 'Jawa Barat';
      if (!regionMap[reg]) regionMap[reg] = [];
      regionMap[reg].push(r);
    });

    const regionsList = Object.keys(regionMap);
    body = [];

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

          const col1 = isFirstRowOfRegion ? String(regIdx + 1) : '';
          const col2 = isFirstRowOfRegion ? regName.toUpperCase() : '';
          const col3 = isFirstRowOfRegion ? String(jmlKec) : '';
          const col4 = isFirstRowOfRegion ? String(jmlKel) : '';
          const col5 = isFirstRowOfRegion ? String(jmlDesa) : '';
          const col6 = isFirstRowOfRegion ? String(jmlTotal) : '';
          const col7 = isFirstRowOfRegion ? String(jmlTerbentuk) : '';
          const col8 = rIdx === 0 ? `${kecIdx + 1} ${kecName.toUpperCase()}` : '';
          const col9 = kelRec ? `${runningKel} ${kelRec.kelDesa || kelRec.nama}` : '';
          const col10 = desaRec ? `${runningDesa} ${desaRec.kelDesa || desaRec.nama}` : '';

          body.push([col1, col2, col3, col4, col5, col6, col7, col8, col9, col10]);
          isFirstRowOfRegion = false;
        }
      });
    });
  } else {
    head = [[
      'No',
      'Kabupaten/Kota',
      'Kecamatan',
      'Nama Lengkap',
      'NIK',
      'Sertifikasi / SK',
      'Nomor Handphone',
      'Status',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.kec || '-',
      item.nama || '-',
      item.nik || '-',
      item.sertifikasi || '-',
      item.hp || '-',
      item.status || 'Aktif',
    ]);
  }

  // 4. Generate AutoTable with High Quality styling
  autoTable(doc, {
    startY: 51,
    head: head,
    body: body,
    showHead: 'firstPage', // Judul kolom tabel tunggal (hanya muncul 1 kali di halaman pertama saja)
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.2,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [4, 62, 46], // #043e2e Emerald
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: pillarId === 'slrt_puskesos' ? {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 32, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 16 },
      5: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      7: { halign: 'left', cellWidth: 36, fontStyle: 'bold' },
      8: { halign: 'left', cellWidth: 56 },
      9: { halign: 'left', cellWidth: 57 },
    } : pillarId === 'lks' ? {
      0: { halign: 'center', cellWidth: 8 }, // No
      1: { halign: 'left', cellWidth: 28, fontStyle: 'bold' }, // Kabupaten/Kota
      2: { halign: 'left', cellWidth: 44, fontStyle: 'bold' }, // Nama LKS
      3: { halign: 'left', cellWidth: 30 }, // Bidang Pelayanan
      4: { halign: 'left', cellWidth: 26 }, // Ketua
      5: { halign: 'left', cellWidth: 38 }, // Alamat
      6: { halign: 'left', cellWidth: 44, cellPadding: 1.5 }, // Nomor Tanda Daftar (auto multiline)
      7: { halign: 'center', cellWidth: 22 }, // Masa Berlaku
    } : {
      0: { halign: 'center', cellWidth: 8 },
    },
    margin: { top: 16, bottom: 20, left: 12, right: 12 },
    didDrawPage: (data) => {
      // Footer on every page
      const totalPagesExp = '{total_pages_count_string}';
      const currentPage = (doc as any).internal.getNumberOfPages();

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      // Footer divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(12, pageHeight - 12, pageWidth - 12, pageHeight - 12);

      doc.text(
        'Dokumen resmi digenerate secara otomatis melalui PSKS JABAR Dinas Sosial Provinsi Jawa Barat.',
        12,
        pageHeight - 7
      );

      const pageStr = `Halaman ${currentPage}`;
      doc.text(pageStr, pageWidth - 12, pageHeight - 7, { align: 'right' });
    },
  });

  // 5. Trigger download of the PDF file
  const scopeSuffix = targetRegionScope
    ? `_${targetRegionScope.replace(/[^a-zA-Z0-9]/g, '_')}`
    : '_Se_Jawa_Barat';
  const fileName = `Laporan_Data_${pillar.shortName.replace(/[^a-zA-Z0-9]/g, '_')}${scopeSuffix}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
  doc.save(fileName);
};
