import React, { useState, useRef } from 'react';
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
  MapPin,
  Check,
  Layers,
  Sparkles,
  Info
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
    setIsUploading(false);
    setUploadSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);

    try {
      const result = await parseSlrtExcelFile(selectedFile, targetRegion);
      setParseResult(result);
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
      handleFileChange(e.dataTransfer.files[0]);
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] text-white flex items-center justify-between border-b-2 border-[#d4af37]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-[#d4af37]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {isSingleRegionMode ? 'Skenario B: Khusus Wilayah' : 'Skenario A: Masal 27 Kab/Kota'}
                </span>
                <span className="text-[10px] text-blue-200 font-semibold">Smart Parser Auto-Forwarding</span>
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
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
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
                Sistem Deteksi Otomatis Format Resmi Puskesos Dinas Sosial Jabar:
              </strong>
              <p>
                {isSingleRegionMode
                  ? `Sistem akan otomatis mengekstrak seluruh Desa dan Kelurahan yang telah membentuk Puskesos khusus untuk wilayah ${targetRegion}.`
                  : 'Unggah 1 file Excel utuh (seperti format laporan WPS dinas). Sistem cerdas akan otomatis membagi, menyortir, dan mendistribusikan ribuan data desa/kelurahan ke masing-masing 27 Kabupaten/Kota se-Jawa Barat tanpa perlu memotong file!'}
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
                        handleFileChange(e.target.files[0]);
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
                        ? 'Sedang Membaca & Memetakan Struktur Excel...'
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

              {/* Parsing Result Preview */}
              {parseResult && (
                <div className="space-y-4">
                  {/* File Info Bar */}
                  <div className="flex flex-wrap items-center justify-between p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#0f2b5c]" />
                      <span className="font-bold text-slate-800">{parseResult.fileName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                        {parseResult.totalRecords} Desa/Kelurahan Terdeteksi
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

                  {/* Summary per Region Breakdown */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#0f2b5c]" />
                      <span>Distribusi Wilayah Kabupaten / Kota ({Object.keys(parseResult.regionsSummary).length} Wilayah)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                      {Object.entries(parseResult.regionsSummary).map(([regName, info]) => (
                        <div
                          key={regName}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-[#0f2b5c] transition-all shadow-2xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-xs text-[#0f2b5c] truncate">{regName}</span>
                            <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                              {info.recordCount} Data
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-medium flex items-center justify-between mt-1">
                            <span>{info.kecamatanList.length} Kecamatan</span>
                            <span>{info.kelurahanCount} Kel / {info.desaCount} Desa</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* First 10 Records Preview Table */}
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-[#0f2b5c]" />
                      <span>Cuplikan Data yang Akan Disimpan (10 Baris Pertama)</span>
                    </h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#0f2b5c] text-white text-[11px] font-bold uppercase sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-center w-10">No</th>
                            <th className="py-2 px-3">Kabupaten / Kota</th>
                            <th className="py-2 px-3">Kecamatan</th>
                            <th className="py-2 px-3">Jenis</th>
                            <th className="py-2 px-3">Desa / Kelurahan</th>
                            <th className="py-2 px-3">Nama Puskesos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {parseResult.records.slice(0, 10).map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-center text-slate-500 font-semibold">{i + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-800">{r.wilayah}</td>
                              <td className="py-2 px-3 text-slate-700">{r.kec}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    r.jenisWilayah === 'Kelurahan'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {r.jenisWilayah || 'Desa'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-semibold text-[#0f2b5c]">{r.kelDesa}</td>
                              <td className="py-2 px-3 text-slate-600">{r.namaSlrt}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {uploadSuccessCount === null && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
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
