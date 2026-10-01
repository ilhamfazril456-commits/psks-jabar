import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Building2,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { PSKSDataRecord, UserSession } from '../../types';
import { sortRecordsByJabarRegion } from '../../utils/regionSort';
import { maskNIK, maskPhoneNumber, maskEmail } from '../../utils/privacyMask';

interface PillarTableProps {
  pillarId: string;
  pillar: any;
  session: UserSession;
  displayRecords: PSKSDataRecord[];
  searchTerm?: string;
  isPeksosGov: (record: PSKSDataRecord) => boolean;
  onDeleteClick: (record: PSKSDataRecord) => void;
  onEditClick?: (record: PSKSDataRecord) => void;
  selectedRecordIds?: string[];
  onToggleSelectRecord?: (recordId: string) => void;
  onToggleSelectAll?: (records: PSKSDataRecord[]) => void;
  showCheckbox?: boolean;
}

export const PillarTable: React.FC<PillarTableProps> = React.memo(({
  pillarId,
  pillar,
  session,
  displayRecords,
  searchTerm,
  isPeksosGov,
  onDeleteClick,
  onEditClick,
  selectedRecordIds = [],
  onToggleSelectRecord,
  onToggleSelectAll,
  showCheckbox = false,
}) => {
  const isSuperOrDev =
    session.role === 'superadmin' ||
    session.role === 'developer' ||
    Boolean(session.isDeveloper);

  const isStaffOrAdmin = session.role !== 'user';

  // Pastikan array selalu valid (sudah disortir secara presisi di komponen induk)
  const recordsToRender = Array.isArray(displayRecords) ? displayRecords : [];

  // Paginasi: Tetap 100 baris per halaman untuk performa super cepat tanpa lag
  const PAGE_SIZE = 100;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // KUNCI HALAMAN: Hanya reset ke halaman 1 jika kata kunci pencarian berubah
  // Mencegah mental kembali ke halaman 1 saat sinkronisasi realtime server berjalan di latar belakang
  const prevSearchRef = React.useRef(searchTerm || '');
  useEffect(() => {
    if (prevSearchRef.current !== (searchTerm || '')) {
      prevSearchRef.current = searchTerm || '';
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const totalRecords = recordsToRender.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Jika total halaman berkurang di bawah halaman aktif, sesuaikan secara halus tanpa melempar ke halaman 1
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRecords = recordsToRender.slice(startIndex, startIndex + PAGE_SIZE);

  const renderCheckboxTh = () => {
    if (!showCheckbox || !isStaffOrAdmin || !onToggleSelectAll) return null;
    const isAllSelected = recordsToRender.length > 0 && selectedRecordIds.length === recordsToRender.length;
    const isSomeSelected = selectedRecordIds.length > 0 && !isAllSelected;
    return (
      <th className="py-3.5 px-3 text-center w-10 whitespace-nowrap border-r border-blue-800/70 bg-[#0c234b]">
        <input
          type="checkbox"
          ref={(el) => {
            if (el) el.indeterminate = isSomeSelected;
          }}
          checked={isAllSelected}
          onChange={() => onToggleSelectAll(recordsToRender)}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
          title="Centang / Pilih Semua Data di Tabel Ini"
        />
      </th>
    );
  };

  const renderCheckboxTd = (record: PSKSDataRecord) => {
    if (!showCheckbox || !isStaffOrAdmin || !onToggleSelectRecord) return null;
    const isSelected = selectedRecordIds.includes(record.id);
    return (
      <td className="py-3 px-3 text-center border-r border-slate-100 whitespace-nowrap bg-inherit">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelectRecord(record.id)}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
          title={`Pilih ${record.nama || 'data ini'}`}
        />
      </td>
    );
  };

  const getColSpan = () => {
    const hasAction = session.role !== 'user';
    const hasCheckbox = Boolean(showCheckbox && isStaffOrAdmin && onToggleSelectAll);
    const cb = hasCheckbox ? 1 : 0;
    switch (pillarId) {
      case 'peksos':
        return 17 + (hasAction ? 1 : 0) + cb;
      case 'psm':
        return 9 + (hasAction ? 1 : 0) + cb;
      case 'tagana':
        return 8 + (hasAction ? 1 : 0) + cb;
      case 'lks':
        return 8 + (hasAction ? 1 : 0) + cb;
      case 'karangtaruna':
        return 8 + (hasAction ? 1 : 0) + cb;
      case 'lk3':
        return 8 + (hasAction ? 1 : 0) + cb;
      case 'pensos':
        return 6 + (hasAction ? 1 : 0) + cb;
      case 'tksk':
        return 8 + (hasAction ? 1 : 0) + cb;
      case 'badanusaha':
        return 7 + (hasAction ? 1 : 0) + cb;
      case 'slrt_puskesos':
        return 8 + (hasAction ? 1 : 0) + cb;
      default:
        return 8 + (hasAction ? 1 : 0) + cb;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#0f2b5c] text-white border-b-2 border-[#d4af37]">
            {pillarId === 'peksos' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">NIK</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Jenis Kelamin</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Pendidikan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor dan tanggal sertifikasi</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Sertifikasi Kompetensi</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Jenjang Jabatan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Tempat Bertugas</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Instansi/tempat bertugas</th>
                <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-r border-blue-800/70">Status Peksos (Pemerintah/Masyarakat)</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Jenjang Jabatan (jika Pemerintah)</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor HP</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Email</th>
                <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-r border-blue-800/70">Status keaktifan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor kontak</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'psm' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Desa/Kelurahan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kecamatan</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Masa Bakti</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor SK</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor HP</th>
                <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-r border-blue-800/70">Status aktif</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'tagana' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor Induk</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Sertifikat</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Keahlian</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Pelatihan</th>
                <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-r border-blue-800/70">Status Aktif</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'lks' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama LKS</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Bidang pelayanan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Ketua</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Alamat</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor Tanda Daftar</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Masa Berlaku</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'karangtaruna' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama Karang Taruna</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Desa/Kelurahan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kecamatan</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Ketua</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor SK</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Tahun Berdiri</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'lk3' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama LK3</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Ketua</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Alamat</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kontak</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Jenis layanan</th>
                <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-r border-blue-800/70">Status aktif</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'pensos' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Instansi</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Jabatan</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Wilayah kerja</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Sertifikasi</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'tksk' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kecamatan</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">SK Pengangkatan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Pendidikan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nomor HP</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Masa tugas</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'badanusaha' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama Badan Usaha</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Jenis usaha</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Bentuk CSR</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Bidang bantuan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kontak</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : pillarId === 'slrt_puskesos' ? (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-3 font-bold text-center w-10 whitespace-nowrap border-r border-blue-800/70">No</th>
                {isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70 bg-[#143b7d] text-amber-300">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Nama SLRT</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Desa/Kelurahan</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kecamatan</th>
                {!isSuperOrDev && (
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Kabupaten/Kota</th>
                )}
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Tahun Berdiri</th>
                <th className="py-3.5 px-3 font-bold whitespace-nowrap border-r border-blue-800/70">Operator Puskesos</th>
                <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap border-r border-blue-800/70">Status Aktif</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-3 font-bold text-center whitespace-nowrap">Aksi</th>
                )}
              </tr>
            ) : (
              <tr>
                {renderCheckboxTh()}
                <th className="py-3.5 px-4 font-bold text-center w-12 border-r border-blue-800/70">No</th>
                <th className="py-3.5 px-4 font-bold border-r border-blue-800/70">Kabupaten/Kota</th>
                <th className="py-3.5 px-4 font-bold border-r border-blue-800/70">Nama Lengkap</th>
                <th className="py-3.5 px-4 font-bold border-r border-blue-800/70">Kecamatan</th>
                <th className="py-3.5 px-4 font-bold border-r border-blue-800/70">Sertifikasi / SK</th>
                <th className="py-3.5 px-4 font-bold border-r border-blue-800/70">Handphone</th>
                <th className="py-3.5 px-4 font-bold text-center border-r border-blue-800/70">Status</th>
                {session.role !== 'user' && (
                  <th className="py-3.5 px-4 font-bold text-center">Aksi</th>
                )}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recordsToRender.length === 0 ? (
              <tr>
                <td
                  colSpan={getColSpan()}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record, index) => (
                <tr
                  key={record.id}
                  className={`transition-colors ${(selectedRecordIds || []).includes(record.id) ? 'bg-amber-50/80 hover:bg-amber-100/70' : 'hover:bg-slate-50'}`}
                >
                  {renderCheckboxTd(record)}
                  <td className="py-3 px-3 text-center font-bold text-slate-500 whitespace-nowrap border-r border-slate-100">
                    {startIndex + index + 1}
                  </td>

                  {pillarId === 'peksos' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.nama}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {isStaffOrAdmin ? record.nik : maskNIK(record.nik)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.jenisKelamin || 'Laki-laki'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.pendidikan || 'D4/S1 Kesejahteraan Sosial'}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">{record.noTglSertifikasi || record.noTglSertifikatKompetensi || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 whitespace-nowrap border-r border-slate-100">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
                          {record.sertifikasiKompetensi || 'Pekerja Sosial Generalis'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800 font-bold whitespace-nowrap border-r border-slate-100">{record.jenjangJabatan || 'Peksos Ahli Pertama'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.tempatBertugas || record.kec || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.instansiBertugas || 'Dinas Sosial'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-100">
                        {isPeksosGov(record) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-emerald-50 text-emerald-800 border-2 border-emerald-300/90 shadow-2xs">
                            <Landmark className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Pemerintah</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-amber-50 text-amber-800 border-2 border-amber-300/90 shadow-2xs">
                            <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Masyarakat</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-100">
                        {isPeksosGov(record) ? (
                          <span className="font-bold text-emerald-900 bg-emerald-100/70 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                            {record.jenjangJabatanPemerintah || record.jenjangJabatan || 'Ahli Pertama'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {isStaffOrAdmin ? record.hp : maskPhoneNumber(record.hp)}
                      </td>
                      <td className="py-3 px-3 text-xs text-blue-700 font-medium whitespace-nowrap border-r border-slate-100">
                        {record.email ? (
                          isStaffOrAdmin ? (
                            <a href={`mailto:${record.email}`} className="hover:underline text-blue-700">
                              {record.email}
                            </a>
                          ) : (
                            <span>{maskEmail(record.email)}</span>
                          )
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-100">
                        <span className={`font-black text-[10px] px-2.5 py-1 rounded-full border shadow-2xs ${
                          (record.statusKeaktifan || record.status || 'Aktif') === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : (record.statusKeaktifan || record.status) === 'Siaga'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {record.statusKeaktifan || record.status || 'Aktif'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {isStaffOrAdmin ? (record.nomorKontak || record.hp || '-') : maskPhoneNumber(record.nomorKontak || record.hp)}
                      </td>
                    </>
                  ) : pillarId === 'psm' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.nama}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.kelDesa || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.kec || '-'}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.masaBakti || '-'}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">{record.noSk || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {isStaffOrAdmin ? (record.hp || '-') : maskPhoneNumber(record.hp)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-100">
                        <span className={`font-black text-[10px] px-2.5 py-1 rounded-full border shadow-2xs ${
                          (record.statusAktif || record.statusKeaktifan || record.status || 'Aktif') === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {record.statusAktif || record.statusKeaktifan || record.status || 'Aktif'}
                        </span>
                      </td>
                    </>
                  ) : pillarId === 'tagana' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.nama}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">{record.nomorInduk || '-'}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">{record.sertifikat || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.keahlian || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.pelatihan || '-'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-100">
                        <span className={`font-black text-[10px] px-2.5 py-1 rounded-full border shadow-2xs ${
                          (record.statusAktif || record.status || 'Aktif') === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {record.statusAktif || record.status || 'Aktif'}
                        </span>
                      </td>
                    </>
                  ) : pillarId === 'lks' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.namaLks || record.nama}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.bidangPelayanan || '-'}</td>
                      <td className="py-3 px-3 text-slate-800 font-bold whitespace-nowrap border-r border-slate-100">{record.ketua || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 text-xs max-w-[200px] truncate border-r border-slate-100" title={record.alamat || record.kec || '-'}>{record.alamat || record.kec || '-'}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {record.nomorTandaDaftar || (record.sertifikasi && record.sertifikasi !== 'CERT-2026' ? record.sertifikasi : '-')}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.masaBerlaku || '-'}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                    </>
                  ) : pillarId === 'karangtaruna' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.namaKarangTaruna || record.nama}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.kelDesa || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.kec || '-'}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 text-slate-800 font-bold whitespace-nowrap border-r border-slate-100">{record.ketua || '-'}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">{record.noSk || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-r border-slate-100">{record.tahunBerdiri || '-'}</td>
                    </>
                  ) : pillarId === 'lk3' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.namaLk3 || record.nama}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 text-slate-800 font-bold whitespace-nowrap border-r border-slate-100">{record.ketua || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 text-xs max-w-[200px] truncate border-r border-slate-100" title={record.alamat || record.kec || '-'}>{record.alamat || record.kec || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {isStaffOrAdmin ? (record.kontak || record.hp || '-') : maskPhoneNumber(record.kontak || record.hp)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.jenisLayanan || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-100">
                        <span className={`font-black text-[10px] px-2.5 py-1 rounded-full border shadow-2xs ${
                          (record.statusAktif || record.status || 'Aktif') === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {record.statusAktif || record.status || 'Aktif'}
                        </span>
                      </td>
                    </>
                  ) : pillarId === 'pensos' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayahKerja || record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.nama}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.instansi || '-'}</td>
                      <td className="py-3 px-3 text-slate-800 font-bold whitespace-nowrap border-r border-slate-100">{record.jabatan || '-'}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayahKerja || record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">{record.sertifikasi || '-'}</td>
                    </>
                  ) : pillarId === 'tksk' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.nama}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.kec || '-'}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 font-mono text-xs text-slate-700 whitespace-nowrap border-r border-slate-100">{record.skPengangkatan || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.pendidikan || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {isStaffOrAdmin ? (record.hp || '-') : maskPhoneNumber(record.hp)}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.masaTugas || '-'}</td>
                    </>
                  ) : pillarId === 'badanusaha' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.namaBadanUsaha || record.nama}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.jenisUsaha || '-'}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 text-slate-700 text-xs max-w-[200px] truncate border-r border-slate-100" title={record.bentukCsr || record.sertifikasi || '-'}>{record.bentukCsr || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.bidangBantuan || '-'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-100">
                        {isStaffOrAdmin ? (record.kontak || record.hp || '-') : maskPhoneNumber(record.kontak || record.hp)}
                      </td>
                    </>
                  ) : pillarId === 'slrt_puskesos' ? (
                    <>
                      {isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">
                          {record.wilayah}
                        </td>
                      )}
                      <td className="py-3 px-3 font-extrabold text-[#0f2b5c] whitespace-nowrap border-r border-slate-100">{record.namaSlrt || record.nama}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.kelDesa || '-'}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap border-r border-slate-100">{record.kec || '-'}</td>
                      {!isSuperOrDev && (
                        <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100">{record.wilayah}</td>
                      )}
                      <td className="py-3 px-3 font-bold text-slate-700 whitespace-nowrap border-r border-slate-100">{record.tahunBerdiri || '-'}</td>
                      <td className="py-3 px-3 text-slate-800 font-bold whitespace-nowrap border-r border-slate-100">{record.operator || record.sertifikasi || '-'}</td>
                      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-slate-100">
                        <span className={`font-black text-[10px] px-2.5 py-1 rounded-full border shadow-2xs ${
                          (record.statusAktif || record.status || 'Aktif') === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {record.statusAktif || record.status || 'Aktif'}
                        </span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-3 font-bold text-slate-800 whitespace-nowrap border-r border-slate-100 bg-amber-50/20">{record.wilayah}</td>
                      <td className="py-3 px-4 font-bold text-[#0f2b5c] border-r border-slate-100">{record.nama}</td>
                      <td className="py-3 px-4 text-slate-600 border-r border-slate-100">{record.kec}</td>
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-100">{record.sertifikasi}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium border-r border-slate-100">
                        {isStaffOrAdmin ? record.hp : maskPhoneNumber(record.hp)}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-slate-100">
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2.5 py-1 rounded-full">
                          {record.status || 'Aktif'}
                        </span>
                      </td>
                    </>
                  )}

                  {session.role !== 'user' && (
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {isSuperOrDev && onEditClick && (
                          <button
                            type="button"
                            onClick={() => onEditClick(record)}
                            className="px-2.5 py-1.5 text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-lg border border-blue-200 transition-all inline-flex items-center gap-1 font-bold text-xs cursor-pointer shadow-xs active:scale-95"
                            title={`Edit Data ${record.nama || record.namaLks || record.namaKarangTaruna || record.namaLk3 || record.namaBadanUsaha || record.namaSlrt || 'Anggota'}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteClick(record)}
                          className="px-2.5 py-1.5 text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-lg border border-red-200 transition-all inline-flex items-center gap-1 font-bold text-xs cursor-pointer shadow-xs active:scale-95"
                          title={`Hapus Data ${record.nama || record.namaLks || record.namaKarangTaruna || record.namaLk3 || record.namaBadanUsaha || record.namaSlrt || 'Anggota'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar (Per 100 Data) */}
      {totalRecords > 0 && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-semibold flex items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-900 font-bold">{startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, totalRecords)}</strong> dari{' '}
              <strong className="text-slate-900 font-bold">{totalRecords.toLocaleString('id-ID')}</strong> data
            </span>
            {totalPages > 1 && (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                Halaman {safeCurrentPage} dari {totalPages}
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Halaman Pertama (1 - 100)"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Page buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2;
                  })
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    typeof p === 'string' ? (
                      <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-8 h-8 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                          p === safeCurrentPage
                            ? 'bg-[#0f2b5c] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        title={`Pindah ke baris ${(p - 1) * PAGE_SIZE + 1} - ${Math.min(p * PAGE_SIZE, totalRecords)}`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-colors"
                title="Halaman Berikutnya"
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={`Halaman Terakhir (${totalPages})`}
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
