import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { RegionalSummaryMap } from '../../services/regionalDistributionService';

interface PillarHorizontalBarChartProps {
  pillarId: string;
  pillarShortName: string;
  chartRegions: string[];
  regionalCounts: Record<string, { total: number; gov: number; swasta: number }>;
  regionalSummary?: RegionalSummaryMap;
  maxChartCount?: number;
  chartVisible: boolean;
  onSelectRegion?: (regionName: string) => void;
}

// Satuan data resmi per pilar sosial Jawa Barat
const PILLAR_UNITS: Record<string, string> = {
  psm: 'Orang',
  tagana: 'Personel',
  karang_taruna: 'Unit',
  tksk: 'Orang',
  peksos: 'Orang',
  lks: 'Lembaga',
  lk3: 'Lembaga',
  pensos: 'Orang',
  badan_usaha: 'Unit',
  slrt_puskesos: 'Unit',
};

// Gradasi warna tematik sesuai identitas masing-masing 10 pilar
const PILLAR_GRADIENTS: Record<string, { bar: string; glow: string; text: string }> = {
  psm: {
    bar: 'from-[#b8901c] to-[#d4af37]',
    glow: 'ring-amber-400/40',
    text: 'text-amber-400',
  },
  tagana: {
    bar: 'from-orange-600 to-amber-500',
    glow: 'ring-orange-400/40',
    text: 'text-orange-400',
  },
  karang_taruna: {
    bar: 'from-blue-600 to-indigo-700',
    glow: 'ring-blue-400/40',
    text: 'text-blue-400',
  },
  tksk: {
    bar: 'from-sky-600 to-blue-700',
    glow: 'ring-sky-400/40',
    text: 'text-sky-400',
  },
  lks: {
    bar: 'from-amber-600 to-yellow-500',
    glow: 'ring-amber-400/40',
    text: 'text-amber-400',
  },
  lk3: {
    bar: 'from-purple-600 via-violet-600 to-indigo-700',
    glow: 'ring-purple-400/40',
    text: 'text-purple-400',
  },
  pensos: {
    bar: 'from-teal-600 to-emerald-700',
    glow: 'ring-emerald-400/40',
    text: 'text-emerald-400',
  },
  badan_usaha: {
    bar: 'from-indigo-600 to-purple-700',
    glow: 'ring-purple-400/40',
    text: 'text-purple-400',
  },
  slrt_puskesos: {
    bar: 'from-emerald-600 via-teal-600 to-emerald-800',
    glow: 'ring-emerald-400/40',
    text: 'text-emerald-400',
  },
};

export const PillarHorizontalBarChart: React.FC<PillarHorizontalBarChartProps> = ({
  pillarId,
  pillarShortName,
  chartRegions,
  regionalCounts,
  regionalSummary,
  maxChartCount: customMaxChartCount,
  chartVisible,
  onSelectRegion,
}) => {
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const unit = PILLAR_UNITS[pillarId] || 'Data';
  const colorScheme = PILLAR_GRADIENTS[pillarId] || {
    bar: 'from-[#b8901c] to-[#d4af37]',
    glow: 'ring-amber-400/40',
    text: 'text-amber-400',
  };

  // Helper untuk mendapatkan nilai total akurat per wilayah (menggabungkan data lokal & regional summary)
  const getEffectiveCounts = (region: string) => {
    const local = regionalCounts[region] || { total: 0, gov: 0, swasta: 0 };
    const summaryVal = regionalSummary?.[region]?.byPillar?.[pillarId] || 0;
    const total = Math.max(local.total, summaryVal);
    return {
      total,
      gov: local.gov,
      swasta: local.swasta,
    };
  };

  // Hitung total kuantitas pilar di seluruh wilayah Jawa Barat
  const totalAccumulated = useMemo(() => {
    return chartRegions.reduce((sum, region) => {
      const counts = getEffectiveCounts(region);
      return sum + counts.total;
    }, 0);
  }, [chartRegions, regionalCounts, regionalSummary, pillarId]);

  // Skala maksimum untuk proporsi batang grafik
  const maxVal = useMemo(() => {
    if (customMaxChartCount && customMaxChartCount > 0) return customMaxChartCount;
    let peak = 1;
    chartRegions.forEach((reg) => {
      const counts = getEffectiveCounts(reg);
      if (counts.total > peak) peak = counts.total;
    });
    return Math.max(peak, 1);
  }, [chartRegions, regionalCounts, regionalSummary, pillarId, customMaxChartCount]);

  // Auto-dismiss floating tooltip saat klik/sentuh di luar chart pada smartphone
  useEffect(() => {
    const handleOutsideInteraction = (e: MouseEvent | TouchEvent) => {
      if (chartContainerRef.current && !chartContainerRef.current.contains(e.target as Node)) {
        setActiveRegion(null);
      }
    };

    document.addEventListener('touchstart', handleOutsideInteraction);
    document.addEventListener('click', handleOutsideInteraction);

    return () => {
      document.removeEventListener('touchstart', handleOutsideInteraction);
      document.removeEventListener('click', handleOutsideInteraction);
    };
  }, []);

  return (
    <div
      ref={chartContainerRef}
      className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-xs mb-6 sm:mb-8"
    >
      {/* Header Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#0f2b5c]">
            Perbandingan Komposisi Kuantitas {pillarShortName} di Wilayah Tugas
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 hidden sm:block">
            Arahkan kursor atau sentuh batang untuk melihat rincian persentase dan kontribusi wilayah.
          </p>
        </div>

        {/* Legend Khusus PEKSOS */}
        {pillarId === 'peksos' ? (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 self-start sm:self-center">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0f2b5c] inline-block shadow-sm"></span>
              <span className="font-bold">Peksos Pemerintah</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#d4af37] inline-block shadow-sm"></span>
              <span className="font-bold">Peksos Masyarakat</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold">
              Total:{' '}
              <span className="text-[#0f2b5c] font-black font-mono">
                {totalAccumulated.toLocaleString('id-ID')}
              </span>{' '}
              <span className="text-[10px] text-slate-500 font-sans font-medium">{unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Daftar Baris Grafik Horizontal (Rata Kiri & Batang Diperluas) */}
      <div className="space-y-2 sm:space-y-2.5 border-l-2 border-slate-300 pl-2 sm:pl-3">
        {chartRegions.map((region, idx) => {
          const counts = getEffectiveCounts(region);
          const isHovered = activeRegion === region;
          const contribution =
            totalAccumulated > 0 ? ((counts.total / totalAccumulated) * 100).toFixed(1) : '0';

          // Kasus Khusus PEKSOS (Dual Bar: Pemerintah vs Masyarakat)
          if (pillarId === 'peksos') {
            const percentGov = counts.gov > 0 ? Math.max(3, (counts.gov / maxVal) * 100) : 0;
            const percentSwasta =
              counts.swasta > 0 ? Math.max(3, (counts.swasta / maxVal) * 100) : 0;

            return (
              <div
                key={region}
                className="py-1.5 border-b border-slate-100 last:border-none relative group cursor-pointer"
                onMouseEnter={() => setActiveRegion(region)}
                onMouseLeave={() => setActiveRegion((prev) => (prev === region ? null : prev))}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setActiveRegion(region);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveRegion(activeRegion === region ? null : region);
                  if (onSelectRegion) onSelectRegion(region);
                }}
              >
                {/* KOTAK MELAYANG LICIN (Tooltip) */}
                {isHovered && (
                  <div
                    className={`absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 left-1/2 -translate-x-1/2 ${
                      idx === 0 ? 'top-full mt-2' : '-top-20 sm:-top-22'
                    }`}
                  >
                    <div className="bg-slate-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[210px] sm:min-w-[230px] ring-4 ring-black/10">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{region}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 font-mono">
                          {contribution}% Jabar
                        </span>
                      </div>
                      <div className="space-y-1 font-semibold text-[11px]">
                        <div className="flex items-center justify-between text-blue-300">
                          <span>Pemerintah:</span>
                          <span className="font-mono font-bold">
                            {counts.gov.toLocaleString('id-ID')} Orang
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-amber-300">
                          <span>Masyarakat:</span>
                          <span className="font-mono font-bold">
                            {counts.swasta.toLocaleString('id-ID')} Orang
                          </span>
                        </div>
                        <div className="pt-1 border-t border-slate-800 flex items-center justify-between font-bold text-white">
                          <span>Total Peksos:</span>
                          <span className="font-mono font-black text-amber-400">
                            {counts.total.toLocaleString('id-ID')} Orang
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Judul Wilayah & Total Angka */}
                <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1">
                  <span className="text-left font-bold text-slate-800">{region}</span>
                  <span className="text-[11px] font-semibold text-slate-500 font-mono">
                    Total: {counts.total.toLocaleString('id-ID')} Orang
                  </span>
                </div>

                <div className="space-y-1 pl-1">
                  {/* Batang 1: Peksos Lembaga Pemerintah */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-20 sm:w-24 text-[10px] font-bold text-blue-900 shrink-0 truncate text-left">
                      Pemerintah
                    </span>
                    <div className="flex-1 bg-slate-100 p-0.5 rounded-lg overflow-hidden flex items-center">
                      {counts.gov > 0 ? (
                        <div
                          style={{ width: chartVisible ? `${percentGov}%` : '0%' }}
                          className="h-4 bg-[#0f2b5c] rounded flex items-center justify-end px-2 shadow-xs transition-all duration-1000 ease-out min-w-[22px]"
                        >
                          <span className="text-[10px] font-black text-white font-mono">
                            {counts.gov.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 font-mono">0</span>
                      )}
                    </div>
                  </div>

                  {/* Batang 2: Peksos Masyarakat */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-20 sm:w-24 text-[10px] font-bold text-amber-900 shrink-0 truncate text-left">
                      Masyarakat
                    </span>
                    <div className="flex-1 bg-slate-100 p-0.5 rounded-lg overflow-hidden flex items-center">
                      {counts.swasta > 0 ? (
                        <div
                          style={{ width: chartVisible ? `${percentSwasta}%` : '0%' }}
                          className="h-4 bg-[#d4af37] rounded flex items-center justify-end px-2 shadow-xs transition-all duration-1000 ease-out min-w-[22px]"
                        >
                          <span className="text-[10px] font-black text-[#0f2b5c] font-mono">
                            {counts.swasta.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 font-mono">0</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Format Seluruh Pilar Lainnya Termasuk LK3 (Ungu) dan SLRT Puskesos (Hijau)
          const percent = counts.total > 0 ? Math.max(3, (counts.total / maxVal) * 100) : 0;

          return (
            <div
              key={region}
              className={`flex items-center gap-2 sm:gap-3 py-1 text-xs relative group cursor-pointer transition-all rounded-lg px-1 ${
                isHovered ? 'bg-slate-50/80 ring-1 ring-slate-200' : ''
              }`}
              onMouseEnter={() => setActiveRegion(region)}
              onMouseLeave={() => setActiveRegion((prev) => (prev === region ? null : prev))}
              onTouchStart={(e) => {
                e.stopPropagation();
                setActiveRegion(region);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveRegion(activeRegion === region ? null : region);
                if (onSelectRegion) onSelectRegion(region);
              }}
            >
              {/* KOTAK MELAYANG LICIN (Tooltip saat Hover / Touch) */}
              {isHovered && (
                <div
                  className={`absolute z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150 left-1/2 -translate-x-1/2 ${
                    idx === 0 ? 'top-full mt-2' : '-top-16 sm:-top-18'
                  }`}
                >
                  <div className="bg-slate-900/95 text-white backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[200px] sm:min-w-[220px] text-center ring-4 ring-black/10">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200 truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{region}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 font-bold">
                      <span className="text-slate-300 font-medium">Kuantitas:</span>
                      <span className={`font-mono font-black text-sm ${colorScheme.text}`}>
                        {counts.total.toLocaleString('id-ID')} {unit}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1 text-left flex items-center justify-between">
                      <span>Kontribusi Se-Jabar:</span>
                      <span className="font-mono text-slate-300 font-bold">{contribution}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* JUDUL WILAYAH: RATA KIRI, LEBIH RAMPING DI HP SEHINGGA TIDAK MENUMPUK/KE TENGAH */}
              <div className="w-24 sm:w-28 md:w-36 text-left font-bold text-slate-700 truncate shrink-0 text-[11px] sm:text-xs">
                {region}
              </div>

              {/* BATANG GRAFIK: PANJANG DIPERLUAS DI HP */}
              <div className="flex-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg overflow-hidden flex items-center min-w-0">
                {counts.total > 0 ? (
                  <div
                    style={{ width: chartVisible ? `${percent}%` : '0%' }}
                    className={`h-5 sm:h-5.5 bg-gradient-to-r ${colorScheme.bar} rounded flex items-center justify-end px-2 shadow-xs transition-all duration-1000 ease-out min-w-[26px] ${
                      isHovered ? `ring-2 ${colorScheme.glow} shadow-md` : ''
                    }`}
                  >
                    <span className="text-[10px] font-black text-white drop-shadow-xs font-mono">
                      {counts.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 font-mono">
                    0
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
