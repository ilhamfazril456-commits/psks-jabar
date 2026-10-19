import React, { useState, useEffect, useRef } from 'react';
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
  MapPin, 
  CheckCircle2, 
  Building, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Award,
  Target,
  Users,
  FileText,
  Share2,
  Search,
  ExternalLink,
  KeyRound,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, subView?: string) => void;
  onPrefetch?: (tab: string) => void;
  session: UserSession;
  onLogout: () => void;
  onOpenGateModal?: () => void;
  onOpenGuestHistoryModal?: () => void;
  onOpenDeveloperPanel?: () => void;
  onOpenInbox?: () => void;
  unreadCount?: number;
  logoUrl?: string;
}

type DropdownKey = 'profil' | 'contact' | 'akun' | null;

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onPrefetch,
  session,
  onLogout,
  onOpenGateModal,
  onOpenGuestHistoryModal,
  onOpenInbox,
  unreadCount = 0,
  logoUrl,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginConfirmModal, setShowLoginConfirmModal] = useState(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  // Desktop active dropdown state
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navContainerRef = useRef<HTMLElement | null>(null);

  // Mobile drawer accordion expanded state
  const [mobileExpanded, setMobileExpanded] = useState<DropdownKey>(null);

  // Monitor scroll position on laptop/tablet to switch style past hero
  useEffect(() => {
    const handleScroll = () => {
      if (currentTab !== 'beranda') {
        setIsScrolledPastHero(true);
        return;
      }
      
      const heroEl = document.querySelector('section');
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        setIsScrolledPastHero(rect.bottom <= 72);
      } else {
        setIsScrolledPastHero(window.scrollY > 380);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentTab]);

  // Click outside to close desktop dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navContainerRef.current && !navContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleNav = (tab: string, subView?: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(tab, subView);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  const navigateAndScroll = (tab: string, elementId?: string, subView?: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(tab, subView);
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      }, 150);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const handleMouseEnter = (menu: 'profil' | 'contact' | 'akun') => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menu);
    onPrefetch?.(menu === 'contact' ? 'contact' : menu);
  };

  const handleMouseLeave = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const toggleDropdown = (menu: 'profil' | 'contact' | 'akun') => {
    setActiveDropdown((prev) => (prev === menu ? null : menu));
  };

  const toggleMobileAccordion = (menu: 'profil' | 'contact' | 'akun') => {
    setMobileExpanded((prev) => (prev === menu ? null : menu));
  };

  const isBeranda = currentTab === 'beranda';

  // Sub-menu definitions with dedicated isolated sub-views
  const profilSubMenus = [
    {
      id: 'kadinas',
      title: 'Kepala Dinas Sosial',
      desc: 'Profil, Foto Resmi & Sambutan Kadinas',
      icon: Award,
      onClick: () => navigateAndScroll('profil', undefined, 'kadinas'),
    },
    {
      id: 'visi_misi',
      title: 'Visi & Misi',
      desc: 'Arah Kebijakan Kesejahteraan Sosial Jabar',
      icon: Target,
      onClick: () => navigateAndScroll('profil', undefined, 'visi_misi'),
    },
    {
      id: 'struktur',
      title: 'Struktur Organisasi',
      desc: 'Bagan Kelembagaan & Hierarki Dinsos Jabar',
      icon: Users,
      onClick: () => navigateAndScroll('profil', undefined, 'struktur'),
    },
    {
      id: 'tupoksi',
      title: 'Tugas Pokok & Fungsi',
      desc: 'Dasar Hukum Regulasi & Tupoksi Kedinasan',
      icon: FileText,
      onClick: () => navigateAndScroll('profil', undefined, 'tupoksi'),
    },
  ];

  const kontakSubMenus = [
    {
      id: 'medsos',
      title: 'Media Sosial Resmi',
      desc: 'YouTube TV, Instagram, TikTok & X',
      icon: Share2,
      onClick: () => navigateAndScroll('contact', undefined, 'medsos'),
    },
    {
      id: 'lokasi',
      title: 'Lokasi & Kantor Wilayah',
      desc: 'Peta Presisi Google Maps 28 Kantor se-Jawa Barat',
      icon: MapPin,
      onClick: () => navigateAndScroll('contact', undefined, 'lokasi'),
    },
  ];

  const getPusatAkunSubMenus = () => {
    let profilDesc = 'Informasi Pengunjung Publik SIM-PSKS';
    if (session.statusActive === 'SAH_TERDAFTAR') {
      if (session.role === 'superadmin' || session.role === 'developer') {
        profilDesc = 'Otoritas Penuh Dinsos Jabar / Developer';
      } else if (session.role === 'admin') {
        profilDesc = `Pejabat Admin ${session.wilayah || '27 Kab/Kota'}`;
      } else {
        profilDesc = 'Data Anggota Pilar & Wilayah Terdaftar';
      }
    }

    const list = [
      {
        id: 'profil_akun',
        title: 'Detail Profil Akun',
        desc: profilDesc,
        icon: UserCheck,
        onClick: () => navigateAndScroll('akun'),
      },
    ];

    // Khusus Akun Superadmin saja : Hapus SubMenu "Cek Status Registrasi" yang berada navigasi pusat akun agar tidak ganda
    if (session.role !== 'superadmin') {
      list.push({
        id: 'cek_status',
        title: 'Cek Status Registrasi',
        desc: 'Pelacakan Resi & Status Verifikasi Berkas',
        icon: Search,
        onClick: () => {
          setActiveDropdown(null);
          setMobileMenuOpen(false);
          if (session.statusActive === 'SAH_TERDAFTAR') {
            navigateAndScroll('user_reg_history');
          } else {
            // Tamu publik: tetap di halaman saat ini (tidak dilempar ke beranda), langsung tampilkan pop up Akses Dibatasi
            if (onOpenGuestHistoryModal) {
              onOpenGuestHistoryModal();
            } else if (onOpenGateModal) {
              onOpenGateModal();
            }
          }
        },
      });
    }

    if (session.statusActive === 'SAH_TERDAFTAR' && session.role === 'superadmin') {
      list.push({
        id: 'ubah_pin_superadmin',
        title: 'Ubah PIN Smart Card',
        desc: 'Pengaturan 6 Digit PIN Akses Superadmin',
        icon: KeyRound,
        onClick: () => {
          navigateAndScroll('akun', 'keamanan-pin-superadmin');
        },
      });
    }

    if (session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'user' || session.role === 'admin')) {
      list.push({
        id: 'ubah_password_user_admin',
        title: 'Ubah Kata Sandi',
        desc: 'Pengaturan Kata Sandi Akun & Keamanan Akses',
        icon: Lock,
        onClick: () => {
          navigateAndScroll('akun', 'ubah-password-section');
        },
      });
    }

    return list;
  };

  const akunSubMenus = getPusatAkunSubMenus();

  return (
    <header className="sticky top-0 z-[1000] w-full select-none font-sans group">
      {/* MAIN NAVBAR CONTAINER */}
      <div 
        className={`w-full relative transition-all duration-300 ease-in-out ${
          isBeranda && !isScrolledPastHero
            ? 'bg-[#081c3c] md:bg-transparent border-b border-amber-400/25 jabarprov-navbar-transparent'
            : 'bg-[#081c3c] md:bg-[#081c3c]/92 md:backdrop-blur-xl border-b border-amber-400/35 shadow-lg shadow-black/25 jabarprov-navbar-scrolled'
        }`}
      >
        <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 h-[68px] sm:h-[72px] flex items-center justify-between gap-3 sm:gap-4">
          
          {/* BRAND / LOGO LEFT */}
          <div
            onClick={() => handleNav('beranda')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group/brand shrink-0"
          >
            <OfficialPsksLogo logoUrl={logoUrl} sizeClassName="w-10 h-10 sm:w-11 sm:h-11 md:w-11 md:h-11 lg:w-12 lg:h-12" />
            <div className="flex flex-col text-left min-w-0">
              <span className="text-white font-extrabold text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg tracking-tight leading-none group-hover/brand:text-amber-200 transition-colors whitespace-nowrap">
                PSKS JABAR
              </span>
              <span
                className="text-[9px] sm:text-[10px] md:text-[10.5px] lg:text-xs font-semibold mt-1 tracking-wide whitespace-nowrap text-amber-300/90"
              >
                Dinas Sosial Provinsi Jawa Barat
              </span>
            </div>
          </div>

          {/* MAIN DESKTOP & TABLET NAVIGATION MENU (TEKS BERSIH, MODERN & BEBAS AI SLOP) */}
          <nav 
            ref={navContainerRef}
            className="hidden md:flex items-center gap-2 lg:gap-4 xl:gap-7 shrink-0"
          >
            {/* 1. BERANDA (TANPA SUB-MENU) */}
            <button
              onClick={() => handleNav('beranda')}
              className={`relative px-3 py-2 rounded-lg text-sm lg:text-[15px] font-semibold tracking-normal transition-all duration-200 cursor-pointer whitespace-nowrap ${
                currentTab === 'beranda'
                  ? 'text-amber-300 font-bold'
                  : 'text-slate-100 hover:text-amber-200 hover:bg-white/[0.05]'
              }`}
            >
              <span>Beranda</span>
              {currentTab === 'beranda' && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full" />
              )}
            </button>

            {/* 2. PROFIL (4 SUB-MENU) */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('profil')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown('profil')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm lg:text-[15px] font-semibold tracking-normal transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  currentTab === 'profil' || activeDropdown === 'profil'
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-100 hover:text-amber-200 hover:bg-white/[0.05]'
                }`}
              >
                <span>Profil</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'profil' ? 'rotate-180 text-amber-300' : 'text-slate-300'}`} />
                {currentTab === 'profil' && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full" />
                )}
              </button>

              {/* DROPDOWN POPOVER PROFIL */}
              {activeDropdown === 'profil' && (
                <div 
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 lg:w-96 bg-[#081b3a]/96 backdrop-blur-2xl border border-amber-400/30 shadow-2xl rounded-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/40"
                  onMouseEnter={() => handleMouseEnter('profil')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-full mb-1" />
                  {profilSubMenus.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-amber-400/25 transition-all text-left group/sub cursor-pointer"
                      >
                        <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 group-hover/sub:bg-amber-400 group-hover/sub:text-[#081b3a] group-hover/sub:border-amber-400 transition-colors shrink-0 shadow-sm">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs lg:text-sm font-bold text-white group-hover/sub:text-amber-300 transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[10.5px] lg:text-[11px] text-slate-300 font-normal truncate mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/sub:text-amber-300 group-hover/sub:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. KONTAK (2 SUB-MENU) */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('contact')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown('contact')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm lg:text-[15px] font-semibold tracking-normal transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  currentTab === 'contact' || activeDropdown === 'contact'
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-100 hover:text-amber-200 hover:bg-white/[0.05]'
                }`}
              >
                <span>Kontak</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'contact' ? 'rotate-180 text-amber-300' : 'text-slate-300'}`} />
                {currentTab === 'contact' && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full" />
                )}
              </button>

              {/* DROPDOWN POPOVER KONTAK */}
              {activeDropdown === 'contact' && (
                <div 
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 lg:w-96 bg-[#081b3a]/96 backdrop-blur-2xl border border-amber-400/30 shadow-2xl rounded-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/40"
                  onMouseEnter={() => handleMouseEnter('contact')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-full mb-1" />
                  {kontakSubMenus.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-amber-400/25 transition-all text-left group/sub cursor-pointer"
                      >
                        <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 group-hover/sub:bg-amber-400 group-hover/sub:text-[#081b3a] group-hover/sub:border-amber-400 transition-colors shrink-0 shadow-sm">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs lg:text-sm font-bold text-white group-hover/sub:text-amber-300 transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[10.5px] lg:text-[11px] text-slate-300 font-normal truncate mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/sub:text-amber-300 group-hover/sub:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. PUSAT AKUN (2 SUB-MENU) */}
            <div 
              className="relative"
              onMouseEnter={() => handleMouseEnter('akun')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => toggleDropdown('akun')}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm lg:text-[15px] font-semibold tracking-normal transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  currentTab === 'akun' || activeDropdown === 'akun'
                    ? 'text-amber-300 font-bold'
                    : 'text-slate-100 hover:text-amber-200 hover:bg-white/[0.05]'
                }`}
              >
                <span>Pusat Akun</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'akun' ? 'rotate-180 text-amber-300' : 'text-slate-300'}`} />
                {currentTab === 'akun' && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full" />
                )}
              </button>

              {/* DROPDOWN POPOVER PUSAT AKUN */}
              {activeDropdown === 'akun' && (
                <div 
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 lg:w-96 bg-[#081b3a]/96 backdrop-blur-2xl border border-amber-400/30 shadow-2xl rounded-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/40"
                  onMouseEnter={() => handleMouseEnter('akun')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-full mb-1" />
                  {akunSubMenus.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-amber-400/25 transition-all text-left group/sub cursor-pointer"
                      >
                        <div className="p-2 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 group-hover/sub:bg-amber-400 group-hover/sub:text-[#081b3a] group-hover/sub:border-amber-400 transition-colors shrink-0 shadow-sm">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs lg:text-sm font-bold text-white group-hover/sub:text-amber-300 transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[10.5px] lg:text-[11px] text-slate-300 font-normal truncate mt-0.5">
                            {item.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/sub:text-amber-300 group-hover/sub:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT ACTION BUTTONS (SENSOR WILAYAH AKTIF, INBOX ADMIN, TOMBOL LOGIN/LOGOUT) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
            {/* PENANDA WILAYAH AKTIF KHUSUS ROLE USER */}
            {session.statusActive === 'SAH_TERDAFTAR' && session.role === 'user' && (
              <div
                className="flex items-center gap-2 bg-[#022116]/80 border border-emerald-500/35 px-3 py-1.5 rounded-xl shadow-md backdrop-blur-md select-none cursor-default shrink-0"
                title={`Status Sensor Pemantau Wilayah: ${session.wilayah || 'Provinsi Jawa Barat'}`}
              >
                <div className="relative flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[8px] lg:text-[8.5px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-amber-300" />
                    Wilayah
                  </span>
                  <span className="text-[11px] lg:text-xs font-bold text-white tracking-tight">
                    {session.wilayah || 'Jawa Barat'}
                  </span>
                </div>
              </div>
            )}

            {/* Inbox Button (UNTUK ADMIN / SUPERADMIN / DEVELOPER) */}
            {session.statusActive === 'SAH_TERDAFTAR' && session.role !== 'user' && onOpenInbox && (
              <button
                onClick={onOpenInbox}
                aria-label="Kotak Masuk Admin"
                className="relative flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-amber-200 text-xs font-bold px-3 py-2 rounded-xl border border-amber-400/30 transition-all cursor-pointer shadow-sm shrink-0"
                title="Buka Inbox Pesan & Notifikasi Admin"
              >
                <Inbox className="w-4 h-4 text-amber-300" />
                <span className="hidden xl:inline">Inbox</span>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Button Login untuk Tamu Publik */}
            {session.statusActive !== 'SAH_TERDAFTAR' && (
              <button
                onClick={() => setShowLoginConfirmModal(true)}
                aria-label="Masuk ke Akun"
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl border border-blue-400/40 shadow-md transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                title="Masuk / Login ke Akun"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-100" />
                <span>Login</span>
              </button>
            )}

            {/* Button Logout untuk Akun Terdaftar */}
            {session.statusActive === 'SAH_TERDAFTAR' && (
              <button
                onClick={onLogout}
                aria-label="Keluar dari Akun"
                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-rose-400/40 shadow-sm transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                title="Keluar / Logout Akun"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-100" />
                <span className="hidden lg:inline">Keluar</span>
              </button>
            )}
          </div>

          {/* MOBILE HAMBURGER BUTTON (MD:HIDDEN) */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Inbox for Admin */}
            {session.statusActive === 'SAH_TERDAFTAR' && session.role !== 'user' && onOpenInbox && (
              <button
                onClick={onOpenInbox}
                className="relative p-2 bg-white/[0.08] text-amber-300 rounded-xl border border-amber-400/35 shadow-xs"
                title="Inbox Pesan"
              >
                <Inbox className="w-4 h-4 text-amber-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-amber-300 hover:text-white border border-amber-400/35 shadow-sm transition-all active:scale-90"
              aria-label="Menu Navigasi Mobile"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE DRAWER ACCORDION NAVIGATION (BERSIH, BERKELAS, NYAMAN DISENTUH) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#071732]/98 backdrop-blur-2xl border-b border-amber-400/30 px-4 py-4 space-y-3 animate-in slide-in-from-top-3 duration-200 shadow-2xl">
          {/* USER INFO BAR */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/10 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#081c3c] flex items-center justify-center font-bold text-xs shadow-sm">
                {session.role ? session.role.slice(0, 2).toUpperCase() : 'PS'}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white truncate max-w-[170px]">
                  {session.nama || 'Pengunjung Publik'}
                </span>
                <span className="block text-[10px] text-amber-300/90 font-medium uppercase tracking-wider">
                  {session.role ? `Role: ${session.role}` : 'Tamu'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 px-2 py-1 rounded-full text-[10px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{session.statusActive === 'SAH_TERDAFTAR' ? 'AKTIF' : 'ONLINE'}</span>
            </div>
          </div>

          {/* ACCORDION NAVIGATION CARDS */}
          <div className="space-y-2">
            {/* 1. BERANDA (SINGLE-CLICK ACTION) */}
            <button
              onClick={() => handleNav('beranda')}
              className={`flex items-center justify-between w-full text-left p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'beranda'
                  ? 'bg-amber-400 text-[#081c3c] font-bold shadow-md shadow-amber-400/20'
                  : 'bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] border border-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTab === 'beranda' ? 'bg-[#081c3c] text-amber-300' : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'}`}>
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold">Beranda</span>
                  <span className={`text-[10px] ${currentTab === 'beranda' ? 'text-[#081c3c]/80 font-medium' : 'text-slate-400'}`}>
                    Peta GIS & Data 10 Pilar PSKS
                  </span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${currentTab === 'beranda' ? 'text-[#081c3c]' : 'text-slate-400'}`} />
            </button>

            {/* 2. PROFIL (ACCORDION WITH 4 SUB-MENUS) */}
            <div className="rounded-xl overflow-hidden bg-white/[0.04] border border-white/5">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('profil')}
                className={`flex items-center justify-between w-full text-left p-3 text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'profil' || mobileExpanded === 'profil'
                    ? 'bg-white/[0.08] text-amber-300 border-b border-amber-400/20'
                    : 'text-slate-200 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Profil</span>
                    <span className="text-[10px] text-slate-300">
                      4 Sub-Menu Informasi Kedinasan
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === 'profil' ? 'rotate-180 text-amber-300' : 'text-slate-400'}`} />
              </button>

              {mobileExpanded === 'profil' && (
                <div className="p-2 space-y-1 bg-black/25">
                  {profilSubMenus.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={sub.onClick}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-left transition-all cursor-pointer group"
                      >
                        <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0">
                          <SubIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white group-hover:text-amber-300 truncate">
                            {sub.title}
                          </div>
                          <div className="text-[10px] text-slate-300 truncate">
                            {sub.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. KONTAK (ACCORDION WITH 2 SUB-MENUS) */}
            <div className="rounded-xl overflow-hidden bg-white/[0.04] border border-white/5">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('contact')}
                className={`flex items-center justify-between w-full text-left p-3 text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'contact' || mobileExpanded === 'contact'
                    ? 'bg-white/[0.08] text-amber-300 border-b border-amber-400/20'
                    : 'text-slate-200 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Kontak</span>
                    <span className="text-[10px] text-slate-300">
                      2 Sub-Menu Saluran Resmi
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === 'contact' ? 'rotate-180 text-amber-300' : 'text-slate-400'}`} />
              </button>

              {mobileExpanded === 'contact' && (
                <div className="p-2 space-y-1 bg-black/25">
                  {kontakSubMenus.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={sub.onClick}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-left transition-all cursor-pointer group"
                      >
                        <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0">
                          <SubIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white group-hover:text-amber-300 truncate">
                            {sub.title}
                          </div>
                          <div className="text-[10px] text-slate-300 truncate">
                            {sub.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. PUSAT AKUN (ACCORDION WITH 2 SUB-MENUS) */}
            <div className="rounded-xl overflow-hidden bg-white/[0.04] border border-white/5">
              <button
                type="button"
                onClick={() => toggleMobileAccordion('akun')}
                className={`flex items-center justify-between w-full text-left p-3 text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'akun' || mobileExpanded === 'akun'
                    ? 'bg-white/[0.08] text-amber-300 border-b border-amber-400/20'
                    : 'text-slate-200 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Pusat Akun</span>
                    <span className="text-[10px] text-slate-300">
                      2 Sub-Menu Akses & Verifikasi
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileExpanded === 'akun' ? 'rotate-180 text-amber-300' : 'text-slate-400'}`} />
              </button>

              {mobileExpanded === 'akun' && (
                <div className="p-2 space-y-1 bg-black/25">
                  {akunSubMenus.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={sub.onClick}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/10 text-left transition-all cursor-pointer group"
                      >
                        <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 shrink-0">
                          <SubIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white group-hover:text-amber-300 truncate">
                            {sub.title}
                          </div>
                          <div className="text-[10px] text-slate-300 truncate">
                            {sub.desc}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS (KELUAR / LOGIN) */}
          <div className="pt-3 border-t border-white/10">
            {session.statusActive === 'SAH_TERDAFTAR' ? (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white text-xs font-bold py-2.5 rounded-xl border border-rose-400/40 shadow-sm cursor-pointer active:scale-95 transition-all"
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
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl border border-blue-400/40 shadow-md cursor-pointer active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Login Akun</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* POPUP KONFIRMASI MASUK / LOGIN AKUN UNTUK TAMU PUBLIK */}
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
