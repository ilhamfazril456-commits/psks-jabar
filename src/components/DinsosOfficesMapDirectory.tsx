import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Clock,
  Globe2,
  X,
  ChevronDown,
  ArrowRight,
  Eye,
  RefreshCw
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'Provinsi' | 'Kabupaten' | 'Kota'>('all');
  const [selectedRayon, setSelectedRayon] = useState<string>('all');
  const [activeOfficeId, setActiveOfficeId] = useState<string>('provinsi_jabar');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [isFullScreenModal, setIsFullScreenModal] = useState(false);

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

  // Currently active selected office
  const activeOffice = useMemo(() => {
    return DINSOS_GEO_OFFICES.find((o) => o.id === activeOfficeId) || provinsiOffice;
  }, [activeOfficeId, provinsiOffice]);

  // Handle office switch with loading transition
  const handleSelectOffice = (office: DinsosGeoOffice, shouldScroll = false) => {
    if (office.id === activeOfficeId && !shouldScroll) return;
    setIsIframeLoading(true);
    setActiveOfficeId(office.id);
    onSelectOffice?.(office);

    if (shouldScroll) {
      const mapEl = document.getElementById('dinsos-precision-map-anchor');
      if (mapEl) {
        const rect = mapEl.getBoundingClientRect();
        const offset = 80;
        const targetY = window.pageYOffset + rect.top - offset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }

    setTimeout(() => {
      setIsIframeLoading(false);
    }, 450);
  };

  // Copy address to clipboard
  const handleCopyAddress = (id: string, text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Build high precision Google Maps embed query URL
  const googleEmbedUrl = useMemo(() => {
    const query = activeOffice.googlePlaceQuery || `${activeOffice.namaDinas} ${activeOffice.alamat}`;
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=id&z=17&output=embed`;
  }, [activeOffice]);

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
            Peta Presisi & Lokasi Kantor Wilayah
          </h2>

          <p className="text-white/85 text-xs sm:text-sm lg:text-base leading-relaxed font-normal mb-5 max-w-3xl">
            Sistem peta terpadu resmi <strong>Google Maps</strong> dengan akurasi 100% tepat di titik gedung kantor. Pilih kota/kabupaten tujuan Anda melalui menu filter di bawah untuk langsung menampilkan navigasi presisi, nomor telepon dinas, dan alamat terverifikasi.
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

      {/* FILTER & OFFICE SELECTOR CONTROL BAR */}
      <div id="dinsos-precision-map-anchor" className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-slate-200 mb-6 space-y-4">
        {/* TOP SELECTOR: INSTANT DROPDOWN SELECTOR & SEARCH */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* PRIMARY DROPDOWN (7 COLS ON DESKTOP) */}
          <div className="md:col-span-7">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pilih Kantor / Kota Tujuan (Peta Otomatis Menyesuaikan):</span>
            </label>
            <div className="relative">
              <select
                value={activeOfficeId}
                onChange={(e) => {
                  const found = DINSOS_GEO_OFFICES.find((o) => o.id === e.target.value);
                  if (found) handleSelectOffice(found, true);
                }}
                className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border-2 border-emerald-600/60 focus:border-emerald-700 rounded-2xl py-3 pl-4 pr-10 text-xs sm:text-sm font-black text-slate-900 shadow-xs focus:outline-none transition-all cursor-pointer"
              >
                <optgroup label="⭐ KANTOR PROVINSI">
                  <option value={provinsiOffice.id}>
                    ⭐ {provinsiOffice.namaDinas} ({provinsiOffice.kabKota})
                  </option>
                </optgroup>
                <optgroup label="🏛️ KANTOR DINAS SOSIAL KABUPATEN & KOTA (27 DAERAH)">
                  {DINSOS_GEO_OFFICES.filter((o) => !o.isProvinsi).map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.type === 'Kota' ? '🏙️' : '🏞️'} {office.namaDinas} — {office.kabKota} ({office.wilayahRayon})
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-800">
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* SEARCH BOX (5 COLS ON DESKTOP) */}
          <div className="md:col-span-5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Cari Nama Daerah / Alamat:</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama kota, kabupaten, atau dinas..."
                className="w-full pl-10 pr-9 py-3 rounded-2xl bg-slate-50 border-2 border-slate-300 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SECONDARY ROW: FILTER PILLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
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
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-gradient-to-r from-[#043e2e] to-[#0f2b5c] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* RAYON DROPDOWN */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Rayon Wilayah:</span>
            <select
              value={selectedRayon}
              onChange={(e) => setSelectedRayon(e.target.value)}
              className="text-xs font-bold bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">Semua Rayon Jabar ({DINSOS_GEO_OFFICES.length})</option>
              {rayons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MAIN VIEW: 1 DYNAMIC GOOGLE MAPS LIVE VIEWER + INTERACTIVE OFFICE LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mb-8">
        {/* 1 GOOGLE MAPS PRESISI VIEWER (8 COLS ON DESKTOP) */}
        <div className="lg:col-span-8 bg-white rounded-3xl overflow-hidden shadow-xl border-2 border-emerald-950/15 flex flex-col">
          {/* MAP HEADER BAR WITH ACTIVE OFFICE INFO & QUICK ACTIONS */}
          <div className="bg-gradient-to-r from-[#0f2b5c] via-[#143b7d] to-[#043e2e] text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shrink-0">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Globe2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span
                    className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      activeOffice.isProvinsi
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {activeOffice.isProvinsi ? '⭐ KANTOR PROVINSI' : activeOffice.type}
                  </span>
                  <span className="text-[10.5px] text-white/80 font-bold">
                    {activeOffice.wilayahRayon}
                  </span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300 shrink-0" />
                    100% Presisi Resmi Google Maps
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white truncate leading-tight">
                  {activeOffice.namaDinas}
                </h3>
              </div>
            </div>

            {/* ACTION BUTTONS ON HEADER */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsFullScreenModal(true)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
                title="Perbesar Layar Peta"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Perbesar</span>
              </button>

              <a
                href={activeOffice.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#d4af37] hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Buka Navigasi Rute di Aplikasi Google Maps"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Rute GPS</span>
                <ExternalLink className="w-3 h-3 opacity-75" />
              </a>
            </div>
          </div>

          {/* ACTIVE MAP LIVE IFRAME CONTAINER */}
          <div className="relative w-full h-[450px] sm:h-[520px] lg:h-[600px] bg-slate-100">
            {isIframeLoading && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 text-emerald-700 animate-spin" />
                <span className="text-xs font-black text-slate-800">Menyiapkan Titik Presisi...</span>
              </div>
            )}

            <iframe
              key={activeOffice.id}
              title={`Google Maps Resmi - ${activeOffice.namaDinas}`}
              src={googleEmbedUrl}
              className="w-full h-full border-0 absolute inset-0"
              allowFullScreen
              loading="lazy"
            />
          </div>

          {/* MAP BOTTOM DETAIL BAR */}
          <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start sm:items-center gap-2 text-slate-700 min-w-0 flex-1">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <span className="font-bold text-slate-900 block sm:inline">Alamat Resmi: </span>
                <span className="font-medium text-slate-700 text-xs">{activeOffice.alamat}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <a
                href={`tel:${activeOffice.telepon.replace(/[^0-9+]/g, '')}`}
                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 font-extrabold text-xs flex items-center gap-1.5 border border-blue-200 transition-colors"
                title="Hubungi Telepon Kantor"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>{activeOffice.telepon}</span>
              </a>

              <button
                onClick={(e) => handleCopyAddress(activeOffice.id, activeOffice.alamat, e)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-slate-200"
                title="Salin Alamat Lengkap"
              >
                {copiedId === activeOffice.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-black">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* INTERACTIVE OFFICE LIST SIDEBAR (4 COLS ON DESKTOP) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-5 shadow-xl border-2 border-slate-200 flex flex-col h-[520px] lg:h-[685px]">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h4 className="font-black text-sm text-slate-900">Daftar Kantor Wilayah</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Klik salah satu kantor untuk mengganti peta seketika
              </p>
            </div>
            <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
              {filteredOffices.length} Kantor
            </span>
          </div>

          {/* SCROLLABLE LIST */}
          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
            {filteredOffices.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-xs font-bold">Tidak ada kantor yang sesuai kriteria.</p>
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
              filteredOffices.map((office) => {
                const isActive = office.id === activeOfficeId;
                return (
                  <div
                    key={office.id}
                    onClick={() => handleSelectOffice(office, false)}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                      isActive
                        ? 'bg-emerald-50/95 border-emerald-600 shadow-sm ring-1 ring-emerald-600/30'
                        : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span
                        className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md ${
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
                        isActive ? 'text-emerald-950 font-black' : 'text-slate-900 group-hover:text-emerald-800'
                      }`}
                    >
                      {office.namaDinas}
                    </h5>

                    <p className="text-[10.5px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                      {office.alamat}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/70 text-[10.5px]">
                      <span
                        className={`inline-flex items-center gap-1 font-extrabold ${
                          isActive ? 'text-emerald-800' : 'text-blue-700 group-hover:underline'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sedang Ditampilkan</span>
                          </>
                        ) : (
                          <>
                            <Globe2 className="w-3 h-3 text-blue-600" />
                            <span>Tampilkan di Peta</span>
                          </>
                        )}
                      </span>

                      <span className="text-slate-400 group-hover:text-emerald-700 font-bold flex items-center">
                        Pilih <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN POPUP MODAL FOR GOOGLE MAPS */}
      {isFullScreenModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0f2b5c] to-[#043e2e] text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Globe2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      {activeOffice.isProvinsi ? '⭐ KANTOR PROVINSI' : activeOffice.type}
                    </span>
                    <span className="text-[11px] text-white/80 font-bold">
                      {activeOffice.wilayahRayon}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    {activeOffice.namaDinas}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeOffice.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#d4af37] hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rute Google Maps</span>
                </a>
                <button
                  onClick={() => setIsFullScreenModal(false)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Tutup Jendela"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Address Strip */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="line-clamp-1">{activeOffice.alamat}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <a href={`tel:${activeOffice.telepon.replace(/[^0-9+]/g, '')}`} className="font-bold text-blue-700 hover:underline">
                  {activeOffice.telepon}
                </a>
              </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 bg-slate-100 relative min-h-0">
              <iframe
                title={`Google Maps Layar Penuh - ${activeOffice.namaDinas}`}
                src={googleEmbedUrl}
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
