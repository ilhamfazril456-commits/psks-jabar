import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Eye,
  Lock,
  Pencil,
  Trash2,
  Upload,
  UserRound,
  AlertTriangle,
  X,
  Save,
} from 'lucide-react';
import { BackToHomeButton } from './BackToHomeButton';
import { PahlawanNasionalItem, UserSession } from '../types';
import {
  TOTAL_PAHLAWAN_SLOTS,
  compressHeroPortraitImage,
  savePahlawanNasional,
  deletePahlawanNasional,
} from '../services/pahlawanNasionalService';
import { recordSystemActivity } from '../lib/activityLogger';

interface PahlawanNasionalManagementPageProps {
  session: UserSession;
  pahlawanList: PahlawanNasionalItem[];
  initialEditSlot?: number | null;
  onClearInitialSlot?: () => void;
  onBackToHome: () => void;
  onOpenPublicGallery?: () => void;
}

export const PahlawanNasionalManagementPage: React.FC<PahlawanNasionalManagementPageProps> = ({
  session,
  pahlawanList,
  initialEditSlot = null,
  onClearInitialSlot,
  onBackToHome,
  onOpenPublicGallery,
}) => {
  const isAuthorized =
    session.statusActive === 'SAH_TERDAFTAR' &&
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true);

  const slotMap = useMemo(() => {
    const map = new Map<number, PahlawanNasionalItem>();
    pahlawanList.forEach((item) => {
      if (item.slotNumber >= 1 && item.slotNumber <= TOTAL_PAHLAWAN_SLOTS) {
        map.set(item.slotNumber, item);
      }
    });
    return map;
  }, [pahlawanList]);

  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [formNama, setFormNama] = useState('');
  const [formGelar, setFormGelar] = useState('');
  const [formBiografi, setFormBiografi] = useState('');
  const [formFotoBase64, setFormFotoBase64] = useState('');
  const [formFotoSizeKb, setFormFotoSizeKb] = useState<number | undefined>(undefined);
  const [formOriginalSizeKb, setFormOriginalSizeKb] = useState<number | undefined>(undefined);
  const [compressionNote, setCompressionNote] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const openEditorForSlot = (slotNum: number) => {
    const existing = slotMap.get(slotNum);
    setEditingSlot(slotNum);
    setFormNama(existing?.nama || '');
    setFormGelar(existing?.gelar || '');
    setFormBiografi(existing?.biografi || '');
    setFormFotoBase64(existing?.fotoBase64 || '');
    setFormFotoSizeKb(existing?.fotoSizeKb);
    setFormOriginalSizeKb(existing?.originalSizeKb);
    setCompressionNote(
      existing?.fotoSizeKb
        ? `Ukuran tersimpan saat ini: ${existing.fotoSizeKb} KB (kompresi jernih)`
        : ''
    );
  };

  useEffect(() => {
    if (initialEditSlot && initialEditSlot >= 1 && initialEditSlot <= TOTAL_PAHLAWAN_SLOTS && isAuthorized) {
      openEditorForSlot(initialEditSlot);
      onClearInitialSlot?.();
    }
  }, [initialEditSlot, isAuthorized]);

  useEffect(() => {
    if (editingSlot === null && confirmDeleteSlot === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSaving) {
          setEditingSlot(null);
          setConfirmDeleteSlot(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingSlot, confirmDeleteSlot, isSaving]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[75vh] bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Akses Dibatasi</h2>
        <p className="text-sm text-slate-600 mt-1 mb-6 max-w-md">
          Fitur Kelola Pahlawan Nasional hanya dapat diakses oleh akun Superadmin atau Developer yang sah.
        </p>
        <BackToHomeButton onClick={onBackToHome} />
      </div>
    );
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Format berkas tidak valid. Harap pilih file gambar (JPG, PNG, atau WebP).', 'error');
      e.target.value = '';
      return;
    }

    try {
      setIsCompressing(true);
      const result = await compressHeroPortraitImage(file);
      setFormFotoBase64(result.base64);
      setFormFotoSizeKb(result.sizeKb);
      setFormOriginalSizeKb(result.originalSizeKb);
      setCompressionNote(
        `Dikompresi jernih (${result.width}x${result.height}px, ${result.format.toUpperCase()}): ${result.originalSizeKb} KB -> ${result.sizeKb} KB`
      );
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengompresi foto pahlawan.', 'error');
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    if (!formFotoBase64) {
      showToast('Foto pahlawan wajib diunggah terlebih dahulu.', 'error');
      return;
    }
    if (!formNama.trim()) {
      showToast('Nama pahlawan wajib diisi.', 'error');
      return;
    }
    if (!formBiografi.trim()) {
      showToast('Biografi pahlawan wajib diisi.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const saved = await savePahlawanNasional({
        slotNumber: editingSlot,
        nama: formNama.trim(),
        gelar: formGelar.trim() || undefined,
        biografi: formBiografi.trim(),
        fotoBase64: formFotoBase64,
        fotoSizeKb: formFotoSizeKb,
        originalSizeKb: formOriginalSizeKb,
        updatedBy: session.nama || session.username || session.role,
      });

      try {
        recordSystemActivity({
          session,
          category: 'SYSTEM_SETTINGS',
          actionType: 'UPDATE',
          targetCollection: 'pahlawan_nasional',
          targetId: saved.id,
          details: `Menyimpan data Pahlawan Nasional Slot ${saved.slotNumber}: ${saved.nama}`,
        });
      } catch {
        // Abaikan error log non-kritis
      }

      setEditingSlot(null);
      showToast(`Slot ${saved.slotNumber} (${saved.nama}) berhasil disimpan ke database dan ditayangkan realtime!`);
    } catch (err: any) {
      showToast(err?.message || 'Gagal menyimpan data ke database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteSlot) return;
    const existing = slotMap.get(confirmDeleteSlot);
    try {
      setIsSaving(true);
      await deletePahlawanNasional(confirmDeleteSlot);

      try {
        recordSystemActivity({
          session,
          category: 'SYSTEM_SETTINGS',
          actionType: 'DELETE',
          targetCollection: 'pahlawan_nasional',
          targetId: `slot_${confirmDeleteSlot}`,
          details: `Menghapus data Pahlawan Nasional Slot ${confirmDeleteSlot}${existing ? `: ${existing.nama}` : ''}`,
        });
      } catch {
        // Abaikan
      }

      showToast(`Slot ${confirmDeleteSlot} berhasil dikosongkan dan diperbarui realtime.`);
      setConfirmDeleteSlot(null);
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghapus data slot pahlawan.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const slots = Array.from({ length: TOTAL_PAHLAWAN_SLOTS }, (_, idx) => idx + 1);
  const filledCount = slotMap.size;

  return (
    <div className="min-h-[80vh] bg-slate-50 text-slate-900 py-6 sm:py-10 px-3 sm:px-6 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-5 right-4 sm:right-6 z-[1300] max-w-md px-4 py-3 rounded-xl shadow-xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : 'bg-rose-800 text-white border-rose-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          )}
          <span className="flex-1">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 hover:bg-white/15 rounded-lg cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-manage-pahlawan" />

          {onOpenPublicGallery && (
            <button
              type="button"
              onClick={onOpenPublicGallery}
              className="inline-flex items-center justify-center gap-2 h-9 sm:h-11 px-4 rounded-xl bg-white hover:bg-blue-50 text-[#0f2b5c] border-2 border-blue-900/20 hover:border-blue-800 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>Lihat Galeri Pahlawan Nasional</span>
            </button>
          )}
        </div>

        {/* Header Banner */}
        <div className="bg-[#0f2b5c] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-blue-900/60 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-amber-300/30 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-300">
                  Khusus Superadmin & Developer · Sinkronisasi Realtime Database
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  Kelola Pahlawan Nasional
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
                  Unggah dan kelola 18 foto Pahlawan Nasional beserta biografinya. Setiap foto otomatis dikompresi tanpa mengurangi kejernihan gambar, tersimpan permanen ke database, dan langsung tampil realtime untuk seluruh pengguna.
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm font-semibold text-blue-100 sm:text-right shrink-0">
              <span className="text-amber-300 font-black text-base sm:text-lg tabular-nums">
                {filledCount} / {TOTAL_PAHLAWAN_SLOTS}
              </span>
              <span className="block text-xs text-blue-200/80">Slot Terisi</span>
            </div>
          </div>
        </div>

        {/* 18-Slot Management Grid (6 kolom x 3 baris di laptop, 2 di HP) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 auto-rows-fr items-stretch">
          {slots.map((slotNum) => {
            const hero = slotMap.get(slotNum);
            return (
              <div
                key={slotNum}
                className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between"
              >
                {/* Slot Foto */}
                <div className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden">
                  {hero ? (
                    <img
                      src={hero.fotoBase64}
                      alt={hero.nama}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-400">
                      <UserRound className="w-8 h-8 mb-1.5 opacity-60" />
                      <span className="text-xs font-semibold">Slot {slotNum}</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[10px] font-bold tabular-nums">
                    #{slotNum}
                  </span>
                </div>

                {/* Slot Nama & Metadata */}
                <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-2.5 border-t border-slate-100">
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-bold text-[#0f2b5c] leading-snug line-clamp-2">
                      {hero ? hero.nama : `Slot ${slotNum} Kosong`}
                    </h3>
                    {hero?.fotoSizeKb ? (
                      <p className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                        Foto terkompresi: {hero.fotoSizeKb} KB
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Belum ada foto & biografi
                      </p>
                    )}
                  </div>

                  {/* Slot Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => openEditorForSlot(slotNum)}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#0f2b5c] hover:bg-[#143b7d] text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 shrink-0" />
                      <span>{hero ? 'Edit' : 'Isi Slot'}</span>
                    </button>

                    {hero && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSlot(slotNum)}
                        aria-label={`Hapus slot ${slotNum}`}
                        title="Hapus Slot"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Tambah / Edit Pahlawan Nasional */}
      {editingSlot !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-pahlawan-title"
          onClick={() => {
            if (!isSaving) setEditingSlot(null);
          }}
          className="fixed inset-0 z-[1200] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-5 sm:px-6 py-4 bg-[#0f2b5c] text-white flex items-center justify-between gap-4 shrink-0">
              <div>
                <p className="text-xs font-medium text-amber-300">
                  Slot #{editingSlot} dari {TOTAL_PAHLAWAN_SLOTS}
                </p>
                <h2
                  id="modal-edit-pahlawan-title"
                  className="text-base sm:text-lg font-black text-white"
                >
                  {slotMap.has(editingSlot) ? 'Edit Data Pahlawan Nasional' : 'Tambah Pahlawan Nasional'}
                </h2>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setEditingSlot(null)}
                aria-label="Tutup editor"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Foto Upload + Live Preview */}
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                <div className="w-36 aspect-[3/4] rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  {formFotoBase64 ? (
                    <img
                      src={formFotoBase64}
                      alt={formNama || 'Pratinjau foto pahlawan'}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 p-3 text-center">
                      <UserRound className="w-8 h-8 mb-1 opacity-60" />
                      <span className="text-[11px]">Belum ada foto</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Foto Pahlawan Nasional *
                  </label>
                  <label className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0f2b5c] bg-slate-50 hover:bg-blue-50/40 cursor-pointer transition-colors text-center">
                    <Upload className="w-5 h-5 text-[#0f2b5c]" />
                    <span className="text-xs font-bold text-[#0f2b5c]">
                      {isCompressing ? 'Mengompresi Foto...' : 'Pilih / Ganti Foto (JPG, PNG, WebP)'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Foto otomatis dikompresi jernih (WebP/JPEG resolusi potret) agar cepat tampil realtime.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isCompressing || isSaving}
                      className="sr-only"
                    />
                  </label>
                  {compressionNote && (
                    <p className="text-xs font-medium text-emerald-700">
                      {compressionNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Nama Pahlawan */}
              <div className="space-y-1.5">
                <label htmlFor="input-hero-nama" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Nama Pahlawan *
                </label>
                <input
                  id="input-hero-nama"
                  type="text"
                  required
                  maxLength={200}
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Ir. Soekarno / R.A. Kartini / Oto Iskandar di Nata"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0f2b5c] focus:outline-none text-sm font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Gelar / Keterangan Singkat */}
              <div className="space-y-1.5">
                <label htmlFor="input-hero-gelar" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Asal Daerah / Masa Perjuangan (Opsional)
                </label>
                <input
                  id="input-hero-gelar"
                  type="text"
                  maxLength={200}
                  value={formGelar}
                  onChange={(e) => setFormGelar(e.target.value)}
                  placeholder="Contoh: Jawa Barat · 1897–1945"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0f2b5c] focus:outline-none text-sm text-slate-900 bg-white"
                />
              </div>

              {/* Biografi */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="input-hero-bio" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Biografi Pahlawan *
                  </label>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {formBiografi.length} / 15.000 karakter
                  </span>
                </div>
                <textarea
                  id="input-hero-bio"
                  required
                  rows={6}
                  maxLength={15000}
                  value={formBiografi}
                  onChange={(e) => setFormBiografi(e.target.value)}
                  placeholder="Tuliskan riwayat hidup, perjuangan, jasa kepahlawanan, dan keteladanan pahlawan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0f2b5c] focus:outline-none text-sm text-slate-900 bg-white leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2b5c] hover:bg-[#143b7d] disabled:bg-slate-400 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {confirmDeleteSlot !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => {
            if (!isSaving) setConfirmDeleteSlot(null);
          }}
          className="fixed inset-0 z-[1250] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Kosongkan Slot #{confirmDeleteSlot}?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Foto dan biografi{' '}
              <strong className="text-slate-900">
                {slotMap.get(confirmDeleteSlot)?.nama || `Slot ${confirmDeleteSlot}`}
              </strong>{' '}
              akan dihapus dari database secara realtime dan slot akan kembali kosong.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setConfirmDeleteSlot(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                {isSaving ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
