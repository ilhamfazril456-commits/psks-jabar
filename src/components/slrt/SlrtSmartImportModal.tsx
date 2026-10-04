import React, { useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Table,
  Building2,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { parseSlrtExcelFile, SlrtParsedResult } from './slrtExcelParser';
import { PSKSDataRecord } from '../../types';

interface SlrtSmartImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRegion?: string | null; // Skenario B jika ada nilainya, Skenario A jika null
  onImportSuccess: (records: Omit<PSKSDataRecord, 'id'>[]) => Promise<number>;
}

export const SlrtSmartImportModal: React.FC<SlrtSmartImportModalProps> = ({
  isOpen,
  onClose,
  targetRegion,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<SlrtParsedResult | null>(null);
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessCount, setUploadSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isSingleRegionMode = Boolean(targetRegion);

  const handleReset = () => {
    setFile(null);
    setIsParsing(false);
    setParseError(null);
    setParseResult(null);
    setSelectedRegionKey('');
    setIsUploading(false);
    setUploadSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (selectedFile: File, sheetName?: string) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseSlrtExcelFile(selectedFile, targetRegion, sheetName);
      setParseResult(result);
      const regKeys = Object.keys(result.regions);
      if (regKeys.length > 0) {
        setSelectedRegionKey(regKeys[0]);
      }
    } catch (err: any) {
      console.error('Error parsing SLRT Excel:', err);
      setParseError(err.message || 'Gagal memproses file Excel.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveToCloud = async () => {
    if (!parseResult || parseResult.records.length === 0) return;
    setIsUploading(true);
    setParseError(null);

    try {
      const savedCount = await onImportSuccess(parseResult.records);
      setUploadSuccessCount(savedCount);
    } catch (err: any) {
      console.error('Error saving records to cloud:', err);
      setParseError(err.message || 'Terjadi kesalahan saat menyimpan data ke database Cloud.');
    } finally {
      setIsUploading(false);
    }
  };

  // Active region data for full preview
  const activeRegionData = useMemo(() => {
    if (!parseResult) return null;
    const key = selectedRegionKey || Object.keys(parseResult.regions)[0];
    return key ? parseResult.regions[key] : null;
  }, [parseResult, selectedRegionKey]);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 flex items-start sm:items-center justify-center min-h-screen animate-fadeIn">
      {/* Container with top and bottom spacing to prevent header cutoff */}
      <div className="my-auto w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header (Never cut off) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] text-white flex items-center justify-between border-b-2 border-[#d4af37] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-[#d4af37] shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {isSingleRegionMode ? 'Skenario B: Khusus Wilayah' : 'Skenario A: Masal 27 Kab/Kota'}
                </span>
                <span className="text-[10px] text-blue-200 font-semibold hidden sm:inline">
                  Smart Paired-Column Scanner (Format Resmi Dinas)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                {isSingleRegionMode
                  ? `Import Data Puskesos - ${targetRegion}`
                  : 'Import Excel Masal Puskesos Se-Jawa Barat (27 Wilayah)'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Petunjuk Pintar */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-blue-950 block mb-1">
                Deteksi Otomatis Format Resmi Rekapitulasi Puskesos:
              </strong>
              <p>
                {isSingleRegionMode
                  ? `Sistem akan otomatis mengekstrak seluruh Desa dan Kelurahan yang telah membentuk Puskesos khusus untuk wilayah ${targetRegion}.`
                  : 'Unggah 1 file Excel utuh (seperti format laporan WPS dinas). Sistem cerdas akan otomatis membagi, menyortir, dan mendistribusikan ribuan data desa/kelurahan ke masing-masing 27 Kabupaten/Kota se-Jawa Barat tanpa perlu memotong baris!'}
              </p>
            </div>
          </div>

          {/* Success Result View */}
          {uploadSuccessCount !== null ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  🎉 Berhasil Menyimpan {uploadSuccessCount} Data Puskesos!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                  Seluruh data kelembagaan Puskesos telah berhasil dipetakan, disortir ke wilayah masing-masing, dan
                  tersimpan secara permanen ke Google Cloud Firestore.
                </p>
              </div>
              <div className="pt-3 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all"
                >
                  Selesai & Buka Tabel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* File Upload Dropzone */}
              {!parseResult && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#0f2b5c] bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white group-hover:bg-[#0f2b5c] text-[#0f2b5c] group-hover:text-white border border-slate-200 flex items-center justify-center shadow-xs transition-colors mb-3">
                      {isParsing ? (
                        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                      ) : (
                        <FileSpreadsheet className="w-7 h-7" />
                      )}
                    </div>
                    <h5 className="text-sm font-black text-slate-800 group-hover:text-[#0f2b5c] mb-1">
                      {isParsing
                        ? 'Sedang Membaca & Memetakan Struktur Kolom WPS...'
                        : 'Klik untuk Memilih File atau Drag & Drop File Excel Disini'}
                    </h5>
                    <p className="text-xs text-slate-500 font-medium">
                      Mendukung format Microsoft Excel / WPS Office (.xlsx, .xls) atau .csv
                    </p>
                  </div>
                </div>
              )}

              {/* Parsing Error */}
              {parseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="font-bold">Gagal Memproses File:</strong>
                    <p>{parseError}</p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs font-bold text-rose-700 underline mt-1 cursor-pointer"
                    >
                      Pilih File Lain
                    </button>
                  </div>
                </div>
              )}

              {/* Parsing Result: Full Preview Section */}
              {parseResult && (
                <div className="space-y-4">
                  {/* File Info Bar */}
                  <div className="flex flex-wrap items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#0f2b5c]" />
                      <span className="font-bold text-slate-800">{parseResult.fileName}</span>
                      <span className="text-[11px] text-slate-500">
                        (Sheet: <strong className="text-blue-900">{parseResult.sheetName}</strong>)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                        Total {parseResult.totalRecords} Desa & Kelurahan Terdeteksi
                      </span>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Ganti File
                      </button>
                    </div>
                  </div>

                  {/* Switch Sheet selector if file has multiple sheets */}
                  {parseResult.availableSheets.length > 1 && (
                    <div className="flex items-center gap-2 text-xs bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                      <span className="font-bold text-amber-900">Pilih Lembar Kerja (Sheet):</span>
                      <select
                        value={parseResult.sheetName}
                        onChange={(e) => {
                          if (file) {
                            processFile(file, e.target.value);
                          }
                        }}
                        className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 font-semibold text-slate-800 focus:outline-none"
                      >
                        {parseResult.availableSheets.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Region Selector Tabs (Full Preview per Region) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[#0f2b5c]" />
                        <span>
                          {isSingleRegionMode
                            ? `Wilayah Target: ${targetRegion}`
                            : `Pilih Wilayah untuk Melihat Preview Lengkap (${Object.keys(parseResult.regions).length} Wilayah)`}
                        </span>
                      </h5>
                    </div>

                    {!isSingleRegionMode && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                        {Object.entries(parseResult.regions).map(([rName, rData]) => (
                          <button
                            key={rName}
                            type="button"
                            onClick={() => setSelectedRegionKey(rName)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 shrink-0 border ${
                              (selectedRegionKey || Object.keys(parseResult.regions)[0]) === rName
                                ? 'bg-[#0f2b5c] text-white border-[#0f2b5c] shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span>{rName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                (selectedRegionKey || Object.keys(parseResult.regions)[0]) === rName
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {rData.totalTerbentuk}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FULL PREVIEW TABLE (Exact Government Layout) */}
                  {activeRegionData && (
                    <div className="space-y-2">
                      {/* Sub-header metric bar */}
                      <div className="flex flex-wrap items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-950 text-sm">{activeRegionData.regionName}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-semibold text-slate-600">
                            {activeRegionData.totalKecamatan} Kecamatan
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-semibold text-slate-700">
                          <span className="text-purple-800 font-bold">{activeRegionData.totalKelurahan} Kelurahan</span>
                          <span>+</span>
                          <span className="text-emerald-800 font-bold">{activeRegionData.totalDesa} Desa</span>
                          <span>=</span>
                          <span className="bg-[#0f2b5c] text-white font-black px-2.5 py-0.5 rounded-full text-xs">
                            {activeRegionData.totalTerbentuk} Total Terbentuk (Otomatis)
                          </span>
                        </div>
                      </div>

                      {/* Full Table */}
                      <div className="overflow-x-auto border-2 border-slate-300 rounded-xl max-h-[380px] shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          {/* Table Header matching Government WPS layout */}
                          <thead className="bg-[#0f2b5c] text-white text-[11px] font-black uppercase sticky top-0 z-10">
                            <tr>
                              <th className="py-2.5 px-3 text-center border-r border-blue-800 w-12">NO</th>
                              <th className="py-2.5 px-3 border-r border-blue-800 min-w-[140px]">KECAMATAN</th>
                              <th className="py-2.5 px-3 border-r border-blue-800 min-w-[170px]">
                                KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
                              </th>
                              <th className="py-2.5 px-3 border-r border-blue-800 min-w-[170px]">
                                DESA YANG TELAH MEMBENTUK PUSKESOS
                              </th>
                              <th className="py-2.5 px-3 text-center min-w-[130px] bg-[#143b7d]">
                                JUMLAH DESA/KELURAHAN YANG TELAH MEMBENTUK PUSKESOS
                              </th>
                            </tr>
                            <tr className="bg-[#1e3a8a] text-blue-200 text-[10px] font-bold text-center border-t border-blue-700">
                              <th className="py-1 px-1 border-r border-blue-800/60">1</th>
                              <th className="py-1 px-1 border-r border-blue-800/60">7</th>
                              <th className="py-1 px-1 border-r border-blue-800/60">8</th>
                              <th className="py-1 px-1 border-r border-blue-800/60">9</th>
                              <th className="py-1 px-1 bg-[#18458b]">10 (Otomatis)</th>
                            </tr>
                          </thead>

                          {/* Table Body: Full Rows */}
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {(() => {
                              let rowNumber = 0;
                              let kelNumber = 0;
                              let desaNumber = 0;

                              return activeRegionData.kecamatanList.map((kecItem, kecIdx) => {
                                const maxSubRows = Math.max(kecItem.kelurahans.length, kecItem.desas.length, 1);

                                return Array.from({ length: maxSubRows }).map((_, rIdx) => {
                                  rowNumber += 1;
                                  const isFirstRowOfKec = rIdx === 0;
                                  const kelName = kecItem.kelurahans[rIdx];
                                  const desaName = kecItem.desas[rIdx];

                                  if (kelName) kelNumber += 1;
                                  if (desaName) desaNumber += 1;

                                  return (
                                    <tr
                                      key={`${kecIdx}-${rIdx}`}
                                      className={`hover:bg-blue-50/40 transition-colors ${
                                        isFirstRowOfKec ? 'border-t-2 border-slate-300' : ''
                                      }`}
                                    >
                                      {/* No */}
                                      <td className="py-2 px-3 text-center text-slate-500 font-bold border-r border-slate-200">
                                        {rowNumber}
                                      </td>

                                      {/* Kecamatan */}
                                      <td className="py-2 px-3 font-extrabold text-slate-900 border-r border-slate-200 bg-slate-50/40">
                                        {isFirstRowOfKec ? `${kecIdx + 1} ${kecItem.kecamatan.toUpperCase()}` : ''}
                                      </td>

                                      {/* Kelurahan yang telah membentuk puskesos */}
                                      <td className="py-2 px-3 border-r border-slate-200">
                                        {kelName ? (
                                          <span className="font-semibold text-purple-950">
                                            {kelNumber} {kelName}
                                          </span>
                                        ) : (
                                          ''
                                        )}
                                      </td>

                                      {/* Desa yang telah membentuk puskesos */}
                                      <td className="py-2 px-3 border-r border-slate-200">
                                        {desaName ? (
                                          <span className="font-semibold text-emerald-950">
                                            {desaNumber} {desaName}
                                          </span>
                                        ) : (
                                          ''
                                        )}
                                      </td>

                                      {/* Jumlah desa/kelurahan (Otomatis per kecamatan pada baris pertama) */}
                                      <td className="py-2 px-3 text-center font-black text-[#0f2b5c] bg-slate-50/40">
                                        {isFirstRowOfKec ? (
                                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 font-bold">
                                            {kecItem.totalTerbentuk}
                                          </span>
                                        ) : (
                                          ''
                                        )}
                                      </td>
                                    </tr>
                                  );
                                });
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {uploadSuccessCount === null && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>

            {parseResult && (
              <button
                type="button"
                onClick={handleSaveToCloud}
                disabled={isUploading}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan ke Cloud Firestore...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      Simpan {parseResult.totalRecords} Data Puskesos ke Cloud
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
