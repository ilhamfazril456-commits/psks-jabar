import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Flag,
  ShieldCheck,
  Users,
  ArrowRight,
  FolderOpen,
  UserRound,
  X,
  Settings2,
  Lock,
} from 'lucide-react';
import { BackToHomeButton } from './BackToHomeButton';
import { PahlawanNasionalItem, UserSession } from '../types';
import { TOTAL_PAHLAWAN_SLOTS } from '../services/pahlawanNasionalService';

export type KepahlawananMenuId =
  | 'pahlawan_nasional'
  | 'pkri'
  | 'janda_pkri'
  | 'keluarga_pahlawan';

export interface KepahlawananMenuItem {
  id: KepahlawananMenuId;
  title: string;
  subtitle?: string;
  fullTitle: string;
  iconBg: string;
  icon: React.ReactElement<{ className?: string }>;
}

export const KEPAHLAWANAN_MENUS: KepahlawananMenuItem[] = [
  {
    id: 'pahlawan_nasional',
    title: 'Pahlawan Nasional',
    fullTitle: 'Pahlawan Nasional',
    iconBg: 'from-[#0f2b5c] via-[#1a3f7e] to-[#0a1d3f]',
    icon: <Award className="w-4 h-4 sm:w-7 sm:h-7 text-white" />,
  },
  {
    id: 'pkri',
    title: 'PKRI',
    subtitle: '(Perintis Kemerdekaan Republik Indonesia)',
    fullTitle: 'PKRI (Perintis Kemerdekaan Republik Indonesia)',
    iconBg: 'from-rose-700 via-red-700 to-rose-800',
    icon: <Flag className="w-4 h-4 sm:w-7 sm:h-7 text-white" />,
  },
  {
    id: 'janda_pkri',
    title: 'Janda PKRI',
    fullTitle: 'Janda PKRI',
    iconBg: 'from-amber-600 via-amber-700 to-yellow-700',
    icon: <ShieldCheck className="w-4 h-4 sm:w-7 sm:h-7 text-white" />,
  },
  {
    id: 'keluarga_pahlawan',
    title: 'Keluarga Pahlawan',
    fullTitle: 'Keluarga Pahlawan',
    iconBg: 'from-emerald-700 via-teal-700 to-emerald-800',
    icon: <Users className="w-4 h-4 sm:w-7 sm:h-7 text-white" />,
  },
];

interface KepahlawananSectionProps {
  onSelectMenu: (menuId: KepahlawananMenuId) => void;
  session?: UserSession;
}

export const KepahlawananSection: React.FC<KepahlawananSectionProps> = ({ onSelectMenu, session }) => {
  const isMenuRestricted = (menuId: KepahlawananMenuId): boolean => {
    if (!session || session.statusActive !== 'SAH_TERDAFTAR' || session.role !== 'superadmin') return false;
    if (!Array.isArray(session.allowedKepahlawanan)) return false;
    if (session.allowedKepahlawanan.includes('all') || session.allowedKepahlawanan.includes('*')) return false;
    return !session.allowedKepahlawanan.includes(menuId);
  };

  return (
    <div id="section-gerbang-kepahlawanan" className="w-full">
      {/* Banner Biru Gerbang Kepahlawanan (seukuran dengan banner biru Gerbang Digital PSKS) */}
      <section
        id="banner-gerbang-kepahlawanan"
        className="relative w-full bg-[#0f2b5c] border-y border-blue-900/60 min-h-[98px] sm:min-h-[126px] py-5 sm:py-7 px-4 sm:px-6 flex items-center justify-center"
      >
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center text-center">
          <h2
            id="judul-gerbang-kepahlawanan"
            className="scroll-mt-[80px] sm:scroll-mt-[90px] text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-snug sm:leading-tight"
          >
            GERBANG KEPAHLAWANAN
          </h2>
        </div>
      </section>

      {/* 4 Menu Kotak Berjajar (4 kolom pada HP maupun Laptop) */}
      <section className="py-4 sm:py-10 px-2 sm:px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-4 md:gap-5 auto-rows-fr items-stretch">
          {KEPAHLAWANAN_MENUS.map((menu) => {
            const restricted = isMenuRestricted(menu.id);
            return (
            <button
              key={menu.id}
              type="button"
              onClick={() => onSelectMenu(menu.id)}
              aria-label={menu.fullTitle}
              className={`group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2b5c] rounded-xl sm:rounded-3xl p-1.5 sm:p-5 text-center flex flex-col items-center justify-between cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full overflow-hidden ${
                restricted
                  ? 'bg-slate-50/95 border border-rose-200/90 hover:border-rose-400'
                  : 'bg-white border border-slate-200/90 hover:border-[#d4af37]'
              }`}
            >
              {/* Subtle accent bar on hover */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${restricted ? 'from-rose-500 via-amber-500 to-rose-600' : 'from-[#0f2b5c] via-amber-500 to-[#1a4a9c]'}`} />

              {restricted && (
                <div className="absolute top-1 right-1 sm:top-2.5 sm:right-2.5 z-10 inline-flex items-center justify-center w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-rose-100 border border-rose-300 text-rose-700 shadow-2xs" title="Akses Kepahlawanan Dikunci Developer">
                  <Lock className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                </div>
              )}

              {/* Icon Badge */}
              <div className="relative mt-0.5 sm:mt-1 mb-1.5 sm:mb-3 flex items-center justify-center shrink-0">
                <div
                  className={`w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-gradient-to-br ${menu.iconBg} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-white/25 ${restricted ? 'opacity-65 grayscale-[35%]' : ''}`}
                >
                  {menu.icon}
                </div>
              </div>

              {/* Title & Optional Subtitle */}
              <div className="flex-1 flex flex-col items-center justify-center w-full px-0.5 my-1 sm:my-2">
                <h3 className={`text-[8px] min-[380px]:text-[9px] sm:text-xs md:text-sm font-black uppercase tracking-tight sm:tracking-wider transition-colors leading-[1.15] sm:leading-snug text-center break-words hyphens-none w-full ${restricted ? 'text-slate-600' : 'text-[#0f2b5c] group-hover:text-[#b8901c]'}`}>
                  {menu.title}
                </h3>
                {menu.subtitle && (
                  <p className="text-[6.5px] min-[380px]:text-[7.5px] sm:text-[10.5px] md:text-xs text-slate-600 font-semibold leading-[1.15] sm:leading-snug mt-0.5 sm:mt-1 text-center break-words w-full">
                    {menu.subtitle}
                  </p>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-auto pt-1.5 sm:pt-2.5 border-t border-slate-100 w-full flex items-center justify-center gap-0.5 shrink-0">
                {restricted ? (
                  <span className="text-[7.5px] min-[380px]:text-[8px] sm:text-xs font-black text-rose-600 flex items-center gap-0.5 sm:gap-1">
                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>Terkunci</span>
                  </span>
                ) : (
                  <span className="text-[7.5px] min-[380px]:text-[8px] sm:text-xs font-black text-[#b8901c] group-hover:text-amber-700 transition-colors flex items-center gap-0.5 sm:gap-1">
                    <span>Buka</span>
                    <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </div>
            </button>
          );
          })}
        </div>
      </section>
    </div>
  );
};

interface KepahlawananDetailViewProps {
  menuId: KepahlawananMenuId;
  session?: UserSession;
  pahlawanList?: PahlawanNasionalItem[];
  onOpenManagePahlawan?: (initialSlot?: number) => void;
  onBackToHome: () => void;
}

export const KepahlawananDetailView: React.FC<KepahlawananDetailViewProps> = ({
  menuId,
  session,
  pahlawanList = [],
  onOpenManagePahlawan,
  onBackToHome,
}) => {
  const menu = KEPAHLAWANAN_MENUS.find((item) => item.id === menuId) || KEPAHLAWANAN_MENUS[0];
  const [selectedHero, setSelectedHero] = useState<PahlawanNasionalItem | null>(null);

  const canManage =
    session?.statusActive === 'SAH_TERDAFTAR' &&
    (session?.role === 'superadmin' || session?.role === 'developer' || session?.isDeveloper === true);

  const slotMap = useMemo(() => {
    const map = new Map<number, PahlawanNasionalItem>();
    pahlawanList.forEach((hero) => {
      if (hero.slotNumber >= 1 && hero.slotNumber <= TOTAL_PAHLAWAN_SLOTS) {
        map.set(hero.slotNumber, hero);
      }
    });
    return map;
  }, [pahlawanList]);

  const filledCount = slotMap.size;

  useEffect(() => {
    if (!selectedHero) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedHero(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedHero]);

  if (menuId === 'pahlawan_nasional') {
    const slots = Array.from({ length: TOTAL_PAHLAWAN_SLOTS }, (_, idx) => idx + 1);

    return (
      <div className="min-h-[75vh] bg-slate-50 py-6 sm:py-10 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-pahlawan-nasional" />

            {canManage && onOpenManagePahlawan && (
              <button
                type="button"
                onClick={() => onOpenManagePahlawan()}
                className="inline-flex items-center justify-center gap-2 h-9 sm:h-11 px-4 rounded-xl bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 border border-[#d4af37]/60 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Settings2 className="w-4 h-4 shrink-0" />
                <span>Kelola Pahlawan Nasional</span>
              </button>
            )}
          </div>

          {/* Section Title Block */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${menu.iconBg} flex items-center justify-center shadow-sm shrink-0`}
                >
                  {React.cloneElement(menu.icon, {
                    className: 'w-6 h-6 sm:w-7 sm:h-7 text-white',
                  })}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Gerbang Kepahlawanan
                  </p>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0f2b5c] tracking-tight">
                    Pahlawan Nasional
                  </h1>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 font-medium sm:text-right">
                <span className="font-bold text-[#0f2b5c] tabular-nums">
                  {filledCount} dari {TOTAL_PAHLAWAN_SLOTS}
                </span>{' '}
                pahlawan terdaftar · Klik foto untuk membaca biografi
              </div>
            </div>

            {/* 18-Slot Grid: 6 kolom x 3 baris pada laptop/desktop, 2 kolom pada HP, 3 kolom pada tablet kecil */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 auto-rows-fr items-stretch">
              {slots.map((slotNum) => {
                const hero = slotMap.get(slotNum);

                if (hero) {
                  return (
                    <button
                      key={slotNum}
                      type="button"
                      onClick={() => setSelectedHero(hero)}
                      aria-label={`Lihat biografi ${hero.nama}`}
                      className="group bg-white border border-slate-200 hover:border-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2b5c] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col text-left cursor-pointer"
                    >
                      <div className="relative w-full aspect-[3/4] bg-slate-100 overflow-hidden">
                        <img
                          src={hero.fotoBase64}
                          alt={hero.nama}
                          loading="lazy"
                          className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </div>
                      <div className="p-2.5 sm:p-3 flex-1 flex flex-col items-center justify-center text-center bg-white border-t border-slate-100">
                        <h3 className="text-xs sm:text-[13px] font-bold text-[#0f2b5c] group-hover:text-[#b8901c] transition-colors leading-snug line-clamp-2">
                          {hero.nama}
                        </h3>
                      </div>
                    </button>
                  );
                }

                if (canManage && onOpenManagePahlawan) {
                  return (
                    <button
                      key={slotNum}
                      type="button"
                      onClick={() => onOpenManagePahlawan(slotNum)}
                      aria-label={`Isi data Pahlawan Nasional Slot ${slotNum}`}
                      className="group bg-slate-50 hover:bg-amber-50/40 border border-dashed border-slate-300 hover:border-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2b5c] rounded-xl sm:rounded-2xl overflow-hidden transition-colors flex flex-col cursor-pointer"
                    >
                      <div className="w-full aspect-[3/4] flex flex-col items-center justify-center p-3 text-slate-400 group-hover:text-[#0f2b5c] transition-colors">
                        <UserRound className="w-8 h-8 sm:w-9 sm:h-9 mb-2 opacity-60" />
                        <span className="text-[11px] font-semibold">Slot {slotNum}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-amber-700 mt-0.5">
                          Isi Data
                        </span>
                      </div>
                      <div className="p-2.5 sm:p-3 border-t border-slate-200/70 bg-white/70 text-center">
                        <span className="text-[11px] font-medium text-slate-400">
                          Kosong
                        </span>
                      </div>
                    </button>
                  );
                }

                return (
                  <div
                    key={slotNum}
                    className="bg-slate-50/80 border border-slate-200/80 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col"
                  >
                    <div className="w-full aspect-[3/4] flex flex-col items-center justify-center p-3 text-slate-300">
                      <UserRound className="w-8 h-8 sm:w-9 sm:h-9 mb-1.5 opacity-70" />
                      <span className="text-[11px] font-medium text-slate-400">
                        Slot {slotNum}
                      </span>
                    </div>
                    <div className="p-2.5 sm:p-3 border-t border-slate-100 bg-white text-center">
                      <span className="text-[11px] font-medium text-slate-400">
                        Belum Diisi
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kotak Melayang Biografi Pahlawan */}
        {selectedHero && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-hero-name"
            onClick={() => setSelectedHero(null)}
            className="fixed inset-0 z-[1200] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-[#0f2b5c] text-white shrink-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-amber-300">
                    Biografi Pahlawan Nasional
                  </p>
                  <h2
                    id="dialog-hero-name"
                    className="text-base sm:text-xl font-black text-white tracking-tight truncate"
                  >
                    {selectedHero.nama}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedHero(null)}
                  aria-label="Tutup biografi pahlawan"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  <div className="w-40 sm:w-44 aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs shrink-0">
                    <img
                      src={selectedHero.fotoBase64}
                      alt={selectedHero.nama}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                    <h3 className="text-lg sm:text-2xl font-black text-[#0f2b5c] leading-tight">
                      {selectedHero.nama}
                    </h3>
                    {selectedHero.gelar && (
                      <p className="text-xs sm:text-sm font-semibold text-slate-500">
                        {selectedHero.gelar}
                      </p>
                    )}
                    <div className="pt-2 border-t border-slate-100 text-sm sm:text-[15px] text-slate-700 leading-relaxed whitespace-pre-line text-left">
                      {selectedHero.biografi}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedHero(null)}
                  className="px-5 py-2 rounded-xl bg-[#0f2b5c] hover:bg-[#143b7d] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 py-6 sm:py-10 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <BackToHomeButton onClick={onBackToHome} />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 border-b border-slate-100 pb-6 text-center sm:text-left">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${menu.iconBg} flex items-center justify-center shadow-sm shrink-0`}
            >
              {React.cloneElement(menu.icon, {
                className: 'w-7 h-7 sm:w-8 sm:h-8 text-white',
              })}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500">
                Gerbang Kepahlawanan
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-[#0f2b5c] tracking-tight">
                {menu.fullTitle}
              </h1>
            </div>
          </div>

          <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <p className="text-sm sm:text-base font-bold text-slate-700">
              Menu {menu.title} Belum Memiliki Data
            </p>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Isi modul ini sengaja dikosongkan untuk sementara hingga data dan pengelolaannya ditambahkan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
