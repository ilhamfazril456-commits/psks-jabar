import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  ExternalLink,
  Phone,
  Mail,
  Copy,
  Check,
  Building2,
  Navigation,
  Compass,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  Filter,
  CheckCircle2,
  Share2,
  Info,
  ShieldCheck,
  ChevronRight,
  Map as MapIcon,
  Grid,
  Clock
} from 'lucide-react';
import { DINSOS_GEO_OFFICES, DinsosGeoOffice } from '../data/dinsosGeoOfficesData';

interface DinsosOfficesMapDirectoryProps {
  onSelectOffice?: (office: DinsosGeoOffice) => void;
  className?: string;
}

export const DinsosOfficesMapDirectory: React.FC<DinsosOfficesMapDirectoryProps> = ({
  onSelectOffice,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Provinsi' | 'Kabupaten' | 'Kota'>('all');
  const [selectedRayon, setSelectedRayon] = useState<string>('all');
  const [activeOfficeId, setActiveOfficeId] = useState<string>('provinsi_jabar');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  // Available unique Rayons
  const rayons = useMemo(() => {
    const set = new Set<string>();
    DINSOS_GEO_OFFICES.forEach((o) => {
      if (o.wilayahRayon) set.add(o.wilayahRayon);
    });
    return Array.from(set).sort();
  }, []);

  // Filtered offices based on search & filters
  const filteredOffices = useMemo(() => {
    return DINSOS_GEO_OFFICES.filter((office) => {
      // Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'Provinsi' && !office.isProvinsi) return false;
        if (selectedType === 'Kabupaten' && office.type !== 'Kabupaten') return false;
        if (selectedType === 'Kota' && office.type !== 'Kota') return false;
      }

      // Rayon filter
      if (selectedRayon !== 'all' && office.wilayahRayon !== selectedRayon) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = office.namaDinas.toLowerCase().includes(q);
        const matchKab = office.kabKota.toLowerCase().includes(q);
        const matchAddr = office.alamat.toLowerCase().includes(q);
        const matchRayon = office.wilayahRayon.toLowerCase().includes(q);
        if (!matchName && !matchKab && !matchAddr && !matchRayon) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedType, selectedRayon]);

  // Featured flagship office (Kantor Provinsi Jawa Barat)
  const provinsiOffice = useMemo(() => {
    return DINSOS_GEO_OFFICES.find((o) => o.isProvinsi) || DINSOS_GEO_OFFICES[0];
  }, []);

  // Copy address to clipboard
  const handleCopyAddress = (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Fly to office on map
  const flyToOffice = (office: DinsosGeoOffice, zoomLevel = 14, scrollMap = true) => {
    setActiveOfficeId(office.id);
    onSelectOffice?.(office);

    if (viewMode === 'grid') {
      setViewMode('map');
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([office.lat, office.lng], zoomLevel, {
        duration: 1.2,
        easeLinearity: 0.25,
      });

      // Open marker popup after flight
      const marker = markersRef.current[office.id];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 600);
      }
    }

    if (scrollMap) {
      const mapEl = document.getElementById('dinsos-interactive-map-anchor');
      if (mapEl) {
        const rect = mapEl.getBoundingClientRect();
        const offset = 80;
        const targetY = window.pageYOffset + rect.top - offset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }
  };

  // Reset map view to show all of West Java
  const handleResetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-6.92, 107.61], 8.5, {
        duration: 1.2,
      });
    }
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // West Java default Center & bounds
    const defaultCenter: [number, number] = [-6.9147, 107.6098];
    const initialZoom = 8.5;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: initialZoom,
      minZoom: 7,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom lightweight Leaflet zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap light clean tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors & Dinsos Jabar',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Fix map sizing after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers when filteredOffices or activeOfficeId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });
    markersRef.current = {};

    DINSOS_GEO_OFFICES.forEach((office) => {
      const isProv = office.isProvinsi;
      const isSelected = office.id === activeOfficeId;

      // Custom SVG DivIcon
      const iconHtml = isProv
        ? `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-10 h-10 bg-amber-400/40 rounded-full animate-ping"></div>
            <div class="relative z-10 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-300 border-2 border-white shadow-xl flex items-center justify-center transform hover:scale-125 transition-transform duration-200">
              <svg class="w-5 h-5 text-slate-950 font-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div class="absolute -bottom-1 w-2.5 h-2.5 bg-amber-600 rotate-45 border-r border-b border-white"></div>
          </div>
        `
        : `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="relative z-10 w-7 h-7 rounded-full ${
              isSelected
                ? 'bg-gradient-to-tr from-emerald-700 to-teal-400 border-2 border-amber-300 scale-125 shadow-lg'
                : 'bg-gradient-to-tr from-[#0f2b5c] to-blue-600 border border-white shadow-md'
            } flex items-center justify-center transform hover:scale-125 transition-transform duration-200">
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div class="absolute -bottom-0.5 w-1.5 h-1.5 ${isSelected ? 'bg-emerald-700' : 'bg-[#0f2b5c]'} rotate-45"></div>
          </div>
        `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'dinsos-custom-marker',
        iconSize: isProv ? [40, 40] : [30, 30],
        iconAnchor: isProv ? [20, 38] : [15, 28],
        popupAnchor: [0, isProv ? -36 : -26],
      });

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 240px; max-width: 290px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; ${
              isProv
                ? 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;'
                : 'background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'
            }">
              ${isProv ? '⭐ Kantor Provinsi (Pusat)' : office.type + ' • ' + office.wilayahRayon}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 800; color: #0f172a; line-height: 1.3;">
            ${office.namaDinas}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569; line-height: 1.4;">
            📍 ${office.alamat}
          </p>
          <p style="margin: 0 0 6px 0; font-size: 10px; color: #0369a1; font-weight: 700; font-family: monospace;">
            🌐 GPS: ${office.lat.toFixed(5)}, ${office.lng.toFixed(5)}
          </p>
          <div style="margin-bottom: 8px; font-size: 11px; color: #0f172a; font-weight: 600;">
            📞 <a href="tel:${office.telepon.replace(/[^0-9+]/g, '')}" style="color: #0284c7; text-decoration: none;">${office.telepon}</a>
          </div>
          <div style="display: flex; gap: 6px;">
            <a href="${office.googleMapsUrl}" target="_blank" rel="noreferrer" 
               style="flex: 1; text-align: center; background: #043e2e; color: #ffffff; padding: 6px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
              <span>Rute Google Maps</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([office.lat, office.lng], { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'dinsos-leaflet-popup',
      });

      marker.on('click', () => {
        setActiveOfficeId(office.id);
        onSelectOffice?.(office);
      });

      markersRef.current[office.id] = marker;
    });
  }, [activeOfficeId, onSelectOffice]);

  return (
    <div id="section-lokasi-kantor" className={`w-full ${className}`}>
      {/* SECTION HEADER CARD */}
      <div className="bg-gradient-to-br from-[#0f2b5c] via-[#143b7d] to-[#043e2e] text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl border-2 border-[#d4af37]/40 relative overflow-hidden mb-6 sm:mb-8">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-200 text-xs font-black px-3.5 py-1.5 rounded-full border border-amber-300/40 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>JARINGAN RESMI 28 KANTOR DINAS SOSIAL SE-JAWA BARAT</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">
            Lokasi & Kantor Wilayah
          </h2>

          <p className="text-white/85 text-xs sm:text-sm lg:text-base leading-relaxed font-normal mb-5 max-w-3xl">
            Peta interaktif dan direktori alamat resmi <strong>1 Kantor Dinas Sosial Provinsi Jawa Barat</strong> (Pusat) serta <strong>27 Kantor Dinas Sosial Kabupaten/Kota</strong> yang tersebar di seluruh wilayah Jawa Barat, lengkap dengan titik koordinat presisi, nomor telepon, dan rute navigasi Google Maps.
          </p>

          {/* QUICK STATS COUNTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-200">28</div>
                <div className="text-[10px] sm:text-xs text-white/80 font-bold leading-tight">Total Kantor Layanan</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-200">1</div>
                <div className="text-[10px] sm:text-xs text-white/80 font-bold leading-tight">Kantor Dinsos Prov</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-400/20 border border-blue-300/40 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-blue-200">18</div>
                <div className="text-[10px] sm:text-xs text-white/80 font-bold leading-tight">Dinsos Kabupaten</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-400/20 border border-purple-300/40 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-purple-200">9</div>
                <div className="text-[10px] sm:text-xs text-white/80 font-bold leading-tight">Dinsos Kota</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURED FLAGSHIP HERO CARD: KANTOR PROVINSI JAWA BARAT */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 rounded-3xl p-1 border-2 border-[#d4af37] shadow-lg mb-6 sm:mb-8">
        <div className="bg-white rounded-[22px] p-4 sm:p-6 lg:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                ⭐ KANTOR PUSAT / MARKAS UTAMA
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full">
                Tingkat Pemerintah Provinsi Jawa Barat
              </span>
              <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                Wilayah Bandung Raya
              </span>
            </div>

            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 leading-snug">
              {provinsiOffice.namaDinas}
            </h3>

            <div className="space-y-1 text-xs sm:text-sm text-slate-600 font-medium">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Alamat:</strong> {provinsiOffice.alamat}
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    <strong>Telepon / Hotline:</strong>{' '}
                    <a href={`tel:${provinsiOffice.telepon.replace(/[^0-9+]/g, '')}`} className="text-blue-700 hover:underline">
                      {provinsiOffice.telepon}
                    </a>
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Jam Pelayanan:</strong> Senin – Jumat, 08:00 – 16:00 WIB
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Titik GPS Presisi:</strong>{' '}
                    <code className="bg-slate-100 text-slate-800 font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-slate-200">
                      {provinsiOffice.lat.toFixed(5)}, {provinsiOffice.lng.toFixed(5)}
                    </code>
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS FOR PROVINSI */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
            <button
              onClick={() => flyToOffice(provinsiOffice, 15)}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-white font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>Fokus di Peta</span>
            </button>

            <a
              href={provinsiOffice.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              <span>Rute Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              onClick={(e) => handleCopyAddress(provinsiOffice.id, provinsiOffice.alamat, e)}
              className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              title="Salin Alamat Lengkap"
            >
              {copiedId === provinsiOffice.id ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-black">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Salin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-200 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama kantor, wilayah kab/kota, atau alamat..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* VIEW SWITCHER & RESET MAP */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white text-emerald-900 shadow-xs border border-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Peta Interaktif</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-900 shadow-xs border border-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Daftar Kartu (28)</span>
              </button>
            </div>

            <button
              onClick={handleResetMapView}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors border border-slate-200 cursor-pointer"
              title="Reset Tampilan Peta se-Jawa Barat"
            >
              <Compass className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
        </div>

        {/* TABS & RAYON FILTERS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* TYPE FILTER PILLS */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Tipe:
            </span>
            {[
              { id: 'all', label: `Semua (${DINSOS_GEO_OFFICES.length})` },
              { id: 'Provinsi', label: 'Provinsi (1)' },
              { id: 'Kabupaten', label: 'Kabupaten (18)' },
              { id: 'Kota', label: 'Kota (9)' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id as any)}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-gradient-to-r from-[#043e2e] to-[#0f2b5c] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* RAYON DROPDOWN / SELECTOR */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Rayon Wilayah:</span>
            <select
              value={selectedRayon}
              onChange={(e) => setSelectedRayon(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="all">Semua Rayon Jabar</option>
              {rayons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: INTERACTIVE SPLIT MAP VIEW */}
      {viewMode === 'map' && (
        <div id="dinsos-interactive-map-anchor" className="space-y-6">
          {/* MAP & SIDEBAR CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEAFLET INTERACTIVE MAP CANVAS (8 COLS ON DESKTOP) */}
            <div className="lg:col-span-8 bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-emerald-950/10 relative">
              {/* Map Floating Header */}
              <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-slate-200 flex items-center gap-2.5 pointer-events-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-slate-800">
                  {filteredOffices.length} Titik Lokasi Kantor Ditampilkan
                </span>
              </div>

              {/* Map Canvas */}
              <div
                ref={mapContainerRef}
                className="w-full h-[430px] sm:h-[500px] lg:h-[580px] z-0"
                style={{ background: '#e2e8f0' }}
              />

              {/* Map Floating Legend */}
              <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-md border border-slate-200 text-[10.5px] font-bold text-slate-700 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white" />
                  <span>Kantor Dinsos Prov</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#0f2b5c] border border-white" />
                  <span>Dinsos Kab / Kota</span>
                </div>
              </div>
            </div>

            {/* QUICK SELECTION LIST (4 COLS ON DESKTOP) */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200 flex flex-col h-[500px] lg:h-[580px]">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900">Daftar Kantor Wilayah</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Klik kantor untuk fokuskan peta & buka rute
                  </p>
                </div>
                <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {filteredOffices.length} Kantor
                </span>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
                {filteredOffices.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-bold">Tidak ada kantor yang sesuai filter.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedType('all');
                        setSelectedRayon('all');
                      }}
                      className="mt-2 text-xs font-extrabold text-emerald-700 underline cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  filteredOffices.map((office, idx) => {
                    const isActive = office.id === activeOfficeId;
                    return (
                      <div
                        key={office.id}
                        onClick={() => flyToOffice(office, 14, false)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                          isActive
                            ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                            : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              office.isProvinsi
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {office.isProvinsi ? '⭐ PROVINSI' : office.kabKota}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {office.wilayahRayon}
                          </span>
                        </div>

                        <h5
                          className={`text-xs font-black leading-tight line-clamp-1 ${
                            isActive ? 'text-emerald-950' : 'text-slate-900 group-hover:text-emerald-800'
                          }`}
                        >
                          {office.namaDinas}
                        </h5>

                        <p className="text-[10.5px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                          {office.alamat}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[10.5px]">
                          <span className="text-slate-600 font-bold truncate max-w-[130px]">
                            📞 {office.telepon}
                          </span>
                          <div className="flex items-center gap-1 text-emerald-700 font-black">
                            <span>Peta</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2 OR ACCORDION GRID OF ALL 28 OFFICE CARDS */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Direktori Lengkap Seluruh Kantor ({filteredOffices.length} Kantor)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Informasi kontak, rute terverifikasi, dan navigasi instan
            </p>
          </div>
          <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Menampilkan {filteredOffices.length} dari 28 Kantor
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredOffices.map((office, idx) => {
            const isProv = office.isProvinsi;
            return (
              <div
                key={office.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col justify-between shadow-xs hover:shadow-lg relative overflow-hidden group ${
                  isProv
                    ? 'border-[#d4af37] bg-gradient-to-b from-amber-50/30 to-white'
                    : 'border-slate-200/90 hover:border-emerald-600/60'
                }`}
              >
                {/* Top badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isProv
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isProv ? '⭐ PROVINSI' : office.type}
                    </span>
                    <span className="text-[10.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {office.wilayahRayon}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-900 transition-colors leading-snug mb-2">
                    {office.namaDinas}
                  </h4>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 font-normal">
                    <p className="flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{office.alamat}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <a href={`tel:${office.telepon.replace(/[^0-9+]/g, '')}`} className="text-blue-700 hover:underline font-bold">
                        {office.telepon}
                      </a>
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Compass className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>
                        GPS:{' '}
                        <code className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                          {office.lat.toFixed(5)}, {office.lng.toFixed(5)}
                        </code>
                      </span>
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto">
                  <button
                    onClick={() => flyToOffice(office, 15)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[11px] shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-amber-300" />
                    <span>Lihat di Peta</span>
                  </button>

                  <a
                    href={office.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-[#d4af37] hover:bg-amber-500 text-slate-950 font-black text-[11px] shadow-xs active:scale-95 transition-all"
                    title="Buka Rute di Google Maps"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Maps</span>
                  </a>

                  <button
                    onClick={(e) => handleCopyAddress(office.id, office.alamat, e)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                    title="Salin Alamat"
                  >
                    {copiedId === office.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
