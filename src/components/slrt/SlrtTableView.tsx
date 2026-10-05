import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { PSKSDataRecord, UserSession } from '../../types';
import { isSameWilayah } from '../../utils/submissionStatus';
import { exportPillarToExcel } from '../../utils/excelExport';
import { exportPillarToPDF } from '../../utils/pdfExport';
import { PILLARS_CONFIG } from '../../data/initialData';
import { JABAR_ADMIN_WILAYAH_MASTER } from './slrtExcelParser';

interface SlrtTableViewProps {
  activeRegion: string;
  records: PSKSDataRecord[];
  session: UserSession;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onDeleteRecord?: (id: string) => Promise<any> | void;
}

interface SlrtDisplayRow {
  globalRowIndex: number;
  isFirstRowOfRegion: boolean;
  isFirstRowOfKec: boolean;
  kecamatanName: string;
  kecIdx: number;
  kelRec?: PSKSDataRecord;
  kelNumber?: number;
  desaRec?: PSKSDataRecord;
  desaNumber?: number;
}

export const SlrtTableView: React.FC<SlrtTableViewProps> = ({
  activeRegion,
  records,
  session,
  onOpenAddModal,
  onOpenImportModal,
  onDeleteRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState<'all' | 'Desa' | 'Kelurahan'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const ROWS_PER_PAGE = 100;
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const canEdit =
    session.role === 'superadmin' ||
    session.role === 'developer' ||
    session.isDeveloper ||
    (session.role === 'admin' && isSameWilayah(session.wilayah, activeRegion));

  // Reset page when filter or region changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedJenisFilter, activeRegion]);

  // 1. Filter records specifically for activeRegion
  const regionRecords = useMemo(() => {
    return records.filter((r) => isSameWilayah(r.wilayah, activeRegion));
  }, [records, activeRegion]);

  // 2. Compute administrative indicator values and total puskesos terbentuk
  const adminSummary = useMemo(() => {
    const uniqueKec = new Set<string>();
    let kelCount = 0;
    let desaCount = 0;

    regionRecords.forEach((r) => {
      if (r.kec && r.kec.trim()) {
        uniqueKec.add(r.kec.trim());
      }
      const isKel =
        r.jenisWilayah === 'Kelurahan' ||
        (r.nama && r.nama.toLowerCase().includes('kel.')) ||
        (r.kelDesa && r.kelDesa.toLowerCase().includes('kelurahan'));

      if (isKel) {
        kelCount += 1;
      } else {
        desaCount += 1;
      }
    });

    const master = JABAR_ADMIN_WILAYAH_MASTER[activeRegion];

    return {
      jmlKecamatan: master?.jmlKecamatan || (uniqueKec.size > 0 ? uniqueKec.size : 0),
      jmlKelurahan: master?.jmlKelurahan ?? 0,
      jmlDesa: master?.jmlDesa ?? 0,
      jmlTotal: master?.jmlTotal ?? (master?.jmlKelurahan || 0) + (master?.jmlDesa || 0),
      puskesosKelurahan: kelCount,
      puskesosDesa: desaCount,
      jmlTerbentuk: kelCount + desaCount, // 100% Otomatis Terhitung
    };
  }, [regionRecords, activeRegion]);

  // 3. Search and filter
  const filteredRecords = useMemo(() => {
    return regionRecords.filter((r) => {
      if (selectedJenisFilter === 'Desa' && r.jenisWilayah === 'Kelurahan') return false;
      if (selectedJenisFilter === 'Kelurahan' && r.jenisWilayah !== 'Kelurahan') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchKec = (r.kec || '').toLowerCase().includes(q);
      const matchDesa = (r.kelDesa || '').toLowerCase().includes(q);
      const matchNama = (r.nama || '').toLowerCase().includes(q);
      return matchKec || matchDesa || matchNama;
    });
  }, [regionRecords, searchQuery, selectedJenisFilter]);

  // 4. Hierarchical Structure Generation (Grouping by Kecamatan)
  const hierarchicalData = useMemo(() => {
    const kecMap: Record<
      string,
      {
        kelurahans: PSKSDataRecord[];
        desas: PSKSDataRecord[];
      }
    > = {};

    filteredRecords.forEach((r) => {
      const kecName = r.kec?.trim() || 'Pusat Wilayah';
      if (!kecMap[kecName]) {
        kecMap[kecName] = { kelurahans: [], desas: [] };
      }
      const isKel =
        r.jenisWilayah === 'Kelurahan' ||
        (r.nama && r.nama.toLowerCase().includes('kel.')) ||
        (r.kelDesa && r.kelDesa.toLowerCase().includes('kelurahan'));

      if (isKel) {
        kecMap[kecName].kelurahans.push(r);
      } else {
        kecMap[kecName].desas.push(r);
      }
    });

    return Object.entries(kecMap).map(([kecName, data]) => ({
      kecamatan: kecName,
      kelurahans: data.kelurahans,
      desas: data.desas,
      rowCount: Math.max(data.kelurahans.length, data.desas.length, 1),
    }));
  }, [filteredRecords]);

  // 5. Flatten to discrete table rows for strict 100-row pagination
  const allDisplayRows: SlrtDisplayRow[] = useMemo(() => {
    const rowsList: SlrtDisplayRow[] = [];
    let globalIndex = 0;
    let runningKel = 0;
    let runningDesa = 0;

    hierarchicalData.forEach((group, kecIdx) => {
      for (let rIdx = 0; rIdx < group.rowCount; rIdx++) {
        globalIndex += 1;
        const kelRec = group.kelurahans[rIdx];
        const desaRec = group.desas[rIdx];

        if (kelRec) runningKel += 1;
        if (desaRec) runningDesa += 1;

        rowsList.push({
          globalRowIndex: globalIndex,
          isFirstRowOfRegion: globalIndex === 1,
          isFirstRowOfKec: rIdx === 0,
          kecamatanName: group.kecamatan,
          kecIdx,
          kelRec,
          kelNumber: kelRec ? runningKel : undefined,
          desaRec,
          desaNumber: desaRec ? runningDesa : undefined,
        });
      }
    });

    return rowsList;
  }, [hierarchicalData]);

  // 6. Pagination Slice (100 Rows per page)
  const totalRows = allDisplayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Jika total halaman berkurang di bawah halaman aktif, sesuaikan secara halus
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const paginatedRows = useMemo(() => {
    return allDisplayRows.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allDisplayRows, startIndex, ROWS_PER_PAGE]);

  const scrollToTableTop = () => {
    if (tableContainerRef.current) {
      try {
        tableContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        // fallback jika browser tidak mendukung block option
      }
      const rect = tableContainerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      const targetY = rect.top + scrollTop - 75;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }
  };

  const handlePageChange = (newPage: number) => {
    const validPage = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(validPage);
    setTimeout(() => {
      scrollToTableTop();
    }, 50);
  };

  // Handle Export
  const handleExportExcel = () => {
    exportPillarToExcel({
      pillarId: 'slrt_puskesos',
      pillar: PILLARS_CONFIG['slrt_puskesos'],
      records: regionRecords,
      session,
      filterWilayah: activeRegion,
    });
  };

  const handleExportPDF = () => {
    exportPillarToPDF({
      pillarId: 'slrt_puskesos',
      pillar: PILLARS_CONFIG['slrt_puskesos'],
      records: regionRecords,
      session,
      filterWilayah: activeRegion,
    });
  };

  const handleDelete = async (recordId: string, name: string) => {
    if (!onDeleteRecord) return;
    if (confirm(`Apakah Anda yakin ingin menghapus data Puskesos "${name}"?`)) {
      setDeletingId(recordId);
      try {
        await onDeleteRecord(recordId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Badges Card (5 Indikator Otomatis di Bagian Atas) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
            Jml Kecamatan
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
            {adminSummary.jmlKecamatan}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Wilayah Administratif</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
            Jml Kelurahan
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
            {adminSummary.jmlKelurahan}
          </span>
          <span className="text-[10px] text-purple-700 font-bold">
            {adminSummary.puskesosKelurahan} Membentuk Puskesos
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Jml Desa
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
            {adminSummary.jmlDesa}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">
            {adminSummary.puskesosDesa} Membentuk Puskesos
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            Total Kel & Desa
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
            {adminSummary.jmlTotal}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Wilayah Administratif</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-gradient-to-br from-[#0f2b5c] to-blue-900 text-white shadow-xs">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
            Jumlah Terbentuk
          </span>
          <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">
            {adminSummary.jmlTerbentuk}
          </span>
          <span className="text-[10px] text-blue-200 font-medium">100% Otomatis Terhitung</span>
        </div>
      </div>

      {/* 2. Action & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Kecamatan, Desa, atau Kelurahan..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSelectedJenisFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                selectedJenisFilter === 'all'
                  ? 'bg-white text-[#0f2b5c] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({regionRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedJenisFilter('Desa')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                selectedJenisFilter === 'Desa'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Desa ({adminSummary.jmlDesa})
            </button>
            <button
              type="button"
              onClick={() => setSelectedJenisFilter('Kelurahan')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
                selectedJenisFilter === 'Kelurahan'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelurahan ({adminSummary.jmlKelurahan})
            </button>
          </div>
        </div>

        {/* Buttons: Add, Import, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Tambah Puskesos</span>
              </button>

              <button
                type="button"
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                title="Import khusus untuk wilayah ini"
              >
                <UploadCloud className="w-4 h-4 text-emerald-200" />
                <span>Import Excel Khusus Wilayah Ini</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* 2.5 Quick Navigation Bar at Top (Muncul jika data lebih dari 100 baris / totalPages > 1) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-blue-50/80 border border-blue-200 rounded-2xl px-4 py-2.5 text-xs shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-[#0f2b5c] bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
              Halaman {safeCurrentPage} dari {totalPages}
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-600 font-medium">
              Menampilkan baris <strong className="text-[#0f2b5c] font-bold">{startIndex + 1}</strong> s.d.{' '}
              <strong className="text-[#0f2b5c] font-bold">{Math.min(startIndex + ROWS_PER_PAGE, totalRows)}</strong> dari total{' '}
              <strong className="text-[#0f2b5c] font-bold">{totalRows}</strong> baris data Puskesos {activeRegion}
            </span>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="Ke Halaman Pertama (Baris 1 - 100)"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage <= 1}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs text-xs"
              title="Ke Baris Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sebelumnya</span>
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-[#0f2b5c] text-white font-extrabold text-xs shadow-2xs">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs text-xs"
              title={`Ke Baris ${safeCurrentPage * ROWS_PER_PAGE + 1} / Selanjutnya`}
            >
              <span className="hidden md:inline">Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              title={`Ke Halaman Terakhir (${totalPages})`}
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. The Official 10-Column Government Table Format (With JUMLAH TERBENTUK moved into Wilayah Administratif after No. 6) */}
      <div ref={tableContainerRef} className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
        {/* Title Bar inside table */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#d4af37]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#f1c40f]">
              Format Resmi Rekapitulasi Pembentukan Puskesos
            </span>
            <h4 className="text-sm sm:text-base font-black tracking-tight">
              DATA PUSAT KESEJAHTERAAN SOSIAL DESA/KELURAHAN WILAYAH {activeRegion.toUpperCase()}
            </h4>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-blue-200 block">
              Dinas Sosial Provinsi Jawa Barat
            </span>
            <span className="text-[10px] text-amber-300 font-bold block">
              {totalRows > 0 ? `Total ${totalRows} Baris Terdata` : 'Belum Ada Data'}
            </span>
          </div>
        </div>

        {/* Responsive Table Scroll Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            {/* Table Headers: Group 1 (Wilayah Administratif: 7 Kolom) & Group 2 (Desa/Kelurahan: 3 Kolom) */}
            <thead>
              {/* Row 1: Group Headers */}
              <tr>
                <th
                  colSpan={7}
                  className="bg-[#fef9c3] text-[#713f12] border-r-2 border-b-2 border-amber-300 font-black text-center py-2.5 px-3 uppercase tracking-wider text-xs sm:text-sm"
                >
                  WILAYAH ADMINISTRATIF
                </th>
                <th
                  colSpan={3}
                  className="bg-[#fed7aa] text-[#7c2d12] border-b-2 border-orange-300 font-black text-center py-2.5 px-3 uppercase tracking-wider text-xs sm:text-sm"
                >
                  DESA/KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
                </th>
              </tr>

              {/* Row 2: Detailed Column Titles */}
              <tr className="bg-[#0f2b5c] text-white text-[11px] sm:text-xs font-black uppercase tracking-tight">
                <th className="py-3 px-3 text-center border-r border-blue-800 w-12">NO.</th>
                <th className="py-3 px-3 border-r border-blue-800 min-w-[140px]">KABUPATEN/ KOTA</th>
                <th className="py-3 px-2.5 text-center border-r border-blue-800 min-w-[85px]">JUMLAH KECAMATAN</th>
                <th className="py-3 px-2.5 text-center border-r border-blue-800 min-w-[85px]">JUMLAH KELURAHAN</th>
                <th className="py-3 px-2.5 text-center border-r border-blue-800 min-w-[85px]">JUMLAH DESA</th>
                <th className="py-3 px-2.5 text-center border-r border-blue-800 min-w-[105px]">
                  JUMLAH KELURAHAN DAN DESA
                </th>
                <th className="py-3 px-2.5 text-center border-r-2 border-blue-700 min-w-[115px] bg-[#143b7d]">
                  JUMLAH TERBENTUK
                </th>
                <th className="py-3 px-3 border-r border-blue-800 min-w-[130px]">KECAMATAN</th>
                <th className="py-3 px-3 border-r border-blue-800 min-w-[170px]">
                  KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
                </th>
                <th className="py-3 px-3 min-w-[170px]">
                  DESA YANG TELAH MEMBENTUK PUSKESOS
                </th>
              </tr>

              {/* Row 3: Standard Sub-number row (1 to 10) */}
              <tr className="bg-[#1e3a8a] text-blue-200 text-[10px] font-bold text-center border-b-2 border-slate-300">
                <th className="py-1 px-1 border-r border-blue-800/60">1</th>
                <th className="py-1 px-1 border-r border-blue-800/60">2</th>
                <th className="py-1 px-1 border-r border-blue-800/60">3</th>
                <th className="py-1 px-1 border-r border-blue-800/60">4</th>
                <th className="py-1 px-1 border-r border-blue-800/60">5</th>
                <th className="py-1 px-1 border-r border-blue-800/60">6</th>
                <th className="py-1 px-1 border-r-2 border-blue-700 bg-[#18458b]">7 (Otomatis)</th>
                <th className="py-1 px-1 border-r border-blue-800/60">8</th>
                <th className="py-1 px-1 border-r border-blue-800/60">9</th>
                <th className="py-1 px-1">10</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 bg-white">
              {totalRows === 0 ? (
                /* Empty State */
                <tr>
                  <td className="py-4 px-3 text-center font-bold text-slate-700 border-r border-slate-200">1</td>
                  <td className="py-4 px-3 font-bold text-[#0f2b5c] border-r border-slate-200">
                    {activeRegion.toUpperCase()}
                  </td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r border-slate-200">0</td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r border-slate-200">0</td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r border-slate-200">0</td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r border-slate-200">0</td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r-2 border-slate-300">0</td>
                  <td colSpan={3} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0f2b5c] flex items-center justify-center">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-700">
                        Belum ada data Puskesos Desa/Kelurahan untuk wilayah {activeRegion}.
                      </p>
                      <p className="text-xs text-slate-500 max-w-md">
                        Silakan klik tombol <strong>"Tambah Puskesos"</strong> atau <strong>"Import Excel Khusus Wilayah Ini"</strong> di atas untuk mulai mengisi data.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                /* Render Paginated Rows (100 Rows per page) */
                paginatedRows.map((rowItem) => (
                  <tr
                    key={rowItem.globalRowIndex}
                    className={`hover:bg-blue-50/30 transition-colors ${
                      rowItem.isFirstRowOfKec ? 'border-t-2 border-slate-300' : ''
                    }`}
                  >
                    {/* Col 1: NO */}
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                      {rowItem.isFirstRowOfRegion ? '1' : ''}
                    </td>

                    {/* Col 2: KABUPATEN/ KOTA */}
                    <td className="py-2.5 px-3 font-extrabold text-[#0f2b5c] border-r border-slate-200">
                      {rowItem.isFirstRowOfRegion ? activeRegion.toUpperCase() : ''}
                    </td>

                    {/* Col 3: JUMLAH KECAMATAN */}
                    <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                      {rowItem.isFirstRowOfRegion ? adminSummary.jmlKecamatan : ''}
                    </td>

                    {/* Col 4: JUMLAH KELURAHAN */}
                    <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                      {rowItem.isFirstRowOfRegion ? adminSummary.jmlKelurahan : ''}
                    </td>

                    {/* Col 5: JUMLAH DESA */}
                    <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                      {rowItem.isFirstRowOfRegion ? adminSummary.jmlDesa : ''}
                    </td>

                    {/* Col 6: JUMLAH KELURAHAN DAN DESA */}
                    <td className="py-2.5 px-2.5 text-center font-black text-[#0f2b5c] border-r border-slate-200 bg-slate-50/50">
                      {rowItem.isFirstRowOfRegion ? adminSummary.jmlTotal : ''}
                    </td>

                    {/* Col 7: JUMLAH TERBENTUK (Dihitung Otomatis Masuk di Wilayah Administratif) */}
                    <td className="py-2.5 px-2.5 text-center font-black text-[#0f2b5c] border-r-2 border-slate-300 bg-amber-50/50">
                      {rowItem.isFirstRowOfRegion ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 font-bold inline-block">
                          {adminSummary.jmlTerbentuk}
                        </span>
                      ) : (
                        ''
                      )}
                    </td>

                    {/* Col 8: KECAMATAN */}
                    <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/30">
                      {rowItem.isFirstRowOfKec
                        ? `${rowItem.kecIdx + 1} ${rowItem.kecamatanName.toUpperCase()}`
                        : ''}
                    </td>

                    {/* Col 9: KELURAHAN YANG TELAH MEMBENTUK PUSKESOS */}
                    <td className="py-2.5 px-3 border-r border-slate-200 group">
                      {rowItem.kelRec ? (
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-purple-950">
                            {rowItem.kelNumber} {rowItem.kelRec.kelDesa || rowItem.kelRec.nama}
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(rowItem.kelRec!.id, rowItem.kelRec!.kelDesa || rowItem.kelRec!.nama)
                              }
                              disabled={deletingId === rowItem.kelRec.id}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-opacity"
                              title="Hapus Puskesos Kelurahan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        ''
                      )}
                    </td>

                    {/* Col 10: DESA YANG TELAH MEMBENTUK PUSKESOS */}
                    <td className="py-2.5 px-3 group">
                      {rowItem.desaRec ? (
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-emerald-950">
                            {rowItem.desaNumber} {rowItem.desaRec.kelDesa || rowItem.desaRec.nama}
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(rowItem.desaRec!.id, rowItem.desaRec!.kelDesa || rowItem.desaRec!.nama)
                              }
                              disabled={deletingId === rowItem.desaRec.id}
                              className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-opacity"
                              title="Hapus Puskesos Desa Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Controls (Per 100 Baris Halaman Baru) */}
        {totalRows > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-600 font-medium">
              Menampilkan baris <strong className="text-[#0f2b5c] font-bold">{startIndex + 1}</strong> s.d.{' '}
              <strong className="text-[#0f2b5c] font-bold">
                {Math.min(startIndex + ROWS_PER_PAGE, totalRows)}
              </strong>{' '}
              dari total <strong className="text-[#0f2b5c] font-bold">{totalRows}</strong> baris data Puskesos
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors cursor-pointer"
                  title="Halaman Pertama (Baris 1 - 100)"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= safeCurrentPage - 2 && pageNum <= safeCurrentPage + 2)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            safeCurrentPage === pageNum
                              ? 'bg-[#0f2b5c] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title={`Pindah ke baris ${(pageNum - 1) * ROWS_PER_PAGE + 1} - ${Math.min(pageNum * ROWS_PER_PAGE, totalRows)}`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === safeCurrentPage - 3 || pageNum === safeCurrentPage + 3) {
                      return (
                        <span key={pageNum} className="text-slate-400 px-0.5">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Halaman Berikutnya"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors cursor-pointer"
                  title={`Halaman Terakhir (${totalPages})`}
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
