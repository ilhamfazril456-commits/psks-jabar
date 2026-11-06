import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserSession } from '../types';
import { PILLARS_CONFIG, KAB_KOTA_ONLY } from '../data/initialData';
import { isRealDataLoaded } from '../services/regionalDistributionService';
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
  regionalSummary?: Record<string, { total: number; byPillar?: Record<string, number> }>;
  onSelectPillar?: (pillarId: string) => void;
  onScrollToGrid?: () => void;
  isSummarySynced?: boolean;
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

// Visual color palette harmonized with West Java identity & user-specified pillar palette
const PILLAR_COLORS: Record<string, { hex: string; bg: string; text: string }> = {
  peksos: { hex: '#059669', bg: 'bg-emerald-500', text: 'text-emerald-700' },
  psm: { hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-700' }, // Oranye
  tagana: { hex: '#dc2626', bg: 'bg-red-600', text: 'text-red-700' }, // Merah
  lks: { hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-700' }, // Biru
  karangtaruna: { hex: '#facc15', bg: 'bg-yellow-400', text: 'text-yellow-700' }, // Kuning cerah
  lk3: { hex: '#9333ea', bg: 'bg-purple-600', text: 'text-purple-700' },
  pensos: { hex: '#f472b6', bg: 'bg-pink-400', text: 'text-pink-700' }, // Pink muda
  tksk: { hex: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-700' }, // Biru tosca
  badanusaha: { hex: '#84cc16', bg: 'bg-lime-500', text: 'text-lime-700' }, // Hijau muda
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
  regionalSummary,
  onSelectPillar,
  onScrollToGrid,
  isSummarySynced = false,
}) => {
  const [selectedPillarFilter, setSelectedPillarFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'COUNT' | 'MAP'>('MAP');
  const [mobileTab, setMobileTab] = useState<'DONUT' | 'BAR'>('DONUT');
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const donutContainerRef = useRef<HTMLDivElement>(null);
  const mobileCardRef = useRef<HTMLDivElement>(null);

  // Auto-close donut detail card when clicking outside donut ring (khususnya pada sentuhan mobile)
  useEffect(() => {
    if (activeDonutIndex === null) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If clicked inside mobile card, do not close
      if (mobileCardRef.current && mobileCardRef.current.contains(target)) return;

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

  // 1. Calculate Donut Chart Data (Distribution across 10 Pillars with Perceptual Arc Floor)
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

    // Hitung persentase riil murni untuk data, tooltip & center hub
    const withRealPercent = list.map((item) => {
      const rawPercent = total > 0 ? (item.count / safeTotal) * 100 : 0;
      let displayPercent = '0%';
      if (rawPercent > 0 && rawPercent < 0.1) {
        displayPercent = '< 0.1%';
      } else if (rawPercent > 0 && rawPercent < 1) {
        displayPercent = `${rawPercent.toFixed(1)}%`;
      } else {
        displayPercent = `${Math.round(rawPercent)}%`;
      }

      return {
        ...item,
        percent: Math.round(rawPercent),
        displayPercent,
        rawFraction: total > 0 ? item.count / safeTotal : 0,
      };
    });

    // IMPLEMENTASI SOLUSI 1: Perceptual Arc Floor
    // Jaminan sudut visual minimal ~4.5° - 6.5° per pilar aktif agar Peksos, TKSK, Badan Usaha, Pensos, LK3 tidak tenggelam
    const MIN_ARC_FRACTION = 0.014; // ~5 derajat visual minimal
    let totalAssignedFloor = 0;
    let bigPillarsRawSum = 0;

    withRealPercent.forEach((it) => {
      if (it.count === 0) return;
      if (it.rawFraction < MIN_ARC_FRACTION) {
        // Skala bertingkat halus agar pilar 71 lebih lebar dari 17 & 6
        const microScale = Math.min(0.009, (it.count / 250) * 0.009);
        const floorVal = MIN_ARC_FRACTION + microScale;
        totalAssignedFloor += floorVal;
      } else {
        bigPillarsRawSum += it.rawFraction;
      }
    });

    const remainingFractionForBig = Math.max(0.2, 1 - totalAssignedFloor);

    return withRealPercent.map((it) => {
      if (it.count === 0) {
        return { ...it, visualWeight: 0 };
      }

      let visualFraction: number;
      if (it.rawFraction < MIN_ARC_FRACTION) {
        const microScale = Math.min(0.009, (it.count / 250) * 0.009);
        visualFraction = MIN_ARC_FRACTION + microScale;
      } else {
        // Distribusikan sisa persentase secara proporsional kepada pilar-pilar besar
        const proportionOfBig = bigPillarsRawSum > 0 ? it.rawFraction / bigPillarsRawSum : 0;
        visualFraction = proportionOfBig * remainingFractionForBig;
      }

      return {
        ...it,
        visualWeight: Math.round(visualFraction * 10000), // Digunakan Recharts untuk menggambar busur donat
      };
    });
  }, [allPillarData, summaryCounts]);

  const totalAllPillars = useMemo(() => {
    return pillarDistributionData.reduce((acc, curr) => acc + (Number.isFinite(curr.count) ? curr.count : 0), 0);
  }, [pillarDistributionData]);

  // Fast animated climb for accumulation total
  const animatedTotalAllPillars = useFastAnimatedCounter(totalAllPillars, 650);

  // Handler interaksi mouse halus untuk tooltip melayang bebas pada layar laptop/desktop
  const handleDonutMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobileScreen) return;
    if (!donutContainerRef.current) return;
    const rect = donutContainerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDonutMouseLeave = () => {
    if (!isMobileScreen) {
      setActiveDonutIndex(null);
      setMousePos(null);
    }
  };

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

    const summaryTotal = Object.values(regionalSummary || {}).reduce((acc, curr) => acc + (curr?.total || 0), 0);
    const pillarTotal = Object.values(allPillarData || {}).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);

    // If regionalSummary represents the comprehensive official dataset (e.g. 6.731 Live Firestore),
    // immediately use accurate regionalSummary to avoid dropping to partial records
    if (regionalSummary && Object.keys(regionalSummary).length > 0 && (summaryTotal >= pillarTotal || pillarTotal < 1000)) {
      KAB_KOTA_ONLY.forEach((wil) => {
        const item = regionalSummary[wil];
        if (item) {
          if (selectedPillarFilter === 'ALL') {
            countsMap[wil] = item.total || 0;
          } else {
            countsMap[wil] = item.byPillar?.[selectedPillarFilter] || 0;
          }
        }
      });
    } else if (allPillarData && typeof allPillarData === 'object') {
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

      // Nama ringkas tanpa kata 'Kabupaten' / 'Kab.' khusus sumbu X di HP agar tidak bertumpuk
      const mobileWilayah = wilayah
        .replace(/^Kabupaten\s+/i, '')
        .replace(/^Kab\.\s+/i, '')
        .replace(/^Kab\s+/i, '')
        .replace('Bandung Barat', 'KBB');

      return {
        wilayah,
        shortWilayah: wilayah.replace('Kabupaten ', 'Kab. '),
        mobileWilayah,
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
  }, [allPillarData, selectedPillarFilter, sortBy, session.wilayah, mapOrderIndex, regionalSummary]);

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
              <span className={`w-1.5 h-1.5 rounded-full ${isSummarySynced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
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
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase leading-none">
                  <span>Total PSKS Terdata</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSummarySynced ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} title={isSummarySynced ? 'Data Terverifikasi Supabase' : 'Sinkronisasi real-time...'} />
                </div>
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

              {/* Recharts Donut Visual - 100% Licin, Celah Rapat Elegan, Center Hub Dinamis & Tooltip Melayang Bebas */}
              <div
                ref={donutContainerRef}
                className="relative h-[290px] sm:h-[320px] w-full flex items-center justify-center select-none overflow-visible"
                onMouseMove={handleDonutMouseMove}
                onMouseLeave={handleDonutMouseLeave}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart
                    key={`piechart-${totalAllPillars}-${pillarDistributionData.length}`}
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <Pie
                      data={pillarDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobileScreen ? 68 : 78}
                      outerRadius={isMobileScreen ? 108 : 122}
                      paddingAngle={1}
                      dataKey="visualWeight"
                      isAnimationActive={false}
                      onMouseEnter={(_, index) => {
                        setActiveDonutIndex(index);
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
                            stroke="#ffffff"
                            strokeWidth={isHovered ? 2.5 : 1.5}
                            className="cursor-pointer outline-none transition-all duration-150"
                            style={{
                              transform: isHovered ? 'scale(1.045)' : 'scale(1)',
                              transformOrigin: 'center center',
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>

                {/* Donut Center Display - Dynamic Interactive Hub (Nol Tabrakan, Teks Bersih & Mulus) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <div
                    className="w-[124px] h-[124px] sm:w-[136px] sm:h-[136px] rounded-full flex flex-col items-center justify-center bg-white/95 shadow-sm border border-slate-200/90 p-2 text-center pointer-events-auto cursor-pointer transition-all duration-200 hover:scale-102"
                    onMouseEnter={() => {
                      if (!isMobileScreen) {
                        setActiveDonutIndex(null);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDonutIndex(null);
                    }}
                    title="Klik untuk melihat total keseluruhan"
                  >
                    {activeDonutIndex !== null && pillarDistributionData[activeDonutIndex] ? (
                      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: pillarDistributionData[activeDonutIndex].color }}
                          />
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight max-w-[95px] truncate">
                            {pillarDistributionData[activeDonutIndex].shortName}
                          </span>
                        </div>
                        <span className="text-xl sm:text-2xl font-black text-[#0f2b5c] font-mono leading-none my-0.5 max-w-[105px] truncate">
                          {pillarDistributionData[activeDonutIndex].count.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 uppercase tracking-wider leading-none mt-0.5">
                          {(pillarDistributionData[activeDonutIndex] as any).displayPercent || `${pillarDistributionData[activeDonutIndex].percent}%`} Total
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center animate-in fade-in duration-150">
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
                    )}
                  </div>
                </div>

                {/* DESKTOP CURSOR-FOLLOWING TOOLTIP: Bergerak bebas mengikuti kursor mouse, 100% licin & tidak menutupi irisan */}
                {!isMobileScreen && activeDonutIndex !== null && mousePos && pillarDistributionData[activeDonutIndex] && (() => {
                  const activePillar = pillarDistributionData[activeDonutIndex];
                  const containerW = donutContainerRef.current?.clientWidth || 320;
                  const containerH = donutContainerRef.current?.clientHeight || 320;

                  const cardW = 190;
                  const cardH = 110;

                  // Posisi X cerdas: jika kursor mendekati sisi kanan, geser tooltip ke kiri kursor
                  const posX = mousePos.x + cardW + 18 > containerW
                    ? Math.max(10, mousePos.x - cardW - 14)
                    : mousePos.x + 16;

                  // Posisi Y cerdas: jika kursor mendekati bawah, geser tooltip ke atas kursor
                  const posY = mousePos.y + cardH + 18 > containerH
                    ? Math.max(10, mousePos.y - cardH - 8)
                    : Math.max(10, mousePos.y - 30);

                  return (
                    <div
                      className="pointer-events-none absolute z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 shadow-2xl border border-slate-700/80 transition-transform duration-75 ease-out select-none"
                      style={{
                        width: `${cardW}px`,
                        transform: `translate3d(${posX}px, ${posY}px, 0)`,
                        left: 0,
                        top: 0,
                        willChange: 'transform',
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-slate-800">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: activePillar.color }}
                        />
                        <span className="text-[11px] font-black text-amber-300 truncate uppercase tracking-tight">
                          {activePillar.shortName}
                        </span>
                      </div>

                      <p className="text-[9.5px] text-slate-300 line-clamp-1 mb-1.5 leading-tight">
                        {activePillar.name}
                      </p>

                      <div className="space-y-1 bg-slate-800/80 rounded-xl p-1.5 border border-slate-700/60">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Terdata:</span>
                          <span className="font-mono font-black text-emerald-400">
                            {activePillar.count.toLocaleString('id-ID')} {activePillar.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-medium">Porsi Sebaran:</span>
                          <span className="font-mono font-black text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/30">
                            {(activePillar as any).displayPercent || `${activePillar.percent}%`}
                          </span>
                        </div>
                      </div>
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
                          {(activePillar as any).displayPercent || `${activePillar.percent}%`}
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
            className={`lg:col-span-7 bg-white rounded-3xl p-2.5 sm:p-6 border border-slate-200/80 shadow-md flex flex-col justify-between transition-all ${
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

                  {/* Sorter Buttons: Sesuai Peta vs Terbanyak */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
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
                  </div>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="h-[290px] sm:h-[310px] w-full pt-1 sm:pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    key={`barchart-${totalAllPillars}-${selectedPillarFilter}-${sortBy}-${isMobileScreen}`}
                    data={regionalData}
                    margin={{
                      top: 10,
                      right: isMobileScreen ? 4 : 10,
                      left: isMobileScreen ? -25 : -15,
                      bottom: isMobileScreen ? 65 : 55,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey={isMobileScreen ? 'mobileWilayah' : 'shortWilayah'}
                      interval={0}
                      angle={isMobileScreen ? -70 : -45}
                      textAnchor="end"
                      tick={{
                        fontSize: isMobileScreen ? 8 : 9.5,
                        fill: isMobileScreen ? '#334155' : '#475569',
                        fontWeight: isMobileScreen ? 700 : 600,
                      }}
                      height={isMobileScreen ? 70 : 60}
                      dx={isMobileScreen ? -2 : 0}
                      dy={isMobileScreen ? 2 : 0}
                    />
                    <YAxis
                      width={isMobileScreen ? 28 : undefined}
                      tick={{ fontSize: isMobileScreen ? 8.5 : 10, fill: '#64748b' }}
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
