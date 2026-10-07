import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PSKSDataRecord } from '../../types';
import { KAB_KOTA_ONLY } from '../../data/initialData';
import { isSameWilayah } from '../../utils/submissionStatus';
import { RegionalSummaryMap } from '../../services/regionalDistributionService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart3, MapPin } from 'lucide-react';

export interface Lk3VerticalBarChartProps {
  chartRegions?: string[];
  regionalCounts?: Record<string, { total: number; gov: number; swasta: number }>;
  regionalSummary?: RegionalSummaryMap;
  dataRecords?: PSKSDataRecord[];
  chartVisible?: boolean;
  pillarTitle?: string;
  pillarShortName?: string;
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

export const Lk3VerticalBarChart: React.FC<Lk3VerticalBarChartProps> = ({
  chartRegions,
  regionalCounts,
  regionalSummary,
  dataRecords,
  pillarShortName = 'LK3',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Calculate live counts per 27 Kabupaten/Kota in Jawa Barat strictly
  // Exact canonical sequence: Kab. Bogor (#1) to Kota Banjar (#27)
  const regionalStats = useMemo(() => {
    const countsMap: Record<string, number> = {};
    KAB_KOTA_ONLY.forEach((reg) => {
      countsMap[reg] = 0;
    });

    const hasLoadedRecords = Array.isArray(dataRecords) && dataRecords.length > 0;

    KAB_KOTA_ONLY.forEach((reg) => {
      let localCount = 0;
      if (hasLoadedRecords) {
        localCount = dataRecords.filter((rec) => rec && isSameWilayah(rec.wilayah, reg)).length;
      } else if (regionalCounts && regionalCounts[reg]) {
        localCount = regionalCounts[reg].total || 0;
      }

      const summaryCount = regionalSummary?.[reg]?.byPillar?.['lk3'] || 0;
      countsMap[reg] = Math.max(localCount, summaryCount);
    });

    return KAB_KOTA_ONLY.map((name, index) => {
      const count = countsMap[name] || 0;
      return {
        geoIndex: index + 1,
        wilayah: name,
        shortWilayah: name.replace(/^Kabupaten\s+/i, 'Kab. '),
        count,
      };
    });
  }, [dataRecords, regionalCounts, regionalSummary]);

  // Total accumulation across all 27 Kab/Kota in West Java
  const totalAllLk3 = useMemo(() => {
    return regionalStats.reduce((sum, item) => sum + item.count, 0);
  }, [regionalStats]);

  const animatedTotal = useAnimatedNumber(totalAllLk3, 650);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-purple-200/80 shadow-sm mb-6 sm:mb-8">
      {/* Header Box: Mirip SLRT Puskesos dengan nuansa warna Ungu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100/80 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 leading-tight">
              Sebaran 27 Kabupaten / Kota - {pillarShortName}
            </h3>
            <p className="text-[11px] font-medium text-slate-500">
              Distribusi jumlah data lembaga LK3 se-Jawa Barat (Kab. Bogor s.d. Kota Banjar)
            </p>
          </div>
        </div>

        {/* Realtime Status & Total Badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200/70 text-purple-700 text-[10.5px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            <span>Realtime Sync</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <div className="text-left">
              <div className="text-[9px] font-bold text-slate-400 uppercase leading-none">Total Se-Jabar</div>
              <div className="text-sm font-black text-purple-700 leading-none mt-0.5 font-mono">
                {animatedTotal.toLocaleString('id-ID')}{' '}
                <span className="text-[10px] font-semibold text-slate-500 font-sans">Lembaga</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart Container: 1 Layar Penuh tanpa Geser (Vertikal Saja) */}
      <div className="h-[280px] sm:h-[320px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={`lk3-barchart-${totalAllLk3}`}
            data={regionalStats}
            margin={{ top: 10, right: 10, left: -15, bottom: 55 }}
            onMouseMove={(state: any) => {
              if (state && state.activeTooltipIndex !== undefined) {
                setHoveredIndex(state.activeTooltipIndex);
              } else {
                setHoveredIndex(null);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              {/* Gradien Warna Ungu (Purple / Violet Royal) */}
              <linearGradient id="purpleRoyalBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="60%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
              {/* Efek Hover Nyala Ungu Terang */}
              <linearGradient id="purpleRoyalHover" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
            </defs>

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

            {/* Animasi Muncul Tooltip Kotak Melayang saat di Hover / Touch */}
            <RechartsTooltip
              cursor={{ fill: 'rgba(168, 85, 247, 0.08)', radius: 4 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-purple-500/40 z-50">
                      <div className="font-extrabold text-purple-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        <span>
                          #{data.geoIndex}. {data.wilayah}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-4 font-bold">
                        <span className="text-slate-300">Jumlah LK3:</span>
                        <span className="text-purple-400 font-mono text-sm font-black">
                          {data.count.toLocaleString('id-ID')} Lembaga
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Kontribusi:{' '}
                        {totalAllLk3 > 0
                          ? ((data.count / totalAllLk3) * 100).toFixed(1)
                          : 0}
                        % Se-Jawa Barat
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Batang Vertikal Warna Ungu */}
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              animationDuration={600}
            >
              {regionalStats.map((entry, index) => (
                <Cell
                  key={`cell-${entry.wilayah}`}
                  fill={hoveredIndex === index ? 'url(#purpleRoyalHover)' : 'url(#purpleRoyalBar)'}
                  className="transition-all duration-200 cursor-default"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
