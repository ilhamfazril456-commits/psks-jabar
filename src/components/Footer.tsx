import React, { useState } from 'react';
import { MapPin, Phone, Mail, Globe, ZoomIn, ZoomOut, ExternalLink, RotateCcw, ShieldCheck, Scale } from 'lucide-react';
import { OfficialPsksLogo } from './OfficialPsksLogo';
import { PrivacyTermsModal } from './PrivacyTermsModal';

interface FooterProps {
  logoUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({ logoUrl }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(17);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);
  const [privacyTermsTab, setPrivacyTermsTab] = useState<'privacy' | 'terms'>('privacy');

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1, 12));
  };

  const handleResetZoom = () => {
    setZoomLevel(17);
  };

  // Google Maps Embed URL with verified official query parameters for Dinas Sosial Provinsi Jawa Barat (Cimahi)
  const iframeSrc = `https://maps.google.com/maps?q=Dinas+Sosial+Provinsi+Jawa+Barat,+Jl.+Jend.+H.+Amir+Machmud+No.331,+Cigugur+Tengah,+Cimahi&t=&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;

  return (
    <footer className="bg-gradient-to-br from-[#043e2e] via-[#054836] to-[#064e3b] text-white border-t-4 border-[#d4af37] pt-10 sm:pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 sm:pb-10 border-b border-white/10">
          {/* Column 1: PSKS Jabar Info (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="flex items-center gap-2.5 h-8 sm:h-9">
              <OfficialPsksLogo logoUrl={logoUrl} sizeClassName="w-7 h-7 sm:w-8 sm:h-8 shrink-0 drop-shadow" />
              <h4 className="text-base sm:text-lg font-bold text-[#d4af37] relative pb-1.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#d4af37] leading-none">
                PSKS JABAR
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
              Potensi dan Sumber Kesejahteraan Sosial (PSKS) Provinsi Jawa Barat merupakan wadah integrasi data dan penguatan 10 pilar sosial kemasyarakatan demi mewujudkan standardisasi kelembagaan, transparansi pendataan terpadu, dan percepatan pelayanan kesejahteraan sosial di 27 Kabupaten/Kota se-Jawa Barat.
            </p>
            <p className="text-xs font-bold text-[#f1c40f]">
              10 Pilar PSKS Tangguh, Jawa Barat Juara Menuju Masyarakat Sejahtera.
            </p>
          </div>

          {/* Column 2: Kontak Informasi (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="flex items-center h-8 sm:h-9">
              <h4 className="text-base sm:text-lg font-bold text-[#d4af37] relative pb-1.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#d4af37] leading-none">
                Kontak Informasi
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200/90">
              <li className="flex gap-2.5 items-start">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>
                  Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522
                </span>
              </li>
              <li className="flex gap-2.5 items-center">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href="tel:0226641564" className="hover:text-amber-200 transition-colors">(022) 6641564</a>
              </li>
              <li className="flex gap-2.5 items-center">
                <Mail className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href="mailto:dinsos@jabarprov.go.id" className="hover:text-amber-200 transition-colors">dinsos@jabarprov.go.id</a>
              </li>
              <li className="flex gap-2.5 items-center">
                <Globe className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href="https://dinsos.jabarprov.go.id" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition-colors">dinsos.jabarprov.go.id</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Interactive Location Map (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between h-8 sm:h-9">
              <h4 className="text-base sm:text-lg font-bold text-[#d4af37] relative pb-1.5 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#d4af37] leading-none">
                Lokasi Kantor Pusat
              </h4>
              <a
                href="https://www.google.com/maps/place/Dinas+Sosial+Provinsi+Jawa+Barat/@-6.8856498,107.5545432,18z"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] sm:text-xs text-[#f1c40f] hover:text-amber-200 hover:underline flex items-center gap-1 font-semibold bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer touch-manipulation shrink-0"
              >
                <span>Buka Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Interactive Map Container */}
            <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border-2 border-[#d4af37]/60 shadow-2xl bg-gradient-to-br from-slate-900 to-emerald-950 group">
              {/* Fallback & Loading Visual (Always Visible immediately to guarantee NO BLACK SCREEN) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 via-[#032e22] to-slate-950 z-0 select-none">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-2 animate-pulse">
                  <MapPin className="w-5 h-5 text-amber-400" />
                </div>
                <h5 className="font-extrabold text-sm text-amber-300 leading-snug">
                  Dinas Sosial Provinsi Jawa Barat
                </h5>
                <p className="text-[11px] text-slate-300 max-w-xs mt-1 leading-relaxed">
                  Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Cimahi
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-black/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <span>GPS: -6.8856, 107.5545</span>
                </div>
              </div>

              {/* Real Google Maps Iframe */}
              <iframe
                key={zoomLevel}
                src={iframeSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps Dinsos Jabar"
                onLoad={() => setIsMapLoaded(true)}
                className={`relative z-1 w-full h-full block transition-opacity duration-500 ${
                  isMapLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Zoom In / Zoom Out Controls (Bottom Right) */}
              <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-lg">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Perbesar (Zoom In)"
                  aria-label="Perbesar Peta"
                  className="p-2 sm:p-1.5 text-slate-200 hover:text-white hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer touch-manipulation"
                >
                  <ZoomIn className="w-4 h-4 text-[#e5c158]" />
                </button>
                <div className="w-full h-[1px] bg-white/10" />
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Perkecil (Zoom Out)"
                  aria-label="Perkecil Peta"
                  className="p-2 sm:p-1.5 text-slate-200 hover:text-white hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer touch-manipulation"
                >
                  <ZoomOut className="w-4 h-4 text-[#e5c158]" />
                </button>
                <div className="w-full h-[1px] bg-white/10" />
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  aria-label="Reset Zoom Peta"
                  className="p-2 sm:p-1.5 text-slate-200 hover:text-white hover:bg-white/20 active:scale-95 rounded-lg transition-colors cursor-pointer touch-manipulation"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#e5c158]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & policy links */}
        <div className="pt-6 flex flex-col items-center justify-center gap-3 text-xs text-slate-300 font-medium border-t border-white/5 mt-4 text-center">
          <div className="text-center">
            &copy; 2026 Dinas Sosial Provinsi Jawa Barat. Hak Cipta Dilindungi Oleh Undang-Undang.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-emerald-200/80">
            <button
              type="button"
              onClick={() => {
                setPrivacyTermsTab('privacy');
                setIsPrivacyTermsOpen(true);
              }}
              className="hover:text-amber-300 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Kebijakan Privasi</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setPrivacyTermsTab('terms');
                setIsPrivacyTermsOpen(true);
              }}
              className="hover:text-amber-300 hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Scale className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Syarat & Ketentuan</span>
            </button>
          </div>
        </div>
      </div>

      <PrivacyTermsModal
        isOpen={isPrivacyTermsOpen}
        onClose={() => setIsPrivacyTermsOpen(false)}
        initialTab={privacyTermsTab}
      />
    </footer>
  );
};


