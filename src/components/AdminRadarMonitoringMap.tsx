import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  MapPin,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Zap,
  Info,
  Users,
  Compass,
  Phone,
  Eye,
  Maximize2
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
  role: string;
  lastActiveTime: string;
}

export const AdminRadarMonitoringMap: React.FC<AdminRadarMonitoringMapProps> = ({
  adminAccounts,
  session,
  onOpenMessageModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('provinsi_jabar');
  const [mapTileMode, setMapTileMode] = useState<'osm' | 'satellite' | 'carto_dark'>('osm');
  const [filterPresence, setFilterPresence] = useState<'ALL' | 'ONLINE' | 'BACKGROUND' | 'OFFLINE'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // 1. FILTER KHUSUS ADMIN & SUPERADMIN SAJA (User, Guest, Tamu ditolak secara ketat)
  const strictlyFilteredAdminAccounts = useMemo(() => {
    return adminAccounts.filter((acc) => {
      const r = (acc.role || '').toLowerCase().trim();
      const u = (acc.username || '').toLowerCase().trim();
      const n = (acc.namaAdmin || '').toLowerCase().trim();

      // Tolak akun user, tamu, guest
      if (
        r === 'user' ||
        r === 'guest' ||
        r === 'tamu' ||
        acc.isGuest === true ||
        acc.statusActive === 'GUEST' ||
        u === 'tamu' ||
        u === 'tamu publik' ||
        u.startsWith('user_') ||
        u.includes('guest') ||
        n.includes('tamu publik') ||
        n.includes('pengunjung')
      ) {
        return false;
      }

      // Hanya terima superadmin, admin wilayah, dan developer
      return r === 'superadmin' || r === 'admin' || r === 'developer' || acc.isDeveloper === true;
    });
  }, [adminAccounts]);

  // 2. Evaluasi status presence (ONLINE = Hijau Menyala, BACKGROUND = Kuning Menyala, OFFLINE = Redup)
  const computeAccountPresence = (acc: AdminAccount): AdminPresenceStatus => {
    // A. Cek sesi lokal pengguna saat ini
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

    // B. Cek Heartbeat Firestore
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

  // 3. Pasangkan 28 titik kantor dengan data admin & status live presence
  const officePresenceList: OfficePresenceInfo[] = useMemo(() => {
    return DINSOS_GEO_OFFICES.map((office) => {
      // Cari akun admin yang bertugas di wilayah kantor ini
      const matchingAccount = strictlyFilteredAdminAccounts.find((acc) => {
        if (office.isProvinsi) {
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
      let adminName = 'Tidak Ada Sesi Admin';
      let role = 'Admin Wilayah';
      let lastActiveTime = 'Offline';

      if (matchingAccount) {
        status = computeAccountPresence(matchingAccount);
        adminName = matchingAccount.namaAdmin || matchingAccount.username || 'Admin Wilayah';
        role = matchingAccount.role === 'superadmin' ? 'Superadmin Jabar' : matchingAccount.role === 'developer' ? 'Developer' : 'Admin Kab/Kota';
        lastActiveTime = matchingAccount.terakhirLogin || 'Baru Saja';
      }

      let statusText = 'Non-Aktif / Offline';
      if (status === 'ONLINE') {
        statusText = 'Online (Aktif di Layar)';
      } else if (status === 'BACKGROUND') {
        statusText = 'Latar Belakang (Standby)';
      }

      return {
        office,
        status,
        statusText,
        matchedAccount: matchingAccount || null,
        adminName,
        role,
        lastActiveTime,
      };
    });
  }, [strictlyFilteredAdminAccounts, session]);

  // Hitung jumlah status
  const totalOffices = officePresenceList.length;
  const onlineCount = officePresenceList.filter((item) => item.status === 'ONLINE').length;
  const backgroundCount = officePresenceList.filter((item) => item.status === 'BACKGROUND').length;
  const offlineCount = officePresenceList.filter((item) => item.status === 'OFFLINE').length;

  const selectedOfficePresence = useMemo(() => {
    return officePresenceList.find((item) => item.office.id === selectedOfficeId) || officePresenceList[0];
  }, [selectedOfficeId, officePresenceList]);

  const filteredPresenceList = useMemo(() => {
    return officePresenceList.filter((item) => {
      if (filterPresence !== 'ALL' && item.status !== filterPresence) {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const matchName = item.office.namaDinas.toLowerCase().includes(q);
        const matchKab = item.office.kabKota.toLowerCase().includes(q);
        const matchAdmin = item.adminName.toLowerCase().includes(q);
        if (!matchName && !matchKab && !matchAdmin) return false;
      }
      return true;
    });
  }, [officePresenceList, filterPresence, searchFilter]);

  // 4. Inisialisasi Peta Leaflet (1 Peta Menampilkan 28 Penanda Sekaligus)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Inisialisasi peta berpusat di Jawa Barat (-6.95, 107.6)
      const map = L.map(mapContainerRef.current, {
        center: [-6.9147, 107.6098],
        zoom: 8,
        minZoom: 8,
        maxZoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Tambahkan kontrol zoom kustom di pojok kanan bawah
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Batasi geseran peta hanya dalam wilayah Jawa Barat agar tidak melompat ke luar provinsi
      const jabarBounds = L.latLngBounds(
        L.latLng(-7.9, 106.2), // Southwest
        L.latLng(-5.8, 108.9)  // Northeast
      );
      map.setMaxBounds(jabarBounds);

      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }

    // Pasang Tile Layer sesuai pilihan
    if (leafletMapRef.current) {
      if (tileLayerRef.current) {
        leafletMapRef.current.removeLayer(tileLayerRef.current);
      }

      let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      if (mapTileMode === 'satellite') {
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      } else if (mapTileMode === 'carto_dark') {
        // High quality dark tile without intrusive watermark
        tileUrl = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
      }

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 18,
        subdomains: 'abcd',
      }).addTo(leafletMapRef.current);
    }

    return () => {
      // Cleanup saat unmount
    };
  }, [mapTileMode]);

  // 5. Render 28 Marker Sensor Sekaligus ke dalam Peta
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerGroupRef.current) return;

    const layerGroup = markersLayerGroupRef.current;
    layerGroup.clearLayers();

    officePresenceList.forEach((item) => {
      const isSelected = item.office.id === selectedOfficeId;
      const isProv = item.office.isProvinsi;

      // Konfigurasi visual sensor berdasarkan status
      let coreColor = '#94a3b8'; // Abu-abu offline
      let ringColor = 'rgba(148, 163, 184, 0.4)';
      let pulseHtml = '';
      let badgeLabel = item.office.kabKota.replace('Kabupaten ', 'Kab. ').replace('Kota ', 'Kota ');

      if (item.status === 'ONLINE') {
        coreColor = '#00ff88'; // Hijau Neon Super Terang & Bercahaya
        ringColor = 'rgba(0, 255, 136, 0.9)';
        pulseHtml = `<div class="radar-sensor-ping-green"></div>`;
      } else if (item.status === 'BACKGROUND') {
        coreColor = '#fbbf24'; // Kuning Amber Menyala
        ringColor = 'rgba(251, 191, 36, 0.8)';
        pulseHtml = `<div class="radar-sensor-ping-yellow"></div>`;
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none group">
          ${pulseHtml}
          <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-2xl transition-transform ${
            isSelected ? 'scale-125 ring-3 ring-amber-300' : 'hover:scale-110'
          }" style="background-color: ${coreColor}; border: 2px solid ${isProv ? '#fde047' : '#ffffff'}; box-shadow: 0 0 16px ${coreColor}, 0 0 28px ${coreColor};">
            ${isProv ? '<span style="font-size: 10px;">⭐</span>' : `<span style="width: 7px; height: 7px; background: white; border-radius: 9999px; box-shadow: 0 0 6px white;"></span>`}
          </div>
          <!-- Label Mini Kota yang Rapi Tanpa Tabrakan -->
          <div class="absolute -bottom-5 whitespace-nowrap bg-slate-950/90 text-[9px] font-black px-1.5 py-0.5 rounded border shadow-lg pointer-events-none ${
            item.status === 'ONLINE' ? 'text-emerald-200 border-emerald-400 shadow-emerald-500/30' : item.status === 'BACKGROUND' ? 'text-amber-200 border-amber-400 shadow-amber-500/30' : 'text-slate-300 border-white/20'
          }">
            ${badgeLabel}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-radar-pin',
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([item.office.lat, item.office.lng], {
        icon: customIcon,
        title: item.office.namaDinas,
      });

      // Event klik marker: update selected office
      marker.on('click', () => {
        setSelectedOfficeId(item.office.id);
      });

      layerGroup.addLayer(marker);
    });
  }, [officePresenceList, selectedOfficeId]);

  // Efek geser peta halus ketika admin memilih kantor dari daftar
  const handleSelectOfficeCard = (office: DinsosGeoOffice) => {
    setSelectedOfficeId(office.id);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([office.lat, office.lng], 12, {
        duration: 0.8,
      });
    }
  };

  const handleResetViewJabar = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([-6.9147, 107.6098], 8, {
        duration: 0.6,
      });
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl border-2 border-emerald-500/40 shadow-2xl overflow-hidden mb-6 text-white relative">
      {/* STYLE CSS KHUSUS ANIMASI SENSOR RADAR HIJAU & KUNING MENYALA */}
      <style>{`
        .radar-sensor-ping-green {
          position: absolute;
          width: 38px;
          height: 38px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.9) 0%, rgba(52, 211, 153, 0.6) 50%, rgba(16, 185, 129, 0) 100%);
          box-shadow: 0 0 20px #10b981, 0 0 35px #34d399;
          animation: sensorPingGreen 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        }
        .radar-sensor-ping-yellow {
          position: absolute;
          width: 34px;
          height: 34px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.85) 0%, rgba(251, 191, 36, 0.5) 50%, rgba(245, 158, 11, 0) 100%);
          box-shadow: 0 0 16px #f59e0b, 0 0 28px #fbbf24;
          animation: sensorPingYellow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        }
        @keyframes sensorPingGreen {
          0% {
            transform: scale(0.4);
            opacity: 1;
          }
          60% {
            opacity: 0.85;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }
        @keyframes sensorPingYellow {
          0% {
            transform: scale(0.5);
            opacity: 0.95;
          }
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        .leaflet-container {
          background-color: #020617 !important;
          font-family: inherit;
        }
      `}</style>

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
                Live Sensor Presence (28 Penanda Bersamaan)
              </span>
              <span className="text-[10px] text-amber-300 font-extrabold uppercase bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Khusus Superadmin & Admin
              </span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-white m-0 tracking-tight flex items-center gap-2">
              Peta Radar Presensi 28 Kantor Dinas Sosial se-Jawa Barat
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
            <span>{onlineCount} Admin Online</span>
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

      {/* MAIN VIEW: 2 COLS (PETA 28 PENANDA BERSAMAAN + PANEL DETAIL SAMPING) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LEAFLET MAP WRAPPER (8 COLS ON DESKTOP) */}
        <div className="lg:col-span-8 relative bg-slate-950 min-h-[460px] sm:min-h-[520px] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* MAP TOP CONTROLS */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* RESET VIEW BUTTON */}
            <button
              type="button"
              onClick={handleResetViewJabar}
              className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-white text-xs font-black border border-emerald-500/40 shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="Tampilkan Seluruh 28 Titik Jawa Barat"
            >
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>Lihat Seluruh Jabar (28 Titik)</span>
            </button>

            {/* MAP THEME TOGGLE (URUTAN: Terang, Satelit, Radar Dark) */}
            <div className="pointer-events-auto flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMapTileMode('osm')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapTileMode === 'osm'
                    ? 'bg-amber-600 text-white font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Terang
              </button>
              <button
                type="button"
                onClick={() => setMapTileMode('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapTileMode === 'satellite'
                    ? 'bg-blue-600 text-white font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => setMapTileMode('carto_dark')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapTileMode === 'carto_dark'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Radar Dark
              </button>
            </div>
          </div>

          {/* LEAFLET MAP ELEMENT CONTAINER */}
          <div ref={mapContainerRef} className="w-full h-full min-h-[460px] sm:min-h-[520px] relative z-0" />

          {/* MAP BOTTOM STATUS BAR (BERSIH TANPA TEKS BERTUMPUK) */}
          <div className="p-3 bg-slate-950/95 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-slate-300 truncate">
                Titik Terpilih: <strong className="text-white">{selectedOfficePresence.office.namaDinas}</strong>
              </span>
            </div>
            <a
              href={selectedOfficePresence.office.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 text-[11px]"
            >
              <span>Buka Navigasi Rute GPS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* RADAR OFFICE DIRECTORY LIST (4 COLS ON DESKTOP) */}
        <div className="lg:col-span-4 bg-slate-900/90 flex flex-col h-[520px] overflow-hidden">
          {/* SEARCH & FILTER BAR */}
          <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>28 Kantor Wilayah</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-300">
                {filteredPresenceList.length} Ditampilkan
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari kab/kota atau nama admin..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* ACTIVE SELECTED CARD HIGHLIGHT (RAPI, TIDAK MENUTUPI AREA LAIN) */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-950/70 to-slate-950 border-b border-emerald-500/30">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {selectedOfficePresence.office.isProvinsi ? '⭐ KANTOR PUSAT PROV' : selectedOfficePresence.office.wilayahRayon}
                </span>
                <h4 className="text-sm font-black text-white mt-1 leading-tight">
                  {selectedOfficePresence.office.namaDinas}
                </h4>
              </div>

              {/* Status Badge */}
              <div
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shrink-0 ${
                  selectedOfficePresence.status === 'ONLINE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs'
                    : selectedOfficePresence.status === 'BACKGROUND'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedOfficePresence.status === 'ONLINE'
                      ? 'bg-emerald-400 animate-pulse'
                      : selectedOfficePresence.status === 'BACKGROUND'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <span>{selectedOfficePresence.status}</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Petugas Admin:</span>
                <span className="font-bold text-white truncate max-w-[170px]">
                  {selectedOfficePresence.adminName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status Presensi:</span>
                <span className="font-extrabold text-amber-300">
                  {selectedOfficePresence.statusText}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Telepon Resmi:</span>
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
                <span>Kirim Instruksi Cepat ke Admin Wilayah</span>
              </button>
            )}
          </div>

          {/* SCROLLABLE LIST OF ALL 28 OFFICES */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-1">
            {filteredPresenceList.map((item) => {
              const isSelected = item.office.id === selectedOfficeId;
              let dotBg = 'bg-slate-500';

              if (item.status === 'ONLINE') {
                dotBg = 'bg-emerald-400';
              } else if (item.status === 'BACKGROUND') {
                dotBg = 'bg-amber-400';
              }

              return (
                <button
                  key={item.office.id}
                  type="button"
                  onClick={() => handleSelectOfficeCard(item.office)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/80 border border-emerald-500/50 shadow-md'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotBg} ${item.status !== 'OFFLINE' ? 'animate-pulse' : ''}`} />

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
