import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, MapPin, Plus, Check, AlertCircle } from 'lucide-react';
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
  const [namaSlrt, setNamaSlrt] = useState<string>('');
  const [sertifikasi, setSertifikasi] = useState<string>('SK Kepala Desa/Lurah Pembentukan Puskesos');
  const [hp, setHp] = useState<string>('');
  const [tahunBerdiri, setTahunBerdiri] = useState<string>(new Date().getFullYear().toString());
  const [statusAktif, setStatusAktif] = useState<string>('Aktif');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-fill namaSlrt when kelDesa changes if user hasn't typed custom name
  const handleKelDesaChange = (val: string) => {
    setKelDesa(val);
    if (!namaSlrt || namaSlrt.startsWith('Puskesos ')) {
      setNamaSlrt(val ? `Puskesos ${jenisWilayah === 'Kelurahan' ? 'Kel.' : 'Desa'} ${val}` : '');
    }
  };

  const handleJenisChange = (jenis: 'Desa' | 'Kelurahan') => {
    setJenisWilayah(jenis);
    if (!namaSlrt || namaSlrt.startsWith('Puskesos ')) {
      setNamaSlrt(kelDesa ? `Puskesos ${jenis === 'Kelurahan' ? 'Kel.' : 'Desa'} ${kelDesa}` : '');
    }
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
    if (!kelDesa.trim()) {
      setErrorMsg(`Nama ${jenisWilayah} wajib diisi.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const title = namaSlrt.trim() || `Puskesos ${jenisWilayah === 'Kelurahan' ? 'Kel.' : 'Desa'} ${kelDesa.trim()}`;

    const newRecord: Omit<PSKSDataRecord, 'id'> = {
      pillarId: 'slrt_puskesos',
      wilayah,
      kec: kec.trim(),
      kelDesa: kelDesa.trim(),
      jenisWilayah,
      nama: title,
      namaSlrt: title,
      nik: `REG-SLRT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: statusAktif,
      statusAktif,
      sertifikasi: sertifikasi.trim() || 'SK Pembentukan Puskesos',
      hp: hp.trim() || '-',
      tahunBerdiri: tahunBerdiri.trim(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Wilayah Kabupaten / Kota */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kabupaten / Kota <span className="text-rose-500">*</span>
            </label>
            <select
              value={wilayah}
              onChange={(e) => setWilayah(e.target.value)}
              disabled={Boolean(targetRegion && targetRegion !== 'Prov. Jabar')}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0f2b5c] disabled:opacity-75"
            >
              {KAB_KOTA_ONLY.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Kecamatan */}
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
            />
          </div>

          {/* 3. Pilihan Jenis: Desa atau Kelurahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Status Wilayah Pemerintahan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleJenisChange('Desa')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  jenisWilayah === 'Desa'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>Desa</span>
                {jenisWilayah === 'Desa' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleJenisChange('Kelurahan')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  jenisWilayah === 'Kelurahan'
                    ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>Kelurahan</span>
                {jenisWilayah === 'Kelurahan' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 4. Nama Desa / Kelurahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama {jenisWilayah} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={kelDesa}
              onChange={(e) => handleKelDesaChange(e.target.value)}
              placeholder={`Contoh: ${jenisWilayah === 'Kelurahan' ? 'Cibeunying' : 'Cileunyi Kulon'}`}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
            />
          </div>

          {/* 5. Nama Puskesos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lembaga Puskesos
            </label>
            <input
              type="text"
              value={namaSlrt}
              onChange={(e) => setNamaSlrt(e.target.value)}
              placeholder="Contoh: Puskesos Desa Cileunyi Kulon"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
            />
            <span className="text-[10.5px] text-slate-500 mt-0.5 block">
              Boleh diubah jika Puskesos memiliki nama khusus (misal: Puskesos Berkah Mandiri)
            </span>
          </div>

          {/* 6. SK Pembentukan & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. SK Pembentukan
              </label>
              <input
                type="text"
                value={sertifikasi}
                onChange={(e) => setSertifikasi(e.target.value)}
                placeholder="SK/01/Pusk/2025"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Operator / Kontak PIC
              </label>
              <input
                type="text"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                placeholder="Nama Operator / No. HP"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
              />
            </div>
          </div>

          {/* 7. Tahun & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Berdiri
              </label>
              <input
                type="number"
                value={tahunBerdiri}
                onChange={(e) => setTahunBerdiri(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0f2b5c]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Keaktifan
              </label>
              <select
                value={statusAktif}
                onChange={(e) => setStatusAktif(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#0f2b5c]"
              >
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
                <option value="Perintisan">Perintisan</option>
              </select>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Puskesos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
