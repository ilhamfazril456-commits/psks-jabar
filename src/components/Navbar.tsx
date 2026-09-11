import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';
import { OfficialPsksLogo } from './OfficialPsksLogo';
import { 
  ShieldCheck, 
  LogOut, 
  LogIn,
  Menu, 
  X, 
  Inbox, 
  Home, 
  User, 
  PhoneCall, 
  UserCheck, 
  Sliders,
  MapPin,
  CheckCircle2,
  Building,
  ChevronRight,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onPrefetch?: (tab: string) => void;
  session: UserSession;
  onLogout: () => void;
  onOpenGateModal?: () => void;
  onOpenDeveloperPanel?: () => void;
  onOpenInbox?: () => void;
  unreadCount?: number;
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onPrefetch,
  session,
  onLogout,
  onOpenGateModal,
  onOpenInbox,
  unreadCount = 0,
  logoUrl,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginConfirmModal, setShowLoginConfirmModal] = useState(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  // Monitor scroll position on laptop/tablet to automatically switch to solid green past the hero video
  useEffect(() => {
    const handleScroll = () => {
      if (currentTab !== 'beranda') {
        setIsScrolledPastHero(true);
        return;
      }
      
      const heroEl = document.querySelector('section');
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        // Switch to green when hero bottom reaches navbar (around 70px)
        setIsScrolledPastHero(rect.bottom <= 72);
      } else {
        setIsScrolledPastHero(window.scrollY > 380);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentTab]);

  const handleNav = (tab: string) => {
    onNavigate(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const isSuperadminOrDev =
    session.statusActive === 'SAH_TERDAFTAR' &&
    (session.role === 'superadmin' || session.role === 'developer');

  const canLogoutInHeader =
    session.statusActive === 'SAH_TERDAFTAR' &&
    (session.role === 'admin' || session.role === 'superadmin' || session.role === 'developer' || session.role === 'user');

  const isBeranda = currentTab === 'beranda';

  return (
    <header className="sticky top-0 z-50 w-full select-none font-sans group">
      {/* MAIN NAVBAR CONTAINER:
          - HP / Mobile: Solid forest green khas Dinsos
          - Laptop / Desktop & Tablet (md:): Transparan blur (glassmorphism) menyambung ke video background, berubah menjadi hijau saat disentuh/hover ATAU otomatis menjadi hijau ketika digulir kebawah melewati video background
      */}
      <div 
        className={`w-full relative transition-all duration-500 ease-in-out shadow-sm overflow-hidden ${
          isBeranda && !isScrolledPastHero
            ? 'bg-gradient-to-br from-[#043e2e] via-[#054836] to-[#064e3b] md:bg-transparent md:bg-none border-b border-[#d4af37]/80 jabarprov-navbar-transparent'
            : 'bg-gradient-to-br from-[#043e2e] via-[#054836] to-[#064e3b] border-b-2 border-[#d4af37] shadow-xl jabarprov-navbar-scrolled'
        }`}
      >
        <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 h-[70px] flex items-center justify-between gap-2 sm:gap-4">
          {/* BRAND / LOGO LEFT */}
          <div
            onClick={() => handleNav('beranda')}
            className="flex items-center gap-2 sm:gap-2.5 md:gap-3 cursor-pointer group/brand shrink-0"
          >
            <OfficialPsksLogo logoUrl={logoUrl} sizeClassName="w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 lg:w-12 lg:h-12" />
            <div className="flex flex-col text-left min-w-0">
              <span className="text-white font-black text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg tracking-tight leading-none group-hover/brand:text-amber-200 transition-colors whitespace-nowrap drop-shadow">
                PSKS JABAR
              </span>
              <span
                className="text-[9px] sm:text-[10px] md:text-[10.5px] lg:text-xs font-bold mt-1 tracking-wide whitespace-nowrap drop-shadow"
                style={{ color: '#e5c158' }}
              >
                Dinas Sosial Provinsi Jawa Barat
              </span>
            </div>
          </div>

          {/* MAIN DESKTOP & TABLET NAVIGATION MENU (MATCHES LAPTOP EXACTLY ON MD/LG/XL) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 xl:gap-5 shrink-0">
            <button
              onClick={() => handleNav('beranda')}
              className={`relative flex items-center gap-1.5 lg:gap-2 text-sm lg:text-[15px] xl:text-base font-extrabold px-2.5 lg:px-3.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap cursor-pointer ${
                currentTab === 'beranda'
                  ? 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'text-white/95 hover:text-amber-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]'
              }`}
            >
              <Home className={`w-4 h-4 lg:w-4.5 lg:h-4.5 transition-transform duration-200 ${currentTab === 'beranda' ? 'text-amber-300 scale-110' : 'text-amber-300/90'}`} />
              <span className="whitespace-nowrap tracking-normal">Beranda</span>
              {currentTab === 'beranda' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-[0_0_6px_#d4af37]" />
              )}
            </button>

            <button
              onClick={() => handleNav('profil')}
              onMouseEnter={() => onPrefetch?.('profil')}
              onTouchStart={() => onPrefetch?.('profil')}
              className={`relative flex items-center gap-1.5 lg:gap-2 text-sm lg:text-[15px] xl:text-base font-extrabold px-2.5 lg:px-3.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap cursor-pointer ${
                currentTab === 'profil'
                  ? 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'text-white/95 hover:text-amber-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]'
              }`}
            >
              <User className={`w-4 h-4 lg:w-4.5 lg:h-4.5 transition-transform duration-200 ${currentTab === 'profil' ? 'text-amber-300 scale-110' : 'text-amber-300/90'}`} />
              <span className="whitespace-nowrap tracking-normal">Profil</span>
              {currentTab === 'profil' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-[0_0_6px_#d4af37]" />
              )}
            </button>

            <button
              onClick={() => handleNav('contact')}
              onMouseEnter={() => onPrefetch?.('contact')}
              onTouchStart={() => onPrefetch?.('contact')}
              className={`relative flex items-center gap-1.5 lg:gap-2 text-sm lg:text-[15px] xl:text-base font-extrabold px-2.5 lg:px-3.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap cursor-pointer ${
                currentTab === 'contact'
                  ? 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'text-white/95 hover:text-amber-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]'
              }`}
            >
              <PhoneCall className={`w-4 h-4 lg:w-4.5 lg:h-4.5 transition-transform duration-200 ${currentTab === 'contact' ? 'text-amber-300 scale-110' : 'text-amber-300/90'}`} />
              <span className="whitespace-nowrap tracking-normal">Kontak</span>
              {currentTab === 'contact' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-[0_0_6px_#d4af37]" />
              )}
            </button>

            <button
              onClick={() => handleNav('akun')}
              onMouseEnter={() => onPrefetch?.('akun')}
              onTouchStart={() => onPrefetch?.('akun')}
              className={`relative flex items-center gap-1.5 lg:gap-2 text-sm lg:text-[15px] xl:text-base font-extrabold px-2.5 lg:px-3.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap cursor-pointer ${
                currentTab === 'akun'
                  ? 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                  : 'text-white/95 hover:text-amber-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]'
              }`}
            >
              <UserCheck className={`w-4 h-4 lg:w-4.5 lg:h-4.5 transition-transform duration-200 ${currentTab === 'akun' ? 'text-amber-300 scale-110' : 'text-amber-300/90'}`} />
              <span className="whitespace-nowrap tracking-normal">Pusat Akun</span>
              {currentTab === 'akun' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-[0_0_6px_#d4af37]" />
              )}
            </button>

            {session.statusActive === 'SAH_TERDAFTAR' && session.role === 'admin' && (
              <button
                onClick={() => handleNav('terima_pendaftaran')}
                onMouseEnter={() => onPrefetch?.('terima_pendaftaran')}
                onTouchStart={() => onPrefetch?.('terima_pendaftaran')}
                className={`relative flex items-center gap-1.5 lg:gap-2 text-sm lg:text-[15px] xl:text-base font-extrabold px-2.5 lg:px-3.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  currentTab === 'terima_pendaftaran'
                    ? 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]'
                    : 'text-white/95 hover:text-amber-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]'
                }`}
                title="Penerimaan & Verifikasi Pendaftaran 10 Pilar PSKS Wilayah"
              >
                <ClipboardList className={`w-4 h-4 lg:w-4.5 lg:h-4.5 transition-transform duration-200 ${currentTab === 'terima_pendaftaran' ? 'text-amber-300 scale-110' : 'text-amber-300/90'}`} />
                <span className="whitespace-nowrap tracking-normal">Terima Pendaftaran</span>
                {currentTab === 'terima_pendaftaran' && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full shadow-[0_0_6px_#d4af37]" />
                )}
              </button>
            )}

            {isSuperadminOrDev && (
              <button
                onClick={() => handleNav('superadmin_settings')}
                className={`relative flex items-center gap-1.5 lg:gap-2 text-sm lg:text-[15px] xl:text-base font-extrabold px-2.5 lg:px-3.5 py-1.5 rounded-lg transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  currentTab === 'superadmin_settings'
                    ? 'text-orange-300 font-black drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]'
                    : 'text-white/95 hover:text-orange-200 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]'
                }`}
                title="Akses Halaman Pengaturan Aplikasi"
              >
                <Sliders className={`w-4 h-4 lg:w-4.5 lg:h-4.5 transition-transform duration-200 ${currentTab === 'superadmin_settings' ? 'text-orange-300 scale-110' : 'text-amber-300/90'}`} />
                <span className="whitespace-nowrap tracking-normal">Pengaturan</span>
                {currentTab === 'superadmin_settings' && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-orange-400 to-amber-300 rounded-full shadow-[0_0_6px_#fb923c]" />
                )}
              </button>
            )}
          </nav>

        {/* RIGHT ACTION BUTTONS (PENANDA SENSOR WILAYAH AKTIF, INBOX ADMIN, TOMBOL LOGIN HIJAU & TOMBOL KELUAR MERAH) */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
          {/* PENANDA WILAYAH AKTIF KHUSUS ROLE USER (TERPISAH DARI NAVIGASI DENGAN SENSOR HIJAU BERKEDIP) */}
          {session.statusActive === 'SAH_TERDAFTAR' && session.role === 'user' && (
            <div
              className="flex items-center gap-2 bg-gradient-to-r from-[#012219]/95 via-[#033628]/95 to-[#012219]/95 border border-emerald-500/50 px-2.5 lg:px-3.5 py-1.5 rounded-xl shadow-lg ring-1 ring-emerald-400/30 backdrop-blur-md select-none cursor-default shrink-0"
              title={`Status Sensor Pemantau Wilayah: ${session.wilayah || 'Provinsi Jawa Barat'}`}
            >
              {/* Animasi Sensor Hijau Aktif Berkedip-kedip */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                <span className="relative w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] lg:text-[8.5px] font-extrabold text-amber-300 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-[#d4af37]" />
                  Wilayah Aktif
                </span>
                <span className="text-[11px] lg:text-xs font-black text-white tracking-tight">
                  {session.wilayah || 'Jawa Barat'}
                </span>
              </div>
            </div>
          )}

          {/* Inbox Button (HANYA UNTUK ADMIN / SUPERADMIN / DEVELOPER - TIDAK DITAMPILKAN UNTUK ROLE USER) */}
          {session.statusActive === 'SAH_TERDAFTAR' && session.role !== 'user' && onOpenInbox && (
            <button
              onClick={onOpenInbox}
              aria-label="Kotak Masuk Admin"
              className="relative flex items-center gap-1.5 bg-[#022a1f] hover:bg-[#033c2d] text-amber-200 text-xs font-bold px-2.5 lg:px-3 py-1.5 rounded-lg border border-[#d4af37]/40 transition-all cursor-pointer shadow-sm shrink-0"
              title="Buka Inbox Pesan & Notifikasi Admin"
            >
              <Inbox className="w-4 h-4 text-[#e5c158]" />
              <span className="hidden xl:inline">Inbox</span>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Button Hijau Login di Pojok Kanan Atas Untuk Tamu Publik yang Belum Login */}
          {session.statusActive !== 'SAH_TERDAFTAR' && (
            <button
              onClick={() => setShowLoginConfirmModal(true)}
              aria-label="Masuk ke Akun"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black px-3.5 lg:px-4 py-1.5 rounded-xl border border-emerald-400/60 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-500/30 transition-all duration-200 cursor-pointer active:scale-95 shrink-0 ring-1 ring-emerald-300/30"
              title="Masuk / Login ke Akun"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-100" />
              <span>Login</span>
            </button>
          )}

          {/* Button Merah di Pojok Kanan Atas Untuk Keluar dari Akun (Role User, Admin, Superadmin, Developer) */}
          {session.statusActive === 'SAH_TERDAFTAR' && (
            <button
              onClick={onLogout}
              aria-label="Keluar dari Akun"
              className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white text-xs font-black px-3 lg:px-3.5 py-1.5 rounded-xl border border-rose-400/60 shadow-lg shadow-rose-950/40 hover:shadow-rose-600/30 transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
              title="Keluar dari akun Anda"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>

        {/* MOBILE ONLY MENU TOGGLE BUTTON & QUICK ACTIONS (MD:HIDDEN - SO TABLET NEVER HAS DUPLICATE BUTTONS) */}
        <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
          {session.statusActive === 'SAH_TERDAFTAR' && session.role !== 'user' && onOpenInbox && (
            <button
              onClick={onOpenInbox}
              aria-label="Kotak Masuk"
              className="relative p-1.5 sm:p-2 bg-[#022a1f] text-amber-200 rounded-lg border border-[#d4af37]/40 shrink-0"
              title="Kotak Masuk"
            >
              <Inbox className="w-4 h-4 sm:w-5 sm:h-5 text-[#e5c158]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1 sm:px-1.5 py-0.2 rounded-full border border-white">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Login button for mobile guest (compact & well-proportioned) */}
          {session.statusActive !== 'SAH_TERDAFTAR' && (
            <button
              onClick={() => setShowLoginConfirmModal(true)}
              aria-label="Masuk ke Akun"
              className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-emerald-400/50 shadow-sm active:scale-95 transition-all shrink-0"
              title="Masuk / Login"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-100" />
              <span>Login</span>
            </button>
          )}

          {/* Quick Logout for mobile user & admin */}
          {session.statusActive === 'SAH_TERDAFTAR' && (
            <button
              onClick={onLogout}
              aria-label="Keluar dari Akun"
              className="flex items-center gap-1 bg-gradient-to-r from-rose-600 to-red-700 text-white text-[11px] sm:text-xs font-black px-2.5 py-1.5 rounded-lg border border-rose-400/50 shadow active:scale-95 transition-all shrink-0"
              title="Keluar Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}

          <button
            onClick={() => {
              const next = !mobileMenuOpen;
              setMobileMenuOpen(next);
              if (next) {
                onPrefetch?.('profil');
                onPrefetch?.('contact');
              }
            }}
            className="text-white p-1.5 sm:p-2 rounded-lg hover:bg-white/10 focus:outline-none transition-colors shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#e5c158]" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          </button>
        </div>
      </div>
      </div>

      {/* MOBILE NAVIGATION DROPDOWN DRAWER (MD:HIDDEN) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gradient-to-br from-[#043e2e] via-[#054836] to-[#064e3b] border-t-2 border-[#d4af37] px-4 py-4 space-y-3 shadow-2xl animate-in fade-in duration-200">
          {/* 1. STATUS CARD (UNIFIED FOR ALL ROLES) */}
          <div className="p-3 rounded-2xl bg-[#032e22]/90 border border-[#d4af37]/50 shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                {session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer') ? (
                  <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                ) : (
                  <MapPin className="w-4 h-4 text-[#d4af37]" />
                )}
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black text-amber-300/80 uppercase tracking-wider block">
                  {session.statusActive === 'SAH_TERDAFTAR'
                    ? session.role === 'superadmin'
                      ? 'Otoritas Superadmin'
                      : session.role === 'developer'
                      ? 'Otoritas Developer'
                      : session.role === 'admin'
                      ? 'Admin Wilayah'
                      : 'Akses Warga & Wilayah'
                    : 'Akses Tamu Publik'}
                </span>
                <span className="text-xs font-black text-white">
                  {session.wilayah || 'Provinsi Jawa Barat'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-500/40 px-2 py-1 rounded-full text-[10px] font-bold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{session.statusActive === 'SAH_TERDAFTAR' ? 'AKTIF' : 'ONLINE'}</span>
            </div>
          </div>

          {/* 2. NAVIGATION LINK CARDS (HARMONIZED CLEAN DESIGN FOR ALL ROLES) */}
          <div className="space-y-1.5">
            {/* 1. Beranda */}
            <button
              onClick={() => handleNav('beranda')}
              className={`flex items-center justify-between w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'beranda'
                  ? 'bg-gradient-to-r from-[#f7e096] via-[#d4af37] to-[#b8860b] text-[#03291e] font-black shadow-lg shadow-amber-500/20 border border-amber-200/90'
                  : 'bg-black/30 text-slate-200 hover:bg-white/10 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTab === 'beranda' ? 'bg-[#03291e] text-amber-300' : 'bg-emerald-950 text-amber-300 border border-emerald-800'}`}>
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-black">Beranda</span>
                  <span className={`text-[10px] ${currentTab === 'beranda' ? 'text-emerald-950 font-semibold' : 'text-slate-400'}`}>
                    Peta GIS & Data 10 Pilar PSKS
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${currentTab === 'beranda' ? 'text-[#03291e]' : 'text-slate-400'}`} />
            </button>

            {/* 2. Profil */}
            <button
              onClick={() => handleNav('profil')}
              onTouchStart={() => onPrefetch?.('profil')}
              onMouseEnter={() => onPrefetch?.('profil')}
              className={`flex items-center justify-between w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'profil'
                  ? 'bg-gradient-to-r from-[#f7e096] via-[#d4af37] to-[#b8860b] text-[#03291e] font-black shadow-lg shadow-amber-500/20 border border-amber-200/90'
                  : 'bg-black/30 text-slate-200 hover:bg-white/10 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTab === 'profil' ? 'bg-[#03291e] text-amber-300' : 'bg-emerald-950 text-amber-300 border border-emerald-800'}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-black">Profil</span>
                  <span className={`text-[10px] ${currentTab === 'profil' ? 'text-emerald-950 font-semibold' : 'text-slate-400'}`}>
                    Visi, Misi & Pejabat Dinsos Jabar
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${currentTab === 'profil' ? 'text-[#03291e]' : 'text-slate-400'}`} />
            </button>

            {/* 3. Kontak */}
            <button
              onClick={() => handleNav('contact')}
              onTouchStart={() => onPrefetch?.('contact')}
              onMouseEnter={() => onPrefetch?.('contact')}
              className={`flex items-center justify-between w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'contact'
                  ? 'bg-gradient-to-r from-[#f7e096] via-[#d4af37] to-[#b8860b] text-[#03291e] font-black shadow-lg shadow-amber-500/20 border border-amber-200/90'
                  : 'bg-black/30 text-slate-200 hover:bg-white/10 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTab === 'contact' ? 'bg-[#03291e] text-amber-300' : 'bg-emerald-950 text-amber-300 border border-emerald-800'}`}>
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-black">Kontak</span>
                  <span className={`text-[10px] ${currentTab === 'contact' ? 'text-emerald-950 font-semibold' : 'text-slate-400'}`}>
                    Hotline WhatsApp, Maps & Alamat
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${currentTab === 'contact' ? 'text-[#03291e]' : 'text-slate-400'}`} />
            </button>

            {/* 4. Pusat Akun */}
            <button
              onClick={() => handleNav('akun')}
              onTouchStart={() => onPrefetch?.('akun')}
              onMouseEnter={() => onPrefetch?.('akun')}
              className={`flex items-center justify-between w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'akun'
                  ? 'bg-gradient-to-r from-[#f7e096] via-[#d4af37] to-[#b8860b] text-[#03291e] font-black shadow-lg shadow-amber-500/20 border border-amber-200/90'
                  : 'bg-black/30 text-slate-200 hover:bg-white/10 border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTab === 'akun' ? 'bg-[#03291e] text-amber-300' : 'bg-emerald-950 text-amber-300 border border-emerald-800'}`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-black">Pusat Akun</span>
                  <span className={`text-[10px] ${currentTab === 'akun' ? 'text-emerald-950 font-semibold' : 'text-slate-400'}`}>
                    Cek Validasi Anggota & Status
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${currentTab === 'akun' ? 'text-[#03291e]' : 'text-slate-400'}`} />
            </button>

            {/* 5. Khusus Admin: Terima Pendaftaran */}
            {session.statusActive === 'SAH_TERDAFTAR' && session.role === 'admin' && (
              <button
                onClick={() => handleNav('terima_pendaftaran')}
                onTouchStart={() => onPrefetch?.('terima_pendaftaran')}
                onMouseEnter={() => onPrefetch?.('terima_pendaftaran')}
                className={`flex items-center justify-between w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'terima_pendaftaran'
                    ? 'bg-gradient-to-r from-[#f7e096] via-[#d4af37] to-[#b8860b] text-[#03291e] font-black shadow-lg shadow-amber-500/20 border border-amber-200/90'
                    : 'bg-black/30 text-slate-200 hover:bg-white/10 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${currentTab === 'terima_pendaftaran' ? 'bg-[#03291e] text-amber-300' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black">Terima Pendaftaran</span>
                    <span className={`text-[10px] ${currentTab === 'terima_pendaftaran' ? 'text-emerald-950 font-semibold' : 'text-amber-300/80'}`}>
                      Verifikasi 10 Pilar Wilayah
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${currentTab === 'terima_pendaftaran' ? 'text-[#03291e]' : 'text-slate-400'}`} />
              </button>
            )}

            {/* 6. Khusus Superadmin & Dev: Pengaturan Aplikasi */}
            {isSuperadminOrDev && (
              <button
                onClick={() => handleNav('superadmin_settings')}
                className={`flex items-center justify-between w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentTab === 'superadmin_settings'
                    ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-orange-500/30 border border-orange-200'
                    : 'bg-black/30 text-slate-200 hover:bg-white/10 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${currentTab === 'superadmin_settings' ? 'bg-slate-950 text-orange-400' : 'bg-orange-950/80 text-orange-300 border border-orange-800/60'}`}>
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-black">Pengaturan Sistem</span>
                    <span className={`text-[10px] ${currentTab === 'superadmin_settings' ? 'text-slate-950 font-semibold' : 'text-orange-200/80'}`}>
                      Video, Foto, Smart Card & Konfigurasi
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${currentTab === 'superadmin_settings' ? 'text-slate-950' : 'text-slate-400'}`} />
              </button>
            )}
          </div>

          {/* 3. ACTION BUTTONS (KELUAR / LOGIN) */}
          <div className="pt-3 border-t border-emerald-900/60">
            {session.statusActive === 'SAH_TERDAFTAR' ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white text-xs font-black py-2.5 rounded-xl border border-rose-400/50 shadow-md cursor-pointer active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLoginConfirmModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black py-2.5 rounded-xl border border-emerald-400/50 shadow-md cursor-pointer active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Login Akun</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* POPUP SIMPLE KONFIRMASI MASUK / LOGIN AKUN UNTUK TAMU PUBLIK */}
      {showLoginConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
          <div className="bg-gradient-to-b from-[#032e22] via-[#043e2e] to-[#011a13] border-2 border-[#d4af37] rounded-2xl p-6 max-w-md w-full shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-150 ring-1 ring-amber-400/30">
            {/* Decorative background glow */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Icon Header */}
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <LogIn className="w-7 h-7 text-emerald-400" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-white mb-2 tracking-tight">
              Konfirmasi Masuk Akun
            </h3>

            {/* Confirmation Question Message */}
            <p className="text-sm text-emerald-100/90 leading-relaxed mb-6 font-medium px-2">
              Apakah anda yakin ingin <strong className="text-white font-extrabold">Login</strong>? Halaman anda akan diarahkan ke halaman gerbang utama untuk masuk/daftar akun!
            </p>

            {/* Action Buttons: Batal & Ya */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLoginConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-white/20 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLoginConfirmModal(false);
                  if (onOpenGateModal) {
                    onOpenGateModal();
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950/50 border border-emerald-300/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Ya</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

