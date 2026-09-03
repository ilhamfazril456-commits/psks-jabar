import React from 'react';
import { PillarId, PSKSDataRecord } from '../types';
import { PILLARS_CONFIG } from '../data/initialData';
import {
  UserCheck,
  HeartHandshake,
  Flame,
  Building2,
  Award,
  Scale,
  Megaphone,
  MapPin,
  Store,
  ShieldCheck,
  ArrowRight,
  Layers,
  Users
} from 'lucide-react';

interface PillarsGridProps {
  onSelectPillar: (pillarId: PillarId) => void;
  allPillarData?: Record<string, PSKSDataRecord[]>;
}

const PILLAR_ICON_MAP: Record<
  string,
  {
    icon: React.ReactNode;
    bgGradient: string;
    badgeBg: string;
    textColor: string;
    tag: string;
  }
> = {
  peksos: {
    icon: <UserCheck className="w-7 h-7 text-white" />,
    bgGradient: 'from-emerald-600 via-emerald-700 to-teal-800',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textColor: 'text-emerald-800',
    tag: 'Profesional',
  },
  psm: {
    icon: <HeartHandshake className="w-7 h-7 text-white" />,
    bgGradient: 'from-amber-500 via-amber-600 to-orange-600',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    textColor: 'text-amber-800',
    tag: 'Masyarakat',
  },
  tagana: {
    icon: <Flame className="w-7 h-7 text-white" />,
    bgGradient: 'from-rose-600 via-red-600 to-rose-700',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    textColor: 'text-rose-800',
    tag: 'Siaga Bencana',
  },
  lks: {
    icon: <Building2 className="w-7 h-7 text-white" />,
    bgGradient: 'from-blue-600 via-blue-700 to-indigo-800',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    textColor: 'text-blue-800',
    tag: 'Lembaga',
  },
  karangtaruna: {
    icon: <Award className="w-7 h-7 text-white" />,
    bgGradient: 'from-yellow-500 via-amber-500 to-amber-600',
    badgeBg: 'bg-yellow-50 text-amber-900 border-yellow-300',
    textColor: 'text-amber-800',
    tag: 'Pemuda',
  },
  lk3: {
    icon: <Scale className="w-7 h-7 text-white" />,
    bgGradient: 'from-purple-600 via-purple-700 to-violet-800',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    textColor: 'text-purple-800',
    tag: 'Konsultasi',
  },
  pensos: {
    icon: <Megaphone className="w-7 h-7 text-white" />,
    bgGradient: 'from-pink-600 via-rose-600 to-pink-700',
    badgeBg: 'bg-pink-50 text-pink-800 border-pink-200',
    textColor: 'text-pink-800',
    tag: 'Penyuluhan',
  },
  tksk: {
    icon: <MapPin className="w-7 h-7 text-white" />,
    bgGradient: 'from-cyan-600 via-teal-600 to-cyan-700',
    badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    textColor: 'text-cyan-800',
    tag: 'Kecamatan',
  },
  badanusaha: {
    icon: <Store className="w-7 h-7 text-white" />,
    bgGradient: 'from-emerald-700 via-green-600 to-emerald-800',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textColor: 'text-emerald-800',
    tag: 'KUBE & Usaha',
  },
  slrt_puskesos: {
    icon: <ShieldCheck className="w-7 h-7 text-white" />,
    bgGradient: 'from-teal-700 via-emerald-800 to-teal-900',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    textColor: 'text-teal-800',
    tag: 'Layanan Terpadu',
  },
};

export const PillarsGrid: React.FC<PillarsGridProps> = ({ onSelectPillar, allPillarData }) => {
  const pillarKeys: PillarId[] = [
    'peksos',
    'psm',
    'tagana',
    'lks',
    'karangtaruna',
    'lk3',
    'pensos',
    'tksk',
    'badanusaha',
    'slrt_puskesos',
  ];

  return (
    <section className="py-4 sm:py-10 px-2 sm:px-6 max-w-7xl mx-auto">
      {/* Grid of 10 Features: 5 atas & 5 bawah (grid-cols-5 di semua layar termasuk HP) */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-4 md:gap-5 auto-rows-fr items-stretch">
        {pillarKeys.map((key) => {
          const pillar = PILLARS_CONFIG[key];
          const style = PILLAR_ICON_MAP[key] || {
            icon: <Layers className="w-4 h-4 sm:w-7 sm:h-7 text-white" />,
            bgGradient: 'from-emerald-600 to-teal-700',
            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            textColor: 'text-emerald-800',
            tag: 'PSKS',
          };

          // Hitung jumlah data terdaftar secara realtime
          const count = allPillarData?.[key]?.length ?? 0;
          const unit = pillar?.unitLabel || (key === 'lks' || key === 'slrt_puskesos' ? 'Lembaga' : key === 'badanusaha' ? 'Kelompok' : 'Orang');

          return (
            <div
              key={key}
              onClick={() => onSelectPillar(key)}
              className="group relative bg-white border border-slate-200/90 rounded-xl sm:rounded-3xl p-1.5 sm:p-4 text-center flex flex-col items-center justify-between cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-[#d4af37] transition-all duration-300 h-full overflow-hidden"
            >
              {/* Subtle accent bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 from-emerald-600 via-amber-500 to-emerald-700" />

              {/* Icon / Logo Badge */}
              <div className="relative mb-1 sm:mb-3 mt-0.5 sm:mt-1 flex items-center justify-center">
                <div
                  className={`w-7 h-7 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-gradient-to-br ${style.bgGradient} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-white/25`}
                >
                  {/* Clone icon with responsive sizing */}
                  {React.cloneElement(style.icon as React.ReactElement<any>, {
                    className: 'w-3.5 h-3.5 sm:w-7 sm:h-7 text-white',
                  })}
                </div>
                {/* Micro Tag Badge */}
                <span
                  className={`hidden sm:inline-block absolute -bottom-2 text-[8.5px] sm:text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap ${style.badgeBg}`}
                >
                  {style.tag}
                </span>
              </div>

              {/* Title & Description section */}
              <div className="flex-1 flex flex-col items-center justify-center w-full px-0.5 my-0.5 sm:my-1.5">
                <h3 className="text-[9px] sm:text-xs md:text-sm font-black text-[#064e3b] uppercase tracking-tighter sm:tracking-wider group-hover:text-[#b8901c] transition-colors leading-tight sm:leading-snug min-h-[22px] sm:min-h-[36px] flex items-center justify-center text-center">
                  {pillar?.title || key}
                </h3>
                {/* Sub-title / shortName is hidden on mobile screens, visible on desktop/laptop (sm:) */}
                <p className="hidden sm:flex text-[10.5px] text-slate-500 font-medium leading-tight min-h-[28px] items-center justify-center text-center mt-0.5 line-clamp-2">
                  {pillar?.shortName}
                </p>
              </div>

              {/* Label Real-time Jumlah Orang/Lembaga Terdata */}
              <div className="w-full my-0.5 sm:my-2 px-0.5">
                <div className="inline-flex items-center justify-center gap-0.5 sm:gap-1.5 w-full bg-slate-50 group-hover:bg-amber-50/70 border border-slate-200/80 group-hover:border-[#d4af37]/60 rounded-md sm:rounded-xl py-0.5 sm:py-1.5 px-0.5 sm:px-2 transition-all duration-300 shadow-2xs">
                  <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${count > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'} shrink-0`} />
                  <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-xs font-black text-slate-800 whitespace-nowrap">
                    <span className="text-[#043e2e] group-hover:text-amber-900 font-black">
                      {count.toLocaleString('id-ID')}
                    </span>
                    <span className="hidden sm:inline text-slate-500 font-bold text-[9px] sm:text-[10.5px]">
                      {unit} Terdata
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-auto pt-1 sm:pt-2 border-t border-slate-100 w-full flex items-center justify-center gap-0.5 shrink-0">
                <span className="text-[7.5px] sm:text-xs font-black text-[#b8901c] group-hover:text-amber-700 transition-colors flex items-center gap-0.5 sm:gap-1">
                  <span>Buka</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

