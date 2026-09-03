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
  QrCode,
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
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ appSettings, onBackToHome }) => {
  const [activeSection, setActiveSection] = useState<'sambutan' | 'dasar-hukum' | 'tujuan' | 'visi-misi'>('sambutan');

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

  const isManualScrollingRef = React.useRef(false);
  const manualScrollTimerRef = React.useRef<number | null>(null);

  // Scroll spy logic: otomatis memindahkan warna aktif button kuning sesuai posisi scroll layar
  React.useEffect(() => {
    const handleScrollSpy = () => {
      if (isManualScrollingRef.current) return;

      const sections: { id: string; key: 'sambutan' | 'dasar-hukum' | 'tujuan' | 'visi-misi' }[] = [
        { id: 'section-sambutan', key: 'sambutan' },
        { id: 'section-dasar-hukum', key: 'dasar-hukum' },
        { id: 'section-tujuan-website', key: 'tujuan' },
        { id: 'section-visi-misi', key: 'visi-misi' },
      ];

      const scrollPosition = window.scrollY + 160;
      let currentKey: 'sambutan' | 'dasar-hukum' | 'tujuan' | 'visi-misi' = 'sambutan';

      for (let i = 0; i < sections.length; i++) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset;
          if (scrollPosition >= top - 80) {
            currentKey = sections[i].key;
          }
        }
      }

      setActiveSection((prev) => (prev !== currentKey ? currentKey : prev));
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    // Initial check
    handleScrollSpy();

    return () => {
      window.removeEventListener('scroll', handleScrollSpy);
      if (manualScrollTimerRef.current) {
        clearTimeout(manualScrollTimerRef.current);
      }
    };
  }, []);

  // Smooth scroll handler for quick jump buttons
  const scrollToSection = (sectionId: string, sectionKey: 'sambutan' | 'dasar-hukum' | 'tujuan' | 'visi-misi') => {
    setActiveSection(sectionKey);
    isManualScrollingRef.current = true;
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    manualScrollTimerRef.current = window.setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 850);

    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

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
      deskripsi: 'Mencakup Permensos TKSK (No. 28/2018), Karang Taruna (No. 25/2019), PSM (No. 10/2019), Tagana (No. 28/2012), LKS/Orsos (No. 184/2011), WKSBM, Pelopor Perdamaian, Dunia Usaha/CSR, KUBE, dan Anggota Veteran RI.',
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
      judul: 'Sentralisasi & Integrasi Data 10 Pilar',
      poin: 'Menyatukan database seluruh anggota dan lembaga dari 10 Pilar PSKS (TKSK, Karang Taruna, PSM, Tagana, LKS, WKSBM, Pelopor Perdamaian, CSR/Dunia Usaha, KUBE, & Veteran) di 27 Kabupaten/Kota Jawa Barat dalam satu pintu portal digital.',
      icon: Database,
      warna: 'from-emerald-600 to-teal-700',
    },
    {
      judul: 'Validasi & Penerbitan Kartu Digital Pintar',
      poin: 'Menyediakan fitur verifikasi legalitas status keanggotaan bersertifikat QR Code terenkripsi (*Smart Access Card*) untuk memastikan kredibilitas, rekam jejak, dan keaslian anggota pilar sosial yang bertugas di lapangan.',
      icon: QrCode,
      warna: 'from-amber-600 to-yellow-600',
    },
    {
      judul: 'Transparansi & Akuntabilitas Publik',
      poin: 'Menjamin keterbukaan informasi publik terkait capaian program, profil lembaga pilar sosial, berita resmi kedinasan, dan statistik kegiatan penanganan permasalahan sosial secara *real-time* dan dapat dipertanggungjawabkan.',
      icon: ShieldCheck,
      warna: 'from-blue-600 to-indigo-700',
    },
    {
      judul: 'Pemetaan Geospasial Wilayah Sebaran',
      poin: 'Menyajikan visualisasi interaktif peta potensi dan sebaran kekuatan sosial di tingkat provinsi hingga kabupaten/kota guna mendukung pengambilan keputusan berbasis data (*data-driven policy*) yang presisi.',
      icon: MapPin,
      warna: 'from-emerald-700 to-green-800',
    },
    {
      judul: 'Akselerasi Respon Penanganan PPKS',
      poin: 'Mempercepat alur koordinasi lapangan lintas pilar relawan saat terjadi kerentanan sosial, bencana alam, maupun kebutuhan bantuan darurat bagi Pemerlu Pelayanan Kesejahteraan Sosial (PPKS).',
      icon: HeartHandshake,
      warna: 'from-rose-600 to-red-700',
    },
    {
      judul: 'Efisiensi Administrasi & Pendaftaran Mandiri',
      poin: 'Memangkas birokrasi verifikasi pendaftaran anggota baru dan pembaharuan dokumen melalui sistem pendaftaran daring terstruktur yang divalidasi langsung oleh Admin Wilayah dan Superadmin Provinsi.',
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
    <div className="min-h-screen bg-slate-50/80 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER TOP BAR & BACK BUTTON */}
        {onBackToHome && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-top-profile" />
            <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200/90 px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#043e2e]" />
              <span>Profil Resmi Dinas Sosial Provinsi Jawa Barat</span>
            </div>
          </div>
        )}

        {/* 4 HORIZONTAL JUMP NAVIGATION BUTTONS (BERJAJAR RAPI DI PALING ATAS) */}
        <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#022219] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 border-[#d4af37] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 text-white">
              <Compass className="w-4 h-4 text-[#e5c158]" />
              <span className="text-xs sm:text-sm font-black tracking-wide text-amber-200 uppercase">
                HALAMAN PROFIL
              </span>
            </div>
            <span className="text-[11px] text-emerald-200/80 font-semibold hidden md:inline-block">
              Klik salah satu menu untuk langsung menuju bagian konten yang diinginkan
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {/* Button 1: Sambutan Kepala Dinas */}
            <button
              type="button"
              onClick={() => scrollToSection('section-sambutan', 'sambutan')}
              className={`flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none group border ${
                activeSection === 'sambutan'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#e5c158] text-[#043e2e] border-amber-200 shadow-md font-black ring-2 ring-amber-300/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-amber-300/40'
              }`}
            >
              <UserCheck className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeSection === 'sambutan' ? 'text-[#043e2e]' : 'text-amber-300'}`} />
              <span className="truncate">Sambutan Kepala Dinas</span>
            </button>

            {/* Button 2: Dasar Hukum */}
            <button
              type="button"
              onClick={() => scrollToSection('section-dasar-hukum', 'dasar-hukum')}
              className={`flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none group border ${
                activeSection === 'dasar-hukum'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#e5c158] text-[#043e2e] border-amber-200 shadow-md font-black ring-2 ring-amber-300/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-amber-300/40'
              }`}
            >
              <Scale className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeSection === 'dasar-hukum' ? 'text-[#043e2e]' : 'text-amber-300'}`} />
              <span className="truncate">Dasar Hukum</span>
            </button>

            {/* Button 3: Tujuan Website */}
            <button
              type="button"
              onClick={() => scrollToSection('section-tujuan-website', 'tujuan')}
              className={`flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none group border ${
                activeSection === 'tujuan'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#e5c158] text-[#043e2e] border-amber-200 shadow-md font-black ring-2 ring-amber-300/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-amber-300/40'
              }`}
            >
              <Target className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeSection === 'tujuan' ? 'text-[#043e2e]' : 'text-amber-300'}`} />
              <span className="truncate">Tujuan Website</span>
            </button>

            {/* Button 4: Visi & Misi */}
            <button
              type="button"
              onClick={() => scrollToSection('section-visi-misi', 'visi-misi')}
              className={`flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer select-none group border ${
                activeSection === 'visi-misi'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#e5c158] text-[#043e2e] border-amber-200 shadow-md font-black ring-2 ring-amber-300/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10 hover:border-amber-300/40'
              }`}
            >
              <Award className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${activeSection === 'visi-misi' ? 'text-[#043e2e]' : 'text-amber-300'}`} />
              <span className="truncate">Visi &amp; Misi</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN 1: SAMBUTAN KEPALA DINAS SOSIAL PROVINSI JAWA BARAT                */}
        {/* ========================================================================= */}
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
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="w-full lg:w-80 shrink-0 flex flex-col items-center"
              >
                {/* Frame Badge Header */}
                <div className="mb-3 inline-flex items-center gap-1.5 bg-amber-100/90 border border-amber-300/80 text-[#043e2e] text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pimpinan Resmi Kedinasan</span>
                </div>

                {/* Photo Card with Gold Border & Ambient Glow */}
                <div className="relative w-full max-w-[290px] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#d4af37] group bg-gradient-to-b from-amber-50 to-slate-100">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentPhoto}
                      initial={{ opacity: 0.3, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      src={currentPhoto}
                      alt={kadinasName}
                      referrerPolicy="no-referrer"
                      onError={() => setCurrentPhoto(OFFICIAL_KADINAS_PHOTO)}
                      className="w-full h-84 sm:h-96 object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </AnimatePresence>

                  {/* Verified Ribbon Badge on Photo */}
                  <div className="absolute bottom-3 left-3 right-3 bg-gradient-to-r from-emerald-950/90 via-[#043e2e]/90 to-emerald-950/90 backdrop-blur-md text-white py-2 px-3 rounded-xl border border-amber-400/40 shadow-lg flex items-center justify-between">
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

        {/* ========================================================================= */}
        {/* BAGIAN 2: DASAR HUKUM LENGKAP PENYELENGGARAAN PSKS & DINAS SOSIAL JABAR   */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* BAGIAN 3: TUJUAN UTAMA WEBSITE SISTEM INFORMASI PSKS JABAR                */}
        {/* ========================================================================= */}
        <section id="section-tujuan-website" className="scroll-mt-24">
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
                  <span>Fungsi &amp; Maksud Pengembangan</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#043e2e] tracking-tight">
                  Tujuan Pengembangan Portal PSKS Jabar
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
                  Portal Sistem Informasi PSKS Jabar dikembangkan sebagai instrumen transformasi digital terintegrasi untuk memperkuat koordinasi, pengawasan, dan percepatan penyelenggaraan kesejahteraan sosial.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                      <span>Tujuan Strategis #{idx + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto text-emerald-600 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ========================================================================= */}
        {/* BAGIAN 4: VISI & MISI RESMI DINAS SOSIAL PROVINSI JAWA BARAT              */}
        {/* ========================================================================= */}
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
