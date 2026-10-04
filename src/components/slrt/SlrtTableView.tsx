import React, { useState, useMemo } from 'react';
import {
  Table,
  Search,
  Plus,
  UploadCloud,
  FileText,
  Download,
  Trash2,
  Edit2,
  Building2,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PSKSDataRecord, UserSession } from '../../types';
import { isSameWilayah } from '../../utils/submissionStatus';
import { exportPillarToExcel } from '../../utils/excelExport';
import { exportPillarToPDF } from '../../utils/pdfExport';
import { PILLARS_CONFIG } from '../../data/initialData';

interface SlrtTableViewProps {
  activeRegion: string;
  records: PSKSDataRecord[];
  session: UserSession;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onDeleteRecord?: (id: string) => Promise<any> | void;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canEdit =
    session.role === 'superadmin' ||
    session.role === 'developer' ||
    session.isDeveloper ||
    (session.role === 'admin' && isSameWilayah(session.wilayah, activeRegion));

  // 1. Filter records specifically for activeRegion
  const regionRecords = useMemo(() => {
    return records.filter((r) => isSameWilayah(r.wilayah, activeRegion));
  }, [records, activeRegion]);

  // 2. Compute 5 administrative indicator values automatically from real data
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

    return {
      jmlKecamatan: uniqueKec.size,
      jmlKelurahan: kelCount,
      jmlDesa: desaCount,
      jmlTotal: kelCount + desaCount,
      jmlTerbentuk: kelCount + desaCount,
    };
  }, [regionRecords]);

  // 3. Search and filter
  const filteredRecords = useMemo(() => {
    return regionRecords.filter((r) => {
      // Type filter
      if (selectedJenisFilter === 'Desa' && r.jenisWilayah === 'Kelurahan') return false;
      if (selectedJenisFilter === 'Kelurahan' && r.jenisWilayah !== 'Kelurahan') return false;

      // Keyword search
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

  // Handle Export
  const handleExportExcel = () => {
    exportPillarToExcel({
      pillarId: 'slrt_puskesos',
      pillar: PILLARS_CONFIG['slrt_puskesos'],
      records: regionRecords,
      session,
    });
  };

  const handleExportPDF = () => {
    exportPillarToPDF({
      pillarId: 'slrt_puskesos',
      pillar: PILLARS_CONFIG['slrt_puskesos'],
      records: regionRecords,
      session,
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

  // Running counters for Kelurahan & Desa numbers in table
  let runningKelIdx = 0;
  let runningDesaIdx = 0;

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
          <span className="text-[10px] text-slate-500 font-medium">Terdata di Wilayah</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
            Jml Kelurahan
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
            {adminSummary.jmlKelurahan}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Membentuk Puskesos</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            Jml Desa
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
            {adminSummary.jmlDesa}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Membentuk Puskesos</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
            Total Kel & Desa
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
            {adminSummary.jmlTotal}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Akumulasi Lembaga</span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-gradient-to-br from-[#0f2b5c] to-blue-900 text-white shadow-xs">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
            Total Terbentuk
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
                title="Skenario B: Import khusus untuk wilayah ini"
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

      {/* 3. The Main Government Table Format (Matching WPS Office Screenshot) */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden">
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
              Wilayah Administratif Terverifikasi
            </span>
          </div>
        </div>

        {/* Responsive Table Scroll Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            {/* Table Headers (2 Groups: Wilayah Administratif & Desa/Kelurahan Yang Telah Membentuk Puskesos) */}
            <thead>
              {/* Row 1: Group Headers */}
              <tr>
                <th
                  colSpan={6}
                  className="bg-[#fef9c3] text-[#713f12] border-r-2 border-b-2 border-amber-300 font-black text-center py-2.5 px-3 uppercase tracking-wider text-xs sm:text-sm"
                >
                  WILAYAH ADMINISTRATIF
                </th>
                <th
                  colSpan={4}
                  className="bg-[#fed7aa] text-[#7c2d12] border-b-2 border-orange-300 font-black text-center py-2.5 px-3 uppercase tracking-wider text-xs sm:text-sm"
                >
                  DESA/KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
                </th>
              </tr>

              {/* Row 2: Detailed Column Titles */}
              <tr className="bg-[#0f2b5c] text-white text-[11px] sm:text-xs font-black uppercase tracking-tight">
                <th className="py-3 px-3 text-center border-r border-blue-800 w-12">NO.</th>
                <th className="py-3 px-3 border-r border-blue-800 min-w-[140px]">KABUPATEN/ KOTA</th>
                <th className="py-3 px-2.5 text-center border-r border-blue-800 min-w-[90px]">JUMLAH KECAMATAN</th>
                <th className="py-3 px-2.5 text-center border-r border-blue-800 min-w-[90px]">JUMLAH KELURAHAN</th>
                <th className="py-3 px-2.5 text-center border-r border-blue-800 min-w-[90px]">JUMLAH DESA</th>
                <th className="py-3 px-2.5 text-center border-r-2 border-blue-700 min-w-[110px]">
                  JUMLAH KELURAHAN DAN DESA
                </th>
                <th className="py-3 px-3 border-r border-blue-800 min-w-[130px]">KECAMATAN</th>
                <th className="py-3 px-3 border-r border-blue-800 min-w-[170px]">
                  KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
                </th>
                <th className="py-3 px-3 border-r border-blue-800 min-w-[170px]">
                  DESA YANG TELAH MEMBENTUK PUSKESOS
                </th>
                <th className="py-3 px-2.5 text-center min-w-[120px]">
                  JUMLAH DESA/ KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
                </th>
              </tr>

              {/* Row 3: Standard Sub-number row (1 to 10) */}
              <tr className="bg-[#1e3a8a] text-blue-200 text-[10px] font-bold text-center border-b-2 border-slate-300">
                <th className="py-1 px-1 border-r border-blue-800/60">1</th>
                <th className="py-1 px-1 border-r border-blue-800/60">2</th>
                <th className="py-1 px-1 border-r border-blue-800/60">3</th>
                <th className="py-1 px-1 border-r border-blue-800/60">4</th>
                <th className="py-1 px-1 border-r border-blue-800/60">5</th>
                <th className="py-1 px-1 border-r-2 border-blue-700">6</th>
                <th className="py-1 px-1 border-r border-blue-800/60">7</th>
                <th className="py-1 px-1 border-r border-blue-800/60">8</th>
                <th className="py-1 px-1 border-r border-blue-800/60">9</th>
                <th className="py-1 px-1">10</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 bg-white">
              {regionRecords.length === 0 ? (
                /* Empty State */
                <tr>
                  <td className="py-4 px-3 text-center font-bold text-slate-700 border-r border-slate-200">1</td>
                  <td className="py-4 px-3 font-bold text-[#0f2b5c] border-r border-slate-200">
                    {activeRegion.toUpperCase()}
                  </td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r border-slate-200">0</td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r border-slate-200">0</td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r border-slate-200">0</td>
                  <td className="py-4 px-3 text-center text-slate-500 border-r-2 border-slate-300">0</td>
                  <td colSpan={4} className="py-12 px-4 text-center">
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
                /* Render Hierarchical Rows */
                (() => {
                  let isFirstRowOfRegion = true;
                  runningKelIdx = 0;
                  runningDesaIdx = 0;

                  return hierarchicalData.map((group, kecIdx) => {
                    const rowCount = group.rowCount;

                    return Array.from({ length: rowCount }).map((_, rIdx) => {
                      const isFirstRowOfKec = rIdx === 0;
                      const kelRec = group.kelurahans[rIdx];
                      const desaRec = group.desas[rIdx];

                      if (kelRec) runningKelIdx += 1;
                      if (desaRec) runningDesaIdx += 1;

                      const isFirstGlobalRow = isFirstRowOfRegion;
                      if (isFirstRowOfRegion) isFirstRowOfRegion = false;

                      return (
                        <tr
                          key={`${kecIdx}-${rIdx}`}
                          className={`hover:bg-blue-50/30 transition-colors ${
                            isFirstRowOfKec ? 'border-t-2 border-slate-300' : ''
                          }`}
                        >
                          {/* Col 1: NO (Sticky or on first row) */}
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 border-r border-slate-200">
                            {isFirstGlobalRow ? '1' : ''}
                          </td>

                          {/* Col 2: KABUPATEN/ KOTA */}
                          <td className="py-2.5 px-3 font-extrabold text-[#0f2b5c] border-r border-slate-200">
                            {isFirstGlobalRow ? activeRegion.toUpperCase() : ''}
                          </td>

                          {/* Col 3: JUMLAH KECAMATAN */}
                          <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                            {isFirstGlobalRow ? adminSummary.jmlKecamatan : ''}
                          </td>

                          {/* Col 4: JUMLAH KELURAHAN */}
                          <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                            {isFirstGlobalRow ? adminSummary.jmlKelurahan : ''}
                          </td>

                          {/* Col 5: JUMLAH DESA */}
                          <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 border-r border-slate-200">
                            {isFirstGlobalRow ? adminSummary.jmlDesa : ''}
                          </td>

                          {/* Col 6: JUMLAH KELURAHAN DAN DESA */}
                          <td className="py-2.5 px-2.5 text-center font-black text-[#0f2b5c] border-r-2 border-slate-300 bg-slate-50/50">
                            {isFirstGlobalRow ? adminSummary.jmlTotal : ''}
                          </td>

                          {/* Col 7: KECAMATAN (Numbered like '1 CILEUNYI', '2 CIMENYAN') */}
                          <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/30">
                            {isFirstRowOfKec ? `${kecIdx + 1} ${group.kecamatan.toUpperCase()}` : ''}
                          </td>

                          {/* Col 8: KELURAHAN YANG TELAH MEMBENTUK PUSKESOS */}
                          <td className="py-2.5 px-3 border-r border-slate-200 group">
                            {kelRec ? (
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-purple-950">
                                  {runningKelIdx} {kelRec.kelDesa || kelRec.nama}
                                </span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(kelRec.id, kelRec.kelDesa || kelRec.nama)}
                                    disabled={deletingId === kelRec.id}
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

                          {/* Col 9: DESA YANG TELAH MEMBENTUK PUSKESOS */}
                          <td className="py-2.5 px-3 border-r border-slate-200 group">
                            {desaRec ? (
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-emerald-950">
                                  {runningDesaIdx} {desaRec.kelDesa || desaRec.nama}
                                </span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(desaRec.id, desaRec.kelDesa || desaRec.nama)}
                                    disabled={deletingId === desaRec.id}
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

                          {/* Col 10: JUMLAH DESA/ KELURAHAN YANG TELAH MEMBENTUK PUSKESOS */}
                          <td className="py-2.5 px-2.5 text-center font-black text-slate-800 bg-slate-50/50">
                            {isFirstGlobalRow ? adminSummary.jmlTerbentuk : ''}
                          </td>
                        </tr>
                      );
                    });
                  });
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
