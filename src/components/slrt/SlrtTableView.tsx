import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  CheckSquare,
  AlertTriangle,
  ChevronDown,
  X,
  MapPin,
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
  onBatchDeleteRecords?: (recordIds: string[], targetPillarId?: any) => Promise<any> | void;
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
  onBatchDeleteRecords,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState<'all' | 'Desa' | 'Kelurahan'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Unified Hapus Dropdown & Mode States
  const [showDeleteDropdown, setShowDeleteDropdown] = useState<boolean>(false);
  const deleteDropdownRef = useRef<HTMLDivElement>(null);
  const deleteHoverTimeoutRef = useRef<any>(null);

  // Mode Centang (Hapus Terpilih)
  const [isSelectionModeActive, setIsSelectionModeActive] = useState<boolean>(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState<boolean>(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState<boolean>(false);

  // Hapus Per Kecamatan
  const [showKecamatanDeleteModal, setShowKecamatanDeleteModal] = useState<boolean>(false);
  const [selectedKecToDelete, setSelectedKecToDelete] = useState<{ name: string; count: number; ids: string[] } | null>(null);
  const [isDeletingKec, setIsDeletingKec] = useState<boolean>(false);

  // Kosongkan Seluruh Wilayah
  const [showClearRegionModal, setShowClearRegionModal] = useState<boolean>(false);
  const [isClearingRegion, setIsClearingRegion] = useState<boolean>(false);

  const ROWS_PER_PAGE = 100;
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const canEdit =
    session.role === 'superadmin' ||
    session.role === 'developer' ||
    session.isDeveloper ||
    (session.role === 'admin' && isSameWilayah(session.wilayah, activeRegion));

  const isSuperAdminOrDev =
    session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper;

  // Click outside listener for Hapus Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deleteDropdownRef.current && !deleteDropdownRef.current.contains(event.target as Node)) {
        setShowDeleteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hover handlers for Hapus Dropdown
  const handleDeleteMouseEnter = () => {
    if (deleteHoverTimeoutRef.current) {
      clearTimeout(deleteHoverTimeoutRef.current);
    }
    setShowDeleteDropdown(true);
  };

  const handleDeleteMouseLeave = () => {
    deleteHoverTimeoutRef.current = setTimeout(() => {
      setShowDeleteDropdown(false);
    }, 280);
  };

  // Reset page when filter or region changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRecordIds([]);
  }, [searchQuery, selectedJenisFilter, activeRegion]);

  // 1. Filter records specifically for activeRegion
  const regionRecords = useMemo(() => {
    const matched = records.filter((r) => isSameWilayah(r.wilayah, activeRegion));
    // Urutkan secara ketat dan konsisten: data lama di atas, registrasi baru di paling bawah
    return [...matched].sort((a, b) => {
      const ordA = typeof (a as any).orderIndex === 'number' ? (a as any).orderIndex : undefined;
      const ordB = typeof (b as any).orderIndex === 'number' ? (b as any).orderIndex : undefined;
      if (ordA !== undefined && ordB !== undefined && ordA !== ordB) {
        return ordA - ordB;
      }
      if (ordA !== undefined && ordB === undefined) return 1;
      if (ordA === undefined && ordB !== undefined) return -1;
      const timeA = (a as any).createdAt || 0;
      const timeB = (b as any).createdAt || 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      return 0;
    });
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

    // Urutkan kelurahans dan desas di dalam masing-masing kecamatan:
    // data lama di atas, dan registrasi baru di baris paling bawah dari kecamatan tersebut
    const sortInside = (a: PSKSDataRecord, b: PSKSDataRecord) => {
      const ordA = typeof (a as any).orderIndex === 'number' ? (a as any).orderIndex : undefined;
      const ordB = typeof (b as any).orderIndex === 'number' ? (b as any).orderIndex : undefined;
      if (ordA !== undefined && ordB !== undefined && ordA !== ordB) return ordA - ordB;
      if (ordA !== undefined && ordB === undefined) return 1;
      if (ordA === undefined && ordB !== undefined) return -1;
      const timeA = (a as any).createdAt || 0;
      const timeB = (b as any).createdAt || 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      return 0;
    };

    Object.values(kecMap).forEach((entry) => {
      entry.kelurahans.sort(sortInside);
      entry.desas.sort(sortInside);
    });

    return Object.entries(kecMap).map(([kecName, data]) => ({
      kecamatan: kecName,
      kelurahans: data.kelurahans,
      desas: data.desas,
      rowCount: Math.max(data.kelurahans.length, data.desas.length, 1),
    }));
  }, [filteredRecords]);

  // Daftar Kecamatan unik di wilayah ini beserta record ID-nya (untuk fitur Hapus Per Kecamatan)
  const kecSummaryList = useMemo(() => {
    const map: Record<string, { kelCount: number; desaCount: number; ids: string[] }> = {};
    regionRecords.forEach((r) => {
      const k = r.kec?.trim() || 'Tanpa Kecamatan';
      if (!map[k]) {
        map[k] = { kelCount: 0, desaCount: 0, ids: [] };
      }
      map[k].ids.push(r.id);
      if (r.jenisWilayah === 'Kelurahan') {
        map[k].kelCount++;
      } else {
        map[k].desaCount++;
      }
    });
    return Object.entries(map).map(([name, stat]) => ({
      name,
      kelCount: stat.kelCount,
      desaCount: stat.desaCount,
      totalCount: stat.ids.length,
      ids: stat.ids,
    }));
  }, [regionRecords]);

  // 5. Flatten to discrete table rows for strict 100-row pagination
  const allDisplayRows: SlrtDisplayRow[] = useMemo(() => {
    const rowsList: SlrtDisplayRow[] = [];
    let globalIndex = 0;
    let runningKel = 0;
    let runningDesa = 0;

    hierarchicalData.forEach((item, kecIdx) => {
      for (let i = 0; i < item.rowCount; i++) {
        const kelRec = item.kelurahans[i];
        const desaRec = item.desas[i];

        if (kelRec) runningKel++;
        if (desaRec) runningDesa++;

        rowsList.push({
          globalRowIndex: globalIndex,
          isFirstRowOfRegion: globalIndex === 0,
          isFirstRowOfKec: i === 0,
          kecamatanName: item.kecamatan,
          kecIdx,
          kelRec,
          kelNumber: kelRec ? runningKel : undefined,
          desaRec,
          desaNumber: desaRec ? runningDesa : undefined,
        });

        globalIndex++;
      }
    });

    return rowsList;
  }, [hierarchicalData]);

  // 6. Pagination Slice (100 Rows per page)
  const totalRows = allDisplayRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Jika total halaman berkurang di bawah halaman aktif, sesuaikan
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Auto-navigasi ke halaman akhir jika ada penambahan registrasi baru (agar langsung terlihat di baris paling bawah)
  const prevRecordCountRef = useRef<number>(regionRecords.length);
  useEffect(() => {
    if (regionRecords.length > prevRecordCountRef.current && prevRecordCountRef.current > 0) {
      const newTotalPages = Math.max(1, Math.ceil(allDisplayRows.length / ROWS_PER_PAGE));
      if (newTotalPages > 1) {
        setCurrentPage(newTotalPages);
      }
    }
    prevRecordCountRef.current = regionRecords.length;
  }, [regionRecords.length, allDisplayRows.length]);

  const startIndex = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const paginatedRows = useMemo(() => {
    return allDisplayRows.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [allDisplayRows, startIndex]);

  // Fungsi pengalihan otomatis ke baris paling atas tabel
  const scrollToTableTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } else {
      window.scrollTo({ top: 180, behavior: 'smooth' });
    }
  };

  const handlePageChange = (newPage: number) => {
    const clampedPage = Math.min(Math.max(1, newPage), totalPages);
    setCurrentPage(clampedPage);
    setTimeout(() => {
      scrollToTableTop();
    }, 50);
  };

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

  // =========================================================================
  // HANDLERS FITUR HAPUS: BATCH (CENTANG), PER KECAMATAN, DAN KOSONGKAN WILAYAH
  // =========================================================================
  const handleConfirmBatchDelete = async () => {
    if (!selectedRecordIds.length) return;
    setIsDeletingBatch(true);
    try {
      if (onBatchDeleteRecords) {
        await onBatchDeleteRecords(selectedRecordIds, 'slrt_puskesos');
      } else if (onDeleteRecord) {
        for (const id of selectedRecordIds) {
          await onDeleteRecord(id);
        }
      }
      setSelectedRecordIds([]);
      setIsSelectionModeActive(false);
    } catch (err) {
      console.error('Error batch deleting Puskesos records:', err);
    } finally {
      setIsDeletingBatch(false);
      setShowBatchDeleteModal(false);
    }
  };

  const handleConfirmKecamatanDelete = async () => {
    if (!selectedKecToDelete || !selectedKecToDelete.ids.length) return;
    setIsDeletingKec(true);
    try {
      if (onBatchDeleteRecords) {
        await onBatchDeleteRecords(selectedKecToDelete.ids, 'slrt_puskesos');
      } else if (onDeleteRecord) {
        for (const id of selectedKecToDelete.ids) {
          await onDeleteRecord(id);
        }
      }
      setSelectedKecToDelete(null);
      setShowKecamatanDeleteModal(false);
    } catch (err) {
      console.error('Error deleting kecamatan Puskesos records:', err);
    } finally {
      setIsDeletingKec(false);
    }
  };

  const handleConfirmClearRegion = async () => {
    if (!regionRecords.length) return;
    setIsClearingRegion(true);
    try {
      const allIds = regionRecords.map((r) => r.id);
      if (onBatchDeleteRecords) {
        await onBatchDeleteRecords(allIds, 'slrt_puskesos');
      } else if (onDeleteRecord) {
        for (const id of allIds) {
          await onDeleteRecord(id);
        }
      }
      setSelectedRecordIds([]);
      setIsSelectionModeActive(false);
    } catch (err) {
      console.error('Error clearing region Puskesos records:', err);
    } finally {
      setIsClearingRegion(false);
      setShowClearRegionModal(false);
    }
  };

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    const pageIds: string[] = [];
    paginatedRows.forEach((r) => {
      if (r.kelRec) pageIds.push(r.kelRec.id);
      if (r.desaRec) pageIds.push(r.desaRec.id);
    });
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedRecordIds.includes(id));
    if (allSelected) {
      setSelectedRecordIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedRecordIds((prev) => Array.from(new Set([...prev, ...pageIds])));
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
              Desa ({adminSummary.puskesosDesa})
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
              Kelurahan ({adminSummary.puskesosKelurahan})
            </button>
          </div>
        </div>

        {/* Buttons: Add, Import, Unified HAPUS Dropdown, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>{session.role === 'admin' ? 'Ajukan Puskesos' : 'Tambah Puskesos'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                title="Import khusus untuk wilayah ini"
              >
                <UploadCloud className="w-4 h-4 text-emerald-200" />
                <span>Import Excel Khusus Wilayah Ini</span>
              </button>

              {/* ========================================================================= */}
              {/* TOMBOL "HAPUS" TUNGGAL DENGAN KOTAK PILIHAN MELAYANG HALUS (HOVER / KLIK) */}
              {/* ========================================================================= */}
              <div
                className="relative inline-block"
                ref={deleteDropdownRef}
                onMouseEnter={handleDeleteMouseEnter}
                onMouseLeave={handleDeleteMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setShowDeleteDropdown((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap border ${
                    showDeleteDropdown || isSelectionModeActive
                      ? 'bg-rose-700 text-white border-rose-800 ring-2 ring-rose-300'
                      : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                  title="Pilihan Penghapusan Data: Hapus Terpilih (Centang), Hapus Per Kecamatan, atau Kosongkan Wilayah"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showDeleteDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Floating Popover Card */}
                {showDeleteDropdown && (
                  <div
                    className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-left animate-in fade-in zoom-in-95 duration-150"
                    onMouseEnter={handleDeleteMouseEnter}
                    onMouseLeave={handleDeleteMouseLeave}
                  >
                    <div className="px-4 py-2.5 bg-gradient-to-r from-rose-700 to-red-800 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-rose-200" />
                        <span className="font-extrabold text-xs">Pilihan Penghapusan Data</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeleteDropdown(false)}
                        className="text-white/80 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2 space-y-1">
                      {/* Opsi 1: Mode Centang (Hapus Terpilih) */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSelectionModeActive((prev) => !prev);
                          setSelectedRecordIds([]);
                          setShowDeleteDropdown(false);
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-rose-50/80 text-left flex items-start gap-2.5 transition-colors cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 group-hover:text-rose-900 block">
                            {isSelectionModeActive ? 'Matikan Mode Centang' : 'Hapus Terpilih (Mode Centang)'}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                            Centang beberapa Desa atau Kelurahan untuk dihapus sekaligus
                          </span>
                        </div>
                      </button>

                      {/* Opsi 2: Hapus Per Kecamatan */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowKecamatanDeleteModal(true);
                          setShowDeleteDropdown(false);
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-amber-50/80 text-left flex items-start gap-2.5 transition-colors cursor-pointer group border-t border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 group-hover:text-amber-950 block">
                            Hapus Per Kecamatan
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                            Hapus seluruh Puskesos pada 1 kecamatan tertentu sekaligus
                          </span>
                        </div>
                      </button>

                      {/* Opsi 3: Kosongkan Seluruh Data Wilayah Ini */}
                      {isSuperAdminOrDev && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowClearRegionModal(true);
                            setShowDeleteDropdown(false);
                          }}
                          className="w-full p-2.5 rounded-xl hover:bg-red-50 text-left flex items-start gap-2.5 transition-colors cursor-pointer group border-t border-slate-100"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-red-700 block">
                              Kosongkan Seluruh Data Wilayah
                            </span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Reset bersih semua data {activeRegion} ({regionRecords.length} data)
                            </span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm px-3 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Banner Bilah Aksi Mode Centang Hapus Masal */}
      {isSelectionModeActive && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-bold text-rose-950">
              Mode Centang Hapus Aktif:
            </span>
            <span className="bg-rose-200 text-rose-900 font-black px-2 py-0.5 rounded-full text-[11px]">
              {selectedRecordIds.length} Terpilih
            </span>
            <span className="text-slate-600 hidden sm:inline">
              (Centang kotak di samping nama Desa atau Kelurahan untuk menghapus beberapa data sekaligus)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllCurrentPage}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 transition-colors cursor-pointer"
            >
              Centang Halaman Ini
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSelectionModeActive(false);
                setSelectedRecordIds([]);
              }}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => setShowBatchDeleteModal(true)}
              disabled={selectedRecordIds.length === 0}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({selectedRecordIds.length}) Terpilih</span>
            </button>
          </div>
        </div>
      )}

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
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs text-xs"
              title="Ke Baris Berikutnya"
            >
              <span>Berikutnya</span>
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

      {/* 3. Main Data Table (Bersih Rapi Tanpa Icon Sampah Menumpuk di Sel) */}
      <div
        ref={tableContainerRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        {/* Table Title Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Rekapitulasi Puskesos: {activeRegion.toUpperCase()}
            </h4>
            <span className="text-xs text-slate-500 font-medium">
              Sesuai Format Baku Rekapitulasi Pemprov Jabar (10 Kolom) • Otomatis menghitung rasio terbentuk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-[#0f2b5c] font-black text-xs">
              {regionRecords.length} Data Terdaftar
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

                    {/* Col 9: KELURAHAN YANG TELAH MEMBENTUK PUSKESOS (Tampilan Bersih Rapi Tanpa Button Sampah) */}
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {rowItem.kelRec ? (
                        <div className="flex items-center gap-2">
                          {isSelectionModeActive && (
                            <input
                              type="checkbox"
                              checked={selectedRecordIds.includes(rowItem.kelRec.id)}
                              onChange={() => toggleSelectRecord(rowItem.kelRec!.id)}
                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer shrink-0"
                            />
                          )}
                          <span className="font-semibold text-purple-950">
                            {rowItem.kelNumber} {rowItem.kelRec.kelDesa || rowItem.kelRec.nama}
                          </span>
                        </div>
                      ) : (
                        ''
                      )}
                    </td>

                    {/* Col 10: DESA YANG TELAH MEMBENTUK PUSKESOS (Tampilan Bersih Rapi Tanpa Button Sampah) */}
                    <td className="py-2.5 px-3">
                      {rowItem.desaRec ? (
                        <div className="flex items-center gap-2">
                          {isSelectionModeActive && (
                            <input
                              type="checkbox"
                              checked={selectedRecordIds.includes(rowItem.desaRec.id)}
                              onChange={() => toggleSelectRecord(rowItem.desaRec!.id)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                            />
                          )}
                          <span className="font-semibold text-emerald-950">
                            {rowItem.desaNumber} {rowItem.desaRec.kelDesa || rowItem.desaRec.nama}
                          </span>
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
              dari total <strong className="text-[#0f2b5c] font-bold">{totalRows}</strong> baris data Puskesos {activeRegion}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={safeCurrentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 transition-colors cursor-pointer"
                  title="Halaman Pertama (1)"
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

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - safeCurrentPage) <= 2
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

      {/* ========================================================================= */}
      {/* 5. MODAL KONFIRMASI HAPUS MASAL (BATCH CENTANG)                          */}
      {/* ========================================================================= */}
      {showBatchDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-2 border-rose-500 p-6 text-center animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                <Trash2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5">
                Hapus {selectedRecordIds.length} Data Puskesos Terpilih?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Sebanyak <strong className="text-rose-700 font-black">{selectedRecordIds.length} data</strong> Puskesos yang Anda centang pada wilayah{' '}
                <strong className="text-[#0f2b5c] font-bold">{activeRegion}</strong> akan dihapus secara permanen dari sistem.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(false)}
                  disabled={isDeletingBatch}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  disabled={isDeletingBatch}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingBatch ? 'Menghapus...' : `Ya, Hapus (${selectedRecordIds.length}) Data`}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 6. MODAL PILIHAN HAPUS PER KECAMATAN                                     */}
      {/* ========================================================================= */}
      {showKecamatanDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
              <div className="p-4 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-200" />
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base">Hapus Puskesos Per Kecamatan</h4>
                    <span className="text-[11px] text-amber-200">
                      Pilih kecamatan yang ingin dihapus seluruh datanya pada wilayah {activeRegion}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowKecamatanDeleteModal(false);
                    setSelectedKecToDelete(null);
                  }}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {kecSummaryList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">
                    Tidak ada data kecamatan terdaftar pada wilayah {activeRegion}.
                  </p>
                ) : (
                  kecSummaryList.map((k) => (
                    <div
                      key={k.name}
                      className="p-3 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0f2b5c] flex items-center justify-center shrink-0 font-black text-xs">
                          <MapPin className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 block truncate">
                            KECAMATAN {k.name.toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {k.totalCount} Puskesos ({k.kelCount} Kelurahan, {k.desaCount} Desa)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedKecToDelete({ name: k.name, count: k.totalCount, ids: k.ids })}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowKecamatanDeleteModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Sub-Modal Konfirmasi Hapus Kecamatan Tertentu */}
      {selectedKecToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-2 border-rose-500 p-6 text-center animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5">
                Hapus Seluruh Data Kecamatan {selectedKecToDelete.name.toUpperCase()}?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Sebanyak <strong className="text-rose-700 font-black">{selectedKecToDelete.count} data</strong> Puskesos di{' '}
                <strong>Kecamatan {selectedKecToDelete.name}</strong>, wilayah{' '}
                <strong className="text-[#0f2b5c] font-bold">{activeRegion}</strong> akan dihapus permanen dari sistem.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedKecToDelete(null)}
                  disabled={isDeletingKec}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKecamatanDelete}
                  disabled={isDeletingKec}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingKec ? 'Menghapus...' : `Ya, Hapus Kecamatan Ini`}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 7. MODAL KONFIRMASI KOSONGKAN SELURUH DATA WILAYAH (SUPERADMIN/DEV)      */}
      {/* ========================================================================= */}
      {showClearRegionModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-2 border-red-600 p-6 text-center animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
                <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1.5">
                Kosongkan Seluruh Data {activeRegion}?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Tindakan ini akan menghapus bersih seluruh{' '}
                <strong className="text-red-600 font-black">{regionRecords.length} data Puskesos</strong> yang telah terdaftar pada wilayah{' '}
                <strong className="text-[#0f2b5c] font-bold">{activeRegion}</strong>.
              </p>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-[11px] mb-5 text-left">
                Gunakan fitur ini jika terjadi kesalahan massal saat import berkas dan Anda ingin mengatur ulang (*reset*) data wilayah ini dari awal.
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearRegionModal(false)}
                  disabled={isClearingRegion}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClearRegion}
                  disabled={isClearingRegion}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isClearingRegion ? 'Mengosongkan...' : 'Ya, Kosongkan Wilayah Ini'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
