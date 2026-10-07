import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart3, Building2, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { RegionalSummaryMap } from '../../services/regionalDistributionService';

interface Lk3VerticalBarChartProps {
  chartRegions: string[];
  regionalCounts: Record<string, { total: number; gov: number; swasta: number }>;
  regionalSummary?: RegionalSummaryMap;
  chartVisible: boolean;
  pillarTitle: string;
  pillarShortName: string;
}

export const Lk3VerticalBarChart: React.FC<Lk3VerticalBarChartProps> = ({
  chartRegions,
  regionalCounts,
  regionalSummary,
  chartVisible,
  pillarTitle,
  pillarShortName,
}) => {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss floating tooltip when clicking outside on mobile touch devices
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveRegion(null);
      }
    };

    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Compute accurate LK3 counts per region combining local state & regional summary
  const chartData = useMemo(() => {
    return chartRegions.map((region) => {
      const localCount = regionalCounts[region]?.total || 0;
      const summaryCount = regionalSummary?.[region]?.byPillar?.['lk3'] || 0;
      const total = Math.max(localCount, summaryCount);

      // Clean display name (e.g. 'Kab. Bandung' -> 'Bandung', 'Kota Bandung' -> 'Kota Bandung')
      const shortName = region.replace(/Kabupaten\s|Kab\.\s/i, '');

      return {
        region,
        shortName,
        total,
      };
    });
  }, [chartRegions, regionalCounts, regionalSummary]);

  // Total accumulation for LK3
  const totalLk3 = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [chartData]);

  // Max count for scaling the vertical bars nicely (minimum scale 3 so bars look balanced)
  const maxVal = useMemo(() => {
    const peak = Math.max(...chartData.map((d) => d.total), 0);
    return Math.max(peak, 3);
  }, [chartData]);

  // Generate 4 horizontal grid scale values
  const gridSteps = useMemo(() => {
    const step = Math.ceil(maxVal / 3);
    return [maxVal, step * 2, step, 0];
  }, [maxVal]);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-2xl p-4 sm:p-6 border border-pink-200/90 shadow-sm mb-6 sm:mb-8 relative overflow-hidden"
    >
      {/* Decorative soft pink ambient gradient in top corner */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-pink-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-pink-100/80 pb-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-[11px] font-black uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3 text-pink-500" />
            <span>GRAFIK BATANG VERTIKAL • PILAR {pillarShortName}</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-500 shrink-0" />
            <span>Distribusi Lembaga LK3 per Wilayah Tugas</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Sentuh atau arahkan kursor ke setiap batang merah muda untuk melihat rincian detail lembaga.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="bg-pink-50 border border-pink-200/80 rounded-xl px-3 py-1.5 text-center shadow-2xs">
            <div className="text-[10px] font-bold text-pink-600 uppercase tracking-wide">Total Terdata</div>
            <div className="text-base sm:text-lg font-black text-pink-700 font-mono leading-none mt-0.5">
              {totalLk3} <span className="text-[10px] font-semibold text-pink-500 font-sans">Lembaga</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helper text for mobile users */}
      <div className="block sm:hidden text-[11px] font-medium text-pink-600/90 mb-2 flex items-center gap-1">
        <span>👉 Geser grafik ke kanan untuk melihat 27 Kabupaten/Kota</span>
      </div>

      {/* Vertical Chart Viewport */}
      <div className="relative pt-8 pb-3">
        {/* Y-Axis Grid Lines & Scale Markers */}
        <div className="absolute inset-0 top-8 bottom-12 pointer-events-none flex flex-col justify-between z-0">
          {gridSteps.map((stepVal, idx) => (
            <div key={idx} className="w-full flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-300 w-5 text-right shrink-0">
                {stepVal}
              </span>
              <div className="flex-1 border-b border-dashed border-slate-200/80" />
            </div>
          ))}
        </div>

        {/* Scrollable Horizontal Bars Container */}
        <div className="overflow-x-auto pb-4 pt-10 px-2 scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
          <div className="flex items-end gap-2 sm:gap-3 md:gap-3.5 min-w-max h-56 sm:h-64 pl-6 pr-4 border-b-2 border-slate-200 relative z-10">
            {chartData.map((item) => {
              const isHovered = activeRegion === item.region;
              const heightPercent = item.total > 0 ? Math.max(12, (item.total / maxVal) * 100) : 4;

              return (
                <div
                  key={item.region}
                  className="flex flex-col items-center justify-end h-full w-9 sm:w-11 md:w-12 shrink-0 relative group select-none cursor-pointer"
                  onMouseEnter={() => setActiveRegion(item.region)}
                  onMouseLeave={() => setActiveRegion((prev) => (prev === item.region ? null : prev))}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setActiveRegion(item.region);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveRegion(activeRegion === item.region ? null : item.region);
                  }}
                >
                  {/* FLOATING CARD / KOTAK MELAYANG (On Hover / Touch) */}
                  {isHovered && (
                    <div className="absolute -top-24 sm:-top-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-slate-900/95 backdrop-blur-md text-white border-2 border-pink-400 shadow-2xl rounded-xl p-2.5 sm:p-3 min-w-[170px] sm:min-w-[190px] text-center relative ring-4 ring-pink-500/20">
                        {/* Little Pill Badge */}
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/25 border border-pink-400/40 text-[9px] font-black text-pink-300 uppercase tracking-wide mb-1">
                          <Building2 className="w-2.5 h-2.5 text-pink-300" />
                          <span>Pilar LK3 Jabar</span>
                        </div>

                        {/* Region Name */}
                        <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[170px] mx-auto">
                          {item.region}
                        </h4>

                        {/* Quantity Counter */}
                        <div className="text-base sm:text-lg font-black text-pink-300 font-mono mt-0.5 leading-tight">
                          {item.total}{' '}
                          <span className="text-[11px] font-bold text-slate-300 font-sans">Lembaga</span>
                        </div>

                        {/* Status Label */}
                        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{item.total > 0 ? 'Terdata Aktif di Wilayah' : 'Belum Ada Entri'}</span>
                        </div>

                        {/* Downward Arrow Pointer Beak */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-pink-400" />
                      </div>
                    </div>
                  )}

                  {/* Value Number Pill above bar (always visible or on bar) */}
                  <div
                    className={`text-[10px] sm:text-[11px] font-black font-mono mb-1 transition-all duration-200 ${
                      item.total > 0
                        ? isHovered
                          ? 'text-pink-600 scale-125 font-black'
                          : 'text-pink-500'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.total}
                  </div>

                  {/* Vertical Pink Bar */}
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      style={{
                        height: chartVisible ? `${heightPercent}%` : '4%',
                      }}
                      className={`w-6 sm:w-8 rounded-t-md sm:rounded-t-lg transition-all duration-500 ease-out flex items-center justify-center shadow-xs ${
                        item.total > 0
                          ? isHovered
                            ? 'bg-gradient-to-t from-pink-600 via-pink-500 to-rose-400 ring-4 ring-pink-400/40 brightness-110 shadow-lg shadow-pink-500/25'
                            : 'bg-gradient-to-t from-pink-500 via-pink-400 to-rose-300 hover:brightness-105'
                          : isHovered
                          ? 'bg-pink-200/90 ring-2 ring-pink-300'
                          : 'bg-slate-200/80'
                      }`}
                    >
                      {/* Subtle inner top highlight line */}
                      {item.total > 0 && (
                        <div className="w-full h-1 bg-white/40 rounded-t-md absolute top-0" />
                      )}
                    </div>
                  </div>

                  {/* Region Label below baseline (X-Axis) */}
                  <div className="mt-2.5 w-full text-center">
                    <span
                      title={item.region}
                      className={`block text-[9.5px] sm:text-[10.5px] font-bold leading-tight truncate transition-colors ${
                        isHovered
                          ? 'text-pink-700 font-extrabold underline decoration-pink-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.shortName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Legend & Helper */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-t from-pink-500 to-rose-300 inline-block shadow-2xs" />
            <span className="text-[11px] font-bold text-slate-700">Lembaga LK3 Merah Muda</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-200 inline-block shadow-2xs" />
            <span className="text-[11px] font-semibold text-slate-400">0 Lembaga</span>
          </div>
        </div>
        <div className="text-[11px] text-pink-700/80 font-semibold flex items-center gap-1">
          <MapPin className="w-3 h-3 text-pink-500" />
          <span>27 Kabupaten / Kota se-Jawa Barat</span>
        </div>
      </div>
    </div>
  );
};
