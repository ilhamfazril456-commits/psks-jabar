import React, { useState, useMemo } from 'react';
import {
  Radio,
  MapPin,
  Building2,
  Maximize2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Zap,
  Info
} from 'lucide-react';
import { DINSOS_GEO_OFFICES, DinsosGeoOffice } from '../data/dinsosGeoOfficesData';
import { AdminAccount, UserSession } from '../types';

interface AdminRadarMonitoringMapProps {
  adminAccounts: AdminAccount[];
  session?: UserSession;
  onOpenMessageModal?: (account: AdminAccount) => void;
}

export type AdminPresenceStatus = 'ONLINE' | 'BACKGROUND' | 'OFFLINE';

export interface OfficePresenceInfo {
  office: DinsosGeoOffice;
  status: AdminPresenceStatus;
  statusText: string;
  matchedAccount: AdminAccount | null;
  adminName: string;
  lastActiveTime: string;
}

export const AdminRadarMonitoringMap: React.FC<AdminRadarMonitoringMapProps> = ({
  adminAccounts,
  session,
  onOpenMessageModal,
}) => {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('provinsi_jabar');
  const [mapLayerMode, setMapLayerMode] = useState<'hybrid' | 'roadmap'>('hybrid');
  const [filterPresence, setFilterPresence] = useState<'ALL' | 'ONLINE' | 'BACKGROUND' | 'OFFLINE'>('ALL');
  const [isIframeLoading, setIsIframeLoading] = useState(false);

  // Helper to determine status for an account
  const computeAccountPresence = (acc: AdminAccount): AdminPresenceStatus => {
    // 1. If currently viewing local session user
    const isCurrentSessionUser =
      session?.statusActive === 'SAH_TERDAFTAR' &&
      (((session.isDeveloper || session.role === 'developer') && acc.role === 'developer') ||
        (session.role === 'superadmin' && acc.role === 'superadmin') ||
        (acc.role === session.role && (acc.wilayahTugas || '').toLowerCase().trim() === (session.wilayah || '').toLowerCase().trim()) ||
        (acc.username || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
        (acc.namaAdmin || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim());

    if (isCurrentSessionUser) {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return 'BACKGROUND';
      }
      return 'ONLINE';
    }

    // 2. Heartbeat evaluation
    const activeTime = acc.lastHeartbeat || acc.lastActive;
    if (!activeTime) return 'OFFLINE';

    const timeDiff = Date.now() - new Date(activeTime).getTime();
    if (isNaN(timeDiff) || timeDiff > 90 * 1000) {
      return 'OFFLINE';
    }

    if (acc.statusLayar === 'OFFLINE' || acc.statusKoneksi === 'OFFLINE') {
      if (timeDiff > 15 * 1000) return 'OFFLINE';
    }

    if (acc.statusLayar === 'LATAR_BELAKANG') {
      return 'BACKGROUND';
    }

    if (acc.statusLayar === 'AKTIF_LAYAR' || acc.statusKoneksi === 'ONLINE' || acc.isOnline === true || acc.isScreenActive === true) {
      return 'ONLINE';
    }

    if (acc.statusLayar === 'AFK_IDLE' || acc.statusKoneksi === 'IDLE') {
      return 'BACKGROUND';
    }

    return 'OFFLINE';
  };

  // Map 28 offices to their live presence status
  const officePresenceList: OfficePresenceInfo[] = useMemo(() => {
    return DINSOS_GEO_OFFICES.map((office) => {
      // Find matching admin account for this office
      const matchingAccount = adminAccounts.find((acc) => {
        if (office.isProvinsi) {
          // Provinsi matched by superadmin or developer
          const r = (acc.role || '').toLowerCase();
          const w = (acc.wilayahTugas || '').toLowerCase();
          return r === 'superadmin' || r === 'developer' || w.includes('provinsi') || w.includes('jawa barat');
        }

        const accWilayah = (acc.wilayahTugas || '').toLowerCase().trim();
        const officeKab = office.kabKota.toLowerCase().trim();
        const officeName = office.namaDinas.toLowerCase();

        return (
          accWilayah === officeKab ||
          officeKab.includes(accWilayah) ||
          accWilayah.includes(officeKab) ||
          officeName.includes(accWilayah)
        );
      });

      let status: AdminPresenceStatus = 'OFFLINE';
      let adminName = 'Tidak Ada Sesi Terhubung';
      let lastActiveTime = 'Offline';

      if (matchingAccount) {
        status = computeAccountPresence(matchingAccount);
        adminName = matchingAccount.namaAdmin || matchingAccount.username || 'Admin Wilayah';
        lastActiveTime = matchingAccount.terakhirLogin || 'Baru Saja';
      }

      let statusText = 'Non-Aktif / Offline';
      if (status === 'ONLINE') {
        statusText = 'Online (Sedang Buka Layar)';
      } else if (status === 'BACKGROUND') {
        statusText = 'Latar Belakang / Standby';
      }

      return {
        office,
        status,
        statusText,
        matchedAccount: matchingAccount || null,
        adminName,
        lastActiveTime,
      };
    });
  }, [adminAccounts, session]);

  // Statistics counters
  const totalOffices = officePresenceList.length;
  const onlineCount = officePresenceList.filter((item) => item.status === 'ONLINE').length;
  const backgroundCount = officePresenceList.filter((item) => item.status === 'BACKGROUND').length;
  const offlineCount = officePresenceList.filter((item) => item.status === 'OFFLINE').length;

  // Selected office data
  const selectedOfficePresence = useMemo(() => {
    return officePresenceList.find((item) => item.office.id === selectedOfficeId) || officePresenceList[0];
  }, [selectedOfficeId, officePresenceList]);

  // Filtered offices for the directory sidebar
  const filteredPresenceList = useMemo(() => {
    if (filterPresence === 'ALL') return officePresenceList;
    return officePresenceList.filter((item) => item.status === filterPresence);
  }, [officePresenceList, filterPresence]);

  // Google Maps Embed URL (Strictly constrained with specific lat/lng and zoom to lock precision to within tens of meters)
  const embedMapUrl = useMemo(() => {
    const lat = selectedOfficePresence.office.lat;
    const lng = selectedOfficePresence.office.lng;
    const query = selectedOfficePresence.office.googlePlaceQuery || `${selectedOfficePresence.office.namaDinas} ${selectedOfficePresence.office.alamat}`;
    
    // Zoom 16 memberikan ketepatan toleransi beberapa puluh meter dari atap gedung, tampak sangat jelas tanpa distorsi
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&ll=${lat},${lng}&hl=id&z=16&t=${mapLayerMode === 'hybrid' ? 'k' : 'm'}&output=embed`;
  }, [selectedOfficePresence, mapLayerMode]);

  const handleSelectOffice = (id: string) => {
    if (id === selectedOfficeId) return;
    setIsIframeLoading(true);
    setSelectedOfficeId(id);
    setTimeout(() => {
      setIsIframeLoading(false);
    }, 400);
  };

  return (
    <div className="bg-slate-900 rounded-3xl border-2 border-emerald-500/40 shadow-2xl overflow-hidden mb-6 text-white relative">
      {/* TOP HEADER: RADAR COMMAND CENTER */}
      <div className="bg-gradient-to-r from-[#031d16] via-[#043e2e] to-[#0f2b5c] p-4 sm:p-5 border-b border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            {/* Radar animated ring */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-slate-950" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sensor Presence
              </span>
              <span className="text-[10px] text-amber-300 font-extrabold uppercase bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                28 Titik Kantor Wilayah Jabar
              </span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-white m-0 tracking-tight flex items-center gap-2">
              Peta Radar Presensi Admin Dinas Sosial se-Jawa Barat
            </h2>
          </div>
        </div>

        {/* PRESENCE COUNTER BADGES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* ONLINE */}
          <button
            type="button"
            onClick={() => setFilterPresence(filterPresence === 'ONLINE' ? 'ALL' : 'ONLINE')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterPresence === 'ONLINE'
                ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span>{onlineCount} Online</span>
          </button>

          {/* BACKGROUND / IDLE */}
          <button
            type="button"
            onClick={() => setFilterPresence(filterPresence === 'BACKGROUND' ? 'ALL' : 'BACKGROUND')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterPresence === 'BACKGROUND'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
            <span>{backgroundCount} Latar Belakang</span>
          </button>

          {/* OFFLINE */}
          <button
            type="button"
            onClick={() => setFilterPresence(filterPresence === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterPresence === 'OFFLINE'
                ? 'bg-slate-300 text-slate-950 border-white shadow-lg'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="inline-flex rounded-full h-2 w-2 bg-slate-500" />
            <span>{offlineCount} Offline</span>
          </button>
        </div>
      </div>

      {/* QUICK HORIZONTAL PRESENCE RADAR PILLS (SCROLLABLE) */}
      <div className="bg-slate-950/80 px-3 py-2.5 border-b border-white/10 overflow-x-auto flex items-center gap-2 no-scrollbar">
        <span className="text-[10px] uppercase font-black text-slate-400 shrink-0 px-1 flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-400" />
          Status Titik:
        </span>
        {officePresenceList.map((item) => {
          const isSelected = item.office.id === selectedOfficeId;
          let dotColor = 'bg-slate-500';
          let pulseClass = '';
          let badgeBorder = 'border-slate-800 bg-slate-900 text-slate-300';

          if (item.status === 'ONLINE') {
            dotColor = 'bg-emerald-400';
            pulseClass = 'animate-ping';
            badgeBorder = isSelected
              ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 ring-2 ring-emerald-400/40 font-black'
              : 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 font-bold';
          } else if (item.status === 'BACKGROUND') {
            dotColor = 'bg-amber-400';
            pulseClass = 'animate-ping';
            badgeBorder = isSelected
              ? 'border-amber-400 bg-amber-950/80 text-amber-200 ring-2 ring-amber-400/40 font-black'
              : 'border-amber-700/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 font-bold';
          } else if (isSelected) {
            badgeBorder = 'border-slate-400 bg-slate-800 text-white font-black';
          }

          return (
            <button
              key={item.office.id}
              type="button"
              onClick={() => handleSelectOffice(item.office.id)}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] border transition-all cursor-pointer ${badgeBorder}`}
              title={`${item.office.kabKota} - ${item.statusText}`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                {pulseClass && <span className={`${pulseClass} absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
              </span>
              <span className="truncate max-w-[130px]">
                {item.office.isProvinsi ? '⭐ Prov. Jabar' : item.office.kabKota.replace('Kabupaten ', 'Kab. ')}
              </span>
            </button>
          );
        })}
      </div>

      {/* MAIN VIEW: 2 COLS (MAP + DETAILS DIRECTORY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* MAP CONTAINER (8 COLS ON DESKTOP) */}
        <div className="lg:col-span-8 relative bg-slate-950 min-h-[440px] sm:min-h-[500px] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* MAP OVERLAY CONTROLS */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
            {/* CURRENT SELECTED OFFICE BADGE */}
            <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/50 shadow-lg flex items-center gap-2 text-xs">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {selectedOfficePresence.status !== 'OFFLINE' && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      selectedOfficePresence.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    selectedOfficePresence.status === 'ONLINE'
                      ? 'bg-emerald-400'
                      : selectedOfficePresence.status === 'BACKGROUND'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
              </span>
              <span className="font-black text-white truncate max-w-[200px] sm:max-w-[320px]">
                {selectedOfficePresence.office.namaDinas}
              </span>
            </div>

            {/* MAP STYLE TOGGLE */}
            <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMapLayerMode('hybrid')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  mapLayerMode === 'hybrid'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satelit / Hybrid
              </button>
              <button
                type="button"
                onClick={() => setMapLayerMode('roadmap')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  mapLayerMode === 'roadmap'
                    ? 'bg-blue-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Peta Jalan
              </button>
            </div>
          </div>

          {/* LOADING SPINNER OVERLAY */}
          {isIframeLoading && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className="text-xs font-black text-emerald-300">Menyesuaikan Titik Presisi Kantor...</span>
            </div>
          )}

          {/* LOCKED / BOUNDED GOOGLE MAP IFRAME */}
          <iframe
            key={`${selectedOfficePresence.office.id}-${mapLayerMode}`}
            title={`Radar Lokasi - ${selectedOfficePresence.office.namaDinas}`}
            src={embedMapUrl}
            className="w-full h-full min-h-[440px] sm:min-h-[500px] border-0"
            loading="lazy"
            allowFullScreen
          />

          {/* BOTTOM MAP STATUS BAR */}
          <div className="p-3 bg-slate-950/95 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300 truncate">
                {selectedOfficePresence.office.alamat}
              </span>
            </div>
            <a
              href={selectedOfficePresence.office.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 text-[11px]"
            >
              <span>Buka Google Maps Lengkap</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* RADAR OFFICE DIRECTORY LIST (4 COLS ON DESKTOP) */}
        <div className="lg:col-span-4 bg-slate-900/90 flex flex-col h-[500px] sm:h-[550px] overflow-hidden">
          {/* DIRECTORY HEADER */}
          <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Daftar 28 Titik Komando
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {filteredPresenceList.length} Titik
            </span>
          </div>

          {/* ACTIVE SELECTED CARD HIGHLIGHT */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-950/60 to-slate-950 border-b border-emerald-500/30">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {selectedOfficePresence.office.isProvinsi ? '⭐ KANTOR PUSAT PROV' : selectedOfficePresence.office.wilayahRayon}
                </span>
                <h4 className="text-sm font-black text-white mt-1 leading-tight">
                  {selectedOfficePresence.office.namaDinas}
                </h4>
              </div>

              {/* Status Pill */}
              <div
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shrink-0 ${
                  selectedOfficePresence.status === 'ONLINE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs'
                    : selectedOfficePresence.status === 'BACKGROUND'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  {selectedOfficePresence.status !== 'OFFLINE' && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        selectedOfficePresence.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      selectedOfficePresence.status === 'ONLINE'
                        ? 'bg-emerald-400'
                        : selectedOfficePresence.status === 'BACKGROUND'
                        ? 'bg-amber-400'
                        : 'bg-slate-500'
                    }`}
                  />
                </span>
                <span>{selectedOfficePresence.status}</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Petugas / Admin:</span>
                <span className="font-bold text-white truncate max-w-[160px]">
                  {selectedOfficePresence.adminName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Layar:</span>
                <span className="font-extrabold text-amber-300">
                  {selectedOfficePresence.statusText}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Telepon Kantor:</span>
                <span className="font-mono text-emerald-300">
                  {selectedOfficePresence.office.telepon}
                </span>
              </div>
            </div>

            {selectedOfficePresence.matchedAccount && onOpenMessageModal && (
              <button
                type="button"
                onClick={() => onOpenMessageModal(selectedOfficePresence.matchedAccount!)}
                className="mt-2.5 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Kirim Instruksi Radar Cepat</span>
              </button>
            )}
          </div>

          {/* SCROLLABLE LIST OF ALL 28 OFFICES */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-1">
            {filteredPresenceList.map((item) => {
              const isSelected = item.office.id === selectedOfficeId;
              let dotBg = 'bg-slate-500';
              let pulseElem = null;

              if (item.status === 'ONLINE') {
                dotBg = 'bg-emerald-400';
                pulseElem = (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                );
              } else if (item.status === 'BACKGROUND') {
                dotBg = 'bg-amber-400';
                pulseElem = (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                );
              }

              return (
                <button
                  key={item.office.id}
                  type="button"
                  onClick={() => handleSelectOffice(item.office.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/80 border border-emerald-500/50 shadow-md'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex h-3 w-3 shrink-0">
                      {pulseElem}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${dotBg}`} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                          {item.office.kabKota}
                        </span>
                        {item.office.isProvinsi && (
                          <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-sm shrink-0">
                            PUSAT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.adminName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[9.5px] font-black px-2 py-0.5 rounded-md ${
                        item.status === 'ONLINE'
                          ? 'text-emerald-300 bg-emerald-500/20'
                          : item.status === 'BACKGROUND'
                          ? 'text-amber-300 bg-amber-500/20'
                          : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
