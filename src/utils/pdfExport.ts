import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PSKSDataRecord, UserSession, PillarInfo } from '../types';

export interface ExportPillarPDFParams {
  pillarId: string;
  pillar: PillarInfo;
  records: PSKSDataRecord[];
  session: UserSession;
  filterWilayah?: string;
}

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

  // 1. Header & Kop Surat
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
  doc.setFontSize(12);
  doc.setTextColor(4, 62, 46);
  doc.text(
    `LAPORAN RESMI DATA PILAR: ${pillarDisplayName.toUpperCase()} (${pillar.shortName.toUpperCase()})`,
    14,
    37
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const scopeInfo = filterWilayah && filterWilayah !== 'Semua'
    ? `Wilayah / Cakupan: ${filterWilayah}`
    : session.role === 'admin'
      ? `Wilayah Tugas: ${session.wilayah}`
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
      item.masaBerlaku || '-',
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
    head = [[
      'No',
      'Kabupaten/Kota',
      'Nama SLRT / Puskesos',
      'Desa/Kelurahan',
      'Kecamatan',
      'Tahun Berdiri',
      'Nama Operator Puskesos',
      'Status Keaktifan',
    ]];

    body = records.map((item, idx) => [
      idx + 1,
      item.wilayah || '-',
      item.namaSlrt || item.nama || '-',
      item.kelDesa || '-',
      item.kec || '-',
      item.tahunBerdiri || '-',
      item.operator || item.sertifikasi || '-',
      item.statusAktif || item.status || 'Aktif',
    ]);
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
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
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
      fontSize: 7.8,
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
    },
    margin: { top: 32, bottom: 20, left: 12, right: 12 },
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
  const fileName = `Laporan_Data_${pillar.shortName.replace(/[^a-zA-Z0-9]/g, '_')}_Jabar_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
  doc.save(fileName);
};
