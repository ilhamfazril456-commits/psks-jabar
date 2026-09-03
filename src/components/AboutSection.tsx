import React, { useState, useEffect, useRef } from 'react';
import { Target, Rocket, Users, BarChart3, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  trigger: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 1400,
  prefix = '',
  suffix = '',
  trigger,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Quad ease-out formula for fast initial start decelerating smoothly to end
      const easedProgress = 1 - Math.pow(1 - progress, 2);
      setCount(Math.floor(easedProgress * end));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setCount(end); // Ensure exact end value on finish
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
  const metricsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMetricsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (metricsRef.current) {
      observer.observe(metricsRef.current);
    }

    return () => observer.disconnect();
  }, []);
  return (
    <section id="tentang-psks" className="py-10 sm:py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Row: Narrative & Vision/Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-3 sm:space-y-4"
          >
            <span className="text-[#b8901c] font-bold text-[11px] sm:text-xs uppercase tracking-widest block">
              Profil Resmi Dinas Sosial Provinsi Jawa Barat
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#043e2e] leading-tight">
              Pilar Kekuatan Sosial <br />
              <span className="text-slate-500 font-medium text-lg sm:text-2xl block mt-1">
                Mewujudkan Jabar Juara Lahir Batin
              </span>
            </h2>
            <p className="text-slate-700 leading-relaxed text-xs sm:text-base">
              <strong>Potensi dan Sumber Kesejahteraan Sosial (PSKS)</strong> adalah modal kemanusiaan dan sosial utama yang bergerak sinergis di bawah naungan Dinas Sosial Provinsi Jawa Barat. PSKS merangkum seluruh potensi, kemampuan, dan kekuatan swadaya yang berasal dari, oleh, dan untuk masyarakat di 27 Kabupaten/Kota.
            </p>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-base">
              Melalui integrasi data satu pintu ini, kami berkomitmen memperkuat kapasitas para pejuang sosial di lapangan. Melalui penguatan pilar perorangan, kelompok, hingga lembaga, kita bersama-sama menciptakan sistem pemulihan, perlindungan, dan pemberdayaan sosial yang adaptif serta tepat sasaran.
            </p>
          </motion.div>

          {/* Right Cards: Vision & Mission with Smooth Scroll Animations */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            {/* VISI CARD */}
            <motion.div
              initial={{ opacity: 0, y: 45, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.8,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25 } }}
              className="group relative bg-gradient-to-br from-white via-amber-50/40 to-amber-100/25 border-l-4 border-[#d4af37] p-3.5 sm:p-6 rounded-r-2xl border border-amber-200/70 shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
            >
              {/* Background Ambient Glow */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-300/25 rounded-full blur-2xl group-hover:bg-amber-400/40 transition-all duration-500 pointer-events-none" />

              <div className="relative flex gap-2.5 sm:gap-4 items-start">
                <motion.div
                  initial={{ scale: 0, rotate: -25 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.25,
                  }}
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className="p-2 sm:p-3.5 bg-gradient-to-br from-amber-400 to-[#d4af37] text-slate-900 rounded-xl shrink-0 shadow-md border border-amber-300/60"
                >
                  <Target className="w-4 h-4 sm:w-6 sm:h-6 text-slate-950" />
                </motion.div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-sm sm:text-xl text-[#043e2e] flex items-center gap-1.5 sm:gap-2">
                      Visi Utama
                    </h3>
                    <span className="text-[8.5px] sm:text-[10px] font-black bg-amber-100 text-amber-900 px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-amber-300/80 shadow-2xs flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 animate-spin" />
                      Landasan Utama
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-slate-700 font-medium leading-relaxed pt-0.5 sm:pt-1">
                    Terwujudnya standardisasi, transparansi, dan integrasi data pilar-pilar sosial yang responsif demi percepatan kesejahteraan sosial di Jawa Barat.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* MISI CARD */}
            <motion.div
              initial={{ opacity: 0, y: 45, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.8,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25 } }}
              className="group relative bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/25 border-l-4 border-[#043e2e] p-3.5 sm:p-6 rounded-r-2xl border border-emerald-200/70 shadow-md hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
            >
              {/* Background Ambient Glow */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-300/25 rounded-full blur-2xl group-hover:bg-emerald-400/40 transition-all duration-500 pointer-events-none" />

              <div className="relative flex gap-2.5 sm:gap-4 items-start">
                <motion.div
                  initial={{ scale: 0, rotate: 25 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.45,
                  }}
                  whileHover={{ rotate: -12, scale: 1.1 }}
                  className="p-2 sm:p-3.5 bg-gradient-to-br from-[#043e2e] to-[#085a43] text-emerald-100 rounded-xl shrink-0 shadow-md border border-emerald-500/40"
                >
                  <Rocket className="w-4 h-4 sm:w-6 sm:h-6 text-amber-300" />
                </motion.div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-sm sm:text-xl text-[#043e2e] flex items-center gap-1.5 sm:gap-2">
                      Misi Strategis
                    </h3>
                    <span className="text-[8.5px] sm:text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-300/80 shadow-2xs flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                      3 Langkah
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-sm text-slate-700 font-medium leading-relaxed pt-0.5 sm:pt-1">
                    Mengembangkan kapasitas SDM pilar sosial, memfasilitasi kemitraan lintas sektor, serta mengoptimalkan pendayagunaan potensi lokal secara digital.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Row: 4 Metric Cards with Staggered Scroll-Triggered Animations */}
        <div ref={metricsRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mt-8 sm:mt-12 pt-6 sm:pt-10 border-t border-emerald-950/10">
          {/* Card 1: 27 Kab/Kota */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -6, scale: 1.025, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-[#043e2e] via-[#064e3b] to-[#085a43] text-white p-3.5 sm:p-6 rounded-2xl text-center border-2 border-[#d4af37]/40 shadow-md hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/25 transition-all duration-300 pointer-events-none" />
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] mx-auto mb-1.5 sm:mb-2 group-hover:scale-115 transition-transform duration-300" />
            <div className="text-2xl sm:text-4xl font-black text-[#f1c40f] my-0.5 sm:my-1 tracking-tight">
              <AnimatedCounter end={27} duration={1400} trigger={metricsVisible} />
            </div>
            <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-white/80 pt-1.5 sm:pt-2 border-t border-white/10">
              Kabupaten / Kota Terintegrasi
            </div>
          </motion.div>

          {/* Card 2: 10 Pilar */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -6, scale: 1.025, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-[#043e2e] via-[#064e3b] to-[#085a43] text-white p-3.5 sm:p-6 rounded-2xl text-center border-2 border-[#d4af37]/40 shadow-md hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/25 transition-all duration-300 pointer-events-none" />
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] mx-auto mb-1.5 sm:mb-2 group-hover:scale-115 transition-transform duration-300" />
            <div className="text-2xl sm:text-4xl font-black text-[#f1c40f] my-0.5 sm:my-1 tracking-tight">
              <AnimatedCounter end={10} duration={1400} trigger={metricsVisible} />
            </div>
            <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-white/80 pt-1.5 sm:pt-2 border-t border-white/10">
              Pilar Utama PSKS Jabar
            </div>
          </motion.div>

          {/* Card 3: 100% Akurasi */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -6, scale: 1.025, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-[#043e2e] via-[#064e3b] to-[#085a43] text-white p-3.5 sm:p-6 rounded-2xl text-center border-2 border-[#d4af37]/40 shadow-md hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/25 transition-all duration-300 pointer-events-none" />
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] mx-auto mb-1.5 sm:mb-2 group-hover:scale-115 transition-transform duration-300" />
            <div className="text-2xl sm:text-4xl font-black text-[#f1c40f] my-0.5 sm:my-1 tracking-tight">
              <AnimatedCounter end={100} duration={1400} suffix="%" trigger={metricsVisible} />
            </div>
            <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-white/80 pt-1.5 sm:pt-2 border-t border-white/10">
              Akurasi Data Lapangan
            </div>
          </motion.div>

          {/* Card 4: Real-Time */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.7,
              delay: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -6, scale: 1.025, transition: { duration: 0.2 } }}
            className="bg-gradient-to-br from-[#043e2e] via-[#064e3b] to-[#085a43] text-white p-3.5 sm:p-6 rounded-2xl text-center border-2 border-[#d4af37]/40 shadow-md hover:shadow-2xl transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#d4af37]/10 rounded-full blur-xl group-hover:bg-[#d4af37]/25 transition-all duration-300 pointer-events-none" />
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-[#d4af37] mx-auto mb-1.5 sm:mb-2 group-hover:scale-115 transition-transform duration-300" />
            <div className="text-xl sm:text-3xl font-black text-[#f1c40f] my-0.5 sm:my-1 tracking-tight">
              Real-Time
            </div>
            <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-white/80 pt-1.5 sm:pt-2 border-t border-white/10">
              Sistem Pelaporan Mandiri
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
