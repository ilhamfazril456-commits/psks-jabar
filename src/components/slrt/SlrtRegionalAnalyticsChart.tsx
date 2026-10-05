import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PSKSDataRecord } from '../../types';
import { KAB_KOTA_ONLY } from '../../data/initialData';
import { isSameWilayah } from '../../utils/submissionStatus';
import { RegionalSummaryMap } from '../../services/regionalDistributionService';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Trophy,
  Activity,
  CheckCircle2,
  Sparkles,
  MapPin,
  ArrowRight,
  MousePointerClick,
  Info,
} from 'lucide-react';

interface SlrtRegionalAnalyticsChartProps {
  dataRecords: PSKSDataRecord[];
  regionalSummary?: RegionalSummaryMap;
  onSelectRegion: (regionName: string) => void;
}

// Ultra-smooth easing animated counter for real-time reactive value climbing
function useAnimatedNumber(target: number, duration: number = 650): number {
  const safeTarget = Number.isFinite(target) ? Math.max(0, target) : 0;
  const [val, setVal] = useState(safeTarget);
  const prevRef = useRef(safeTarget);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = prevRef.current;
    const change = safeTarget - startValue;

    if (change === 0) {
      setVal(safeTarget);
      return;
    }

    let frameId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + change * ease);

      setVal(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setVal(safeTarget);
        prevRef.current = safeTarget;
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      prevRef.current = safeTarget;
    };
  }, [safeTarget, duration]);

  return val;
}

// Canonical short abbreviations for 27 Kab/Kota so they fit neatly under vertical bars without scroll
function getRegionAbbreviation(name: string): string {
  const clean = name.replace(/^Kabupaten\s+/i, '').replace(/^Kab\.\s+/i, '').replace(/^Kota\s+/i, '');
  const isKota = /^Kota\s+/i.test(name);

  switch (clean.toLowerCase()) {
    case 'bogor':
      return isKota ? 'K. Bgr' : 'Bogor';
    case 'sukabumi':
      return isKota ? 'K. Skm' : 'Sukabumi';
    case 'cianjur':
      return 'Cianjur';
    case 'bandung':
      return isKota ? 'K. Bdg' : 'Bandung';
    case 'garut':
      return 'Garut';
    case 'tasikmalaya':
      return isKota ? 'K. Tsk' : 'Tasik';
    case 'ciamis':
      return 'Ciamis';
    case 'kuningan':
      return 'Kuningan';
    case 'cirebon':
      return isKota ? 'K. Crb' : 'Cirebon';
    case 'majalengka':
      return 'Mjlengka';
    case 'sumedang':
      return 'Sumedang';
    case 'indramayu':
      return 'Indramayu';
    case 'subang':
      return 'Subang';
    case 'purwakarta':
      return 'Pwkarta';
    case 'karawang':
      return 'Karawang';
    case 'bekasi':
      return isKota ? 'K. Bks' : 'Bekasi';
    case 'bandung barat':
      return 'KBB';
    case 'pangandaran':
      return 'Pangandaran';
    case 'depok':
      return 'K. Depok';
    case 'cimahi':
      return 'K. Cimahi';
    case 'banjar':
      return 'K. Banjar';
    default:
      return clean.length > 7 ? clean.slice(0, 6) + '.' : clean;
  }
}

export const SlrtRegionalAnalyticsChart: React.FC<SlrtRegionalAnalyticsChartProps> = ({
  dataRecords,
  regionalSummary,
  onSelectRegion,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // 1. Calculate live counts per 27 Kabupaten/Kota in Jawa Barat strictly
  // Exact canonical sequence: Kab. Bogor (#1) to Kota Banjar (#27)
  const regionalStats = useMemo(() => {
    const countsMap: Record<string, number> = {};
    KAB_KOTA_ONLY.forEach((reg) => {
      countsMap[reg] = 0;
    });

    const hasLoadedRecords = Array.isArray(dataRecords) && dataRecords.length > 0;

    if (hasLoadedRecords) {
      dataRecords.forEach((rec) => {
        if (!rec || typeof rec !== 'object') return;
        const matched = KAB_KOTA_ONLY.find((k) => isSameWilayah(rec.wilayah, k));
        if (matched) {
          countsMap[matched] = (countsMap[matched] || 0) + 1;
        }
      });
    } else if (regionalSummary && Object.keys(regionalSummary).length > 0) {
      // Fallback to baseline regional summary if records haven't loaded yet
      KAB_KOTA_ONLY.forEach((reg) => {
        const item = regionalSummary[reg];
        if (item) {
          countsMap[reg] = item.byPillar?.['slrt_puskesos'] || item.total || 0;
        }
      });
    }

    return KAB_KOTA_ONLY.map((name, index) => {
      const count = countsMap[name] || 0;
      return {
        geoIndex: index + 1,
        name,
        shortName: name.replace(/^Kabupaten\s+/i, 'Kab. '),
        abbr: getRegionAbbreviation(name),
        count,
      };
    });
  }, [dataRecords, regionalSummary]);

  // Total accumulation across all 27 Kab/Kota in West Java
  const totalAllPuskesos = useMemo(() => {
    return regionalStats.reduce((sum, item) => sum + item.count, 0);
  }, [regionalStats]);

  const animatedTotal = useAnimatedNumber(totalAllPuskesos, 700);

  // Highest count in West Java (for relative percentage bar scaling)
  const maxCount = useMemo(() => {
    const max = Math.max(...regionalStats.map((r) => r.count), 0);
    return max > 0 ? max : 1;
  }, [regionalStats]);

  // Top Leader Region
  const topRegion = useMemo(() => {
    const sorted = [...regionalStats].sort((a, b) => b.count - a.count);
    return sorted[0] || { name: '-', count: 0, geoIndex: 1 };
  }, [regionalStats]);

  // Active Regions Count (> 0 records)
  const activeRegionsCount = useMemo(() => {
    return regionalStats.filter((r) => r.count > 0).length;
  }, [regionalStats]);

  // Average per region
  const averagePerRegion = useMemo(() => {
    return Math.round(totalAllPuskesos / (KAB_KOTA_ONLY.length || 1));
  }, [totalAllPuskesos]);

  // Active highlighted item (either currently hovered or top region)
  const activeSpotlight = useMemo(() => {
    if (hoveredRegion) {
      return regionalStats.find((r) => r.name === hoveredRegion) || null;
    }
    return null;
  }, [hoveredRegion, regionalStats]);

  return (
    <section
      id="section-slrt-regional-analytics"
      className="bg-gradient-to-b from-[#021814] via-[#04241d] to-[#01120f] border border-emerald-500/30 rounded-3xl p-4 sm:p-6 lg:p-7 text-white shadow-2xl shadow-emerald-950/50 mb-8 relative overflow-hidden transition-all duration-300"
    >
      {/* Background Emerald & Forest Jade Ambient Radial Glow */}
      <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.04] pointer-events-none" />

      {/* TOP HEADER: BADGES, TITLE, & REALTIME BADGE */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-emerald-500/20">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>GRAFIK BATANG EKSEKUTIF SUPERADMIN & DEVELOPER</span>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-teal-950/80 border border-teal-400/40 text-teal-300 text-[10.5px] font-bold px-3 py-0.5 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>LIVE REALTIME SYNC</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 shrink-0" />
            <span className="bg-gradient-to-r from-emerald-200 via-teal-100 to-white bg-clip-text text-transparent">
              Sebaran Lembaga SLRT Puskesos 27 Kab/Kota
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-emerald-100/80 font-medium max-w-3xl leading-relaxed">
            Distribusi vertikal lembaga Sistem Layanan & Rujukan Terpadu (SLRT_PUSKESOS) se-Jawa Barat.
            Tersusun berurutan dari <strong className="text-emerald-300">Kab. Bogor (No. 1)</strong> hingga{' '}
            <strong className="text-emerald-300">Kota Banjar (No. 27)</strong> dan bertambah otomatis secara realtime.
          </p>
        </div>

        {/* Executive Quick Stats Chip */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <div className="bg-emerald-950/70 border border-emerald-500/30 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-inner">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider block">
                Total Se-Jabar
              </span>
              <div className="text-lg sm:text-xl font-black text-white flex items-baseline gap-1">
                <span>{animatedTotal.toLocaleString('id-ID')}</span>
                <span className="text-[11px] font-bold text-emerald-400">Unit</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 EXECUTIVE KPI SUMMARY MINI CARDS (EMERALD & FOREST JADE THEMED) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-5 relative z-10">
        {/* KPI 1: Total Puskesos */}
        <div className="bg-gradient-to-br from-[#063329]/70 via-[#04241d]/80 to-[#021814]/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm shadow-md flex items-center gap-3 hover:border-emerald-400/50 transition-colors">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider block truncate">
              Total Lembaga Se-Jabar
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>{animatedTotal.toLocaleString('id-ID')}</span>
              <span className="text-[10px] font-bold text-emerald-300">Unit</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Wilayah Tertinggi */}
        <div className="bg-gradient-to-br from-[#06382e]/70 via-[#04241d]/80 to-[#021814]/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm shadow-md flex items-center gap-3 hover:border-teal-400/50 transition-colors">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider block truncate">
              Wilayah Tertinggi
            </span>
            <div className="text-sm sm:text-base font-black text-white truncate">
              {topRegion.name}
            </div>
            <span className="text-[11px] font-extrabold text-teal-300">
              {topRegion.count.toLocaleString('id-ID')} Unit Terdata
            </span>
          </div>
        </div>

        {/* KPI 3: Rata-rata per Wilayah */}
        <div className="bg-gradient-to-br from-[#063329]/70 via-[#04241d]/80 to-[#021814]/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm shadow-md flex items-center gap-3 hover:border-emerald-400/50 transition-colors">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider block truncate">
              Rata-Rata per Kab/Kota
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>{averagePerRegion.toLocaleString('id-ID')}</span>
              <span className="text-[10px] font-bold text-emerald-300">Unit / Wilayah</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Cakupan Wilayah Aktif */}
        <div className="bg-gradient-to-br from-[#06382e]/70 via-[#04241d]/80 to-[#021814]/90 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm shadow-md flex items-center gap-3 hover:border-teal-400/50 transition-colors">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider block truncate">
              Cakupan Wilayah Aktif
            </span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>{activeRegionsCount} / 27</span>
              <span className="text-[10px] font-bold text-teal-300">
                ({Math.round((activeRegionsCount / 27) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE HOVER SPOTLIGHT STRIP (INTERACTIVE EXECUTIVE PREVIEW) */}
      <div className="relative z-10 mb-4 bg-[#03201a]/80 border border-emerald-500/30 px-3.5 sm:px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs backdrop-blur-xs transition-all duration-200 min-h-[46px]">
        {activeSpotlight ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-emerald-500 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                #{activeSpotlight.geoIndex}
              </span>
              <span className="font-black text-white sm:text-sm tracking-tight truncate">
                {activeSpotlight.name}
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="font-extrabold text-emerald-300 text-xs sm:text-sm">
                {activeSpotlight.count.toLocaleString('id-ID')} Unit Lembaga
              </span>
              <span className="text-emerald-200/70 text-[11px]">
                ({totalAllPuskesos > 0 ? ((activeSpotlight.count / totalAllPuskesos) * 100).toFixed(1) : 0}% Se-Jabar)
              </span>
            </div>

            <button
              type="button"
              onClick={() => onSelectRegion(activeSpotlight.name)}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black text-xs px-3 py-1 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <span>Buka Wilayah #{activeSpotlight.geoIndex}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-emerald-200/80 text-[11.5px] w-full justify-between">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span>
                Arahkan kursor pada batang grafik di bawah untuk melihat rincian setiap Kab/Kota secara realtime.
              </span>
            </div>
            <span className="hidden md:inline-block text-[10.5px] font-semibold text-emerald-400/90">
              Urutan Resmi: 1. Kab. Bogor s.d. 27. Kota Banjar
            </span>
          </div>
        )}
      </div>

      {/* MAIN VERTICAL CHART STAGE: FIT 1 LAPTOP SCREEN WITHOUT HORIZONTAL SCROLL */}
      <div className="relative z-10 bg-[#031d17]/85 border border-emerald-500/30 rounded-2xl p-3 sm:p-5 lg:p-6 backdrop-blur-xs w-full overflow-hidden">
        {/* Top Info Bar */}
        <div className="text-xs text-emerald-200/80 font-semibold mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-bold text-white text-[11px] sm:text-xs">
              Grafik Batang Vertikal 27 Kab/Kota (1 Layar Penuh)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10.5px]">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-300 inline-block shadow-xs" />
              <span>Gradien Emerald & Forest Jade</span>
            </span>
          </div>
        </div>

        {/* Vertical Chart Arena with Horizontal Gridlines */}
        <div className="relative w-full h-[270px] sm:h-[310px] md:h-[340px] pt-10 pb-1 flex flex-col justify-end">
          {/* Subtle Background Horizontal Baseline Guides (100%, 75%, 50%, 25%, 0%) */}
          <div className="absolute inset-0 top-10 bottom-8 flex flex-col justify-between pointer-events-none z-0">
            <div className="border-b border-emerald-500/15 w-full flex items-center justify-between text-[9px] font-mono text-emerald-400/40 pr-1">
              <span>Maks ({maxCount})</span>
              <span>100%</span>
            </div>
            <div className="border-b border-emerald-500/10 w-full flex items-center justify-between text-[9px] font-mono text-emerald-400/30 pr-1">
              <span>{Math.round(maxCount * 0.75)}</span>
              <span>75%</span>
            </div>
            <div className="border-b border-emerald-500/10 w-full flex items-center justify-between text-[9px] font-mono text-emerald-400/30 pr-1">
              <span>{Math.round(maxCount * 0.5)}</span>
              <span>50%</span>
            </div>
            <div className="border-b border-emerald-500/10 w-full flex items-center justify-between text-[9px] font-mono text-emerald-400/30 pr-1">
              <span>{Math.round(maxCount * 0.25)}</span>
              <span>25%</span>
            </div>
            <div className="border-b border-emerald-500/25 w-full flex items-center justify-between text-[9px] font-mono text-emerald-400/40 pr-1">
              <span>0</span>
              <span>0%</span>
            </div>
          </div>

          {/* 27 VERTICAL BARS: FULL WIDTH EQUAL PROPORTIONS, NO HORIZONTAL SCROLL */}
          <div className="relative z-10 w-full h-full flex items-end justify-between gap-1 sm:gap-1.5 md:gap-2">
            {regionalStats.map((item) => {
              const isHovered = hoveredRegion === item.name;
              const isTopLeader = item.name === topRegion.name && item.count > 0;
              const heightPercent = maxCount > 0
                ? Math.max((item.count / maxCount) * 100, item.count > 0 ? 8 : 2.5)
                : 2.5;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setHoveredRegion(item.name)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => {
                    onSelectRegion(item.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 min-w-0 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  title={`No. ${item.geoIndex}: ${item.name} (${item.count} Lembaga)`}
                >
                  {/* Vertical Light Pillar / Hover Beam */}
                  <div
                    className={`absolute inset-0 -top-6 rounded-xl pointer-events-none transition-all duration-200 ${
                      isHovered
                        ? 'bg-gradient-to-t from-emerald-500/10 via-teal-400/20 to-emerald-400/25 border-x border-emerald-400/30 opacity-100'
                        : 'opacity-0'
                    }`}
                  />

                  {/* ANIMASI MUNCUL SAAT DI HOVER: FLOATING POP-UP TOOLTIP BADGE */}
                  <div
                    className={`absolute -top-16 z-30 pointer-events-none flex flex-col items-center transition-all duration-200 ${
                      isHovered
                        ? 'opacity-100 -translate-y-1 scale-105'
                        : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
                    }`}
                  >
                    <div className="bg-[#021e18] border-2 border-emerald-400 text-white px-2.5 py-1.5 rounded-xl shadow-xl shadow-emerald-950/80 text-center whitespace-nowrap flex flex-col items-center">
                      <span className="text-[9.5px] font-black text-emerald-300 block leading-tight">
                        #{item.geoIndex} {item.name}
                      </span>
                      <div className="text-xs font-black text-white flex items-baseline gap-1 mt-0.5">
                        <span className="text-teal-200">{item.count.toLocaleString('id-ID')}</span>
                        <span className="text-[9px] font-semibold text-emerald-300">Unit</span>
                      </div>
                    </div>
                    {/* Tiny Triangle Pointer */}
                    <div className="w-2 h-2 bg-[#021e18] border-r-2 border-b-2 border-emerald-400 transform rotate-45 -mt-1" />
                  </div>

                  {/* Top Live Count Label */}
                  <div
                    className={`text-[9px] sm:text-[10px] font-black px-1 rounded mb-1 transition-all duration-200 select-none ${
                      isHovered
                        ? 'text-teal-200 scale-125 font-black text-emerald-300'
                        : item.count > 0
                        ? 'text-emerald-200/90'
                        : 'text-emerald-400/30'
                    }`}
                  >
                    {item.count}
                  </div>

                  {/* VERTICAL BAR COLUMN (EMERALD & FOREST JADE GRADIENT WITH GLOWING CAP) */}
                  <div className="w-full flex flex-col justify-end items-center h-[180px] sm:h-[220px] md:h-[240px] px-0.5">
                    <div
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ease-out relative overflow-hidden flex flex-col justify-between ${
                        isHovered
                          ? 'bg-gradient-to-t from-[#047857] via-[#10b981] to-[#5eead4] shadow-[0_0_20px_rgba(45,212,191,0.7)] scale-y-[1.03] -translate-y-1 origin-bottom'
                          : isTopLeader
                          ? 'bg-gradient-to-t from-[#064e3b] via-[#059669] to-[#34d399] shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                          : item.count > 0
                          ? 'bg-gradient-to-t from-[#064e3b] via-[#059669] to-[#2dd4bf]'
                          : 'bg-[#04241d]/60 border border-emerald-900/40'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Glowing Cap on Top of Bar */}
                      {item.count > 0 && (
                        <div
                          className={`w-full h-1.5 shrink-0 transition-colors ${
                            isHovered
                              ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                              : 'bg-[#5eead4] shadow-[0_0_8px_rgba(94,234,212,0.8)]'
                          }`}
                        />
                      )}

                      {/* Internal Sheen Reflection */}
                      <div className="w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 pointer-events-none" />
                    </div>
                  </div>

                  {/* BOTTOM NUMBER BADGE (No. 1 s/d No. 27 strictly) */}
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black text-[8px] sm:text-[9.5px] mt-2 transition-all duration-200 select-none ${
                      isHovered
                        ? 'bg-teal-300 text-emerald-950 scale-110 font-black shadow-md shadow-teal-400/50'
                        : isTopLeader
                        ? 'bg-emerald-500 text-emerald-950 font-black'
                        : 'bg-[#062c23] text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.geoIndex}
                  </div>

                  {/* BOTTOM REGION ABBREVIATION (Truncated neatly for 1-screen fit) */}
                  <div className="mt-1 text-center w-full overflow-hidden select-none">
                    <span
                      className={`block truncate text-[8px] sm:text-[9.5px] font-bold transition-colors ${
                        isHovered
                          ? 'text-teal-200'
                          : 'text-emerald-300/70 group-hover:text-emerald-200'
                      }`}
                      title={item.name}
                    >
                      {item.abbr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM RANGE GUIDE: KAB. BOGOR S.D. KOTA BANJAR */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-200/80">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center text-[9px] font-black">
              1
            </span>
            <span className="text-emerald-300">Kabupaten Bogor</span>
            <span className="text-emerald-400/50 mx-1">─────────────▶</span>
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center text-[9px] font-black">
              27
            </span>
            <span className="text-emerald-300">Kota Banjar</span>
          </div>

          <div className="flex items-center gap-2 text-emerald-300/90 font-medium">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Klik pada salah satu batang untuk langsung membuka data SLRT Puskesos wilayah tersebut.</span>
          </div>
        </div>
      </div>

      {/* FOOTER GUARANTEE NOTE */}
      <div className="relative z-10 mt-5 pt-3.5 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-emerald-200/70">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Data terhubung langsung ke antrean Firestore & otomatis bertambah/berkurang secara realtime saat ada penambahan atau impor data baru.
          </span>
        </div>
        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
          <span>Mode Tampilan: Vertikal Penuh (1 Layar Laptop)</span>
        </div>
      </div>
    </section>
  );
};
