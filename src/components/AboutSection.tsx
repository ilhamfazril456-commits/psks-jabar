import React, { useState, useEffect, useRef } from 'react';
import { Target, Rocket, Users, BarChart3, ShieldCheck, Zap, Shield, Sparkles, Building2, Layers } from 'lucide-react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  trigger: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 1200,
  prefix = '',
  suffix = '',
  trigger,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // If element is not intersecting / out of view, reset counter to 0 so it replays upon re-entry
    if (!trigger) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Cubic ease-out: snappy acceleration at start, ultra-smooth deceleration into final value
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easedProgress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setCount(end); // Ensure exact end integer on finish
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration, trigger]);

  return (
    <span>
      {prefix}
      {count.toLocaleString('id-ID')}
      {suffix}
    </span>
  );
};

export const AboutSection: React.FC = () => {
  const [metricsVisible, setMetricsVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const metricsRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Bidirectional Observer for 4 Metric Cards:
    // Triggers counting animation EVERY time user scrolls into view (from top-down OR bottom-up)
    const metricsObserver = new IntersectionObserver(
      ([entry]) => {
        setMetricsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    // Bidirectional Observer for Narrative Text:
    const textObserver = new IntersectionObserver(
      ([entry]) => {
        setTextVisible(entry.isIntersecting);
      },
      { threshold: 0.12 }
    );

    if (metricsRef.current) metricsObserver.observe(metricsRef.current);
    if (textRef.current) textObserver.observe(textRef.current);

    return () => {
      metricsObserver.disconnect();
      textObserver.disconnect();
    };
  }, []);

  return (
    <section id="tentang-psks" className="py-10 sm:py-16 lg:py-20 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200 overflow-hidden relative">
      {/* Subtle Atmospheric Grid & Ambient Depth (Zero AI-slop, pure executive aesthetic) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden select-none">
        <div className="absolute top-10 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-40 -right-20 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* TOP ROW: NARRATIVE (DESKRIPSI WEBSITE) & VISI-MISI RESMI                   */}
        {/* ========================================================================= */}
        <div ref={textRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: DESKRIPSI WEBSITE DENGAN ANIMASI HALUS & BERKELAS */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5">
            
            {/* Kicker Tagline */}
            <div
              className={`flex items-center gap-2 transition-all duration-700 ease-out transform ${
                textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <span className="w-6 h-0.5 bg-gradient-to-r from-[#d4af37] to-amber-500 rounded-full" />
              <span className="text-[#0f2b5c] font-black text-[11px] sm:text-xs uppercase tracking-widest">
                Profil Resmi Dinas Sosial Provinsi Jawa Barat
              </span>
            </div>

            {/* Main Heading */}
            <h2
              className={`text-2xl sm:text-4xl lg:text-[40px] font-black text-[#0f2b5c] leading-[1.18] tracking-tight transition-all duration-700 delay-100 ease-out transform ${
                textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Pilar Kekuatan Sosial <br />
              <span className="bg-gradient-to-r from-[#0f2b5c] via-[#1a4a9c] to-[#0f2b5c] bg-clip-text text-transparent font-extrabold text-xl sm:text-3xl block mt-1.5">
                Mewujudkan Jabar Juara Lahir Batin
              </span>
            </h2>

            {/* Paragraph 1: Pengertian PSKS */}
            <p
              className={`text-slate-700 leading-relaxed text-xs sm:text-base font-normal transition-all duration-700 delay-200 ease-out transform ${
                textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <strong className="text-[#0f2b5c] font-black">Potensi dan Sumber Kesejahteraan Sosial (PSKS)</strong> adalah perseorangan, keluarga, kelompok, dan/atau masyarakat yang berperan serta menjaga, menciptakan, mendukung, dan memperkuat penyelenggaraan kesejahteraan sosial di seluruh penjuru Tanah Pasundan.
            </p>

            {/* Paragraph 2: Integrasi Satu Data Dinsos Jabar */}
            <p
              className={`text-slate-600 leading-relaxed text-xs sm:text-base font-normal transition-all duration-700 delay-300 ease-out transform ${
                textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Melalui integrasi satu pintu ini, Dinas Sosial Provinsi Jawa Barat berkomitmen merangkum seluruh potensi dan memperkuat kapasitas para pejuang sosial di 27 Kabupaten/Kota demi terwujudnya sistem perlindungan, rehabilitasi, dan pemberdayaan sosial yang adaptif, transparan, serta tepat sasaran.
            </p>

            {/* 3 Indikator Keunggulan Layanan (Editorial Bullet Badges - Zero Pill AI Slop) */}
            <div
              className={`pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 transition-all duration-700 delay-400 ease-out transform ${
                textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-[#0f2b5c] leading-tight">Perlindungan</div>
                  <div className="text-[9.5px] text-slate-500 font-medium truncate">Linjamsos Adaptif</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-[#0f2b5c] leading-tight">Pemberdayaan</div>
                  <div className="text-[9.5px] text-slate-500 font-medium truncate">10 Pilar Mandiri</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-[#0f2b5c] leading-tight">Satu Data</div>
                  <div className="text-[9.5px] text-slate-500 font-medium truncate">27 Wilayah Riil</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: KARTU VISI & MISI RESMI (EXECUTIVE SUMMARY CARD) */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            
            {/* VISI CARD */}
            <div
              className={`group relative bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-l-4 border-l-[#d4af37] ${
                textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '250ms' }}
            >
              <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/20 transition-all duration-500 pointer-events-none" />

              <div className="relative flex gap-3.5 sm:gap-4 items-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 to-[#d4af37] text-slate-950 flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-sm sm:text-lg text-[#0f2b5c] tracking-tight">
                      Visi Utama
                    </h3>
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 tracking-wider uppercase">
                      Landasan Strategis
                    </span>
                  </div>
                  <p className="text-[11.5px] sm:text-sm text-slate-600 font-normal leading-relaxed pt-0.5">
                    Terwujudnya standardisasi, transparansi, dan integrasi data pilar-pilar sosial yang responsif demi percepatan penyelenggaraan kesejahteraan sosial di Jawa Barat.
                  </p>
                </div>
              </div>
            </div>

            {/* MISI CARD */}
            <div
              className={`group relative bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-l-4 border-l-[#0f2b5c] ${
                textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '400ms' }}
            >
              <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-blue-600/10 rounded-full blur-xl group-hover:bg-blue-600/20 transition-all duration-500 pointer-events-none" />

              <div className="relative flex gap-3.5 sm:gap-4 items-start">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#0f2b5c] to-[#1a4a9c] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                  <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-[#ffd700]" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-sm sm:text-lg text-[#0f2b5c] tracking-tight">
                      Misi Strategis
                    </h3>
                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 tracking-wider uppercase">
                      Akselerasi Nyata
                    </span>
                  </div>
                  <p className="text-[11.5px] sm:text-sm text-slate-600 font-normal leading-relaxed pt-0.5">
                    Mengembangkan kapasitas SDM pilar sosial, memfasilitasi kemitraan lintas sektor, serta mengoptimalkan pendayagunaan potensi lokal berbasis Satu Data Terpadu.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ROW: 4 KOTAK MATRIKS DENGAN ANIMASI SCROLL RE-TRIGGER DUA ARAH     */}
        {/* SUBTEKS 100% DIPERTAHANKAN SESUAI PERMINTAAN USER                         */}
        {/* ========================================================================= */}
        <div
          ref={metricsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 mt-10 sm:mt-14 pt-8 sm:pt-10 border-t border-slate-200"
        >
          {/* KOTAK 1: 27 Kabupaten / Kota Terintegrasi */}
          <div className="group relative bg-gradient-to-br from-[#0f2b5c] via-[#123673] to-[#0a1e42] text-white p-3.5 sm:p-5 lg:p-6 rounded-2xl text-center border border-blue-400/30 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between select-none">
            {/* Background Ambient Glow */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#d4af37]/15 rounded-full blur-xl group-hover:bg-[#d4af37]/30 transition-all duration-300 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Icon */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f3d978] group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300 shadow-xs">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            {/* Number Counter */}
            <div className="text-2xl sm:text-4xl lg:text-[42px] font-black text-[#f3d978] my-0.5 sm:my-1 tracking-tight leading-none drop-shadow-xs">
              <AnimatedCounter end={27} duration={1200} trigger={metricsVisible} />
            </div>

            {/* Subteks 100% Asli */}
            <div className="text-[9.5px] sm:text-xs uppercase tracking-wider font-semibold text-blue-100/90 pt-2 sm:pt-2.5 border-t border-white/10 leading-tight">
              Kabupaten / Kota Terintegrasi
            </div>
          </div>

          {/* KOTAK 2: 10 Pilar Utama PSKS Jabar */}
          <div className="group relative bg-gradient-to-br from-[#0f2b5c] via-[#123673] to-[#0a1e42] text-white p-3.5 sm:p-5 lg:p-6 rounded-2xl text-center border border-blue-400/30 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between select-none">
            {/* Background Ambient Glow */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#d4af37]/15 rounded-full blur-xl group-hover:bg-[#d4af37]/30 transition-all duration-300 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Icon */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f3d978] group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300 shadow-xs">
              <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            {/* Number Counter */}
            <div className="text-2xl sm:text-4xl lg:text-[42px] font-black text-[#f3d978] my-0.5 sm:my-1 tracking-tight leading-none drop-shadow-xs">
              <AnimatedCounter end={10} duration={1200} trigger={metricsVisible} />
            </div>

            {/* Subteks 100% Asli */}
            <div className="text-[9.5px] sm:text-xs uppercase tracking-wider font-semibold text-blue-100/90 pt-2 sm:pt-2.5 border-t border-white/10 leading-tight">
              Pilar Utama PSKS Jabar
            </div>
          </div>

          {/* KOTAK 3: 100% Akurasi Data Lapangan */}
          <div className="group relative bg-gradient-to-br from-[#0f2b5c] via-[#123673] to-[#0a1e42] text-white p-3.5 sm:p-5 lg:p-6 rounded-2xl text-center border border-blue-400/30 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between select-none">
            {/* Background Ambient Glow */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#d4af37]/15 rounded-full blur-xl group-hover:bg-[#d4af37]/30 transition-all duration-300 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Icon */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f3d978] group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300 shadow-xs">
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>

            {/* Number Counter */}
            <div className="text-2xl sm:text-4xl lg:text-[42px] font-black text-[#f3d978] my-0.5 sm:my-1 tracking-tight leading-none drop-shadow-xs">
              <AnimatedCounter end={100} duration={1200} suffix="%" trigger={metricsVisible} />
            </div>

            {/* Subteks 100% Asli */}
            <div className="text-[9.5px] sm:text-xs uppercase tracking-wider font-semibold text-blue-100/90 pt-2 sm:pt-2.5 border-t border-white/10 leading-tight">
              Akurasi Data Lapangan
            </div>
          </div>

          {/* KOTAK 4: Real-Time Sistem Pelaporan Mandiri */}
          <div className="group relative bg-gradient-to-br from-[#0f2b5c] via-[#123673] to-[#0a1e42] text-white p-3.5 sm:p-5 lg:p-6 rounded-2xl text-center border border-blue-400/30 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col justify-between select-none">
            {/* Background Ambient Glow */}
            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#d4af37]/15 rounded-full blur-xl group-hover:bg-[#d4af37]/30 transition-all duration-300 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

            {/* Icon dengan Live Indicator Pulse */}
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-1.5 sm:mb-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f3d978] group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300 shadow-xs">
              <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            {/* Real-Time Label */}
            <div className="text-xl sm:text-3xl lg:text-[34px] font-black text-[#f3d978] my-0.5 sm:my-1 tracking-tight leading-none flex items-center justify-center gap-1.5 drop-shadow-xs">
              <span className={`transition-all duration-500 transform ${metricsVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}>
                Real-Time
              </span>
            </div>

            {/* Subteks 100% Asli */}
            <div className="text-[9.5px] sm:text-xs uppercase tracking-wider font-semibold text-blue-100/90 pt-2 sm:pt-2.5 border-t border-white/10 leading-tight">
              Sistem Pelaporan Mandiri
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
