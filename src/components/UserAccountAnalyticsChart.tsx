import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AdminAccount } from '../types';
import { KAB_KOTA_ONLY } from '../data/initialData';
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
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart,
  UserCheck,
  UserX,
  MapPin,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Users,
  Shield,
  Code2,
  UserCog,
  ArrowUpDown,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface UserAccountAnalyticsChartProps {
  userAccounts: AdminAccount[];
  allAdminAccounts: AdminAccount[];
  selectedWilayah: string;
  onSelectWilayah: (wilayah: string) => void;
  selectedStatus: 'ALL' | 'ACTIVE' | 'FROZEN';
  onSelectStatus: (status: 'ALL' | 'ACTIVE' | 'FROZEN') => void;
}

// Ultra-fast and smooth animated number counter for real-time numeric climbing
function useFastAnimatedCounter(targetValue: number, durationMs: number = 650): number {
  const [displayValue, setDisplayValue] = useState(0);
  const prevTargetRef = useRef(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = prevTargetRef.current;
    const change = targetValue - startValue;

    if (change === 0) {
      setDisplayValue(targetValue);
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
        setDisplayValue(targetValue);
        prevTargetRef.current = targetValue;
      }
    };

    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      prevTargetRef.current = targetValue;
    };
  }, [targetValue, durationMs]);

  return displayValue;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  user: { bg: 'bg-blue-600', text: 'text-blue-600', hex: '#2563eb' },
  admin: { bg: 'bg-emerald-600', text: 'text-emerald-600', hex: '#059669' },
  superadmin: { bg: 'bg-amber-500', text: 'text-amber-600', hex: '#d97706' },
  developer: { bg: 'bg-purple-600', text: 'text-purple-600', hex: '#7c3aed' },
};

export const UserAccountAnalyticsChart: React.FC<UserAccountAnalyticsChartProps> = ({
  userAccounts,
  allAdminAccounts,
  selectedWilayah,
  onSelectWilayah,
  selectedStatus,
  onSelectStatus,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<'COUNT' | 'MAP'>('COUNT');
  const [activeChartTab, setActiveChartTab] = useState<'ROLE' | 'REGION'>('ROLE');
  const [activeRoleIndex, setActiveRoleIndex] = useState<number | null>(null);

  // 1. Role Distribution Calculations (Strictly 3 Roles: User, Admin Wilayah, Superadmin - Developer is hidden)
  const roleDistributionData = useMemo(() => {
    const counts: Record<string, number> = {
      user: 0,
      admin: 0,
      superadmin: 0,
    };

    const combinedList: AdminAccount[] = [];
    const seenIds = new Set<string>();

    (allAdminAccounts || []).forEach((acc) => {
      const k = (acc.id || acc.username || '').toLowerCase().trim();
      if (k && !seenIds.has(k)) {
        seenIds.add(k);
        combinedList.push(acc);
      }
    });

    (userAccounts || []).forEach((acc) => {
      const k = (acc.id || acc.username || '').toLowerCase().trim();
      if (k && !seenIds.has(k)) {
        seenIds.add(k);
        combinedList.push(acc);
      }
    });

    combinedList.forEach((acc) => {
      const r = (acc.role || '').toLowerCase().trim();
      const u = (acc.username || '').toLowerCase().trim();
      const n = (acc.namaAdmin || '').toLowerCase().trim();

      // 1. Exclude developer accounts completely from donut visualization
      if (r === 'developer' || u === 'ilhamfazril' || u === 'admin_ilham' || acc.isDeveloper) {
        return;
      }

      // 2. Exclude guest / tamu publik completely
      if (
        r === 'guest' ||
        r === 'tamu' ||
        u === 'tamu' ||
        u === 'tamu publik' ||
        u.includes('guest') ||
        n.includes('tamu publik') ||
        n.includes('pengunjung') ||
        acc.isGuest === true ||
        acc.statusActive === 'GUEST'
      ) {
        return;
      }

      if (r === 'superadmin' || u.includes('superadmin') || u === 'superadmin jabar') {
        counts.superadmin += 1;
      } else if (r === 'admin' || u.startsWith('admin_')) {
        counts.admin += 1;
      } else if (r === 'user' || acc.statusActive === 'SAH_TERDAFTAR') {
        // Only registered users
        counts.user += 1;
      }
    });

    const total = counts.user + counts.admin + counts.superadmin;
    const denominator = total > 0 ? total : 1;

    return [
      {
        name: 'User (Masyarakat/Pilar)',
        shortName: 'User',
        roleKey: 'user',
        count: counts.user,
        percent: total > 0 ? Math.round((counts.user / denominator) * 100) : 0,
        color: ROLE_COLORS.user.hex,
        desc: 'Akun pendaftar & pengelola data pilar',
      },
      {
        name: 'Admin Wilayah (Kab/Kota)',
        shortName: 'Admin Wilayah',
        roleKey: 'admin',
        count: counts.admin,
        percent: total > 0 ? Math.round((counts.admin / denominator) * 100) : 0,
        color: ROLE_COLORS.admin.hex,
        desc: 'Verifikator data 27 Kab/Kota Jawa Barat',
      },
      {
        name: 'Superadmin Jabar',
        shortName: 'Superadmin',
        roleKey: 'superadmin',
        count: counts.superadmin,
        percent: total > 0 ? Math.round((counts.superadmin / denominator) * 100) : 0,
        color: ROLE_COLORS.superadmin.hex,
        desc: 'Administrator Tingkat Provinsi Jawa Barat',
      },
    ];
  }, [allAdminAccounts, userAccounts]);

  const totalRoleAccounts = useMemo(() => {
    return roleDistributionData.reduce((acc, curr) => acc + curr.count, 0);
  }, [roleDistributionData]);

  // Fast animated climb for role account total
  const animatedTotalRoleAccounts = useFastAnimatedCounter(totalRoleAccounts, 650);

  // 2. All 27 Kab/Kota Complete Data (Realtime from Kab. Bogor to Kota Banjar)
  const regionStats = useMemo(() => {
    const statsMap: Record<string, { total: number; active: number; frozen: number }> = {};

    // Initialize all 27 Kab/Kota strictly with standard naming (e.g. Kota Bandung vs Kab. Bandung)
    KAB_KOTA_ONLY.forEach((wil) => {
      statsMap[wil] = { total: 0, active: 0, frozen: 0 };
    });

    // Realtime populate from user accounts
    userAccounts.forEach((acc) => {
      let wil = (acc.wilayahTugas || '').trim();
      if (!wil || wil === 'Prov. Jabar' || wil === 'Semua Wilayah') return;

      // Normalize region name if needed
      if (wil === 'Kab. Bandung Barat' || wil === 'Kabupaten Bandung Barat') wil = 'Kab. Bandung Barat';
      else if (wil === 'Kab. Bandung' || wil === 'Kabupaten Bandung') wil = 'Kab. Bandung';
      else if (wil === 'Kota Bandung') wil = 'Kota Bandung';
      else if (wil.startsWith('Kabupaten ')) wil = wil.replace('Kabupaten ', 'Kab. ');

      if (!statsMap[wil]) {
        statsMap[wil] = { total: 0, active: 0, frozen: 0 };
      }
      const isFrozen = acc.isFrozen === true || acc.statusAkun === 'DIBEKUKAN';
      statsMap[wil].total += 1;
      if (isFrozen) {
        statsMap[wil].frozen += 1;
      } else {
        statsMap[wil].active += 1;
      }
    });

    // Index map strictly according to official West Java map order (Kab. Bogor to Kota Banjar)
    const mapIndex = new Map(KAB_KOTA_ONLY.map((name, index) => [name, index]));

    // Convert to array of all 27 Kab/Kota
    let list = Object.entries(statsMap).map(([wilayah, data]) => ({
      wilayah,
      ...data,
      shortWilayah: wilayah.replace('Kabupaten ', 'Kab. '),
      mapOrder: mapIndex.get(wilayah) ?? 999,
    }));

    // Sorting: Terbanyak vs Sesuai Peta (Kab. Bogor s/d Kota Banjar)
    if (sortBy === 'COUNT') {
      list.sort((a, b) => b.total - a.total || a.mapOrder - b.mapOrder);
    } else {
      // Sesuai Peta berurutan dari Kab. Bogor s/d Kota Banjar
      list.sort((a, b) => a.mapOrder - b.mapOrder);
    }

    return list;
  }, [userAccounts, sortBy]);

  // Total Counts for User Accounts
  const totalUsers = userAccounts.length;
  const activeUsers = userAccounts.filter((u) => !u.isFrozen && u.statusAkun !== 'DIBEKUKAN').length;
  const frozenUsers = userAccounts.filter((u) => u.isFrozen === true || u.statusAkun === 'DIBEKUKAN').length;

  const activePercent = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const frozenPercent = totalUsers > 0 ? 100 - activePercent : 0;

  // Max value for proportional calculations
  const maxBarValue = useMemo(() => {
    return Math.max(...regionStats.map((r) => r.total), 1);
  }, [regionStats]);

  // Recharts custom tooltip for Donut Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="font-black text-amber-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-slate-300">
            Jumlah: <span className="font-black text-white">{data.count} Akun</span> ({data.percent}%)
          </div>
          <div className="text-[10px] text-slate-400 italic">{data.desc}</div>
        </div>
      );
    }
    return null;
  };

  // Recharts custom tooltip for Regional Bar Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="font-black text-amber-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{data.wilayah}</span>
          </div>
          <div className="text-emerald-300 flex items-center justify-between gap-3">
            <span>Akun Aktif:</span>
            <span className="font-black">{data.active}</span>
          </div>
          <div className="text-rose-300 flex items-center justify-between gap-3">
            <span>Akun Dibekukan:</span>
            <span className="font-black">{data.frozen}</span>
          </div>
          <div className="border-t border-slate-700 pt-1 text-slate-200 flex items-center justify-between font-black">
            <span>Total Akun:</span>
            <span className="text-amber-400">{data.total} Akun</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 text-white flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#d4af37]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37] to-amber-600 text-[#043e2e] flex items-center justify-center font-black shadow-md shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-wide uppercase">
                Grafik Analisis Akun User &amp; Distribusi Peran
              </h3>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hidden sm:inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#d4af37]" /> Recharts Engine
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
              Visualisasi distribusi peran pengguna dan sebaran lengkap 27 Kabupaten/Kota se-Jawa Barat secara realtime.
            </p>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">Sembunyikan Grafik</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline">Tampilkan Grafik</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
          {/* TOP SECTION: RECHARTS ROLE DISTRIBUTION & STATUS PROPORTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* 1. RECHARTS DONUT CHART: ROLE DISTRIBUTION (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                      Distribusi Peran Akun (Role Distribution)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Komposisi seluruh tipe hak akses dalam sistem database
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                  Total: {totalRoleAccounts} Akun
                </span>
              </div>

              {/* Chart and Legend Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Recharts Pie/Donut Container (6 cols) */}
                <div className="sm:col-span-6 h-52 sm:h-56 flex items-center justify-center relative select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={roleDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        isAnimationActive={false}
                        onMouseEnter={(_, index) => setActiveRoleIndex(index)}
                        onMouseLeave={() => setActiveRoleIndex(null)}
                      >
                        {roleDistributionData.map((entry, index) => {
                          const isHovered = activeRoleIndex === index;
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke={isHovered ? '#0f172a' : '#ffffff'}
                              strokeWidth={isHovered ? 2.5 : 1.5}
                              className="transition-all duration-200 cursor-pointer"
                              style={{
                                filter: isHovered ? 'drop-shadow(0px 3px 6px rgba(0,0,0,0.15))' : 'none',
                              }}
                            />
                          );
                        })}
                      </Pie>
                    </RePieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Label - Static, Clean, Non-overlapping */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                    <div className="w-[100px] h-[100px] rounded-full bg-white/95 shadow-sm border border-slate-200/90 flex flex-col items-center justify-center p-1.5 text-center">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        Total
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono leading-none my-0.5">
                        {animatedTotalRoleAccounts.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[8.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 uppercase leading-none">
                        Akun
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Details & Badges (6 cols) */}
                <div className="sm:col-span-6 space-y-2">
                  {roleDistributionData.map((r, index) => {
                    const isSelected = activeRoleIndex === index;
                    return (
                      <div
                        key={r.roleKey}
                        onMouseEnter={() => setActiveRoleIndex(index)}
                        onMouseLeave={() => setActiveRoleIndex(null)}
                        className={`bg-white border rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 shadow-sm ring-1 ring-blue-400 bg-blue-50/30'
                            : 'border-slate-200/90 shadow-2xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-md shrink-0 shadow-xs transition-transform"
                            style={{ backgroundColor: r.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">
                              {r.shortName}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {r.desc}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-slate-900 font-mono">
                            {r.count} <span className="text-[10px] font-semibold text-slate-500 font-sans">Akun</span>
                          </div>
                          <div className="text-[10px] font-extrabold text-slate-500">
                            {r.percent}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. USER ACCOUNT STATUS & RATIO (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                      Status Keamanan Akun User
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Monitoring akun aktif vs dibekukan
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-2xs">
                  {totalUsers} User
                </span>
              </div>

              {/* Ratio Stack Bar */}
              <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Aktif: {activeUsers} ({activePercent}%)
                  </span>
                  <span className="text-rose-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    Dibekukan: {frozenUsers} ({frozenPercent}%)
                  </span>
                </div>

                <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner p-0.5">
                  {totalUsers === 0 ? (
                    <div className="w-full h-full bg-slate-300 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-600">
                      Belum Ada Akun
                    </div>
                  ) : (
                    <>
                      <div
                        style={{ width: `${activePercent}%` }}
                        className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                        title={`Aktif: ${activeUsers} (${activePercent}%)`}
                      />
                      <div
                        style={{ width: `${frozenPercent}%` }}
                        className="h-full bg-rose-500 rounded-r-full transition-all duration-500"
                        title={`Dibekukan: ${frozenUsers} (${frozenPercent}%)`}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Status Filter Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectStatus(selectedStatus === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStatus === 'ACTIVE'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
                      Akun Aktif
                    </span>
                    <UserCheck className={`w-4 h-4 ${selectedStatus === 'ACTIVE' ? 'text-emerald-200' : 'text-emerald-600'}`} />
                  </div>
                  <div className="text-xl font-black mt-1">
                    {activeUsers} <span className="text-xs font-semibold opacity-80">Akun</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectStatus(selectedStatus === 'FROZEN' ? 'ALL' : 'FROZEN')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStatus === 'FROZEN'
                      ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400/40'
                      : 'bg-white hover:bg-rose-50 text-slate-700 border-slate-200 hover:border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
                      Dibekukan
                    </span>
                    <UserX className={`w-4 h-4 ${selectedStatus === 'FROZEN' ? 'text-rose-200' : 'text-rose-600'}`} />
                  </div>
                  <div className="text-xl font-black mt-1">
                    {frozenUsers} <span className="text-xs font-semibold opacity-80">Akun</span>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION: SEMUA 27 KABUPATEN/KOTA (REALTIME) */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            
            {/* Regional Header & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#043e2e] text-[#d4af37] flex items-center justify-center font-black">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
                      Distribusi Semua 27 Kabupaten / Kota (Realtime)
                    </h4>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      27 Kab/Kota Lengkap
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Data sebaran akun pendaftar di setiap wilayah Jawa Barat yang disinkronkan secara langsung.
                  </p>
                </div>
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 pl-1.5 pr-1 hidden sm:inline">Urutan:</span>
                <button
                  type="button"
                  onClick={() => setSortBy('COUNT')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === 'COUNT'
                      ? 'bg-[#043e2e] text-[#d4af37] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Urutkan dari jumlah akun terbanyak"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>Terbanyak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('MAP')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortBy === 'MAP'
                      ? 'bg-[#043e2e] text-[#d4af37] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Urutkan berurutan sesuai peta Jawa Barat (Kab. Bogor s/d Kota Banjar)"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Sesuai Peta</span>
                </button>
              </div>
            </div>

            {/* Recharts Bar Chart Overview (Responsive on all devices) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#043e2e]" />
                  Grafik Batang Recharts (27 Wilayah)
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Aktif
                  </span>
                  <span className="flex items-center gap-1 text-rose-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Dibekukan
                  </span>
                </div>
              </div>

              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regionStats}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortWilayah"
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }}
                      height={50}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      domain={[0, 'auto']}
                      tickFormatter={(val: number) =>
                        val >= 10000 ? `${Math.round(val / 1000)}k` : val.toLocaleString('id-ID')
                      }
                    />
                    <RechartsTooltip content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="active"
                      name="Aktif"
                      stackId="a"
                      fill="#10b981"
                      radius={[0, 0, 0, 0]}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="frozen"
                      name="Dibekukan"
                      stackId="a"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Complete 27 Kab/Kota Interactive Clickable List Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 px-1">
                <span>Daftar 27 Kabupaten / Kota</span>
                <span className="text-[11px] text-slate-500 font-normal italic">
                  💡 Klik kartu wilayah untuk memfilter daftar akun di tabel bawah
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {regionStats.map((item, idx) => {
                  const isSelected = selectedWilayah === item.wilayah;
                  const percentWidth = Math.max(4, Math.round((item.total / maxBarValue) * 100));
                  const activeRatio = item.total > 0 ? (item.active / item.total) * 100 : 0;
                  const frozenRatio = item.total > 0 ? (item.frozen / item.total) * 100 : 0;

                  return (
                    <div
                      key={item.wilayah}
                      onClick={() => onSelectWilayah(isSelected ? 'ALL' : item.wilayah)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-amber-50/90 border-[#d4af37] shadow-md ring-2 ring-[#d4af37]/40'
                          : 'bg-white hover:bg-slate-100/90 border-slate-200/90 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-black text-slate-400 w-5 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className={`text-xs font-black truncate ${isSelected ? 'text-[#043e2e]' : 'text-slate-800'}`}>
                            {item.wilayah}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.total > 0 ? (
                            <>
                              <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">
                                {item.active}
                              </span>
                              {item.frozen > 0 && (
                                <span className="text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">
                                  {item.frozen}
                                </span>
                              )}
                              <span className="text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-xs font-black">
                                {item.total}
                              </span>
                            </>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-semibold">
                              0 Akun
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                        {item.total === 0 ? (
                          <div className="w-full h-full bg-transparent" />
                        ) : (
                          <div
                            style={{ width: `${percentWidth}%` }}
                            className="h-full flex rounded-full overflow-hidden transition-all duration-500"
                          >
                            {item.active > 0 && (
                              <div
                                style={{ width: `${activeRatio}%` }}
                                className="h-full bg-emerald-500"
                                title={`${item.wilayah}: ${item.active} Aktif`}
                              />
                            )}
                            {item.frozen > 0 && (
                              <div
                                style={{ width: `${frozenRatio}%` }}
                                className="h-full bg-rose-500"
                                title={`${item.wilayah}: ${item.frozen} Dibekukan`}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Filter Reset Notice */}
            {(selectedWilayah !== 'ALL' || selectedStatus !== 'ALL') && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-bold">
                <span>
                  Filter Aktif: {selectedWilayah !== 'ALL' && `Wilayah "${selectedWilayah}"`}
                  {selectedWilayah !== 'ALL' && selectedStatus !== 'ALL' && ' • '}
                  {selectedStatus !== 'ALL' && `Status "${selectedStatus === 'ACTIVE' ? 'Aktif' : 'Dibekukan'}"`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectWilayah('ALL');
                    onSelectStatus('ALL');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-black cursor-pointer transition-colors"
                >
                  Reset Filter Grafik
                </button>
              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
};
