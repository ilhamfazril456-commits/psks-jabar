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
  Search,
  ArrowUpDown,
  ChevronRight,
  Sparkles,
  MapPin,
  Layers,
  ArrowRight,
  Filter,
  Eye,
  SlidersHorizontal,
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

export const SlrtRegionalAnalyticsChart: React.FC<SlrtRegionalAnalyticsChartProps> = ({
  dataRecords,
  regionalSummary,
  onSelectRegion,
}) => {
  const [sortBy, setSortBy] = useState<'GEOGRAPHIC' | 'COUNT_DESC'>('GEOGRAPHIC');
  const [viewMode, setViewMode] = useState<'METRIC_BARS' | 'PANORAMIC_COLUMNS'>('METRIC_BARS');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // 1. Calculate live counts per 27 Kabupaten/Kota in Jawa Barat
  // Follows exact canonical order: Kab. Bogor (#1) to Kota Banjar (#27)
  const regionalStats = useMemo(() => {
    // Initial map with zero counts for all 27 Kab/Kota strictly
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
        shortName: name.replace('Kabupaten ', 'Kab. '),
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
    return sorted[0] || { name: '-', count: 0 };
  }, [regionalStats]);

  // Active Regions Count (> 0 records)
  const activeRegionsCount = useMemo(() => {
    return regionalStats.filter((r) => r.count > 0).length;
  }, [regionalStats]);

  // Average per region
  const averagePerRegion = useMemo(() => {
    return Math.round(totalAllPuskesos / (KAB_KOTA_ONLY.length || 1));
  }, [totalAllPuskesos]);

  // Filtered and sorted dataset
  const displayedStats = useMemo(() => {
    let list = [...regionalStats];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => item.name.toLowerCase().includes(q));
    }

    if (sortBy === 'COUNT_DESC') {
      list.sort((a, b) => b.count - a.count || a.geoIndex - b.geoIndex);
    } else {
      // Default: Strict geographic order (Kab. Bogor #1 s.d. Kota Banjar #27)
      list.sort((a, b) => a.geoIndex - b.geoIndex);
    }

    return list;
  }, [regionalStats, searchQuery, sortBy]);

  return (
    <section
      id="section-slrt-regional-analytics"
      className="bg-gradient-to-b from-[#091b3a] via-[#0d234d] to-[#08152e] border-2 border-[#d4af37] rounded-3xl p-4 sm:p-7 text-white shadow-2xl mb-8 relative overflow-hidden transition-all duration-300"
    >
      {/* Background High-Tech Glow FX */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

      {/* TOP HEADER: BADGES, TITLE, & CONTROLS */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-blue-400/20">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-[#d4af37]/60 text-amber-300 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span>GRAFIK EKSEKUTIF SUPERADMIN & DEVELOPER</span>
            </span>

            <span className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-[10.5px] font-bold px-3 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE REALTIME SYNC</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 shrink-0" />
            <span>Sebaran Lembaga SLRT Puskesos 27 Kab/Kota</span>
          </h3>

          <p className="text-xs sm:text-sm text-blue-200/90 font-medium max-w-3xl leading-relaxed">
            Distribusi data aktif lembaga Sistem Layanan & Rujukan Terpadu (SLRT_PUSKESOS) se-Jawa Barat.
            Urutan dimulai dari <strong className="text-amber-300">Kab. Bogor (No. 1)</strong> hingga{' '}
            <strong className="text-amber-300">Kota Banjar (No. 27)</strong> dan otomatis bertambah secara realtime.
          </p>
        </div>

        {/* Action Controls: View Switcher & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center bg-blue-950/80 border border-blue-400/30 p-1 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('METRIC_BARS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === 'METRIC_BARS'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                  : 'text-blue-300 hover:text-white'
              }`}
              title="Tampilan Bar Metrik Horisontal (Ramah Semua Device)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Bar Metrik</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('PANORAMIC_COLUMNS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                viewMode === 'PANORAMIC_COLUMNS'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
                  : 'text-blue-300 hover:text-white'
              }`}
              title="Tampilan Kolom Panoramik"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Kolom Vertikal</span>
            </button>
          </div>

          {/* Sort By Button */}
          <button
            type="button"
            onClick={() => setSortBy((prev) => (prev === 'GEOGRAPHIC' ? 'COUNT_DESC' : 'GEOGRAPHIC'))}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d4af37]/20 to-[#f1c40f]/20 hover:from-[#d4af37]/30 hover:to-[#f1c40f]/30 border border-[#d4af37]/70 text-amber-200 hover:text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
            title="Ubah urutan tampilan grafik"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {sortBy === 'GEOGRAPHIC' ? 'Urutan Peta (Bogor → Banjar)' : 'Peringkat Terbanyak'}
            </span>
          </button>
        </div>
      </div>

      {/* 4 EXECUTIVE KPI SUMMARY MINI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6 relative z-10">
        {/* KPI 1: Total Puskesos */}
        <div className="bg-gradient-to-br from-emerald-900/40 via-teal-950/40 to-blue-950/60 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4.5 backdrop-blur-sm shadow-md flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-200/80 uppercase tracking-wider block truncate">
              Total Lembaga Se-Jabar
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>{animatedTotal.toLocaleString('id-ID')}</span>
              <span className="text-[10px] font-bold text-emerald-300">Unit</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Wilayah Tertinggi */}
        <div className="bg-gradient-to-br from-amber-900/40 via-yellow-950/30 to-blue-950/60 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4.5 backdrop-blur-sm shadow-md flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-200/80 uppercase tracking-wider block truncate">
              Wilayah Tertinggi
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-white truncate">
              {topRegion.name}
            </div>
            <span className="text-[11px] font-extrabold text-amber-300">
              {topRegion.count.toLocaleString('id-ID')} Lembaga Terdata
            </span>
          </div>
        </div>

        {/* KPI 3: Rata-rata per Wilayah */}
        <div className="bg-gradient-to-br from-blue-900/40 via-indigo-950/40 to-blue-950/60 border border-blue-500/30 rounded-2xl p-3.5 sm:p-4.5 backdrop-blur-sm shadow-md flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-200/80 uppercase tracking-wider block truncate">
              Rata-Rata per Kab/Kota
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>{averagePerRegion.toLocaleString('id-ID')}</span>
              <span className="text-[10px] font-bold text-blue-300">Unit / Wilayah</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Cakupan Wilayah Aktif */}
        <div className="bg-gradient-to-br from-teal-900/40 via-cyan-950/40 to-blue-950/60 border border-teal-500/30 rounded-2xl p-3.5 sm:p-4.5 backdrop-blur-sm shadow-md flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-teal-200/80 uppercase tracking-wider block truncate">
              Cakupan Wilayah Aktif
            </span>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
              <span>{activeRegionsCount} / 27</span>
              <span className="text-[10px] font-bold text-teal-300">
                ({Math.round((activeRegionsCount / 27) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR & QUICK FILTER */}
      <div className="relative z-10 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-blue-950/40 border border-blue-400/20 p-2.5 sm:p-3 rounded-2xl backdrop-blur-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Kabupaten atau Kota (contoh: Bogor, Bandung, Cirebon)..."
            className="w-full pl-9 pr-4 py-2 bg-blue-900/30 hover:bg-blue-900/50 focus:bg-blue-950/80 border border-blue-400/30 focus:border-amber-400 rounded-xl text-xs sm:text-sm text-white placeholder-blue-300/60 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-300 hover:text-white"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-blue-200/80 font-semibold px-2">
          <span>Menampilkan <strong>{displayedStats.length}</strong> dari 27 Wilayah</span>
        </div>
      </div>

      {/* CHART BODY VIEW 1: EXECUTIVE METRIC BARS (MODERN, CLEAN, RESPONSIVE) */}
      {viewMode === 'METRIC_BARS' && (
        <div className="relative z-10 space-y-2.5 max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
          {displayedStats.map((item) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const percentOfTotal = totalAllPuskesos > 0 ? ((item.count / totalAllPuskesos) * 100).toFixed(1) : '0';
            const isTopLeader = item.name === topRegion.name && item.count > 0;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredRegion(item.name)}
                onMouseLeave={() => setHoveredRegion(null)}
                className={`group p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                  isTopLeader
                    ? 'bg-gradient-to-r from-amber-950/30 via-blue-950/60 to-blue-950/80 border-amber-400/60 shadow-lg shadow-amber-500/5'
                    : 'bg-blue-950/30 hover:bg-blue-900/40 border-blue-400/20 hover:border-emerald-400/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-2.5">
                  {/* Left: Geo Index & Region Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                        isTopLeader
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-blue-950 font-black'
                          : 'bg-[#0f2b5c] text-amber-300 border border-blue-400/30'
                      }`}
                    >
                      {item.geoIndex}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors truncate">
                          SLRT {item.name}
                        </h4>
                        {isTopLeader && (
                          <span className="bg-amber-400 text-blue-950 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                            <Trophy className="w-2.5 h-2.5" />
                            <span>Peringkat 1</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-blue-200/70 font-medium block">
                        Dinas Sosial {item.name} • {percentOfTotal}% dari sebaran se-Jabar
                      </span>
                    </div>
                  </div>

                  {/* Right: Count Badge & Quick Open Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-black text-white tracking-tight flex items-baseline justify-end gap-1">
                        <span className={item.count > 0 ? 'text-emerald-300' : 'text-slate-400'}>
                          {item.count.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] font-bold text-blue-200/80">Lembaga</span>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-300/80 block">
                        {item.count > 0 ? 'Aktif Terverifikasi' : 'Belum Ada Data'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectRegion(item.name);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1 bg-gradient-to-r from-[#d4af37] via-[#f1c40f] to-[#b8901c] hover:scale-105 active:scale-95 text-[#0f2b5c] font-black text-[11px] sm:text-xs px-3 sm:px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                      title={`Buka detail data Puskesos ${item.name}`}
                    >
                      <span className="hidden sm:inline">Buka Wilayah</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar Track with Smooth Gradient Fill & Glowing Tip */}
                <div className="relative w-full h-3 sm:h-3.5 bg-blue-950/80 rounded-full overflow-hidden border border-blue-500/20 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${
                      isTopLeader
                        ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 shadow-sm shadow-amber-400/50'
                        : item.count > 0
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-400 to-cyan-300 shadow-sm shadow-teal-400/50'
                        : 'bg-slate-700/40'
                    }`}
                    style={{ width: `${Math.max(percentage, item.count > 0 ? 3 : 0)}%` }}
                  >
                    {/* Glowing animated pulse sheen */}
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse pointer-events-none" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHART BODY VIEW 2: PANORAMIC COLUMN BARS (RESPONSIVE HORIZONTAL SCROLL ON MOBILE) */}
      {viewMode === 'PANORAMIC_COLUMNS' && (
        <div className="relative z-10 bg-blue-950/40 border border-blue-400/20 rounded-2xl p-4 sm:p-6 backdrop-blur-xs">
          <div className="text-xs text-blue-200/80 font-semibold mb-4 flex items-center justify-between">
            <span>Visualisasi Sebaran Kolom Vertikal (Geser ke samping pada layar kecil)</span>
            <span className="text-amber-300 font-bold">27 Titik Wilayah Kerja</span>
          </div>

          <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="min-w-[880px] h-[340px] flex items-end justify-between gap-2.5 pt-8 pb-4 px-2">
              {displayedStats.map((item) => {
                const heightPercent = maxCount > 0 ? Math.max((item.count / maxCount) * 100, item.count > 0 ? 6 : 2) : 2;
                const isHovered = hoveredRegion === item.name;
                const isTopLeader = item.name === topRegion.name && item.count > 0;

                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setHoveredRegion(item.name)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    onClick={() => {
                      onSelectRegion(item.name);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Floating Value Pill */}
                    <div
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md mb-1.5 transition-all duration-200 ${
                        isHovered || isTopLeader
                          ? 'bg-amber-400 text-blue-950 scale-110 shadow-md font-black'
                          : 'text-blue-200 bg-blue-900/60 opacity-80'
                      }`}
                    >
                      {item.count}
                    </div>

                    {/* Column Bar with Gradient & Glowing Rounded Top */}
                    <div className="w-full max-w-[28px] bg-blue-950/60 rounded-t-lg overflow-hidden flex flex-col justify-end p-0.5 h-[220px]">
                      <div
                        className={`w-full rounded-t-md transition-all duration-700 relative overflow-hidden ${
                          isTopLeader
                            ? 'bg-gradient-to-t from-amber-600 via-yellow-400 to-amber-200 shadow-md shadow-amber-400/40'
                            : isHovered
                            ? 'bg-gradient-to-t from-emerald-600 via-teal-300 to-cyan-200 shadow-md shadow-teal-400/40'
                            : item.count > 0
                            ? 'bg-gradient-to-t from-emerald-700 via-teal-500 to-cyan-400'
                            : 'bg-slate-700/40'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        <div className="w-full h-1 bg-white/40 absolute top-0 left-0" />
                      </div>
                    </div>

                    {/* Geo Index Tag */}
                    <div className="w-5 h-5 rounded-full bg-blue-900/80 text-[9.5px] font-bold text-amber-300 flex items-center justify-center mt-2 group-hover:bg-amber-400 group-hover:text-blue-950 transition-colors">
                      {item.geoIndex}
                    </div>

                    {/* Rotated Region Label */}
                    <div className="mt-2 text-center w-full">
                      <span className="text-[9px] font-bold text-blue-200/90 group-hover:text-amber-300 block truncate max-w-[70px]">
                        {item.name.replace(/kab\.|kota\s/i, '')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER NOTE: Real-time Guarantee */}
      <div className="relative z-10 mt-6 pt-4 border-t border-blue-400/20 flex flex-wrap items-center justify-between gap-3 text-[11px] text-blue-200/70">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Grafik ini terhubung langsung ke antrean data dan otomatis bertambah bila terjadi input/import baru.
          </span>
        </div>
        <div className="font-semibold text-amber-300">
          Klik bar wilayah mana saja untuk langsung membuka database wilayah tersebut.
        </div>
      </div>
    </section>
  );
};
