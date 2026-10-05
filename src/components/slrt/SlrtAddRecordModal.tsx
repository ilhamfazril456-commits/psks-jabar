import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Plus, Check, AlertCircle, Trash2, MapPin } from 'lucide-react';
import { PSKSDataRecord, UserSession } from '../../types';
import { KAB_KOTA_ONLY } from '../../data/initialData';

interface SlrtAddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRegion?: string | null;
  session: UserSession;
  onAddRecord: (record: Omit<PSKSDataRecord, 'id'>) => Promise<any>;
  onBatchAddRecords?: (records: Omit<PSKSDataRecord, 'id'>[]) => Promise<any>;
}

export const SlrtAddRecordModal: React.FC<SlrtAddRecordModalProps> = ({
  isOpen,
  onClose,
  targetRegion,
  session,
  onAddRecord,
  onBatchAddRecords,
}) => {
  const [wilayah, setWilayah] = useState<string>(
    targetRegion || (session.wilayah && session.wilayah !== 'Prov. Jabar' ? session.wilayah : 'Kab. Bandung')
  );
  const [kec, setKec] = useState<string>('');

  // Multi-entry Kelurahan & Desa
  const [kelurahanList, setKelurahanList] = useState<string[]>([]);
  const [currentKelInput, setCurrentKelInput] = useState<string>('');

  const [desaList, setDesaList] = useState<string[]>([]);
  const [currentDesaInput, setCurrentDesaInput] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper untuk menambah kelurahan (support koma & enter)
  const handleAddKelurahan = () => {
    if (!currentKelInput.trim()) return;
    const parts = currentKelInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = [...kelurahanList];
    parts.forEach((p) => {
      if (!updated.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
        updated.push(p);
      }
    });

    setKelurahanList(updated);
    setCurrentKelInput('');
    setErrorMsg(null);
  };

  const handleRemoveKelurahan = (idx: number) => {
    setKelurahanList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Helper untuk menambah desa (support koma & enter)
  const handleAddDesa = () => {
    if (!currentDesaInput.trim()) return;
    const parts = currentDesaInput
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updated = [...desaList];
    parts.forEach((p) => {
      if (!updated.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
        updated.push(p);
      }
    });

    setDesaList(updated);
    setCurrentDesaInput('');
    setErrorMsg(null);
  };

  const handleRemoveDesa = (idx: number) => {
    setDesaList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wilayah) {
      setErrorMsg('Kabupaten/Kota wajib dipilih.');
      return;
    }
    if (!kec.trim()) {
      setErrorMsg('Nama Kecamatan wajib diisi.');
      return;
    }

    // Jika ada teks tertinggal di input kelurahan atau desa, masukkan dulu
    let finalKelList = [...kelurahanList];
    if (currentKelInput.trim()) {
      const parts = currentKelInput
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      parts.forEach((p) => {
        if (!finalKelList.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
          finalKelList.push(p);
        }
      });
    }

    let finalDesaList = [...desaList];
    if (currentDesaInput.trim()) {
      const parts = currentDesaInput
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      parts.forEach((p) => {
        if (!finalDesaList.some((existing) => existing.toLowerCase() === p.toLowerCase())) {
          finalDesaList.push(p);
        }
      });
    }

    if (finalKelList.length === 0 && finalDesaList.length === 0) {
      setErrorMsg('Silakan masukkan minimal 1 nama Desa atau 1 nama Kelurahan yang telah membentuk Puskesos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const kecamatanClean = kec.trim();
    const recordsToCreate: Omit<PSKSDataRecord, 'id'>[] = [];

    // 1. Buat record untuk masing-masing Kelurahan
    finalKelList.forEach((kelName) => {
      const title = `Kel. ${kelName}`;
      recordsToCreate.push({
        pillarId: 'slrt_puskesos',
        wilayah,
        kec: kecamatanClean,
        kelDesa: kelName,
        jenisWilayah: 'Kelurahan',
        nama: title,
        namaSlrt: `Puskesos ${title}`,
        nik: `REG-SLRT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Aktif',
        statusAktif: 'Aktif',
        sertifikasi: 'SK Pembentukan Puskesos',
        hp: '-',
        tahunBerdiri: new Date().getFullYear().toString(),
      });
    });

    // 2. Buat record untuk masing-masing Desa
    finalDesaList.forEach((desaName) => {
      const title = `Desa ${desaName}`;
      recordsToCreate.push({
        pillarId: 'slrt_puskesos',
        wilayah,
        kec: kecamatanClean,
        kelDesa: desaName,
        jenisWilayah: 'Desa',
        nama: title,
        namaSlrt: `Puskesos ${title}`,
        nik: `REG-SLRT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'Aktif',
        statusAktif: 'Aktif',
        sertifikasi: 'SK Pembentukan Puskesos',
        hp: '-',
        tahunBerdiri: new Date().getFullYear().toString(),
      });
    });

    try {
      if (onBatchAddRecords) {
        await onBatchAddRecords(recordsToCreate);
      } else {
        for (const rec of recordsToCreate) {
          await onAddRecord(rec);
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Error adding Puskesos records:', err);
      setErrorMsg(err.message || 'Gagal menambahkan data Puskesos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEntries = kelurahanList.length + desaList.length;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] text-white flex items-center justify-between border-b-2 border-[#d4af37]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-[#d4af37]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                Puskesos Desa / Kelurahan
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Tambah Data Puskesos Per Kecamatan
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Multi-Entry Per Kecamatan */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner Alur Input Cepat */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>
              <strong>Input Kolektif 1 Kecamatan:</strong> Masukkan nama kecamatan, lalu tambahkan beberapa nama Kelurahan dan Desa sekaligus. Semua data akan langsung masuk rapi ke baris kecamatan terkait pada tabel rekapitulasi.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Wilayah Kabupaten / Kota */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kabupaten / Kota <span className="text-rose-500">*</span>
              </label>
              <select
                value={wilayah}
                onChange={(e) => setWilayah(e.target.value)}
                disabled={Boolean(targetRegion && targetRegion !== 'Prov. Jabar')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0f2b5c] disabled:opacity-75 disabled:bg-slate-100"
              >
                {KAB_KOTA_ONLY.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Nama Kecamatan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Kecamatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={kec}
                onChange={(e) => setKec(e.target.value)}
                placeholder="Contoh: Kadudampit"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#0f2b5c]"
                autoFocus
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-4">
            {/* 3. Daftar Kelurahan yang Telah Membentuk Puskesos */}
            <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-purple-950 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span>Kelurahan yang Telah Membentuk Puskesos (Kolom 9)</span>
                </label>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                  {kelurahanList.length} Kelurahan
                </span>
              </div>

              {/* Input + Tombol Tambah */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentKelInput}
                  onChange={(e) => setCurrentKelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKelurahan();
                    }
                  }}
                  placeholder="Ketik nama kelurahan (contoh: Cikole), tekan Enter / tombol Tambah"
                  className="flex-1 bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-purple-600"
                />
                <button
                  type="button"
                  onClick={handleAddKelurahan}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              {/* List Kelurahan Badges */}
              {kelurahanList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {kelurahanList.map((kelName, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-purple-950 font-bold text-xs shadow-2xs animate-fadeIn"
                    >
                      <span>{idx + 1}. Kel. {kelName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKelurahan(idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                        title="Hapus Kelurahan Ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  * Kosongkan jika di kecamatan ini tidak ada Kelurahan (atau belum ada yang membentuk Puskesos).
                </p>
              )}
            </div>

            {/* 4. Daftar Desa yang Telah Membentuk Puskesos */}
            <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  <span>Desa yang Telah Membentuk Puskesos (Kolom 10)</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {desaList.length} Desa
                </span>
              </div>

              {/* Input + Tombol Tambah */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentDesaInput}
                  onChange={(e) => setCurrentDesaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDesa();
                    }
                  }}
                  placeholder="Ketik nama desa (contoh: Gedepangrango, Sukamaju), tekan Enter / tombol Tambah"
                  className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddDesa}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              {/* List Desa Badges */}
              {desaList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {desaList.map((desaName, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 font-bold text-xs shadow-2xs animate-fadeIn"
                    >
                      <span>{idx + 1}. Desa {desaName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDesa(idx)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                        title="Hapus Desa Ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  * Kosongkan jika di kecamatan ini tidak ada Desa (atau belum ada yang membentuk Puskesos).
                </p>
              )}
            </div>
          </div>

          {/* Ringkasan Jumlah Data Terbentuk */}
          {totalEntries > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
              <span>
                Total <strong>{totalEntries} unit Puskesos</strong> akan ditambahkan ke Kecamatan <strong>{kec || '...'}</strong> ({kelurahanList.length} Kelurahan, {desaList.length} Desa).
              </span>
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (totalEntries === 0 && !currentKelInput && !currentDesaInput)}
              className="px-5 py-2.5 bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : totalEntries > 0
                  ? `Simpan Data Kecamatan (${totalEntries} Puskesos)`
                  : 'Simpan Data Kecamatan'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
