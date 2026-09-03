import React, { useState, useRef, useEffect } from 'react';
import { UserSession, AppSettings, AnnouncementConfig } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';
import {
  DEFAULT_ANNOUNCEMENT_CONFIG,
  DEFAULT_ANNOUNCEMENT_PHOTO,
  createDefaultWilayahSwitches,
} from '../data/defaultAnnouncement';
import { compressImage } from '../utils/imageCompressor';
import { BackToHomeButton } from './BackToHomeButton';
import { FloatingAnnouncementModal } from './FloatingAnnouncementModal';
import {
  Volume2,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Radio,
  Sparkles,
  Users,
  Building2,
  ShieldCheck,
  Search,
  CheckSquare,
  XSquare,
  RotateCcw,
  Zap,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Sliders,
  ShieldAlert,
  Palette,
} from 'lucide-react';

interface AnnouncementManagementPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
  onOpenAnnouncementDetail: (announcement: AnnouncementConfig) => void;
}

export const AnnouncementManagementPage: React.FC<AnnouncementManagementPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
  onOpenAnnouncementDetail,
}) => {
  const isDeveloper = session.role === 'developer';

  // Announcement State
  const [config, setConfig] = useState<AnnouncementConfig>(() => {
    if (appSettings.announcement) {
      return {
        ...DEFAULT_ANNOUNCEMENT_CONFIG,
        ...appSettings.announcement,
        targetUserWilayah: {
          ...createDefaultWilayahSwitches(true),
          ...(appSettings.announcement.targetUserWilayah || {}),
        },
        targetAdminWilayah: {
          ...createDefaultWilayahSwitches(true),
          ...(appSettings.announcement.targetAdminWilayah || {}),
        },
      };
    }
    return { ...DEFAULT_ANNOUNCEMENT_CONFIG };
  });

  // Sync if appSettings changes externally
  useEffect(() => {
    if (appSettings.announcement) {
      setConfig((prev) => ({
        ...prev,
        ...appSettings.announcement,
        targetUserWilayah: {
          ...createDefaultWilayahSwitches(true),
          ...(appSettings.announcement?.targetUserWilayah || {}),
        },
        targetAdminWilayah: {
          ...createDefaultWilayahSwitches(true),
          ...(appSettings.announcement?.targetAdminWilayah || {}),
        },
      }));
    }
  }, [appSettings.announcement]);

  // Image Upload state
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMetrics, setCompressionMetrics] = useState<{
    originalSizeKb: number;
    compressedSizeKb: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter for Region Switches
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'user' | 'admin'>('all');

  // Interactive Live Preview Tester modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Saving state, confirmation modal, and success modal
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingMaster, setIsTogglingMaster] = useState(false);
  const [realtimeSyncNotice, setRealtimeSyncNotice] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<{
    title: string;
    msg: string;
  } | null>(null);

  // Instant Real-Time Master Toggle Handler between Superadmin & Developer
  const handleToggleMasterActive = async () => {
    const nextActive = !config.active;

    // 1. Instant Optimistic UI update
    setConfig((prev) => ({ ...prev, active: nextActive }));
    setIsTogglingMaster(true);

    // Instant toast feedback
    setRealtimeSyncNotice(
      nextActive
        ? '🟢 Siaran Pengumuman Melayang DIAKTIFKAN (Tersinkronisasi Real-Time)'
        : '⚪ Siaran Pengumuman Melayang DINONAKTIFKAN (Tersinkronisasi Real-Time)'
    );

    const now = new Date();
    const dateFormatted = `${now.getDate()} ${
      ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][
        now.getMonth()
      ]
    } ${now.getFullYear()}`;

    const updatedAnnouncement: AnnouncementConfig = {
      ...config,
      active: nextActive,
      publishedAt: config.publishedAt || dateFormatted,
      publishedBy:
        session.role === 'developer' || session.isDeveloper
          ? 'Tim Developer Otoritas Pusat Dinsos Jabar'
          : 'Superadmin Otoritas Pusat Dinsos Jabar',
      updatedAt: Date.now(),
    };

    // 2. Persist locally to localStorage immediately so page reloads or logouts retain exact state
    try {
      localStorage.setItem('dinsos_announcement', JSON.stringify(updatedAnnouncement));
    } catch (e) {
      console.error('Local storage update error', e);
    }

    // 3. Fast async save to Firestore
    try {
      const newSettings: AppSettings = {
        ...appSettings,
        announcement: updatedAnnouncement,
      };

      await onSaveSettings(newSettings);
    } catch (err) {
      console.error('Failed to toggle announcement in realtime:', err);
      // Revert on error
      setConfig((prev) => ({ ...prev, active: !nextActive }));
      setRealtimeSyncNotice('⚠️ Gagal menyinkronkan status ke server. Coba lagi.');
    } finally {
      setIsTogglingMaster(false);
      setTimeout(() => {
        setRealtimeSyncNotice(null);
      }, 3500);
    }
  };

  // Filtered regions based on search
  const filteredRegions = KAB_KOTA_ONLY.filter((r) =>
    r.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Counters
  const activeUserCount = Object.values(config.targetUserWilayah || {}).filter(Boolean).length;
  const activeAdminCount = Object.values(config.targetAdminWilayah || {}).filter(Boolean).length;

  // Handle Photo Upload with HTML5 Canvas Compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format file harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    setIsCompressing(true);
    try {
      // Compress to max 1000px width/height and quality 0.72 (~30KB-60KB base64)
      const res = await compressImage(file, 1000, 800, 0.72);
      setConfig((prev) => ({
        ...prev,
        photoUrl: res.base64,
        photoStorageSizeKb: res.sizeKb,
      }));
      setCompressionMetrics({
        originalSizeKb: res.originalSizeKb,
        compressedSizeKb: res.sizeKb,
      });
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Gagal memproses dan mengompresi gambar. Silakan gunakan file gambar lain.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Reset to default photo
  const handleResetPhoto = () => {
    setConfig((prev) => ({
      ...prev,
      photoUrl: DEFAULT_ANNOUNCEMENT_PHOTO,
      photoStorageSizeKb: 4,
    }));
    setCompressionMetrics(null);
  };

  // Batch Switch Controllers for User
  const handleToggleAllUser = (value: boolean) => {
    const next: Record<string, boolean> = {};
    KAB_KOTA_ONLY.forEach((w) => (next[w] = value));
    setConfig((prev) => ({ ...prev, targetUserWilayah: next }));
  };

  // Batch Switch Controllers for Admin
  const handleToggleAllAdmin = (value: boolean) => {
    const next: Record<string, boolean> = {};
    KAB_KOTA_ONLY.forEach((w) => (next[w] = value));
    setConfig((prev) => ({ ...prev, targetAdminWilayah: next }));
  };

  // Individual Switch for User Wilayah
  const handleToggleUserWilayah = (region: string) => {
    setConfig((prev) => ({
      ...prev,
      targetUserWilayah: {
        ...prev.targetUserWilayah,
        [region]: !prev.targetUserWilayah[region],
      },
    }));
  };

  // Individual Switch for Admin Wilayah
  const handleToggleAdminWilayah = (region: string) => {
    setConfig((prev) => ({
      ...prev,
      targetAdminWilayah: {
        ...prev.targetAdminWilayah,
        [region]: !prev.targetAdminWilayah[region],
      },
    }));
  };

  // Initiate save with validation & prompt confirmation modal
  const handleInitiateSave = () => {
    if (!config.title.trim()) {
      alert('Judul Pengumuman tidak boleh kosong.');
      return;
    }

    if (config.actionType === 'content' && !config.content.trim()) {
      alert('Isi Pengumuman tidak boleh kosong ketika pilihan "Isi Pengumuman" dipilih.');
      return;
    }

    if (config.actionType === 'url' && !config.linkUrl.trim()) {
      alert('Link URL Pengumuman tidak boleh kosong ketika pilihan "Link URL" dipilih.');
      return;
    }

    setShowConfirmModal(true);
  };

  // Save changes to Firestore
  const executeSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    try {
      const now = new Date();
      const dateFormatted = `${now.getDate()} ${
        ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][
          now.getMonth()
        ]
      } ${now.getFullYear()}`;

      const updatedAnnouncement: AnnouncementConfig = {
        ...config,
        publishedAt: dateFormatted,
        publishedBy:
          session.role === 'developer' || session.isDeveloper
            ? 'Tim Developer Otoritas Pusat Dinsos Jabar'
            : 'Superadmin Otoritas Pusat Dinsos Jabar',
        updatedAt: Date.now(),
      };

      try {
        localStorage.setItem('dinsos_announcement', JSON.stringify(updatedAnnouncement));
      } catch (e) {
        console.error('Failed to save to local storage:', e);
      }

      const newSettings: AppSettings = {
        ...appSettings,
        announcement: updatedAnnouncement,
      };

      await onSaveSettings(newSettings);

      setSaveSuccessNotice({
        title: 'Pengumuman Melayang Berhasil Disimpan!',
        msg: `Konfigurasi siaran pengumuman aktif untuk ${activeUserCount} wilayah Publik dan ${activeAdminCount} wilayah Admin. Pengunjung akan otomatis melihat pengumuman melayang selama 15 detik.`,
      });

      // Show the dedicated Success Popup Modal
      setShowSuccessModal(true);

      setTimeout(() => {
        setSaveSuccessNotice(null);
      }, 4000);
    } catch (e) {
      console.error('Failed to save announcement:', e);
      alert('Terjadi kesalahan saat menyimpan pengumuman ke Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Breadcrumb & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-top-announcement-manage" />

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-600 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs sm:text-sm font-extrabold shadow-xs transition-all cursor-pointer"
              title="Pratinjau tampilan melayang 15 detik"
            >
              <Eye className="w-4 h-4 text-emerald-700" />
              <span>Uji Tampil Melayang (15s)</span>
            </button>

            <button
              onClick={handleInitiateSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#043e2e] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#d4af37]/60 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert Toast */}
        {saveSuccessNotice && (
          <div className="bg-emerald-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-amber-400 flex items-start gap-3 animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-black text-amber-300">{saveSuccessNotice.title}</h4>
              <p className="text-xs text-emerald-100 font-medium mt-1 leading-relaxed">
                {saveSuccessNotice.msg}
              </p>
            </div>
          </div>
        )}

        {/* Real-time Toggle Feedback Toast */}
        {realtimeSyncNotice && (
          <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border-2 border-[#d4af37] flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div>
                <h5 className="text-xs font-black text-amber-300">Sinkronisasi Real-Time Sukses</h5>
                <p className="text-[11px] text-slate-200 font-medium">{realtimeSyncNotice}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#d4af37]/20 text-amber-300 px-2.5 py-1 rounded-full border border-[#d4af37]/40 shrink-0">
              Auto-Synced
            </span>
          </div>
        )}

        {/* Page Header Title */}
        <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border-2 border-[#d4af37]/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>FITUR KHUSUS KE-7 : TAMBAH PENGUMUMAN MELAYANG</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Pusat Kendali Pengumuman Melayang Real-Time
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed font-medium">
                Kelola siaran pengumuman interaktif yang otomatis tampil di layar melayang selama 15 detik ketika seseorang baru masuk ke dalam website. Status tombol siaran di bawah tersinkronisasi otomatis secara real-time antara Superadmin dan Developer.
              </p>
            </div>

            {/* Master Switch on Header */}
            <div className="bg-black/40 border border-amber-400/50 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center shrink-0 min-w-[220px] shadow-lg">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  Status Siaran Real-Time
                </span>
              </div>
              <button
                id="btn-toggle-master-announcement"
                type="button"
                onClick={handleToggleMasterActive}
                disabled={isTogglingMaster}
                className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer border ${
                  config.active
                    ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-900/50 hover:bg-emerald-600 scale-105'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                } ${isTogglingMaster ? 'opacity-70 animate-pulse' : ''}`}
                title="Klik untuk langsung mengaktifkan atau menonaktifkan siaran secara realtime"
              >
                <Radio className={`w-3.5 h-3.5 ${config.active ? 'animate-pulse text-amber-300' : 'text-slate-400'}`} />
                <span>
                  {isTogglingMaster
                    ? 'Menyinkronkan...'
                    : config.active
                    ? '🟢 AKTIF MELAYANG'
                    : '⚪ NON AKTIF'}
                </span>
              </button>
              <span className="text-[9px] text-amber-200/70 font-medium mt-1.5 text-center">
                Terhubung Superadmin &amp; Developer
              </span>
            </div>
          </div>
        </div>

        {/* Form Container Grid (2 Columns: Left Form Editor, Right Live Preview & Target Matrix) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Editor Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. UPLOAD FOTO PENGUMUMAN (LOW STORAGE PROFILE) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#043e2e]">Upload Foto Pengumuman</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Otomatis dikompresi agar hemat ruang penyimpanan Firebase (&lt; 60 KB)
                    </p>
                  </div>
                </div>

                {compressionMetrics && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    ⚡ {compressionMetrics.originalSizeKb} KB ➔ {compressionMetrics.compressedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Photo Preview Frame with matching selected border & background */}
              <div
                style={{
                  backgroundColor: config.frameColor || '#ffffff',
                  borderColor: config.frameBorderColor || '#e2e8f0',
                }}
                className="relative w-full p-2.5 rounded-xl border-2 shadow-xs group flex items-center justify-center transition-colors"
              >
                <div className="w-full relative rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={config.photoUrl || DEFAULT_ANNOUNCEMENT_PHOTO}
                    alt="Preview Pengumuman"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[220px] object-contain rounded-lg group-hover:scale-[1.015] transition-transform duration-300 block"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md hover:bg-slate-100 cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ganti Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPhoto}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-rose-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Default</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
                id="announcement-photo-input"
              />

              {/* Upload Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-700" />
                  <span>{isCompressing ? 'Mengompresi Gambar...' : 'Pilih & Kompres Foto Banner'}</span>
                </button>

                <button
                  onClick={handleResetPhoto}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Kembalikan ke Banner Resmi Dinas"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* 2. DURASI TAYANG PENGUMUMAN MELAYANG */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border-2 border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#043e2e]">Atur Waktu Pengumuman Melayang</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Pilih durasi hitung mundur otomatis sebelum pengumuman tertutup
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-3 py-1 rounded-full shadow-xs">
                  ⏱️ {config.displayDurationSeconds || 15} Detik
                </span>
              </div>

              {/* 5 Duration Option Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[10, 15, 20, 25, 30].map((sec) => {
                  const isSelected = (config.displayDurationSeconds || 15) === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, displayDurationSeconds: sec }))}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#043e2e] to-[#085a43] text-amber-300 border-[#d4af37] shadow-md scale-[1.03] font-black'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300 font-bold'
                      }`}
                    >
                      <span className="text-sm sm:text-base leading-none">{sec}s</span>
                      <span className="text-[10px] opacity-90 leading-tight">
                        {sec === 10 ? 'Cepat' : sec === 15 ? 'Standar' : sec === 20 ? 'Sedang' : sec === 25 ? 'Lama' : 'Maksimal'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 font-medium italic">
                * Hitung mundur berjalan 100% lancar dan sinkron per milidetik. Pengunjung juga dapat menjeda waktu dengan mengarahkan kursor ke atas pengumuman.
              </p>
            </div>

            {/* 3. PILIH WARNA / TEMA BINGKAI PENGUMUMAN */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border-2 border-amber-300/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Palette className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#043e2e]">Pilih Warna Bingkai Pengumuman</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Sesuaikan warna wadah/bingkai agar selaras dengan foto poster
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border border-slate-300 shadow-inner"
                    style={{ backgroundColor: config.frameColor || '#ffffff' }}
                    title="Warna Latar Saat Ini"
                  />
                  <div
                    className="w-5 h-5 rounded-full border-2 shadow-inner"
                    style={{ backgroundColor: config.frameBorderColor || '#e2e8f0', borderColor: '#d4af37' }}
                    title="Warna Garis Tepi Saat Ini"
                  />
                </div>
              </div>

              {/* Preset Color Themes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'white',
                    name: 'Putih Bersih',
                    desc: 'Latar Putih Bersih',
                    bg: '#ffffff',
                    border: '#e2e8f0',
                    tag: 'Default',
                  },
                  {
                    id: 'emerald',
                    name: 'Hijau Emerald',
                    desc: 'Khas Dinsos Jabar',
                    bg: '#043e2e',
                    border: '#d4af37',
                    tag: 'Resmi',
                  },
                  {
                    id: 'gold',
                    name: 'Emas Mewah',
                    desc: 'Gold Luxury',
                    bg: '#1c1608',
                    border: '#d4af37',
                    tag: 'Premium',
                  },
                  {
                    id: 'dark',
                    name: 'Hitam Klasik',
                    desc: 'Matte Dark Mode',
                    bg: '#0f172a',
                    border: '#334155',
                    tag: 'Modern',
                  },
                  {
                    id: 'navy',
                    name: 'Biru Sapphire',
                    desc: 'Biru Jabar Digital',
                    bg: '#0c1a30',
                    border: '#3b82f6',
                    tag: 'Eksekutif',
                  },
                  {
                    id: 'cream',
                    name: 'Krem Hangat',
                    desc: 'Warm Ivory Vintage',
                    bg: '#fcfaf6',
                    border: '#e5decb',
                    tag: 'Klasik',
                  },
                ].map((theme) => {
                  const isSelected =
                    (config.frameColor || '#ffffff').toLowerCase() === theme.bg.toLowerCase() &&
                    (config.frameBorderColor || '#e2e8f0').toLowerCase() === theme.border.toLowerCase();

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          frameColor: theme.bg,
                          frameBorderColor: theme.border,
                          frameTheme: theme.id,
                        }))
                      }
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 relative overflow-hidden ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-slate-400/50 shadow-xs"
                            style={{ backgroundColor: theme.bg }}
                          />
                          <span className="text-xs font-black text-slate-800">{theme.name}</span>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                          {theme.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">{theme.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Pickers */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl">
                <div className="text-xs font-bold text-slate-700">
                  <span>Atur Kustom Sendiri:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Background Picker */}
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span>Latar:</span>
                    <input
                      type="color"
                      value={config.frameColor || '#ffffff'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          frameColor: e.target.value,
                          frameTheme: 'custom',
                        }))
                      }
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      title="Pilih Warna Latar Bingkai"
                    />
                    <span className="font-mono text-[10px] uppercase text-slate-500">
                      {config.frameColor || '#FFFFFF'}
                    </span>
                  </label>

                  {/* Border Picker */}
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                    <span>Garis Tepi:</span>
                    <input
                      type="color"
                      value={config.frameBorderColor || '#e2e8f0'}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          frameBorderColor: e.target.value,
                          frameTheme: 'custom',
                        }))
                      }
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
                      title="Pilih Warna Garis Tepi Bingkai"
                    />
                    <span className="font-mono text-[10px] uppercase text-slate-500">
                      {config.frameBorderColor || '#E2E8F0'}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. KOLOM JUDUL & SUBJUDUL */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200 space-y-4">
              <h3 className="text-sm font-black text-[#043e2e] pb-2 border-b border-slate-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span>Judul & Subjudul Pengumuman</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Utama Pengumuman <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Contoh: Pemberitahuan Pemutakhiran Data Mandiri PSKS 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subjudul / Ringkasan Singkat
                  </label>
                  <input
                    type="text"
                    value={config.subtitle}
                    onChange={(e) => setConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Contoh: Sosialisasi Penataan Data 10 Pilar Kesejahteraan Sosial se-Jawa Barat"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 4. DUA PILIHAN TARGET AKSI (PILIH SALAH SATU) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border-2 border-amber-300/80 space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-sm font-black text-[#043e2e]">
                    Pilihan Aksi Saat Pengumuman Diklik (Wajib Pilih Salah Satu)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Tentukan apakah klik banner akan membuka Halaman Pengumuman Teks Lengkap atau Link Website luar.
                </p>
              </div>

              {/* 2 Segmented Radio Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pilihan 1 */}
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, actionType: 'content' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    config.actionType === 'content'
                      ? 'bg-amber-50/80 border-amber-500 shadow-md scale-[1.02]'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-[#043e2e]">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Pilihan 1: Isi Pengumuman</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        config.actionType === 'content'
                          ? 'border-amber-600 bg-amber-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {config.actionType === 'content' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Mengarahkan pengunjung ke <strong>Halaman Pengumuman</strong> yang menampilkan narasi teks lengkap &amp; dokumen rilis.
                  </p>
                </button>

                {/* Pilihan 2 */}
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, actionType: 'url' }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    config.actionType === 'url'
                      ? 'bg-blue-50/80 border-blue-500 shadow-md scale-[1.02]'
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-950">
                      <LinkIcon className="w-4 h-4 text-blue-600" />
                      <span>Pilihan 2: Link URL Web</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        config.actionType === 'url'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {config.actionType === 'url' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Langsung berpindah halaman / membuka <strong>Tautan Link Website</strong> yang diinput saat foto diklik.
                  </p>
                </button>
              </div>

              {/* Conditional Input Field Based on Selection */}
              {config.actionType === 'content' ? (
                <div className="space-y-2 pt-2 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-700">
                    Kolom Isi Pengumuman (Teks Narasi Lengkap) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={8}
                    value={config.content}
                    onChange={(e) => setConfig((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Tuliskan isi pengumuman lengkap secara terstruktur di sini..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-medium leading-relaxed focus:bg-white focus:border-amber-600 focus:outline-none transition-all"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-500">
                    <span>Mendukung baris baru, rincian nomor, dan format paragraf.</span>
                    <button
                      type="button"
                      onClick={() => onOpenAnnouncementDetail(config)}
                      className="text-amber-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lihat Tampilan Halaman Pengumuman</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-2 animate-fade-in">
                  <label className="block text-xs font-bold text-slate-700">
                    Kolom Input Link URL Pengumuman <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={config.linkUrl}
                        onChange={(e) => setConfig((prev) => ({ ...prev, linkUrl: e.target.value }))}
                        placeholder="https://dinsos.jabarprov.go.id/agenda-sosial"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                      />
                    </div>
                    {config.linkUrl && (
                      <a
                        href={config.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <span>Uji Link</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pengunjung yang mengklik banner pengumuman akan langsung dialihkan ke alamat website ini.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: 27 SWITCHES MATRIX (BEDAKAN DARI MAINTENANCE) & PREVIEW (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* SAKLAR TARGET AUDIENCE DASHBOARD */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-200 space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#043e2e]">
                        Matriks Saklar Target Pengumuman
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        27 Wilayah Publik &amp; 27 Admin Wilayah
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audience Status Counter Pills */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] font-extrabold uppercase text-emerald-800">
                      Tamu Publik
                    </div>
                    <div className="text-lg font-black text-emerald-900">
                      {activeUserCount} <span className="text-xs font-semibold text-slate-500">/ 27</span>
                    </div>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] font-extrabold uppercase text-indigo-800">
                      Admin Wilayah
                    </div>
                    <div className="text-lg font-black text-indigo-900">
                      {activeAdminCount} <span className="text-xs font-semibold text-slate-500">/ 27</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAKLAR KHUSUS TARGET SUPERADMIN (& DEVELOPER IF DEVELOPER SESSION) */}
              <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white rounded-2xl p-4 sm:p-5 border-2 border-amber-400/80 shadow-lg space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-amber-400/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider">
                      {isDeveloper ? 'SAKLAR KHUSUS SUPERADMIN & DEVELOPER' : 'SAKLAR KHUSUS SUPERADMIN'}
                    </span>
                  </div>
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                    TARGET PENGELOLA PUSAT
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 leading-relaxed font-medium">
                  {isDeveloper
                    ? 'Gunakan saklar di bawah ini untuk mengaktifkan siaran pengumuman melayang untuk akun Superadmin dan Developer (termasuk untuk memberi pengumuman kepada akun Anda sendiri saat masuk).'
                    : 'Gunakan saklar di bawah ini untuk mengaktifkan siaran pengumuman melayang bagi akun Superadmin saat masuk ke dalam portal.'}
                </p>

                <div className={`grid grid-cols-1 ${isDeveloper ? 'sm:grid-cols-2' : ''} gap-3 pt-1`}>
                  {/* Saklar Superadmin */}
                  <div className="bg-black/30 border border-amber-400/40 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                        <span>Akun Superadmin</span>
                      </div>
                      <p className="text-[10px] text-amber-200/80 mt-0.5">
                        {config.targetSuperadmin ? '🟢 Tayang untuk Superadmin' : '⚪ Tidak Ditayangkan'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          targetSuperadmin: !prev.targetSuperadmin,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        config.targetSuperadmin ? 'bg-amber-400' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          config.targetSuperadmin ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Saklar Developer - ONLY VISIBLE TO DEVELOPER ROLE */}
                  {isDeveloper && (
                    <div className="bg-black/30 border border-purple-400/40 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-purple-300" />
                          <span>Akun Developer</span>
                        </div>
                        <p className="text-[10px] text-purple-200/80 mt-0.5">
                          {config.targetDeveloper ? '🟢 Tayang untuk Developer' : '⚪ Tidak Ditayangkan'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            targetDeveloper: !prev.targetDeveloper,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          config.targetDeveloper ? 'bg-purple-400' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            config.targetDeveloper ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Audience Tab Filter */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-white text-[#043e2e] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua (54)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('user')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                    activeTab === 'user'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Publik ({activeUserCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Admin ({activeAdminCount})
                </button>
              </div>

              {/* Quick Batch Toggle Actions */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                {(activeTab === 'all' || activeTab === 'user') && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleAllUser(true)}
                      className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 text-center transition-colors cursor-pointer"
                    >
                      ✓ Semua Publik On
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllUser(false)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center transition-colors cursor-pointer"
                    >
                      ✕ Semua Publik Off
                    </button>
                  </>
                )}

                {(activeTab === 'all' || activeTab === 'admin') && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleAllAdmin(true)}
                      className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg border border-indigo-200 text-center transition-colors cursor-pointer"
                    >
                      ✓ Semua Admin On
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllAdmin(false)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center transition-colors cursor-pointer"
                    >
                      ✕ Semua Admin Off
                    </button>
                  </>
                )}
              </div>

              {/* Search Bar for Regions */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Kabupaten/Kota..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-600 transition-all"
                />
              </div>

              {/* Scrollable Region Switch Cards List */}
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {filteredRegions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Tidak ada wilayah yang sesuai dengan kata kunci "{searchQuery}"
                  </div>
                ) : (
                  filteredRegions.map((region) => {
                    const isUserOn = !!config.targetUserWilayah[region];
                    const isAdminOn = !!config.targetAdminWilayah[region];

                    return (
                      <div
                        key={region}
                        className="pt-2 pb-1 flex items-center justify-between gap-2 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                      >
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{region}</h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span className={isUserOn ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                              Publik: {isUserOn ? 'ON' : 'OFF'}
                            </span>
                            <span>•</span>
                            <span className={isAdminOn ? 'text-indigo-700 font-bold' : 'text-slate-400'}>
                              Admin: {isAdminOn ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>

                        {/* Dual Switch Controls (Publik & Admin) */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* User Toggle */}
                          {(activeTab === 'all' || activeTab === 'user') && (
                            <button
                              type="button"
                              onClick={() => handleToggleUserWilayah(region)}
                              className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer border ${
                                isUserOn
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                              title={`Ubah status pengumuman publik untuk ${region}`}
                            >
                              Publik {isUserOn ? 'ON' : 'OFF'}
                            </button>
                          )}

                          {/* Admin Toggle */}
                          {(activeTab === 'all' || activeTab === 'admin') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAdminWilayah(region)}
                              className={`px-2 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer border ${
                                isAdminOn
                                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                              title={`Ubah status pengumuman admin untuk ${region}`}
                            >
                              Admin {isAdminOn ? 'ON' : 'OFF'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* LIVE PREVIEW TEST CARD */}
            <div className="bg-gradient-to-br from-amber-50 to-emerald-50 rounded-2xl p-5 border border-amber-200/80 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#043e2e]">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Simulasi Layar Pengumuman Melayang</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Klik tombol di bawah ini untuk melihat simulasi langsung popup melayang 15 detik dengan hitung mundur dan penutupan interaktif.
              </p>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full py-2.5 px-4 bg-[#043e2e] hover:bg-[#065e44] text-amber-300 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-400/40"
              >
                <Eye className="w-4 h-4 text-amber-300" />
                <span>Uji Tampil Melayang Sekarang (15s)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar Actions */}
        <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-announcement-manage" />

          <button
            onClick={handleInitiateSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#043e2e] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#d4af37]/60 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-300" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal Before Publishing */}
      {showConfirmModal && (
        <div
          id="confirm-publish-announcement-overlay"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-overlay-fade"
          onClick={() => !isSaving && setShowConfirmModal(false)}
        >
          <div
            id="confirm-publish-announcement-card"
            className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-[#d4af37] overflow-hidden animate-pop-spring"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#043e2e] via-[#065e44] to-[#043e2e] text-white p-5 sm:p-6 border-b border-[#d4af37]/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
                <AlertCircle className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-300">
                  Konfirmasi Publikasi Pengumuman
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Pusat Kendali Pengumuman Melayang Real-Time Jabar
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  Apakah Anda yakin akan mempublikasikan pengumuman?
                </p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Pengumuman melayang ini akan segera disiarkan secara real-time ke database dan otomatis tampil selama {config.displayDurationSeconds || 15} detik bagi pengunjung yang baru masuk ke dalam portal.
                </p>
              </div>

              {/* Quick Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Judul Siaran:</span>
                  <span className="font-bold text-slate-800 text-right line-clamp-1">
                    {config.title}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Status & Durasi:</span>
                  <span className={`font-black ${config.active ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {config.active ? `🟢 Siaran Aktif Melayang (${config.displayDurationSeconds || 15} Detik)` : '⚪ Disimpan Draf (Nonaktif)'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 font-medium">Pilihan Aksi:</span>
                  <span className="font-bold text-slate-800">
                    {config.actionType === 'content'
                      ? 'Pilihan 1: Isi Narasi Pengumuman Lengkap'
                      : 'Pilihan 2: Link URL Website Eksternal'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Target Sasaran:</span>
                  <div className="flex flex-wrap gap-1.5 text-[11px] font-bold text-emerald-800">
                    <span className="bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      Publik: {activeUserCount} Kab/Kota
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-300">
                      Admin: {activeAdminCount} Kab/Kota
                    </span>
                    <span className={`px-2 py-0.5 rounded border ${config.targetSuperadmin ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      Superadmin: {config.targetSuperadmin ? 'Aktif' : 'Off'}
                    </span>
                    {isDeveloper && (
                      <span className={`px-2 py-0.5 rounded border ${config.targetDeveloper ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        Developer: {config.targetDeveloper ? 'Aktif' : 'Off'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeSave}
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#043e2e] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#d4af37]/60 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>Ya, Publikasikan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup Modal After Publishing */}
      {showSuccessModal && (
        <div
          id="success-publish-announcement-overlay"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-overlay-fade"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            id="success-publish-announcement-card"
            className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-[#d4af37] overflow-hidden animate-pop-spring text-center p-6 sm:p-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>SIARAN TERSIMPAN</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#043e2e]">
                Pengumuman Berhasil Dipublikasikan!
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Pengumuman melayang telah sukses disimpan di database dan disiarkan secara real-time ke seluruh target yang diaktifkan di Jawa Barat.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 font-bold text-left space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 font-black">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Status Siaran Melayang Real-Time:</span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium">
                {config.active
                  ? `Pengumuman aktif melayang selama 15 detik untuk ${activeUserCount} wilayah Publik dan ${activeAdminCount} wilayah Admin.`
                  : 'Pengumuman tersimpan sebagai draf (saat ini nonaktif).'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#043e2e] to-[#085a43] hover:from-[#065e44] hover:to-[#0a6f53] text-amber-300 font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-[#d4af37]/60"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      )}

      {/* Interactive Modal Preview */}
      <FloatingAnnouncementModal
        isOpen={isPreviewOpen}
        announcement={config}
        onClose={() => setIsPreviewOpen(false)}
        onOpenDetail={() => {
          setIsPreviewOpen(false);
          onOpenAnnouncementDetail(config);
        }}
      />
    </div>
  );
};
