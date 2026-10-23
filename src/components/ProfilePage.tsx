import React, { useState } from 'react';
import { AppSettings } from '../types';
import { OFFICIAL_KADINAS_PHOTO } from '../assets/officialKadinasPhoto';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Quote, 
  UserCheck,
  Scale,
  Target,
  Compass,
  FileText,
  CheckCircle2,
  Database,
  Building2,
  Flame,
  Network,
  Briefcase,
  MapPin,
  HeartHandshake,
  Landmark,
  Layers,
  ArrowRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { BackToHomeButton } from './BackToHomeButton';

interface ProfilePageProps {
  appSettings?: AppSettings;
  onBackToHome?: () => void;
  subView?: 'kadinas' | 'visi_misi' | 'struktur' | 'tupoksi';
  onSwitchSubView?: (view: 'kadinas' | 'visi_misi' | 'struktur' | 'tupoksi') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  appSettings,
  onBackToHome,
  subView = 'kadinas',
  onSwitchSubView,
}) => {
  const [currentView, setCurrentView] = useState<'kadinas' | 'visi_misi' | 'struktur' | 'tupoksi'>(subView);

  React.useEffect(() => {
    if (subView) {
      setCurrentView(subView);
    }
  }, [subView]);

  // Autoscroll to top of profile page when view changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  const getKadinasPhoto = React.useCallback(() => {
    const fs = appSettings?.kadinasPhotoUrl;
    if (fs && fs !== 'LOCAL_STORAGE_SAVED_PHOTO' && !fs.startsWith('C:') && !fs.startsWith('file:') && !fs.includes('Users\\')) {
      return fs;
    }
    const local = typeof window !== 'undefined' ? localStorage.getItem('dinsos_kadinas_photo_url') : null;
    if (local && local !== 'LOCAL_STORAGE_SAVED_PHOTO' && !local.startsWith('C:') && !local.startsWith('file:') && !local.includes('Users\\')) {
      return local;
    }
    return OFFICIAL_KADINAS_PHOTO;
  }, [appSettings?.kadinasPhotoUrl]);

  const [currentPhoto, setCurrentPhoto] = React.useState<string>(getKadinasPhoto);

  React.useEffect(() => {
    setCurrentPhoto(getKadinasPhoto());
  }, [getKadinasPhoto]);

  const kadinasName = appSettings?.kadinasName || 'Noneng Komara Nengsih, S.E., M.A.P.';
  const profileSubtitle = appSettings?.profileSubtitle || 'Kepala Dinas Sosial Provinsi Jawa Barat';
  const profileGreeting = appSettings?.profileGreeting || 'Assalamualaikum Wr. Wb.';
  const profileBody = appSettings?.profileBody || `Selamat Datang di Website Resmi Sistem Informasi Potensi dan Sumber Kesejahteraan Sosial (PSKS) Dinas Sosial Provinsi Jawa Barat. Semoga Dengan Adanya Portal Terintegrasi Ini Bisa Membantu Masyarakat, Relawan, Serta Seluruh Mitra Kerja Sosial Untuk Mendapatkan Informasi Yang Transparan, Akurat, dan Terpadu Berkaitan Dengan Penyelenggaraan Kesejahteraan Sosial di 27 Kabupaten/Kota se-Jawa Barat.

Semoga Upaya Kolaboratif Ini Mampu Memperkuat Sinergi 10 Pilar PSKS Dalam Menangani Berbagai Masalah Kesejahteraan Sosial Secara Tanggap, Terukur, dan Berkelanjutan Demi Mewujudkan Jawa Barat Juara Lahir dan Batin.`;
  const profileClosing = appSettings?.profileClosing || 'Wassalamualaikum Wr. Wb.';

  const bodyParagraphs = profileBody.split('\n').filter((p) => p.trim().length > 0);

  const dasarHukumList = [
    {
      nomor: 'Undang-Undang RI No. 11 Tahun 2009',
      tentang: 'Kesejahteraan Sosial',
      deskripsi: 'Landasan hukum utama penyelenggaraan kesejahteraan sosial di Indonesia yang mengatur upaya terarah, terpadu, dan berkelanjutan untuk memenuhi kebutuhan dasar setiap warga negara serta pemberdayaan potensi dan sumber daya sosial.',
      kategori: 'Undang-Undang Pokok',
      icon: Scale,
    },
    {
      nomor: 'Undang-Undang RI No. 23 Tahun 2014',
      tentang: 'Pemerintahan Daerah',
      deskripsi: 'Menetapkan pembagian urusan pemerintahan konkuren di bidang sosial antara Pemerintah Pusat, Pemerintah Daerah Provinsi, dan Pemerintah Daerah Kabupaten/Kota serta kewenangan pembinaan terhadap pilar-pilar sosial wilayah.',
      kategori: 'Undang-Undang Otonomi',
      icon: Landmark,
    },
    {
      nomor: 'Peraturan Pemerintah No. 39 Tahun 2012',
      tentang: 'Penyelenggaraan Kesejahteraan Sosial',
      deskripsi: 'Mengatur secara rinci mengenai rehabilitasi sosial, jaminan sosial, pemberdayaan sosial, dan perlindungan sosial, serta tata cara peran serta masyarakat dan pilar PSKS dalam pembangunan sosial.',
      kategori: 'Peraturan Pemerintah',
      icon: FileText,
    },
    {
      nomor: 'Permensos RI No. 08 Tahun 2012',
      tentang: 'Pedoman Pendataan dan Pengelolaan Data PMKS dan PSKS',
      deskripsi: 'Pedoman standar verifikasi, klasifikasi, pemutakhiran, dan validasi data Pemerlu Pelayanan Kesejahteraan Sosial (PPKS) serta 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS) berbasis sistem informasi terintegrasi.',
      kategori: 'Peraturan Menteri',
      icon: Database,
    },
    {
      nomor: 'Permensos Terkait 10 Pilar PSKS',
      tentang: 'Regulasi Khusus Eksistensi & Pembinaan Tiap Pilar Sosial',
      deskripsi: 'Mencakup regulasi kementerian terkait standar kompetensi, tugas pokok, dan pembinaan 10 Pilar PSKS: Pekerja Sosial Profesional, PSM (Permensos No. 10/2019), TAGANA (Permensos No. 28/2012), LKS (Permensos No. 184/2011 & No. 5/2019), Karang Taruna (Permensos No. 25/2019), LK3, PENSOS, TKSK (Permensos No. 28/2018), Kelompok Usaha Bersama (KUBE / Badan Usaha Sosial), dan SLRT Puskesos.',
      kategori: 'Regulasi Pilar',
      icon: Layers,
    },
    {
      nomor: 'Peraturan Daerah Prov. Jabar No. 10 Tahun 2012',
      tentang: 'Penyelenggaraan Kesejahteraan Sosial di Jawa Barat',
      deskripsi: 'Payung hukum kebijakan daerah Provinsi Jawa Barat untuk mempercepat penanganan kemiskinan, kebencanaan, dan kerentanan sosial melalui penguatan kelembagaan dan kemitraan strategis 10 Pilar PSKS se-Jawa Barat.',
      kategori: 'Peraturan Daerah Prov. Jabar',
      icon: Landmark,
    },
    {
      nomor: 'Peraturan Gubernur Jabar No. 89 Tahun 2017',
      tentang: 'Tupoksi dan Tata Kerja Dinas Sosial Provinsi Jawa Barat',
      deskripsi: 'Pedoman pelaksanaan tugas pokok, fungsi, perumusan kebijakan teknis operasional, pembinaan, fasilitasi, pengawasan, serta standarisasi mutu layanan sosial di seluruh wilayah Provinsi Jawa Barat.',
      kategori: 'Peraturan Gubernur Jabar',
      icon: FileText,
    },
  ];

  const tujuanWebsiteList = [
    {
      judul: 'Sentralisasi & Integrasi Data 10 Pilar PSKS',
      poin: 'Menyatukan database seluruh anggota dan lembaga dari 10 Pilar PSKS (PEKSOS, PSM, TAGANA, LKS, Karang Taruna, LK3, PENSOS, TKSK, KUBE/Badan Usaha Sosial, dan SLRT Puskesos) di 27 Kabupaten/Kota Jawa Barat dalam satu pintu portal digital resmi.',
      icon: Database,
      warna: 'from-emerald-600 to-teal-700',
    },
    {
      judul: 'Pemetaan Geospasial Wilayah Sebaran',
      poin: 'Menyajikan visualisasi interaktif peta potensi dan sebaran kekuatan sosial di tingkat provinsi hingga 27 kabupaten/kota guna mendukung pengambilan kebijakan sosial berbasis data (data-driven policy) yang presisi.',
      icon: MapPin,
      warna: 'from-emerald-700 to-green-800',
    },
    {
      judul: 'Transparansi & Akuntabilitas Publik',
      poin: 'Menjamin keterbukaan informasi publik terkait capaian program, profil lembaga pilar sosial, berita resmi kedinasan, dan statistik kegiatan penanganan permasalahan sosial secara transparan, akurat, dan dapat dipertanggungjawabkan.',
      icon: ShieldCheck,
      warna: 'from-blue-600 to-indigo-700',
    },
    {
      judul: 'Akselerasi Respon Penanganan PPKS',
      poin: 'Mempercepat alur koordinasi lapangan lintas pilar relawan saat terjadi kerentanan sosial, bencana alam, maupun kebutuhan bantuan darurat bagi Pemerlu Pelayanan Kesejahteraan Sosial (PPKS).',
      icon: HeartHandshake,
      warna: 'from-rose-600 to-red-700',
    },
    {
      judul: 'Efisiensi Administrasi & Pendataan Terpadu',
      poin: 'Memangkas birokrasi verifikasi pendaftaran anggota dan kelembagaan melalui sistem pendataan daring terstruktur yang divalidasi langsung secara berjenjang oleh Admin Wilayah dan Superadmin Provinsi.',
      icon: TrendingUp,
      warna: 'from-violet-600 to-purple-800',
    },
  ];

  const misiList = [
    {
      nomor: '01',
      judul: 'Peningkatan Kualitas Pelayanan Sosial',
      deskripsi: 'Meningkatkan mutu, kecepatan, dan keterjangkauan pelayanan rehabilitasi sosial, jaminan sosial, serta perlindungan sosial bagi seluruh Pemerlu Pelayanan Kesejahteraan Sosial (PPKS) secara adil dan merata.',
    },
    {
      nomor: '02',
      judul: 'Penguatan Kapasitas & Kompetensi 10 Pilar PSKS',
      deskripsi: 'Memberdayakan, membina, dan meningkatkan kapasitas SDM serta kelembagaan 10 Pilar Potensi dan Sumber Kesejahteraan Sosial sebagai garda terdepan penanganan masalah sosial di Jawa Barat.',
    },
    {
      nomor: '03',
      judul: 'Transformasi Digital & Akurasi Data Sosial',
      deskripsi: 'Mengembangkan sistem pendataan dan ekosistem digital terpadu berbasis geospasial yang mutakhir, transparan, dan terintegrasi untuk menjamin efektivitas program bantuan dan intervensi sosial.',
    },
    {
      nomor: '04',
      judul: 'Pengembangan Kemitraan Strategis & Kolaborasi',
      deskripsi: 'Memperluas jejaring kerja sama lintas sektor dengan dunia usaha (CSR), akademisi, organisasi kemasyarakatan, dan komunitas sosial guna mewujudkan kemandirian kesejahteraan masyarakat.',
    },
    {
      nomor: '05',
      judul: 'Tata Kelola Pemerintahan yang Adaptif & Akuntabel',
      deskripsi: 'Mewujudkan tata kelola birokrasi Dinas Sosial yang bersih, inovatif, responsif terhadap kebencanaan, serta menjunjung tinggi integritas dalam melayani masyarakat Jawa Barat.',
    },
  ];

  return (
    <div id="profil-section" className="min-h-screen bg-slate-50/80 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER TOP BAR & BACK BUTTON */}
        {onBackToHome && (
          <div id="profile-top-anchor" className="flex flex-wrap items-center justify-between gap-3">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-top-profile" />
            <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200/90 px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#043e2e]" />
              <span>Profil Resmi Dinas Sosial Provinsi Jawa Barat</span>
            </div>
          </div>
        )}

        {/* IN-PAGE PROFILE SUB-NAVIGATION TABS */}
        <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200/90 shadow-sm flex flex-wrap gap-1 sm:gap-2">
          {[
            { id: 'kadinas', label: 'Sambutan Kepala Dinas', icon: UserCheck },
            { id: 'visi_misi', label: 'Visi & Misi', icon: Target },
            { id: 'struktur', label: 'Struktur Organisasi', icon: Users },
            { id: 'tupoksi', label: 'Dasar Hukum & Tupoksi', icon: Scale },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCurrentView(tab.id as any);
                  onSwitchSubView?.(tab.id as any);
                }}
                className={`flex-1 min-w-[140px] sm:min-w-0 py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-[13px] transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#043e2e] text-amber-300 shadow-md border border-amber-400/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN 1: SAMBUTAN KEPALA DINAS SOSIAL PROVINSI JAWA BARAT                */}
        {/* ========================================================================= */}
        {currentView === 'kadinas' && (
          <section id="section-sambutan" className="scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl shadow-xl border border-emerald-950/10 p-6 sm:p-10 lg:p-12 relative overflow-hidden"
          >
            {/* Background Decorative Accent Gradients */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-amber-300/20 to-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-tr from-emerald-500/10 to-amber-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* PHOTO COLUMN */}
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full lg:w-80 shrink-0 flex flex-col items-center"
              >
                {/* Frame Badge Header */}
                <div className="mb-3 inline-flex items-center gap-1.5 bg-amber-100/90 border border-amber-300/80 text-[#043e2e] text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pimpinan Resmi Kedinasan</span>
                </div>

                {/* Photo Card with Gold Border & Ambient Glow */}
                <div className="relative w-full max-w-[290px] h-84 sm:h-96 rounded-2xl overflow-hidden shadow-2xl border-4 border-[#d4af37] group bg-slate-900">
                  {/* Permanent Base Image Layer (Guarantees Photo NEVER disappears) */}
                  <img
                    src={OFFICIAL_KADINAS_PHOTO}
                    alt={kadinasName}
                    className="absolute inset-0 w-full h-full object-cover object-top z-0"
                    loading="eager"
                  />

                  {/* Active Photo Layer if custom photo is loaded */}
                  {currentPhoto && currentPhoto !== OFFICIAL_KADINAS_PHOTO && (
                    <img
                      key={currentPhoto}
                      src={currentPhoto}
                      alt={kadinasName}
                      referrerPolicy="no-referrer"
                      onError={() => setCurrentPhoto(OFFICIAL_KADINAS_PHOTO)}
                      className="absolute inset-0 w-full h-full object-cover object-top z-1 transition-opacity duration-500 group-hover:scale-105"
                      loading="eager"
                    />
                  )}

                  {/* Verified Ribbon Badge on Photo */}
                  <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-r from-emerald-950/90 via-[#043e2e]/90 to-emerald-950/90 backdrop-blur-md text-white py-2 px-3 rounded-xl border border-amber-400/40 shadow-lg flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
                        Dinsos Prov. Jabar
                      </span>
                    </div>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                </div>

                {/* Subtitle Badge Box below Photo */}
                <div className="mt-5 w-full bg-gradient-to-r from-emerald-50 via-amber-50/50 to-emerald-50 border-l-4 border-[#043e2e] p-3.5 rounded-r-xl text-center sm:text-left shadow-xs border border-emerald-950/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider mb-0.5 justify-center sm:justify-start">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Jabatan Struktural</span>
                  </div>
                  <span className="text-xs font-black text-[#043e2e] block leading-snug">
                    {profileSubtitle}
                  </span>
                </div>
              </motion.div>

              {/* DETAILS & MESSAGE COLUMN */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 space-y-5"
              >
                {/* Header Titles */}
                <div className="space-y-2 border-b border-slate-200/80 pb-5">
                  <div className="inline-flex items-center gap-2 text-xs font-black text-[#b8901c] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md border border-amber-200/80 shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 text-[#b8901c]" />
                    <span>Sambutan Kepala Dinas</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#043e2e] leading-tight tracking-tight">
                    {kadinasName}
                  </h1>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
                    {profileSubtitle}
                  </h3>
                </div>

                {/* Message Body Paragraphs */}
                <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed text-justify relative">
                  <Quote className="absolute -top-3 -left-3 w-12 h-12 text-emerald-900/5 rotate-180 pointer-events-none" />

                  {/* Greeting */}
                  {profileGreeting && (
                    <p className="font-black text-[#043e2e] text-lg sm:text-xl tracking-tight text-left">
                      {profileGreeting}
                    </p>
                  )}

                  {/* Paragraphs */}
                  {bodyParagraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100/80 hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {/* Closing */}
                  {profileClosing && (
                    <p className="font-bold text-[#043e2e] italic pt-2 text-left flex items-center gap-2">
                      <span className="w-6 h-0.5 bg-[#d4af37] rounded-full inline-block" />
                      {profileClosing}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
        )}

        {/* ========================================================================= */}
        {/* BAGIAN 2: DASAR HUKUM LENGKAP PENYELENGGARAAN PSKS & DINAS SOSIAL JABAR   */}
        {/* ========================================================================= */}
        {currentView === 'tupoksi' && (
        <section id="section-dasar-hukum" className="scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl shadow-xl border border-emerald-950/10 p-6 sm:p-10 lg:p-12 relative overflow-hidden space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-black text-[#b8901c] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md border border-amber-200/80 shadow-2xs">
                  <Scale className="w-3.5 h-3.5 text-[#b8901c]" />
                  <span>Landasan Yuridis &amp; Regulasi Resmi</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#043e2e] tracking-tight">
                  Dasar Hukum Penyelenggaraan PSKS
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                  Seluruh program, pendataan, dan operasionalisasi Potensi dan Sumber Kesejahteraan Sosial (PSKS) di wilayah Provinsi Jawa Barat berlandaskan pada ketentuan perundang-undangan Republik Indonesia dan Peraturan Daerah Provinsi Jawa Barat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {dasarHukumList.map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className="bg-gradient-to-br from-slate-50 to-emerald-50/30 p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10.5px] font-black text-[#043e2e] bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {item.kategori}
                        </span>
                        <ItemIcon className="w-5 h-5 text-emerald-700/60 group-hover:text-emerald-700 group-hover:scale-110 transition-all shrink-0" />
                      </div>

                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#043e2e] group-hover:text-emerald-800 transition-colors">
                          {item.nomor}
                        </h4>
                        <p className="text-xs font-bold text-amber-800 mt-0.5">
                          Tentang: {item.tentang}
                        </p>
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed text-justify">
                        {item.deskripsi}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Berlaku Sah di Lingkungan Dinsos Prov. Jabar</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
        )}

        {/* ========================================================================= */}
        {/* BAGIAN 3: STRUKTUR ORGANISASI DINAS SOSIAL PROVINSI JAWA BARAT           */}
        {/* ========================================================================= */}
        {currentView === 'struktur' && (
        <section id="section-struktur-organisasi" className="scroll-mt-24 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl shadow-xl border border-emerald-950/10 p-6 sm:p-10 lg:p-12 relative overflow-hidden space-y-8"
          >
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-black text-[#b8901c] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md border border-amber-200/80 shadow-2xs">
                  <Network className="w-3.5 h-3.5 text-[#b8901c]" />
                  <span>Bagan Kelembagaan &amp; Tata Kerja Resmi</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#043e2e] tracking-tight">
                  Struktur Organisasi Dinas Sosial Provinsi Jawa Barat
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                  Bagan susunan organisasi kelembagaan Dinas Sosial Provinsi Jawa Barat beserta tata hubungan pembinaan dan koordinasi berjenjang terhadap 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS) di 27 Kabupaten/Kota se-Jawa Barat.
                </p>
              </div>
            </div>

            {/* LEVEL 1: PUCUK PIMPINAN KEDINASAN */}
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xl bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] text-white rounded-2xl p-5 border-2 border-[#d4af37] shadow-xl text-center relative overflow-hidden group">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2">
                  <Award className="w-3 h-3 text-amber-300" />
                  <span>Pucuk Pimpinan Kedinasan</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white mb-1">
                  Kepala Dinas Sosial Provinsi Jawa Barat
                </h3>
                <div className="text-sm font-bold text-amber-300 mb-2">
                  {kadinasName}
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-lg mx-auto">
                  Memimpin perumusan kebijakan teknis operasional, pembinaan aparatur, penyelenggaraan pelayanan sosial, koordinasi lintas instansi, serta pertanggungjawaban umum urusan sosial se-Provinsi Jawa Barat.
                </p>
              </div>

              {/* Vertical Connector Line */}
              <div className="w-0.5 h-6 bg-[#043e2e]/40 my-1" />

              {/* LEVEL 2: SEKRETARIAT DINAS SOSIAL */}
              <div className="w-full max-w-2xl bg-slate-50 border-2 border-emerald-900/20 rounded-2xl p-4 sm:p-5 shadow-sm text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-[10.5px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider mb-1.5 border border-emerald-300/60">
                  <Briefcase className="w-3 h-3 text-emerald-700" />
                  <span>Unsur Pelayanan Administrasi &amp; Manajemen</span>
                </div>
                <h4 className="text-base font-black text-[#043e2e]">
                  Sekretariat Dinas Sosial Provinsi Jawa Barat
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto">
                  Mengoordinasikan perumusan rencana kerja, pengelolaan administrasi umum, kepegawaian, keuangan, aset, hubungan masyarakat, serta akselerasi transformasi sistem informasi digital.
                </p>

                {/* Subbagian Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] font-black text-[#043e2e] block">Subbag Perencanaan &amp; Program</span>
                    <span className="text-[10px] text-slate-500 font-medium">Penyusunan RKA &amp; Evaluasi Kinerja</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] font-black text-[#043e2e] block">Subbag Keuangan &amp; Aset</span>
                    <span className="text-[10px] text-slate-500 font-medium">Pengelolaan Anggaran &amp; BMD</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] font-black text-[#043e2e] block">Subbag Kepegawaian &amp; Umum</span>
                    <span className="text-[10px] text-slate-500 font-medium">SDM Aparatur, Surat &amp; Logistik</span>
                  </div>
                </div>
              </div>

              {/* Vertical Connector Line */}
              <div className="w-0.5 h-6 bg-[#043e2e]/40 my-1" />
            </div>

            {/* LEVEL 3: 4 BIDANG TEKNIS UTAMA & PEMBINA 10 PILAR PSKS */}
            <div className="space-y-3">
              <div className="text-center space-y-1">
                <span className="text-xs font-black text-[#043e2e] uppercase tracking-wider bg-amber-100/90 border border-amber-300/80 px-3 py-1 rounded-full inline-block">
                  Unsur Pelaksana Teknis &amp; Pembina 10 Pilar PSKS
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#043e2e]">
                  4 Bidang Teknis Operasional Dinas Sosial Jabar
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* 1. Bidang Pemberdayaan Sosial */}
                <div className="bg-gradient-to-br from-emerald-50/60 to-white p-5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-500 transition-all shadow-xs flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#043e2e] leading-snug">
                          Bidang Pemberdayaan Sosial (Dayasos)
                        </h4>
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                          Pembina Kelembagaan &amp; Sumber Kesejahteraan
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                      Bertugas merumuskan kebijakan operasional, fasilitasi, penguatan kelembagaan sosial, peningkatan kompetensi, serta pengembangan kemitraan strategis dengan potensi sumber kesejahteraan sosial masyarakat.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-100">
                    <span className="text-[10px] font-black text-[#043e2e] uppercase tracking-wider block mb-1.5">
                      Pilar PSKS Terkait:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['PEKSOS Profesional', 'PSM', 'Karang Taruna', 'PENSOS', 'KUBE / Usaha Sosial'].map((p, pIdx) => (
                        <span key={pIdx} className="bg-white text-emerald-900 border border-emerald-300 text-[10.5px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Bidang Perlindungan & Jaminan Sosial */}
                <div className="bg-gradient-to-br from-rose-50/60 to-white p-5 rounded-2xl border-2 border-rose-200 hover:border-rose-400 transition-all shadow-xs flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-rose-700 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#043e2e] leading-snug">
                          Bidang Perlindungan &amp; Jaminan Sosial (Linjamsos)
                        </h4>
                        <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">
                          Penanggulangan Bencana &amp; Jaminan Sosial
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                      Bertugas menyelenggarakan perlindungan sosial korban bencana alam dan bencana sosial, mitigasi risiko kedaruratan, kesiapsiagaan logistik evakuasi, serta penyaluran jaminan sosial bagi keluarga korban bencana.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-rose-100">
                    <span className="text-[10px] font-black text-[#043e2e] uppercase tracking-wider block mb-1.5">
                      Pilar PSKS Terkait:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['TAGANA (Taruna Siaga Bencana)', 'Relawan Kebencanaan', 'Satgas Logistik Bencana'].map((p, pIdx) => (
                        <span key={pIdx} className="bg-white text-rose-900 border border-rose-300 text-[10.5px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Bidang Rehabilitasi Sosial */}
                <div className="bg-gradient-to-br from-blue-50/60 to-white p-5 rounded-2xl border-2 border-blue-200 hover:border-blue-400 transition-all shadow-xs flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                        <Scale className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#043e2e] leading-snug">
                          Bidang Rehabilitasi Sosial (Rehsos)
                        </h4>
                        <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">
                          Pelayanan PPKS, Disabilitas, Lansia &amp; Anak
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                      Bertugas merumuskan kebijakan dan menyelenggarakan pelayanan rehabilitasi sosial berbasis lembaga dan keluarga bagi penyandang disabilitas, anak telantar, lanjut usia rentan, dan korban tindak kekerasan sosial.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-100">
                    <span className="text-[10px] font-black text-[#043e2e] uppercase tracking-wider block mb-1.5">
                      Pilar PSKS Terkait:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['LKS (Lembaga Kesejahteraan Sosial)', 'LK3 (Konsultasi Kesejahteraan Keluarga)'].map((p, pIdx) => (
                        <span key={pIdx} className="bg-white text-blue-900 border border-blue-300 text-[10.5px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Bidang Penanganan Fakir Miskin */}
                <div className="bg-gradient-to-br from-amber-50/60 to-white p-5 rounded-2xl border-2 border-amber-200 hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-[#043e2e] leading-snug">
                          Bidang Penanganan Fakir Miskin (PFM)
                        </h4>
                        <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                          Penanggulangan Kemiskinan &amp; Layanan Terpadu
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed text-justify">
                      Bertugas mengoordinasikan verifikasi dan validasi data kemiskinan terpadu, intervensi bantuan sosial ekonomi keluarga rentan miskin, serta mengoptimalkan jejaring sistem rujukan sosial di tingkat kecamatan dan desa.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-100">
                    <span className="text-[10px] font-black text-[#043e2e] uppercase tracking-wider block mb-1.5">
                      Pilar PSKS Terkait:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['TKSK (Kecamatan)', 'SLRT & Puskesos (Pusat Kesejahteraan Sosial)'].map((p, pIdx) => (
                        <span key={pIdx} className="bg-white text-amber-900 border border-amber-300 text-[10.5px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LEVEL 4 & 5: UPTD / BALAI & TATA HUBUNGAN KEWILAYAHAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-black text-[#043e2e] uppercase tracking-wider mb-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  <span>UPTD &amp; Balai Pelayanan Sosial Provinsi</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unit Pelaksana Teknis Daerah yang menyelenggarakan pelayanan langsung rehabilitasi dan perlindungan sosial di lapangan, antara lain Balai Rehabilitasi Sosial Disabilitas, Balai Perlindungan Sosial Tresna Werdha (Lansia), Balai Rehabilitasi Sosial Anak dan Remaja, serta Balai Perlindungan Sosial Karya Wanita se-Jawa Barat.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-black text-[#043e2e] uppercase tracking-wider mb-2">
                  <Landmark className="w-4 h-4 text-amber-700" />
                  <span>Kemitraan Wilayah 27 Kab/Kota &amp; Relawan</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menjalin sinergi koordinasi horizontal dan vertikal bersama Dinas Sosial Pemerintah Kabupaten/Kota se-Jawa Barat, Camat, Kepala Desa/Lurah, serta membina seluruh pengurus dan anggota 10 Pilar PSKS hingga ke pelosok wilayah rukun warga dan komunitas.
                </p>
              </div>
            </div>
          </motion.div>

          {/* BAGIAN TUJUAN SISTEM INFORMASI PSKS JABAR (TANPA KARTU PINTAR) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl shadow-xl border border-emerald-950/10 p-6 sm:p-10 lg:p-12 relative overflow-hidden space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-black text-[#b8901c] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md border border-amber-200/80 shadow-2xs">
                  <Target className="w-3.5 h-3.5 text-[#b8901c]" />
                  <span>Fungsi &amp; Maksud Pengembangan Portal</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#043e2e] tracking-tight">
                  Tujuan Strategis Sistem Informasi PSKS Jabar
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                  Portal Sistem Informasi PSKS Jabar dikembangkan sebagai instrumen transformasi data digital terintegrasi untuk memperkuat koordinasi, keterbukaan informasi, dan percepatan penyelenggaraan kesejahteraan sosial.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {tujuanWebsiteList.map((tujuan, idx) => {
                const IconComponent = tujuan.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="space-y-3 relative z-10">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tujuan.warna} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <h4 className="text-base font-black text-[#043e2e] group-hover:text-emerald-800 transition-colors leading-snug">
                        {tujuan.judul}
                      </h4>

                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed text-justify">
                        {tujuan.poin}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 relative z-10 flex items-center text-[11.5px] font-bold text-emerald-800 gap-1">
                      <span>Fokus #{idx + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto text-emerald-600 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>
        )}

        {/* ========================================================================= */}
        {/* BAGIAN 4: VISI & MISI RESMI DINAS SOSIAL PROVINSI JAWA BARAT              */}
        {/* ========================================================================= */}
        {currentView === 'visi_misi' && (
        <section id="section-visi-misi" className="scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-3xl shadow-xl border border-emerald-950/10 p-6 sm:p-10 lg:p-12 relative overflow-hidden space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-black text-[#b8901c] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-md border border-amber-200/80 shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-[#b8901c]" />
                  <span>Arah Kebijakan &amp; Cita-Cita Bersama</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#043e2e] tracking-tight">
                  Visi &amp; Misi Dinas Sosial Jawa Barat
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                  Komitmen teguh Dinas Sosial Provinsi Jawa Barat bersama 10 Pilar Potensi dan Sumber Kesejahteraan Sosial dalam mewujudkan masyarakat yang adil, mandiri, dan bermartabat.
                </p>
              </div>
            </div>

            {/* VISI CARD UTAMA */}
            <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>VISI DINAS SOSIAL PROVINSI JAWA BARAT</span>
                </div>

                <p className="text-lg sm:text-2xl lg:text-3xl font-black text-white leading-snug tracking-tight text-justify sm:text-left">
                  &ldquo;Terwujudnya Jawa Barat Juara Lahir Batin Melalui Penyelenggaraan Kesejahteraan Sosial yang Berkeadilan, Inklusif, Profesional, dan Berdaya Saing.&rdquo;
                </p>

                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                  Fokus utama visi adalah pemenuhan hak-hak dasar warga negara, perlindungan kelompok rentan, serta penguatan peran aktif 10 Pilar PSKS sebagai pilar pembangunan kesejahteraan sosial daerah.
                </p>
              </div>
            </div>

            {/* MISI LIST CARDS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-black text-[#043e2e] uppercase tracking-wider">
                <Layers className="w-4 h-4 text-[#d4af37]" />
                <span>5 MISI STRATEGIS PENYELENGGARAAN KESEJAHTERAAN SOSIAL</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {misiList.map((misi, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                    className="bg-slate-50 hover:bg-emerald-50/40 p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-500/40 transition-all flex gap-4 items-start group shadow-2xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#043e2e] group-hover:bg-[#d4af37] text-white group-hover:text-[#043e2e] font-black text-sm flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300">
                      {misi.nomor}
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm sm:text-base font-black text-[#043e2e] leading-snug">
                        {misi.judul}
                      </h4>
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed text-justify">
                        {misi.deskripsi}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Extra Value Card (Tata Nilai Utama) */}
                <div className="bg-gradient-to-br from-amber-50 to-emerald-50/50 p-5 rounded-2xl border-2 border-dashed border-[#d4af37]/60 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-[#043e2e] uppercase tracking-wider">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>TATA NILAI BUDAYA KERJA DINAS SOSIAL</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Integritas', 'Empati Sosial', 'Inklusif & Humanis', 'Responsif Cepat', 'Kolaboratif'].map((val, vIdx) => (
                        <span
                          key={vIdx}
                          className="bg-white text-[#043e2e] border border-amber-300/70 text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-2xs"
                        >
                          ✓ {val}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                      Menjadi pedoman perilaku dan dedikasi bagi aparatur sipil negara dan relawan 10 Pilar PSKS dalam melayani seluruh lapisan masyarakat Jawa Barat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
        )}

        {/* BOTTOM BACK TO HOME BUTTON */}
        {onBackToHome && (
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-profile" />
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Sistem Informasi 10 Pilar PSKS Provinsi Jawa Barat</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
