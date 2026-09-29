import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  ExternalLink,
  ShieldCheck,
  Search,
  Zap,
  Compass,
  Crosshair,
  Signal
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
  const radarLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Kantor Provinsi sebagai Titik Pusat Radar
  const provinsiOffice = useMemo(() => {
    return DINSOS_GEO_OFFICES.find((o) => o.isProvinsi) || DINSOS_GEO_OFFICES[0];
  }, []);

  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('provinsi_jabar');
  // Default Map Theme: RADAR BLACK (Hitam Dominan)
  const [mapTileMode, setMapTileMode] = useState<'radar_black' | 'satellite' | 'osm'>('radar_black');
  const [filterPresence, setFilterPresence] = useState<'ALL' | 'ONLINE' | 'BACKGROUND' | 'OFFLINE'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Live real-time heartbeat ticker (memperbarui status presensi setiap 2 detik secara instan)
  const [liveTick, setLiveTick] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTick((t) => t + 1);
    }, 2000);

    const handleVisAndFocus = () => {
      setLiveTick((t) => t + 1);
    };

    document.addEventListener('visibilitychange', handleVisAndFocus);
    window.addEventListener('focus', handleVisAndFocus);
    window.addEventListener('blur', handleVisAndFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisAndFocus);
      window.removeEventListener('focus', handleVisAndFocus);
      window.removeEventListener('blur', handleVisAndFocus);
    };
  }, []);

  // 1. FILTER KHUSUS ADMIN & SUPERADMIN SAJA
  const strictlyFilteredAdminAccounts = useMemo(() => {
    return adminAccounts.filter((acc) => {
      const r = (acc.role || '').toLowerCase().trim();
      const u = (acc.username || '').toLowerCase().trim();
      const n = (acc.namaAdmin || '').toLowerCase().trim();

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

      return r === 'superadmin' || r === 'admin' || r === 'developer' || acc.isDeveloper === true;
    });
  }, [adminAccounts]);

  // 2. Evaluasi status presence (ONLINE = Hijau Neon Menyala, BACKGROUND = Kuning Menyala, OFFLINE = Redup)
  const computeAccountPresence = (acc: AdminAccount): AdminPresenceStatus => {
    // A. Cek jika akun ini adalah sesi pengguna yang sedang login saat ini di tab ini
    const isCurrentSessionUser =
      Boolean(session) &&
      session?.statusActive === 'SAH_TERDAFTAR' &&
      (((session?.isDeveloper || session?.role === 'developer') && acc.role === 'developer') ||
        (session?.role === 'superadmin' && acc.role === 'superadmin') ||
        (session?.username && (acc.username || '').toLowerCase().trim() === session.username.toLowerCase().trim()) ||
        (session?.nama && (acc.namaAdmin || '').toLowerCase().trim() === session.nama.toLowerCase().trim()) ||
        (acc.role === session?.role && (acc.wilayahTugas || '').toLowerCase().trim() === (session?.wilayah || '').toLowerCase().trim()));

    if (isCurrentSessionUser) {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return 'BACKGROUND';
      }
      return 'ONLINE';
    }

    // B. Cek status realtime akun lain (Heartbeat Firestore & Signal Live)
    const activeTime = acc.lastHeartbeat || acc.lastActive;
    if (!activeTime) return 'OFFLINE';

    const timeDiff = Date.now() - new Date(activeTime).getTime();
    if (isNaN(timeDiff) || timeDiff > 120 * 1000) {
      return 'OFFLINE';
    }

    if (acc.statusLayar === 'OFFLINE' || acc.statusKoneksi === 'OFFLINE') {
      if (timeDiff > 15 * 1000) return 'OFFLINE';
    }

    if (acc.statusLayar === 'LATAR_BELAKANG' || acc.statusKoneksi === 'IDLE' || acc.statusLayar === 'AFK_IDLE') {
      return 'BACKGROUND';
    }

    if (acc.statusLayar === 'AKTIF_LAYAR' || acc.statusKoneksi === 'ONLINE' || acc.isOnline === true || acc.isScreenActive === true) {
      return 'ONLINE';
    }

    // Jika memiliki heartbeat terbaru dalam 90 detik terakhir
    if (timeDiff <= 90 * 1000) {
      return 'ONLINE';
    }

    return 'OFFLINE';
  };

  // 3. Pasangkan 28 titik kantor dengan data admin & status live presence secara presisi & realtime
  const officePresenceList: OfficePresenceInfo[] = useMemo(() => {
    return DINSOS_GEO_OFFICES.map((office) => {
      // A. Kumpulkan seluruh akun yang bertugas di wilayah kantor ini
      const matchedAccounts = strictlyFilteredAdminAccounts.filter((acc) => {
        if (office.isProvinsi) {
          const r = (acc.role || '').toLowerCase();
          const w = (acc.wilayahTugas || '').toLowerCase();
          const u = (acc.username || '').toLowerCase();
          return (
            r === 'superadmin' ||
            r === 'developer' ||
            w.includes('provinsi') ||
            w.includes('jawa barat') ||
            u.includes('superadmin')
          );
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

      // B. Cek apakah sesi login saat ini bertugas di kantor ini
      const isSessionAtThisOffice = (() => {
        if (!session) return false;
        if (office.isProvinsi) {
          const r = (session.role || '').toLowerCase();
          const w = (session.wilayah || '').toLowerCase();
          return r === 'superadmin' || r === 'developer' || w.includes('provinsi') || w.includes('jawa barat');
        }
        const sw = (session.wilayah || '').toLowerCase().trim();
        const ok = office.kabKota.toLowerCase().trim();
        return sw === ok || ok.includes(sw) || sw.includes(ok);
      })();

      // C. Tentukan akun representatif & status kehadiran
      let activeAccount: AdminAccount | null = null;
      let status: AdminPresenceStatus = 'OFFLINE';

      if (isSessionAtThisOffice) {
        // JIKA AKUN YANG SEDANG LOGIN BERTUGAS DI KANTOR INI (e.g. SUPERADMIN di KANTOR PROVINSI):
        // Prioritaskan akun yang sedang login tersebut (pasti ONLINE saat aktif di layar)
        const sessionAccount = matchedAccounts.find(
          (a) =>
            (session.username && (a.username || '').toLowerCase().trim() === session.username.toLowerCase().trim()) ||
            (session.nama && (a.namaAdmin || '').toLowerCase().trim() === session.nama.toLowerCase().trim()) ||
            (session.role === a.role)
        );
        activeAccount = sessionAccount || matchedAccounts.find((a) => a.role === session.role) || matchedAccounts[0] || null;

        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          status = 'BACKGROUND';
        } else {
          status = 'ONLINE';
        }
      } else {
        // JIKA BUKAN SESI LOGIN DI PERANGKAT INI:
        // Evaluasi seluruh akun admin kantor ini, utamakan akun yang sedang ONLINE
        let bestAcc: AdminAccount | null = null;
        let bestStatus: AdminPresenceStatus = 'OFFLINE';

        for (const acc of matchedAccounts) {
          const presence = computeAccountPresence(acc);
          if (presence === 'ONLINE') {
            bestAcc = acc;
            bestStatus = 'ONLINE';
            break;
          } else if (presence === 'BACKGROUND' && bestStatus === 'OFFLINE') {
            bestAcc = acc;
            bestStatus = 'BACKGROUND';
          }
        }

        if (!bestAcc) {
          // Jika tidak ada yang online, ambil akun default representatif kantor
          if (office.isProvinsi) {
            bestAcc = matchedAccounts.find((a) => a.role === 'superadmin') || matchedAccounts[0] || null;
          } else {
            bestAcc = matchedAccounts[0] || null;
          }
          bestStatus = 'OFFLINE';
        }

        activeAccount = bestAcc;
        status = bestStatus;
      }

      // D. Susun Nama Petugas & Label Status
      let adminName = 'Tidak Ada Sesi Admin';
      let role = office.isProvinsi ? 'Superadmin Jabar' : 'Admin Wilayah';
      let lastActiveTime = 'Offline';

      if (isSessionAtThisOffice && session) {
        adminName = session.nama || session.username || (office.isProvinsi ? 'Super Admin Dinsos Jabar' : 'Admin Wilayah');
        role = session.role === 'superadmin' ? 'Superadmin Jabar' : session.role === 'developer' ? 'Developer' : 'Admin Kab/Kota';
        lastActiveTime = status === 'ONLINE' ? 'Sedang Aktif di Layar Saat Ini' : 'Standby di Latar Belakang';
      } else if (activeAccount) {
        adminName = activeAccount.namaAdmin || activeAccount.username || 'Admin Wilayah';
        role = activeAccount.role === 'superadmin' ? 'Superadmin Jabar' : activeAccount.role === 'developer' ? 'Developer' : 'Admin Kab/Kota';
        lastActiveTime = activeAccount.terakhirLogin || 'Baru Saja';
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
        matchedAccount: activeAccount,
        adminName,
        role,
        lastActiveTime,
      };
    });
  }, [strictlyFilteredAdminAccounts, session, liveTick]);

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

  // 4. Inisialisasi Peta Leaflet Berpusat di Jawa Barat
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-6.9147, 107.6098],
        zoom: 8,
        minZoom: 7,
        maxZoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Batasan geseran peta se-Jawa Barat
      const jabarBounds = L.latLngBounds(
        L.latLng(-8.2, 105.8),
        L.latLng(-5.6, 109.3)
      );
      map.setMaxBounds(jabarBounds);

      // Layer khusus untuk radar gelombang (hanya aktif di radar_black)
      radarLayerGroupRef.current = L.layerGroup().addTo(map);
      // Layer khusus untuk 28 marker sensor kantor
      markersLayerGroupRef.current = L.layerGroup().addTo(map);

      leafletMapRef.current = map;
    }

    // Pasang Tile Layer sesuai pilihan
    if (leafletMapRef.current) {
      if (tileLayerRef.current) {
        leafletMapRef.current.removeLayer(tileLayerRef.current);
      }

      let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      let subdomains = 'abc';
      let maxZoom = 19;
      let tileClassName = '';

      if (mapTileMode === 'satellite') {
        // Mode Satelit Asli Tanpa Filter Gelap
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        subdomains = '';
        maxZoom = 18;
        tileClassName = '';
      } else if (mapTileMode === 'osm') {
        // Mode Terang Asli Tanpa Filter Gelap
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        subdomains = 'abc';
        maxZoom = 19;
        tileClassName = '';
      } else if (mapTileMode === 'radar_black') {
        // Mode Radar Black: Filter gelap yang pas (tidak terlalu gelap, batas & jalan tetap jelas)
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        subdomains = 'abc';
        maxZoom = 19;
        tileClassName = 'radar-black-tile-filter';
      }

      const newTileLayer = L.tileLayer(tileUrl, {
        maxZoom,
        subdomains,
        className: tileClassName,
      }).addTo(leafletMapRef.current);

      tileLayerRef.current = newTileLayer;
      leafletMapRef.current.invalidateSize();
    }
  }, [mapTileMode]);

  // Observer agar peta selalu responsif & tidak ada tile hitam saat resize
  useEffect(() => {
    if (!leafletMapRef.current || !mapContainerRef.current) return;

    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        handleResize();
      });
      ro.observe(mapContainerRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 5. Render Lapisan Radar Gelombang (HANYA DITAMPILKAN DI MODE "RADAR BLACK")
  // Terkunci langsung di layer peta Leaflet pada koordinat Kantor Provinsi (Anti-geser & Anti-lag)
  useEffect(() => {
    if (!leafletMapRef.current || !radarLayerGroupRef.current) return;

    const radarGroup = radarLayerGroupRef.current;
    radarGroup.clearLayers();

    // Radar HANYA diperuntukkan untuk "radar_black" saja. Di mode Satelit & Terang TIDAK ADA RADAR sama sekali.
    if (mapTileMode !== 'radar_black' || !provinsiOffice) {
      return;
    }

    // HTML SVG Radar yang terpusat tepat pada koordinat Kantor Provinsi
    // Center SVG berada di (400, 400), di-offset -400px -400px sehingga menempel absolut pada titik koordinat
    const radarHtml = `
      <div style="position: relative; width: 0; height: 0; pointer-events: none;">
        <svg
          width="800"
          height="800"
          viewBox="0 0 800 800"
          style="position: absolute; left: -400px; top: -400px; pointer-events: none; overflow: visible;"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="radarBlackWaveGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#00ff88" stop-opacity="0.35" />
              <stop offset="35%" stop-color="#00ff88" stop-opacity="0.14" />
              <stop offset="70%" stop-color="#10b981" stop-opacity="0.04" />
              <stop offset="100%" stop-color="#00ff88" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="radarBlackSweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00ff88" stop-opacity="0.5" />
              <stop offset="45%" stop-color="#00ff88" stop-opacity="0.12" />
              <stop offset="100%" stop-color="#00ff88" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- 1. LINGKARAN JANGKAUAN BERSIH TANPA TEKS KM KM -->
          <circle cx="400" cy="400" r="70" fill="none" stroke="rgba(0, 255, 136, 0.35)" stroke-dasharray="4 4" stroke-width="1.2" />
          <circle cx="400" cy="400" r="150" fill="none" stroke="rgba(0, 255, 136, 0.28)" stroke-dasharray="5 5" stroke-width="1.2" />
          <circle cx="400" cy="400" r="250" fill="none" stroke="rgba(0, 255, 136, 0.22)" stroke-dasharray="6 6" stroke-width="1.2" />
          <circle cx="400" cy="400" r="370" fill="none" stroke="rgba(0, 255, 136, 0.16)" stroke-dasharray="8 8" stroke-width="1.2" />

          <!-- Garis Sumbu Koordinat Halus -->
          <line x1="30" y1="400" x2="770" y2="400" stroke="rgba(0, 255, 136, 0.2)" stroke-dasharray="4 6" stroke-width="1" />
          <line x1="400" y1="30" x2="400" y2="770" stroke="rgba(0, 255, 136, 0.2)" stroke-dasharray="4 6" stroke-width="1" />

          <!-- 2. GELOMBANG MEMANCAR MEMBESAR KE ARAH LUAR SECARA TERUS MENERUS (RADIAL PULSE / RIPPLE) -->
          <circle cx="400" cy="400" fill="url(#radarBlackWaveGlow)" stroke="#00ff88" class="radar-wave-ripple-1" />
          <circle cx="400" cy="400" fill="url(#radarBlackWaveGlow)" stroke="#00ff88" class="radar-wave-ripple-2" />
          <circle cx="400" cy="400" fill="url(#radarBlackWaveGlow)" stroke="#00ff88" class="radar-wave-ripple-3" />
          <circle cx="400" cy="400" fill="url(#radarBlackWaveGlow)" stroke="#00ff88" class="radar-wave-ripple-4" />

          <!-- 3. SAPUAN SINAR PEMINDAI RADAR 360 DERAJAT -->
          <g style="transform-origin: 400px 400px; animation: radarSweepRotate 4.5s linear infinite;">
            <path d="M 400 400 L 770 400 A 370 370 0 0 1 720 585 Z" fill="url(#radarBlackSweepGradient)" />
            <line x1="400" y1="400" x2="770" y2="400" stroke="#00ff88" stroke-width="2.2" style="filter: drop-shadow(0 0 6px #00ff88);" />
          </g>
        </svg>
      </div>
    `;

    const radarIcon = L.divIcon({
      className: 'radar-black-layer-icon',
      html: radarHtml,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const radarMarker = L.marker([provinsiOffice.lat, provinsiOffice.lng], {
      icon: radarIcon,
      zIndexOffset: -50,
      interactive: false,
    });

    radarGroup.addLayer(radarMarker);
  }, [mapTileMode, provinsiOffice]);

  // 6. Render 28 Marker Sensor Kantor
  useEffect(() => {
    if (!leafletMapRef.current || !markersLayerGroupRef.current) return;

    const layerGroup = markersLayerGroupRef.current;
    layerGroup.clearLayers();

    officePresenceList.forEach((item) => {
      const isSelected = item.office.id === selectedOfficeId;
      const isProv = item.office.isProvinsi;

      // Konfigurasi visual sensor berdasarkan status
      let coreColor = '#64748b'; // Abu-abu offline redup
      let glowColor = 'rgba(100, 116, 139, 0.4)';
      let pulseHtml = '';
      const badgeLabel = item.office.kabKota.replace('Kabupaten ', 'Kab. ').replace('Kota ', 'Kota ');

      if (isProv) {
        // Kantor Provinsi: Pusat Radar Emas & Hijau Bersinar
        coreColor = '#f59e0b';
        glowColor = '#10b981';
        pulseHtml = `<div class="radar-provinsi-beacon"></div>`;
      } else if (item.status === 'ONLINE') {
        coreColor = '#00ff88'; // Hijau Neon
        glowColor = '#00ff88';
        pulseHtml = `<div class="radar-sensor-ping-green"></div>`;
      } else if (item.status === 'BACKGROUND') {
        coreColor = '#fbbf24'; // Kuning Amber
        glowColor = '#fbbf24';
        pulseHtml = `<div class="radar-sensor-ping-yellow"></div>`;
      }

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none group">
          ${pulseHtml}
          <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelected ? 'scale-125 ring-3 ring-emerald-400' : 'hover:scale-115'
          }" style="background-color: ${coreColor}; border: 2px solid ${isProv ? '#fef08a' : '#050b14'}; box-shadow: 0 0 16px ${glowColor}, 0 0 28px ${glowColor};">
            ${isProv ? '<span style="font-size: 11px; filter: drop-shadow(0 0 4px #000);">⭐</span>' : `<span style="width: 6px; height: 6px; background: #ffffff; border-radius: 9999px; box-shadow: 0 0 6px white;"></span>`}
          </div>
          <!-- Label Mini Kota Tactical Sleek Black -->
          <div class="absolute -bottom-5 whitespace-nowrap bg-black/90 text-[8.5px] font-black px-1.5 py-0.5 rounded border pointer-events-none transition-all ${
            isProv
              ? 'text-amber-300 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              : item.status === 'ONLINE'
              ? 'text-emerald-300 border-emerald-500/80 shadow-[0_0_10px_rgba(0,255,136,0.4)]'
              : item.status === 'BACKGROUND'
              ? 'text-amber-300 border-amber-500/80 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
              : 'text-slate-400 border-slate-700/80'
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
        zIndexOffset: isProv ? 1000 : 100,
      });

      marker.on('click', () => {
        setSelectedOfficeId(item.office.id);
      });

      layerGroup.addLayer(marker);
    });
  }, [officePresenceList, selectedOfficeId]);

  // Efek geser peta ketika memilih kantor dari daftar
  const handleSelectOfficeCard = (office: DinsosGeoOffice) => {
    setSelectedOfficeId(office.id);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([office.lat, office.lng], 11, {
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

  const handleFocusKantorProvinsi = () => {
    setSelectedOfficeId('provinsi_jabar');
    if (leafletMapRef.current && provinsiOffice) {
      leafletMapRef.current.flyTo([provinsiOffice.lat, provinsiOffice.lng], 10, {
        duration: 0.7,
      });
    }
  };

  return (
    <div className="bg-[#030712] rounded-3xl border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden mb-6 text-white relative">
      {/* STYLE CSS KHUSUS TEMA RADAR BLACK & GELOMBANG MEMANCAR */}
      <style>{`
        /* 1. FILTER TILE RADAR BLACK PROPORSIONAL (TIDAK TERLALU GELAP & TIDAK NUMPUK) */
        .radar-black-tile-filter {
          filter: invert(90%) hue-rotate(190deg) brightness(88%) contrast(108%) saturate(30%) !important;
        }

        /* 2. BEACON PUSAT RADAR (Kantor Provinsi) */
        .radar-provinsi-beacon {
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.9) 0%, rgba(16, 185, 129, 0.5) 45%, rgba(16, 185, 129, 0) 100%);
          box-shadow: 0 0 24px #10b981, 0 0 45px #f59e0b;
          animation: beaconPulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        /* 3. SENSOR PING ONLINE & BACKGROUND */
        .radar-sensor-ping-green {
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(0, 255, 136, 0.9) 0%, rgba(16, 185, 129, 0.6) 50%, rgba(0, 255, 136, 0) 100%);
          box-shadow: 0 0 18px #00ff88, 0 0 32px #10b981;
          animation: sensorPingGreen 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        .radar-sensor-ping-yellow {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.85) 0%, rgba(251, 191, 36, 0.5) 50%, rgba(245, 158, 11, 0) 100%);
          box-shadow: 0 0 15px #f59e0b, 0 0 26px #fbbf24;
          animation: sensorPingYellow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          pointer-events: none;
        }

        @keyframes beaconPulse {
          0% { transform: scale(0.3); opacity: 1; }
          70% { opacity: 0.8; }
          100% { transform: scale(3.2); opacity: 0; }
        }

        @keyframes sensorPingGreen {
          0% { transform: scale(0.4); opacity: 1; }
          60% { opacity: 0.85; }
          100% { transform: scale(2.8); opacity: 0; }
        }

        @keyframes sensorPingYellow {
          0% { transform: scale(0.45); opacity: 0.95; }
          75%, 100% { transform: scale(2.6); opacity: 0; }
        }

        /* 4. GELOMBANG RADAR EXPANDING RIPPLE (PULSE DARI KANTOR PROVINSI KE LUAR SECARA LOOPING) */
        @keyframes radarRippleExpand {
          0% {
            r: 6px;
            opacity: 0.95;
            stroke-width: 3.5px;
          }
          40% {
            opacity: 0.75;
            stroke-width: 2.2px;
          }
          75% {
            opacity: 0.35;
            stroke-width: 1.4px;
          }
          100% {
            r: 420px;
            opacity: 0;
            stroke-width: 0.8px;
          }
        }

        .radar-wave-ripple-1 {
          animation: radarRippleExpand 4.4s cubic-bezier(0.15, 0.45, 0.35, 1) infinite;
        }
        .radar-wave-ripple-2 {
          animation: radarRippleExpand 4.4s cubic-bezier(0.15, 0.45, 0.35, 1) infinite;
          animation-delay: 1.1s;
        }
        .radar-wave-ripple-3 {
          animation: radarRippleExpand 4.4s cubic-bezier(0.15, 0.45, 0.35, 1) infinite;
          animation-delay: 2.2s;
        }
        .radar-wave-ripple-4 {
          animation: radarRippleExpand 4.4s cubic-bezier(0.15, 0.45, 0.35, 1) infinite;
          animation-delay: 3.3s;
        }

        /* 5. RADAR SWEEP ROTATION 360 DERAJAT */
        @keyframes radarSweepRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .leaflet-container {
          background-color: #010409 !important;
          font-family: inherit;
        }
      `}</style>

      {/* TOP HEADER: RADAR BLACK COMMAND CENTER */}
      <div className="bg-gradient-to-r from-black via-[#060e1d] to-black p-4 sm:p-5 border-b border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute -top-12 left-1/4 w-96 h-28 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="relative flex items-center justify-center">
            <div className="w-13 h-13 rounded-2xl bg-black border-2 border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(0,255,136,0.3)]">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            {/* Live radar status indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-black" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Radar Black Monitor • 28 Kantor Se-Jawa Barat</span>
              </span>
              <span className="text-[10px] text-amber-300 font-extrabold uppercase bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-amber-400" />
                <span>Pusat: Kantor Provinsi</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-white m-0 tracking-tight flex items-center gap-2 mt-1">
              Peta Radar Presensi 28 Kantor Dinas Sosial se-Jawa Barat
            </h2>
          </div>
        </div>

        {/* PRESENCE COUNTER BADGES */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {/* ONLINE BUTTON FILTER */}
          <button
            type="button"
            onClick={() => setFilterPresence(filterPresence === 'ONLINE' ? 'ALL' : 'ONLINE')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              filterPresence === 'ONLINE'
                ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_20px_rgba(0,255,136,0.4)]'
                : 'bg-black/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-950/40'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <span>{onlineCount} Admin Online</span>
          </button>

          {/* BACKGROUND BUTTON FILTER */}
          <button
            type="button"
            onClick={() => setFilterPresence(filterPresence === 'BACKGROUND' ? 'ALL' : 'BACKGROUND')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              filterPresence === 'BACKGROUND'
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                : 'bg-black/80 text-amber-300 border-amber-500/50 hover:bg-amber-950/40'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
            <span>{backgroundCount} Latar Belakang</span>
          </button>

          {/* OFFLINE BUTTON FILTER */}
          <button
            type="button"
            onClick={() => setFilterPresence(filterPresence === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              filterPresence === 'OFFLINE'
                ? 'bg-slate-200 text-black border-white shadow-md'
                : 'bg-black/80 text-slate-400 border-slate-700 hover:bg-slate-900'
            }`}
          >
            <span className="inline-flex rounded-full h-2 w-2 bg-slate-500" />
            <span>{offlineCount} Offline</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW: 2 COLS (PETA RADAR JABAR + PANEL KONTROL & DAFTAR KANTOR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LEAFLET MAP WRAPPER (8 COLS ON DESKTOP) */}
        <div className="lg:col-span-8 relative bg-black min-h-[480px] sm:min-h-[550px] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/80">
          
          {/* MAP TOP CONTROLS (HUD TACTICAL BAR - TANPA TOMBOL ON/PAUSE DAN NORMAL/CEPAT) */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* LEFT ACTIONS: RESET VIEW & PUSAT PROVINSI */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetViewJabar}
                className="px-3 py-1.5 rounded-xl bg-black/90 hover:bg-slate-900 text-white text-xs font-black border border-emerald-500/50 shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all backdrop-blur-md"
                title="Tampilkan Seluruh 28 Titik Jawa Barat"
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Lihat Seluruh Jabar (28 Titik)</span>
              </button>

              <button
                type="button"
                onClick={handleFocusKantorProvinsi}
                className="px-2.5 py-1.5 rounded-xl bg-black/90 hover:bg-slate-900 text-amber-300 text-xs font-black border border-amber-400/50 shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all backdrop-blur-md"
                title="Kunci Pusat Radar di Kantor Dinsos Provinsi"
              >
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Pusat Radar</span>
              </button>
            </div>

            {/* RIGHT ACTIONS: MAP THEME TOGGLE (Radar Dark, Satelit, Terang) */}
            <div className="pointer-events-auto flex items-center gap-1 bg-black/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setMapTileMode('radar_black')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  mapTileMode === 'radar_black'
                    ? 'bg-emerald-600 text-black font-black shadow-[0_0_12px_rgba(0,255,136,0.5)]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Radar Black (Dengan Efek Radar Aktif)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Radar Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setMapTileMode('satellite')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapTileMode === 'satellite'
                    ? 'bg-blue-600 text-white font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Citra Satelit Murni"
              >
                Satelit
              </button>
              <button
                type="button"
                onClick={() => setMapTileMode('osm')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  mapTileMode === 'osm'
                    ? 'bg-amber-600 text-white font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Peta Terang Murni"
              >
                Terang
              </button>
            </div>
          </div>

          {/* LEAFLET MAP ELEMENT CONTAINER */}
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[480px] sm:min-h-[550px] relative z-0"
          />

          {/* MAP BOTTOM STATUS & TELEMETRY BAR */}
          <div className="p-3 bg-black/95 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_#00ff88]" />
              <span className="text-slate-300 truncate">
                Titik Terpilih:{' '}
                <strong className="text-white">
                  {selectedOfficePresence.office.namaDinas.replace(/\s*\(kantor pusat\)/gi, '')}
                </strong>
                {selectedOfficePresence.office.isProvinsi && (
                  <span className="ml-2 text-[10px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                    ⭐ Pusat Radar Provinsi
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {mapTileMode === 'radar_black' && (
                <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/40 hidden md:inline-flex items-center gap-1 shadow-xs">
                  <Signal className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>RADAR BLACK: JANGKAUAN 28 TITIK SENSOR AKTIF</span>
                </span>
              )}

              <a
                href={selectedOfficePresence.office.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 text-[11px]"
              >
                <span>Buka Rute GPS</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* RADAR OFFICE DIRECTORY LIST (4 COLS ON DESKTOP - SLEEK BLACK SIDEBAR) */}
        <div className="lg:col-span-4 bg-[#050914] flex flex-col h-[550px] overflow-hidden">
          
          {/* SEARCH & FILTER BAR */}
          <div className="p-3.5 bg-black/90 border-b border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>28 Kantor Wilayah</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
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
                className="w-full bg-[#0b1020] border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* ACTIVE SELECTED CARD HIGHLIGHT (SLEEK BLACK CARBON STYLE) */}
          <div className="p-3.5 bg-gradient-to-br from-[#071724] via-[#050d18] to-black border-b border-emerald-500/30">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {selectedOfficePresence.office.isProvinsi ? 'PROVINSI JAWA BARAT' : selectedOfficePresence.office.wilayahRayon}
                </span>
                <h4 className="text-sm font-black text-white mt-1 leading-tight flex items-center gap-1.5">
                  {selectedOfficePresence.office.isProvinsi && <span className="text-amber-400">⭐</span>}
                  <span>{selectedOfficePresence.office.namaDinas.replace(/\s*\(kantor pusat\)/gi, '')}</span>
                </h4>
              </div>

              {/* Status Badge */}
              <div
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shrink-0 ${
                  selectedOfficePresence.status === 'ONLINE'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                    : selectedOfficePresence.status === 'BACKGROUND'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    selectedOfficePresence.status === 'ONLINE'
                      ? 'bg-emerald-400 animate-pulse'
                      : selectedOfficePresence.status === 'BACKGROUND'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-600'
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
                <span className={`font-extrabold ${
                  selectedOfficePresence.status === 'ONLINE'
                    ? 'text-emerald-400 font-black'
                    : selectedOfficePresence.status === 'BACKGROUND'
                    ? 'text-amber-300'
                    : 'text-slate-400'
                }`}>
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
                className="mt-2.5 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-black font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-black" />
                <span>Kirim Instruksi Cepat ke Admin Wilayah</span>
              </button>
            )}
          </div>

          {/* SCROLLABLE LIST OF ALL 28 OFFICES */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900 p-1.5 space-y-1">
            {filteredPresenceList.map((item) => {
              const isSelected = item.office.id === selectedOfficeId;
              const isProv = item.office.isProvinsi;
              let dotBg = 'bg-slate-600';

              if (isProv) {
                dotBg = 'bg-amber-400';
              } else if (item.status === 'ONLINE') {
                dotBg = 'bg-emerald-400';
              } else if (item.status === 'BACKGROUND') {
                dotBg = 'bg-amber-400';
              }

              return (
                <button
                  key={item.office.id}
                  type="button"
                  onClick={() => handleSelectOfficeCard(item.office)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-950/50 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotBg} ${
                        item.status !== 'OFFLINE' || isProv ? 'animate-pulse' : ''
                      }`}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? 'text-emerald-300 font-black' : 'text-slate-200'
                          }`}
                        >
                          {item.office.kabKota}
                        </span>
                        {isProv && <span className="text-[10px] text-amber-300">⭐</span>}
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
                          ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                          : item.status === 'BACKGROUND'
                          ? 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                          : 'text-slate-500 bg-slate-900 border border-slate-800'
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
