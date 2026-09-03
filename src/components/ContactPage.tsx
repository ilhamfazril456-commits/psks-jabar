import React from 'react';
import { ExternalLink, ShieldAlert, Sparkles, MessageCircleHeart } from 'lucide-react';
import { AppSettings } from '../types';
import { motion } from 'motion/react';
import { BackToHomeButton } from './BackToHomeButton';

interface ContactItem {
  id: string;
  name: string;
  desc: string;
  actionText: string;
  href: string;
  brandColor: string;
  bgGradient: string;
  btnStyle: string;
  hoverGlow: string;
  iconSvg: React.ReactNode;
}

interface ContactPageProps {
  appSettings?: AppSettings;
  onBackToHome?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ appSettings, onBackToHome }) => {
  // Saved / Configured Official Links for Dinsos Jabar
  const officialLinks: Record<string, string> = {
    whatsapp: 'https://wa.me/6282126030038',
    instagram: 'https://www.instagram.com/dinsos.jabar?igsh=MWI1NnRtMWcycmlwbg==',
    youtube: 'https://youtube.com/@dinsosjabartv?si=ZlCTj5Crvbzmrqne',
    facebook: 'https://www.facebook.com/share/1KVk3bkMSQ/',
    tiktok: 'https://www.tiktok.com/@dinsos.jabar?_r=1&_t=ZS-98KXkZOGaWb',
    email: 'mailto:dinsos@jabarprov.go.id',
    x: 'https://x.com/dinsosjabar',
  };

  const storedLinks = appSettings?.socialLinks || (() => {
    try {
      const saved = localStorage.getItem('dinsos_contact_links');
      return saved ? JSON.parse(saved) : officialLinks;
    } catch {
      return officialLinks;
    }
  })();

  const contactsList: ContactItem[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Resmi',
      desc: 'Layanan Pengaduan & Informasi PSKS',
      actionText: 'Chat WhatsApp',
      href: storedLinks.whatsapp || officialLinks.whatsapp,
      brandColor: '#25D366',
      bgGradient: 'from-emerald-500 to-green-600',
      btnStyle: 'bg-[#25D366] hover:bg-emerald-600 text-white shadow-emerald-500/30',
      hoverGlow: 'hover:border-emerald-500 hover:shadow-emerald-500/20',
      iconSvg: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.332 5.001L2 22l5.148-1.348c1.464.798 3.111 1.218 4.862 1.218h.004c5.507 0 9.99-4.479 9.99-9.986 0-2.667-1.038-5.174-2.927-7.062A9.923 9.923 0 0012.012 2zm5.836 14.167c-.244.688-1.428 1.312-1.977 1.393-.526.079-1.206.113-1.944-.124-.447-.143-1.021-.331-1.764-.654-3.112-1.353-5.143-4.502-5.299-4.708-.155-.207-1.267-1.688-1.267-3.22 0-1.532.802-2.288 1.085-2.597.283-.309.617-.386.823-.386.206 0 .412.002.593.01.19.008.446-.073.698.531.258.618.875 2.134.953 2.289.077.155.129.336.026.542-.103.206-.155.335-.309.516-.154.181-.325.403-.464.542-.154.155-.315.324-.136.633.18.309.799 1.317 1.713 2.131 1.173 1.044 2.162 1.368 2.47 1.523.309.155.49.129.67-.077.18-.206.772-.901.978-1.21.206-.309.412-.258.695-.155.283.103 1.799.849 2.108 1.004.309.155.515.232.592.36.077.129.077.747-.167 1.435z" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      name: 'Instagram Resmi',
      desc: 'Galeri Program & Informasi Kegiatan',
      actionText: 'Ikuti Instagram',
      href: storedLinks.instagram || officialLinks.instagram,
      brandColor: '#E1306C',
      bgGradient: 'from-amber-500 via-rose-500 to-purple-600',
      btnStyle: 'bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 hover:opacity-95 text-white shadow-pink-500/30',
      hoverGlow: 'hover:border-rose-500 hover:shadow-rose-500/20',
      iconSvg: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      id: 'youtube',
      name: 'YouTube Channel',
      desc: 'Dokumentasi Video & Liputan Dinsos',
      actionText: 'Tonton YouTube',
      href: storedLinks.youtube || officialLinks.youtube,
      brandColor: '#FF0000',
      bgGradient: 'from-red-600 to-rose-700',
      btnStyle: 'bg-[#FF0000] hover:bg-red-700 text-white shadow-red-500/30',
      hoverGlow: 'hover:border-red-500 hover:shadow-red-500/20',
      iconSvg: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      name: 'Facebook Fanpage',
      desc: 'Portal Berita & Edukasi Masyarakat',
      actionText: 'Sukai Facebook',
      href: storedLinks.facebook || officialLinks.facebook,
      brandColor: '#1877F2',
      bgGradient: 'from-blue-600 to-indigo-700',
      btnStyle: 'bg-[#1877F2] hover:bg-blue-700 text-white shadow-blue-500/30',
      hoverGlow: 'hover:border-blue-500 hover:shadow-blue-500/20',
      iconSvg: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white transform group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'tiktok',
      name: 'TikTok Official',
      desc: 'Konten Edukasi & Publikasi Kreatif',
      actionText: 'Tonton TikTok',
      href: storedLinks.tiktok || officialLinks.tiktok,
      brandColor: '#000000',
      bgGradient: 'from-slate-900 via-zinc-900 to-black',
      btnStyle: 'bg-black hover:bg-slate-900 text-white shadow-slate-900/40 border border-slate-700',
      hoverGlow: 'hover:border-cyan-400 hover:shadow-cyan-500/20',
      iconSvg: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white transform group-hover:scale-110 transition-transform duration-300 drop-shadow-[2px_2px_0px_rgba(37,244,238,0.8)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68 6.34 6.34 0 0 0 9.35 22a6.34 6.34 0 0 0 6.33-6.32V9.05a8.4 8.4 0 0 0 4.91 1.58V7.2a5.18 5.18 0 0 1-1-.51z" />
        </svg>
      ),
    },
    {
      id: 'email',
      name: 'E-Mail Persuratan',
      desc: 'Surat Resmi & Layanan Permohonan',
      actionText: 'Kirim Email',
      href: storedLinks.email || officialLinks.email,
      brandColor: '#EA4335',
      bgGradient: 'from-red-500 to-amber-600',
      btnStyle: 'bg-[#EA4335] hover:bg-red-600 text-white shadow-red-500/30',
      hoverGlow: 'hover:border-red-500 hover:shadow-red-500/20',
      iconSvg: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-white transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      ),
    },
    {
      id: 'x',
      name: 'Twitter / X',
      desc: 'Informasi Terkini & Tanggap Cepat',
      actionText: 'Kunjungi X',
      href: storedLinks.x || officialLinks.x,
      brandColor: '#0F172A',
      bgGradient: 'from-slate-800 to-slate-950',
      btnStyle: 'bg-slate-900 hover:bg-black text-white shadow-slate-800/40 border border-slate-700',
      hoverGlow: 'hover:border-slate-500 hover:shadow-slate-500/20',
      iconSvg: (
        <svg className="w-5 h-5 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 py-6 sm:py-10 lg:py-14 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {onBackToHome && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackToHomeButton onClick={onBackToHome} id="btn-back-top-contact" />
            <div className="text-xs font-bold text-slate-500 bg-white/80 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
              <span>Kontak & Media Sosial Resmi Dinas Sosial Jabar</span>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-emerald-950/10 p-4 sm:p-8 lg:p-10 relative overflow-hidden"
        >
          {/* Background Decorative Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-amber-400/20 to-amber-200/10 rounded-full blur-3xl pointer-events-none" />

          {/* Clean Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-6 sm:mb-8 lg:mb-10 pb-4 border-b border-slate-100 relative"
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-50 via-amber-50/60 to-emerald-50 text-[#043e2e] text-[11px] sm:text-xs font-extrabold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full mb-2.5 border border-emerald-200/80 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>SALURAN RESMI PROVINSI JAWA BARAT</span>
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#043e2e] tracking-tight">
            Hubungi Layanan Kami
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed font-medium">
            Silakan terhubung melalui media sosial resmi Dinas Sosial Provinsi Jawa Barat di bawah ini untuk mendapatkan respon interaktif dan informasi pelayanan publik.
          </p>
        </motion.div>

        {/* Unified 7-Contact Card Responsive Flex Grid (2 per row on mobile, 4 on desktop) */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-5 lg:gap-6">
          {contactsList.map((c, index) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2, ease: 'easeOut' } }}
              className={`group bg-white border-2 border-slate-100/90 ${c.hoverGlow} rounded-2xl p-2.5 sm:p-5 flex flex-col items-center justify-between shadow-xs hover:shadow-xl transition-all duration-300 relative overflow-hidden w-[calc(50%-0.35rem)] sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.875rem)] lg:w-[calc(25%-1.125rem)] min-h-[175px] sm:min-h-[235px]`}
            >
              {/* Background Ambient Glow */}
              <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-slate-100 rounded-full blur-2xl group-hover:bg-amber-100/50 transition-all duration-500 pointer-events-none" />

              {/* Icon Badge */}
              <div className={`p-2.5 sm:p-3.5 bg-gradient-to-br ${c.bgGradient} rounded-xl sm:rounded-2xl mb-1.5 sm:mb-3 shadow-md group-hover:scale-110 transition-transform duration-300 relative z-10 shrink-0 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14`}>
                {c.iconSvg}
              </div>

              {/* Title & Description */}
              <div className="text-center w-full relative z-10 flex-1 flex flex-col justify-center my-0.5 sm:my-1">
                <h4 className="font-black text-xs sm:text-base text-slate-900 group-hover:text-[#043e2e] transition-colors leading-tight sm:leading-snug truncate">
                  {c.name}
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium my-0.5 sm:my-1.5 leading-tight sm:leading-relaxed line-clamp-2 min-h-[24px] sm:min-h-[32px] flex items-center justify-center">
                  {c.desc}
                </p>
              </div>

              {/* Action Button */}
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className={`w-full py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${c.btnStyle} group-hover:scale-[1.02] active:scale-95 relative z-10 shrink-0 mt-auto`}
              >
                <span className="truncate">{c.actionText}</span>
                <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </a>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-8 sm:mt-12 text-center flex items-center justify-center gap-2 text-xs font-bold text-slate-500 pt-5 border-t border-slate-100"
        >
          <MessageCircleHeart className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Dinas Sosial Provinsi Jawa Barat — Melayani Sepenuh Hati</span>
        </motion.div>
      </motion.div>

      {onBackToHome && (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-contact" />
          <div className="text-xs text-slate-500 font-semibold">
            <span>Dinas Sosial Provinsi Jawa Barat</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};



