import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Plus, Check, AlertCircle } from 'lucide-react';
import { PSKSDataRecord, UserSession } from '../../types';
import { KAB_KOTA_ONLY } from '../../data/initialData';

interface SlrtAddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRegion?: string | null;
  session: UserSession;
  onAddRecord: (record: Omit<PSKSDataRecord, 'id'>) => Promise<any>;
}

export const SlrtAddRecordModal: React.FC<SlrtAddRecordModalProps> = ({
  isOpen,
  onClose,
  targetRegion,
  session,
  onAddRecord,
}) => {
  const [wilayah, setWilayah] = useState<string>(
    targetRegion || (session.wilayah && session.wilayah !== 'Prov. Jabar' ? session.wilayah : 'Kab. Bandung')
  );
  const [kec, setKec] = useState<string>('');
  const [jenisWilayah, setJenisWilayah] = useState<'Desa' | 'Kelurahan'>('Desa');
  const [kelDesa, setKelDesa] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
    if (!kelDesa.trim()) {
      setErrorMsg(`Nama ${jenisWilayah} wajib diisi.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const title = jenisWilayah === 'Kelurahan' ? `Kel. ${kelDesa.trim()}` : `Desa ${kelDesa.trim()}`;

    const newRecord: Omit<PSKSDataRecord, 'id'> = {
      pillarId: 'slrt_puskesos',
      wilayah,
      kec: kec.trim(),
      kelDesa: kelDesa.trim(),
      jenisWilayah,
      nama: title,
      namaSlrt: `Puskesos ${title}`,
      nik: `REG-SLRT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Aktif',
      statusAktif: 'Aktif',
      sertifikasi: 'SK Pembentukan Puskesos',
      hp: '-',
      tahunBerdiri: new Date().getFullYear().toString(),
    };

    try {
      await onAddRecord(newRecord);
      onClose();
    } catch (err: any) {
      console.error('Error adding Puskesos record:', err);
      setErrorMsg(err.message || 'Gagal menambahkan data Puskesos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] relative my-auto">
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
                Tambah Data Puskesos Baru
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

        {/* Form Body - Opsi A: Ringkas, Cepat & 100% Sinkron Tabel 10 Kolom */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner Format */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <span className="font-bold">Format Resmi Rekapitulasi:</span> Daftarkan unit Puskesos yang telah terbentuk pada wilayah administratif Desa atau Kelurahan berikut untuk memperbaharui rekapitulasi data secara otomatis.
          </div>

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
              placeholder="Contoh: Cileunyi"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
              autoFocus
            />
          </div>

          {/* 3. Pilihan Status Wilayah: Desa atau Kelurahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status Wilayah Pemerintahan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setJenisWilayah('Desa')}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  jenisWilayah === 'Desa'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Desa</span>
                {jenisWilayah === 'Desa' && <Check className="w-4 h-4 text-emerald-200" />}
              </button>
              <button
                type="button"
                onClick={() => setJenisWilayah('Kelurahan')}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  jenisWilayah === 'Kelurahan'
                    ? 'bg-purple-700 text-white border-purple-800 shadow-sm ring-2 ring-purple-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Kelurahan</span>
                {jenisWilayah === 'Kelurahan' && <Check className="w-4 h-4 text-purple-200" />}
              </button>
            </div>
          </div>

          {/* 4. Nama Desa / Kelurahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama {jenisWilayah} yang Telah Membentuk Puskesos <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={kelDesa}
              onChange={(e) => setKelDesa(e.target.value)}
              placeholder={`Contoh: ${jenisWilayah === 'Kelurahan' ? 'Cibeunying' : 'Cileunyi Kulon'}`}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Data akan otomatis masuk ke Kolom {jenisWilayah === 'Kelurahan' ? '9 (Kelurahan Terbentuk)' : '10 (Desa Terbentuk)'} pada tabel resmi rekapitulasi Puskesos.
            </span>
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Puskesos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
