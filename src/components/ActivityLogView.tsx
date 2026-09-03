import React, { useState, useEffect, useMemo } from 'react';
import { UserSession, SystemLog } from '../types';
import {
  History,
  Search,
  RefreshCw,
  Trash2,
  Calendar,
  User,
  Shield,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  Flame,
  Activity,
  Database
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getLocalLogs, autoPurgeOldLogs } from '../lib/activityLogger';

interface ActivityLogViewProps {
  session?: UserSession;
  onBackToHome?: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({
  session,
  onBackToHome,
}) => {
  const [logs, setLogs] = useState<SystemLog[]>(() => getLocalLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'SET' | 'DELETE' | 'CREATE' | 'UPDATE'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'superadmin'>('ALL');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  // 1. Setup Firestore real-time listener for system_logs
  useEffect(() => {
    // Run initial auto purge for >30 days old logs
    autoPurgeOldLogs().catch(() => {});

    try {
      const logsRef = collection(db, 'system_logs');
      const q = query(logsRef, orderBy('createdAt', 'desc'), limit(200));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreLogs: SystemLog[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as SystemLog;
              // STRICT RULE: Double check developer filter just in case
              const isDev =
                (data.actorRole as string) === 'developer' ||
                (data.actorName || '').toLowerCase().includes('ilham') ||
                (data.actorName || '').toLowerCase().includes('developer');
              if (!isDev) {
                firestoreLogs.push({ ...data, id: docSnap.id });
              }
            });

            // Merge with local logs if any
            const local = getLocalLogs();
            const combinedMap = new Map<string, SystemLog>();
            [...firestoreLogs, ...local].forEach((item) => {
              if (item.id && !combinedMap.has(item.id)) {
                combinedMap.set(item.id, item);
              }
            });

            const sorted = Array.from(combinedMap.values()).sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            );
            setLogs(sorted);
          }
        },
        (error) => {
          console.warn('[ActivityLogView] Firestore snapshot listener warning (operating on local logs):', error);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error('[ActivityLogView] Setup listener error:', e);
    }
  }, []);

  // Filter logs according to search & filter criteria
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Exclude developer activity strictly
      const isDev =
        (log.actorRole as string) === 'developer' ||
        (log.actorName || '').toLowerCase().includes('ilham') ||
        (log.actorName || '').toLowerCase().includes('developer');
      if (isDev) return false;

      // Filter Action
      if (actionFilter !== 'ALL' && log.actionType !== actionFilter) {
        return false;
      }

      // Filter Role
      if (roleFilter !== 'ALL' && log.actorRole !== roleFilter) {
        return false;
      }

      // Search query (actor, wilayah, target, details, timestamp)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actor = (log.actorName || '').toLowerCase();
        const wilayah = (log.actorWilayah || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const target = (log.targetCollection || '').toLowerCase();
        const time = (log.timestamp || '').toLowerCase();
        const matches =
          actor.includes(q) ||
          wilayah.includes(q) ||
          details.includes(q) ||
          target.includes(q) ||
          time.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [logs, actionFilter, roleFilter, searchQuery]);

  const handleManualPurge = async () => {
    setIsPurging(true);
    try {
      const purged = await autoPurgeOldLogs();
      setLogs(getLocalLogs());
      setPurgeFeedback(
        purged > 0
          ? `✅ Berhasil membersihkan ${purged} data log berusia >30 hari.`
          : '✅ Penyimpanan bersih! Tidak ada log berusia lebih dari 30 hari.'
      );
      setTimeout(() => setPurgeFeedback(null), 4000);
    } catch (e) {
      setPurgeFeedback('⚠️ Gagal menjalankan pembersihan log.');
      setTimeout(() => setPurgeFeedback(null), 3000);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-950 via-[#043e2e] to-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-[#d4af37] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-[#043e2e] border border-[#d4af37]/60 px-3.5 py-1.5 rounded-full text-xs font-black text-amber-300 shadow-sm">
              <History className="w-4 h-4 text-[#d4af37]" />
              <span>AUDIT TRAIL & RIWAYAT PERUBAHAN SISTEM</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Purge 30 Hari Aktif</span>
              </span>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl uppercase shadow-xs">
                Realtime Firestore
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide flex items-center gap-2.5">
            <span>Riwayat Aktivitas & Perubahan Data</span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse hidden sm:inline-block" />
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-3xl leading-relaxed">
            Catatan log audit transparan yang merekam seluruh operasi penambahan (<strong className="text-emerald-300">SET</strong>), pembaruan, dan penghapusan (<strong className="text-rose-300">DELETE</strong>) oleh Admin Wilayah dan Superadmin. Fitur ini dioptimalkan dengan batch-write hemat kuota dan penghapusan otomatis (auto-purge) berkas berusia &gt;30 hari.
          </p>
        </div>
      </div>

      {/* Purge Notification */}
      {purgeFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-900 text-emerald-100 border-2 border-emerald-500 text-xs font-bold flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{purgeFeedback}</span>
          </div>
          <button
            onClick={() => setPurgeFeedback(null)}
            className="text-white hover:opacity-80 font-extrabold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#043e2e] text-amber-300 font-black shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Log Terekam (30 Hari)
            </span>
            <span className="text-xl font-black text-slate-900">
              {filteredLogs.length} Aktivitas
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-700 text-white font-black shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Operasi Simpan / Input (SET)
            </span>
            <span className="text-xl font-black text-emerald-700">
              {filteredLogs.filter((l) => l.actionType === 'SET' || l.actionType === 'CREATE' || l.actionType === 'UPDATE').length} Catatan
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-700 text-white font-black shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Operasi Hapus (DELETE)
            </span>
            <span className="text-xl font-black text-rose-700">
              {filteredLogs.filter((l) => l.actionType === 'DELETE').length} Catatan
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama admin, wilayah, atau detail aktivitas..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#d4af37]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Button: Auto Purge Trigger */}
          <button
            type="button"
            onClick={handleManualPurge}
            disabled={isPurging}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPurging ? 'animate-spin text-[#043e2e]' : ''}`} />
            <span>{isPurging ? 'Membersihkan...' : 'Uji Pembersihan Log (>30 Hari)'}</span>
          </button>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider mr-1">
            Filter Tipe Aksi:
          </span>
          {(['ALL', 'SET', 'DELETE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActionFilter(type)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                actionFilter === type
                  ? 'bg-[#043e2e] text-amber-300 border border-[#d4af37]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {type === 'ALL' ? 'Semua Aksi' : type === 'SET' ? '🟢 SET (Input / Update)' : '🔴 DELETE (Hapus)'}
            </button>
          ))}

          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider ml-3 mr-1">
            Filter Peran:
          </span>
          {(['ALL', 'admin', 'superadmin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#043e2e] text-amber-300 border border-[#d4af37]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {r === 'ALL' ? 'Semua Peran' : r === 'superadmin' ? 'Superadmin' : 'Admin Wilayah'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List View */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#043e2e] text-white flex items-center justify-between border-b border-amber-500/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Daftar Riwayat Perubahan Terverifikasi
              </h3>
              <p className="text-xs text-emerald-200 font-medium">
                Diurutkan berdasarkan waktu terbaru (Real-time Audit Trail)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-white/10 text-amber-300 px-3 py-1 rounded-full border border-white/20">
            {filteredLogs.length} Baris Log
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-slate-800">
              Belum Ada Riwayat Perubahan Data
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Setiap kali Admin Wilayah atau Superadmin menambahkan, memperbarui, atau menghapus data PSKS / Akun Admin, catatan realtime akan otomatis muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Nama Pelaksana</th>
                  <th className="py-3 px-4">Wilayah Tugas</th>
                  <th className="py-3 px-4">Tipe Aksi</th>
                  <th className="py-3 px-4">Target Koleksi</th>
                  <th className="py-3 px-4">Rincian Perubahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredLogs.map((log) => {
                  const isDelete = log.actionType === 'DELETE';
                  const isSuper = log.actorRole === 'superadmin';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* Actor Name & Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-white shrink-0 ${isSuper ? 'bg-[#043e2e] border border-amber-300' : 'bg-emerald-700'}`}>
                            {(log.actorName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {log.actorName}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${isSuper ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'}`}>
                              {log.actorRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Wilayah */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-700">
                        {log.actorWilayah}
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide ${
                            isDelete
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isDelete ? 'bg-rose-600' : 'bg-emerald-600'}`} />
                          <span>{log.actionType}</span>
                        </span>
                      </td>

                      {/* Target Collection */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {log.targetCollection}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-slate-800 max-w-xs sm:max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
