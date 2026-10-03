import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserSession } from '../types';
import { PILLARS_CONFIG, KAB_KOTA_ONLY } from '../data/initialData';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  BarChart3,
  PieChart,
  MapPin,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  Layers,
  Award,
  Filter,
  Eye,
  TrendingUp,
  Building2,
  Users2,
  ChevronRight,
  X,
} from 'lucide-react';

interface HomePSKSAnalyticsProps {
  allPillarData: Record<string, any[]>;
  session: UserSession;
  summaryCounts?: Record<string, number>;
  onSelectPillar?: (pillarId: string) => void;
  onScrollToGrid?: () => void;
}

// Ultra-fast and smooth animated number counter for real-time numeric climbing
export function useFastAnimatedCounter(targetValue: number, durationMs: number = 650): number {
  const safeTarget = Number.isFinite(targetValue) ? Math.max(0, targetValue) : 0;
  const [displayValue, setDisplayValue] = useState(safeTarget);
  const prevTargetRef = useRef(safeTarget);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = prevTargetRef.current;
    const change = safeTarget - startValue;

    if (change === 0) {
      setDisplayValue(safeTarget);
      return;
    }

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease-out cubic: rapid sprint up from 0 and softly locks at targetValue
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + change * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(safeTarget);
        prevTargetRef.current = safeTarget;
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      prevTargetRef.current = safeTarget;
    };
  }, [safeTarget, durationMs]);

  return displayValue;
}

// Visual color palette paired with West Java aesthetic
const PILLAR_COLORS: Record<string, { hex: string; bg: string; text: string }> = {
  peksos: { hex: '#059669', bg: 'bg-emerald-500', text: 'text-emerald-700' },
  psm: { hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-700' },
  tagana: { hex: '#d97706', bg: 'bg-amber-600', text: 'text-amber-700' },
  lks: { hex: '#7c3aed', bg: 'bg-purple-600', text: 'text-purple-700' },
  karangtaruna: { hex: '#0891b2', bg: 'bg-cyan-600', text: 'text-cyan-700' },
  lk3: { hex: '#e11d48', bg: 'bg-rose-600', text: 'text-rose-700' },
  pensos: { hex: '#4f46e5', bg: 'bg-indigo-600', text: 'text-indigo-700' },
  tksk: { hex: '#b45309', bg: 'bg-amber-700', text: 'text-amber-800' },
  badanusaha: { hex: '#0284c7', bg: 'bg-sky-600', text: 'text-sky-700' },
  slrt_puskesos: { hex: '#047857', bg: 'bg-emerald-700', text: 'text-emerald-800' },
};

// Normalize region naming to match 27 Kab/Kota strictly
const normalizeRegion = (raw: string): string => {
  const s = (raw || '').trim();
  if (!s || s === 'Prov. Jabar' || s === 'Semua Wilayah') return 'Kota Bandung';
  const direct = KAB_KOTA_ONLY.find((k) => k.toLowerCase() === s.toLowerCase());
  if (direct) return direct;
  const partial = KAB_KOTA_ONLY.find((k) => s.toLowerCase().includes(k.replace(/kab\.|kota\s/i, '').trim().toLowerCase()));
  if (partial) return partial;
  if (s.startsWith('Kabupaten ')) return s.replace('Kabupaten ', 'Kab. ');
  return s;
};

export const HomePSKSAnalytics: React.FC<HomePSKSAnalyticsProps> = ({
  allPillarData,
  session,
  summaryCounts,
  onSelectPillar,
  onScrollToGrid,
}) => {
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'COUNT' | 'MAP'>('COUNT');
  const [mobileTab, setMobileTab] = useState<'DONUT' | 'BAR'>('DONUT');
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);
  const donutContainerRef = useRef<HTMLDivElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);
  const desktopCardRef = useRef<HTMLDivElement>(null);

  // Auto-close donut detail card when clicking outside donut ring (khususnya pada sentuhan mobile)
  useEffect(() => {
    if (activeDonutIndex === null) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If clicked inside mobile card or desktop card, do not close
      if (mobileCardRef.current && mobileCardRef.current.contains(target)) return;
      if (desktopCardRef.current && desktopCardRef.current.contains(target)) return;

      // If clicked on a pie sector / cell path, do not close (let cell handle it)
      if (
        target.closest('.recharts-pie-sector') ||
        target.closest('.recharts-pie') ||
        target.closest('.recharts-sector') ||
        (target.tagName.toLowerCase() === 'path' && target.closest('.recharts-surface'))
      ) {
        return;
      }

      // If clicked on legend item, let legend onClick handle it
      if (target.closest('[data-pillar-legend]')) {
        return;
      }

      // Any other click (outside donut ring, center hole, outside section, etc.) -> close!
      setActiveDonutIndex(null);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('touchend', handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('touchend', handleOutsideClick);
    };
  }, [activeDonutIndex]);

  // 1. Calculate Donut Chart Data (Distribution across 10 Pillars)
  const pillarDistributionData = useMemo(() => {
    if (!allPillarData || typeof allPillarData !== 'object') return [];

    const list = Object.entries(PILLARS_CONFIG).map(([key, config]) => {
      const records = allPillarData && Array.isArray(allPillarData[key]) ? allPillarData[key] : [];
      const accurateCount = summaryCounts?.[key] !== undefined ? summaryCounts[key] : records.length;
      return {
        id: key,
        name: config.title || key,
        shortName: config.shortName || config.title || key,
        icon: config.icon || '📌',
        count: accurateCount,
        color: PILLAR_COLORS[key]?.hex || '#059669',
        unit: config.unitLabel || 'Data',
      };
    });

    const total = list.reduce((acc, curr) => acc + curr.count, 0);
    const safeTotal = total > 0 ? total : 1;

    return list.map((item) => ({
      ...item,
      percent: total > 0 ? Math.round((item.count / safeTotal) * 100) : 0,
    }));
  }, [allPillarData, summaryCounts]);

  const totalAllPillars = useMemo(() => {
    return pillarDistributionData.reduce((acc, curr) => acc + (Number.isFinite(curr.count) ? curr.count : 0), 0);
  }, [pillarDistributionData]);

  // Fast animated climb for accumulation total
  const animatedTotalAllPillars = useFastAnimatedCounter(totalAllPillars, 650);

  // Determine if active slice is positioned on the left or right side of the donut to float the card on the opposite side
  const activePositionOnRight = useMemo(() => {
    if (activeDonutIndex === null || activeDonutIndex < 0 || activeDonutIndex >= pillarDistributionData.length) {
      return false;
    }
    let cumulative = 0;
    for (let i = 0; i < activeDonutIndex; i++) {
      cumulative += pillarDistributionData[i]?.count || 0;
    }
    const currentCount = pillarDistributionData[activeDonutIndex]?.count || 0;
    const midCount = cumulative + currentCount / 2;
    const total = totalAllPillars > 0 ? totalAllPillars : 1;
    const fraction = midCount / total; // 0 to 1
    // If slice center is in the left arc (0.25 to 0.75), float card on RIGHT.
    // Otherwise in the right arc, float card on LEFT.
    return fraction >= 0.25 && fraction <= 0.75;
  }, [activeDonutIndex, pillarDistributionData, totalAllPillars]);

  // 2. Calculate Regional Bar Chart Data (27 Kab/Kota)
  const mapOrderIndex = useMemo(() => {
    return new Map(KAB_KOTA_ONLY.map((name, index) => [name, index]));
  }, []);

  const regionalData = useMemo(() => {
    const countsMap: Record<string, number> = {};

    // Initialize all 27 Kab/Kota strictly
    KAB_KOTA_ONLY.forEach((wil) => {
      countsMap[wil] = 0;
    });

    // Populate data safely
    if (allPillarData && typeof allPillarData === 'object') {
      if (selectedPillarFilter === 'ALL') {
        Object.entries(allPillarData).forEach(([_, records]) => {
          if (!Array.isArray(records)) return;
          records.forEach((rec) => {
            if (!rec || typeof rec !== 'object') return;
            const wil = normalizeRegion(rec.wilayah || '');
            if (countsMap[wil] !== undefined) {
              countsMap[wil] += 1;
            }
          });
        });
      } else {
        const records = Array.isArray(allPillarData[selectedPillarFilter]) ? allPillarData[selectedPillarFilter] : [];
        records.forEach((rec) => {
          if (!rec || typeof rec !== 'object') return;
          const wil = normalizeRegion(rec.wilayah || '');
          if (countsMap[wil] !== undefined) {
            countsMap[wil] += 1;
          }
        });
      }
    }

    let result = Object.entries(countsMap).map(([wilayah, count]) => {
      const isUserRegion =
        session.wilayah &&
        session.wilayah !== 'Prov. Jabar' &&
        session.wilayah !== 'Semua Wilayah' &&
        normalizeRegion(session.wilayah) === wilayah;

      return {
        wilayah,
        shortWilayah: wilayah.replace('Kabupaten ', 'Kab. '),
        count,
        mapOrder: mapOrderIndex.get(wilayah) ?? 999,
        isUserRegion,
      };
    });

    if (sortBy === 'COUNT') {
      result.sort((a, b) => b.count - a.count || a.mapOrder - b.mapOrder);
    } else {
      // Sesuai Peta (Kab. Bogor s/d Kota Banjar)
      result.sort((a, b) => a.mapOrder - b.mapOrder);
    }

    return result;
  }, [allPillarData, selectedPillarFilter, sortBy, session.wilayah, mapOrderIndex]);

  // Top region and average calculation
  const statsOverview = useMemo(() => {
    const sortedByCount = [...regionalData].sort((a, b) => b.count - a.count);
    const topRegion = sortedByCount[0] || { wilayah: '-', count: 0 };
    const avg = Math.round(totalAllPillars / (KAB_KOTA_ONLY.length || 1));
    return { topRegion, avg };
  }, [regionalData, totalAllPillars]);

  // Helper for clicking on pillar
  const handlePillarClick = (pillarId: string) => {
    if (onSelectPillar) {
      onSelectPillar(pillarId);
    } else if (onScrollToGrid) {
      onScrollToGrid();
    }
  };

  return (
    <section
      id="section-analitik-psks-beranda"
      className="py-8 sm:py-12 bg-gradient-to-b from-slate-50 via-emerald-50/20 to-white border-b border-emerald-900/10 relative overflow-hidden"
    >
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f2b5c]/10 border border-[#0f2b5c]/20 text-[#0f2b5c] text-[11px] font-black tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#b8901c]" />
              <span>DASHBOARD ANALITIK TERPADU JAWA BARAT</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#0f2b5c] tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] shrink-0" />
              <span>Statistik & Sebaran PSKS Realtime</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
              Visualisasi komprehensif data potensi dan sumber kesejahteraan sosial 10 pilar binaan Dinsos Jabar di 27 Kabupaten/Kota se-Jawa Barat.
            </p>
          </div>

          {/* Role Status Tag & Total Summary */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
              <Users2 className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Total PSKS Terdata</div>
                <div className="text-sm font-black text-[#0f2b5c] leading-none mt-0.5 font-mono">
                  {animatedTotalAllPillars.toLocaleString('id-ID')} <span className="text-[10px] font-semibold text-slate-500 font-sans">Record</span>
                </div>
              </div>
            </div>

            {session.wilayah && session.wilayah !== 'Prov. Jabar' && session.wilayah !== 'Semua Wilayah' && (
              <div className="px-3 py-1.5 rounded-xl bg-[#0f2b5c] text-amber-300 border border-blue-700 shadow-2xs flex items-center gap-1.5 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{session.wilayah}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile View Tab Switcher (Only on screens < 768px) */}
        <div className="flex md:hidden bg-slate-200/80 p-1 rounded-2xl border border-slate-300 shadow-inner">
          <button
            type="button"
            onClick={() => setMobileTab('DONUT')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'DONUT'
                ? 'bg-[#0f2b5c] text-[#d4af37] shadow-sm'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Proporsi 10 Pilar</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('BAR')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mobileTab === 'BAR'
                ? 'bg-[#0f2b5c] text-[#d4af37] shadow-sm'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Sebaran 27 Kab/Kota</span>
          </button>
        </div>

        {/* Main Charts Grid: Bento Layout (Desktop: Side-by-Side | Mobile: Tabbed/Stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= COLUMN KIRI: GRAFIK DONAT PROPORSI 10 PILAR ================= */}
          <div
            className={`lg:col-span-5 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-md flex flex-col justify-between transition-all ${
              mobileTab !== 'DONUT' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div>
              {/* Header Box */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-800 leading-tight">
                      Komposisi 10 Pilar PSKS
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      Rasio tenaga & lembaga sosial se-Jawa Barat
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                  10 Pilar
                </span>
              </div>

              {/* Recharts Donut Visual - Clean Fixed Center, Side Floating Inspector on Desktop (Zero Collision) */}
              <div
                ref={donutContainerRef}
                className="relative h-[270px] sm:h-[310px] w-full flex items-center justify-center select-none"
                onMouseLeave={(e) => {
                  if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                    const related = e.relatedTarget as Node | null;
                    if (desktopCardRef.current && related && desktopCardRef.current.contains(related)) {
                      return;
                    }
                    setActiveDonutIndex(null);
                  }
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart
                    key={`piechart-${totalAllPillars}-${pillarDistributionData.length}`}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Pie
                      data={pillarDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={74}
                      outerRadius={112}
                      paddingAngle={3}
                      dataKey="count"
                      isAnimationActive={false}
                      onMouseEnter={(_, index) => {
                        if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                          setActiveDonutIndex(index);
                        }
                      }}
                      onClick={(_, index) => {
                        setActiveDonutIndex((prev) => (prev === index ? null : index));
                      }}
                    >
                      {pillarDistributionData.map((entry, index) => {
                        const isHovered = activeDonutIndex === index;
                        return (
                          <Cell
                            key={`cell-${entry.id}`}
                            fill={entry.color}
                            stroke={isHovered ? '#043e2e' : '#ffffff'}
                            strokeWidth={isHovered ? 3.5 : 1.5}
                            className="transition-all duration-200 cursor-pointer outline-none"
                            style={{
                              filter: isHovered ? 'drop-shadow(0px 4px 10px rgba(0,0,0,0.28))' : 'none',
                              transformOrigin: 'center center',
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>

                {/* Donut Center Display - Static, Clean, Non-Colliding Accumulation Hub (Klik untuk menutup keterangan jika aktif) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <div 
                    className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-full flex flex-col items-center justify-center bg-white/95 shadow-sm border border-slate-200/90 p-2 text-center pointer-events-auto cursor-pointer"
                    onMouseEnter={() => {
                      if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                        setActiveDonutIndex(null);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDonutIndex(null);
                    }}
                  >
                    <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Total PSKS
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-[#043e2e] tracking-tight font-mono leading-none my-0.5 max-w-[105px] truncate">
                      {animatedTotalAllPillars.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 uppercase tracking-wider leading-none mt-0.5">
                      10 Pilar Jabar
                    </span>
                  </div>
                </div>

                {/* DESKTOP ONLY FLOATING CARD (JANGAN UBAH DEVICE LAIN / TETAP SEPERTI SEMULA PADA LAPTOP & DESKTOP): Melayang pada sisi donat */}
                {activeDonutIndex !== null && pillarDistributionData[activeDonutIndex] && (() => {
                  const activePillar = pillarDistributionData[activeDonutIndex];
                  return (
                    <div
                      ref={desktopCardRef}
                      className={`hidden sm:block absolute z-30 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-slate-700/80 transition-all duration-200 animate-fadeIn ${
                        activePositionOnRight
                          ? 'sm:top-3 sm:w-[195px] sm:right-2 sm:left-auto sm:translate-x-0'
                          : 'sm:top-3 sm:w-[195px] sm:left-2 sm:right-auto sm:translate-x-0'
                      }`}
                      onMouseEnter={() => {
                        // Keep open when cursor is hovering over floating card
                      }}
                      onMouseLeave={(e) => {
                        if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                          const related = e.relatedTarget as Node | null;
                          if (donutContainerRef.current && related && donutContainerRef.current.contains(related)) {
                            return;
                          }
                          setActiveDonutIndex(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header with color dot, short name, and close button */}
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: activePillar.color }}
                          />
                          <span className="text-[11px] font-black text-amber-300 truncate uppercase tracking-tight">
                            {activePillar.shortName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDonutIndex(null);
                          }}
                          className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                          title="Tutup"
                          aria-label="Tutup"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-300 line-clamp-2 mb-2 leading-tight">
                        {activePillar.name}
                      </p>

                      {/* Metrics breakdown */}
                      <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700/60 mb-2 space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-400 font-medium">Terdata:</span>
                          <span className="font-mono font-black text-emerald-400">
                            {activePillar.count.toLocaleString('id-ID')} {activePillar.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-slate-400 font-medium">Porsi:</span>
                          <span className="font-mono font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                            {activePillar.percent}%
                          </span>
                        </div>
                      </div>

                      {/* Action button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePillarClick(activePillar.id);
                        }}
                        className="w-full py-1.5 px-2 rounded-xl text-slate-950 font-black text-[10px] sm:text-[10.5px] flex items-center justify-center gap-1 shadow-sm transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                        style={{ backgroundColor: activePillar.color }}
                      >
                        <span>Lihat Data Pilar</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* KHUSUS PADA TAMPILAN HP SAJA: Keterangan dibuat di bawah grafik donat agar tidak menghalangi */}
              {activeDonutIndex !== null && pillarDistributionData[activeDonutIndex] && (() => {
                const activePillar = pillarDistributionData[activeDonutIndex];
                return (
                  <div
                    ref={mobileCardRef}
                    id="mobile-donut-keterangan"
                    className="block sm:hidden my-3 p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 shadow-xl transition-all duration-200 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with color dot, short name, and close button */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white/30"
                          style={{ backgroundColor: activePillar.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-amber-300 uppercase tracking-tight truncate">
                            {activePillar.shortName}
                          </div>
                          <div className="text-[10px] text-slate-300 font-medium truncate">
                            {activePillar.name}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDonutIndex(null);
                        }}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        title="Tutup Keterangan"
                        aria-label="Tutup Keterangan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metrics breakdown */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/60 mb-2.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-medium">Terdata di Jabar:</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {activePillar.count.toLocaleString('id-ID')}{' '}
                          <span className="text-[10px] font-sans text-slate-300 font-semibold">{activePillar.unit}</span>
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-medium">Porsi Sebaran:</span>
                        <span className="font-mono font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30 text-xs mt-0.5">
                          {activePillar.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePillarClick(activePillar.id);
                      }}
                      className="w-full py-2 px-3 rounded-xl text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:brightness-110 active:scale-98 cursor-pointer"
                      style={{ backgroundColor: activePillar.color }}
                    >
                      <span>Buka Data {activePillar.shortName}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Compact Legend Chips (Clickable to jump/filter with Synchronized Hover) */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                <span>Daftar Rincian 10 Pilar:</span>
                <span className="text-[10px] text-blue-700 font-semibold">Sorot / Klik detail</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {pillarDistributionData.map((item, index) => {
                  const isSelected = activeDonutIndex === index;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-pillar-legend="true"
                      onMouseEnter={() => setActiveDonutIndex(index)}
                      onMouseLeave={() => {
                        if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                          setActiveDonutIndex(null);
                        }
                      }}
                      onClick={(e) => {
                        if (typeof window !== 'undefined' && window.innerWidth < 640) {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveDonutIndex((prev) => (prev === index ? null : index));
                        } else {
                          handlePillarClick(item.id);
                        }
                      }}
                      className={`flex items-center justify-between p-1.5 rounded-xl border text-left transition-all text-xs cursor-pointer group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40'
                      }`}
                      title={`Klik untuk melihat detail pilar ${item.name}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className={`truncate text-[11px] ${
                            isSelected
                              ? 'font-black text-[#0f2b5c]'
                              : 'font-bold text-slate-700 group-hover:text-[#0f2b5c]'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          isSelected
                            ? 'font-black text-blue-800'
                            : 'font-black text-slate-500 group-hover:text-blue-700'
                        }`}
                      >
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= COLUMN KANAN: GRAFIK BATANG SEBARAN 27 KAB/KOTA ================= */}
          <div
            className={`lg:col-span-7 bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-md flex flex-col justify-between transition-all ${
              mobileTab !== 'BAR' ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="space-y-4">
              {/* Header Box & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-800 leading-tight">
                      Sebaran 27 Kabupaten / Kota
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      Komparasi kuantitas PSKS antar wilayah Jawa Barat
                    </p>
                  </div>
                </div>

                {/* Filter Pilar & Sorting Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Pilar Dropdown */}
                  <div className="relative flex items-center">
                    <select
                      value={selectedPillarFilter}
                      onChange={(e) => setSelectedPillarFilter(e.target.value)}
                      aria-label="Filter berdasarkan pilar spesifik"
                      className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 px-3 pr-7 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0f2b5c] cursor-pointer transition-colors"
                      title="Filter berdasarkan pilar spesifik"
                    >
                      <option value="ALL">Semua 10 Pilar</option>
                      {Object.entries(PILLARS_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>
                          {cfg.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sorter Buttons: Terbanyak vs Sesuai Peta */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSortBy('COUNT')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        sortBy === 'COUNT'
                          ? 'bg-[#0f2b5c] text-[#d4af37] shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Urutkan dari terbanyak ke terkecil"
                    >
                      Terbanyak
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy('MAP')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        sortBy === 'MAP'
                          ? 'bg-[#0f2b5c] text-[#d4af37] shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Urutkan sesuai peta dari Kab. Bogor sampai Kota Banjar"
                    >
                      Sesuai Peta
                    </button>
                  </div>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="h-[280px] sm:h-[310px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    key={`barchart-${totalAllPillars}-${selectedPillarFilter}-${sortBy}`}
                    data={regionalData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 55 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortWilayah"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 9.5, fill: '#475569', fontWeight: 600 }}
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      tickFormatter={(val: number) =>
                        val >= 10000 ? `${Math.round(val / 1000)}k` : val.toLocaleString('id-ID')
                      }
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 z-50">
                              <div className="font-extrabold text-amber-300 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                <span>{data.wilayah}</span>
                              </div>
                              <div className="text-[11px] text-slate-300">
                                Filter:{' '}
                                <span className="text-white font-semibold">
                                  {selectedPillarFilter === 'ALL'
                                    ? 'Total Seluruh Pilar'
                                    : PILLARS_CONFIG[selectedPillarFilter]?.title}
                                </span>
                              </div>
                              <div className="pt-1 border-t border-slate-700 flex items-center justify-between gap-4 font-bold">
                                <span>Jumlah Terdata:</span>
                                <span className="text-blue-400 font-mono text-sm">
                                  {data.count.toLocaleString('id-ID')} Record
                                </span>
                              </div>
                              {data.isUserRegion && (
                                <div className="text-[9.5px] font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 text-center mt-1">
                                  ★ Wilayah Tugas / Domisili Anda
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#0f2b5c"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    >
                      {regionalData.map((entry) => (
                        <Cell key={`bar-${entry.wilayah}`} fill="#0f2b5c" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Summary Bar for Regional Chart */}
            <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Wilayah Tertinggi:</span>
                <span className="font-extrabold text-[#0f2b5c] truncate block text-[11px]">
                  {statsOverview.topRegion.wilayah} ({statsOverview.topRegion.count})
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-500 block">Rata-rata / Kab-Kota:</span>
                <span className="font-extrabold text-slate-800 block text-[11px]">
                  ~{statsOverview.avg} Record
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-blue-50/60 p-2 rounded-xl border border-blue-200/70 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-800 block">Total Wilayah:</span>
                  <span className="font-black text-[#0f2b5c] block text-[11px]">27 Kab / Kota</span>
                </div>
                <Award className="w-4 h-4 text-[#d4af37] shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
