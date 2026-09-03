import React from 'react';
import { Wifi, ShieldCheck, QrCode } from 'lucide-react';

interface SmartCardGraphicProps {
  role?: string;
  nama?: string;
  isInteractive?: boolean;
  className?: string;
  showChip?: boolean;
}

export const SmartCardGraphic: React.FC<SmartCardGraphicProps> = ({
  role = 'SUPERADMIN ACCOUNT',
  nama,
  isInteractive = false,
  className = '',
}) => {
  // Normalize role text
  const getSubRoleText = (r: string) => {
    const lower = (r || '').toLowerCase();
    if (lower.includes('developer')) return 'DEVELOPER ACCOUNT';
    if (lower.includes('superadmin')) return 'SUPERADMIN ACCOUNT';
    if (lower.includes('admin')) return 'ADMIN WILAYAH';
    return 'AKUN RESMI DINAS';
  };

  const subRole = getSubRoleText(role);

  return (
    <div
      className={`relative w-full max-w-[340px] sm:max-w-[380px] aspect-[16/10] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 text-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] border-2 border-[#d4af37]/70 overflow-hidden select-none transition-all duration-300 ${
        isInteractive ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0c5942 0%, #043e2e 50%, #011c15 100%)',
      }}
    >
      {/* Subtle Vector Background Geometric Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-emerald-400/15 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#d4af37]/15 blur-2xl" />
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
      </div>

      {/* CARD CONTENT LAYER - CLEAN GENERIC CARD DESIGN */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {/* TOP ROW: GOLD EMV CHIP & NFC ICON */}
        <div className="flex items-start justify-between gap-2">
          {/* Gold EMV Chip Graphic */}
          <div className="w-10 h-7.5 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-[#d4af37] to-amber-700 border border-amber-200/80 p-0.5 shadow-md flex flex-col justify-between">
            <div className="w-full h-0.5 bg-amber-900/40 rounded-full" />
            <div className="flex justify-between w-full h-full my-0.5">
              <div className="w-2.5 h-full border-r border-amber-900/30" />
              <div className="w-2.5 h-full border-l border-amber-900/30" />
            </div>
            <div className="w-full h-0.5 bg-amber-900/40 rounded-full" />
          </div>

          {/* Contactless Waves & Brand Icon */}
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full border border-[#d4af37]/40 shadow-xs">
            <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 rotate-90" />
            <span className="text-[10px] sm:text-xs font-black text-amber-200 tracking-wider">
              NFC
            </span>
          </div>
        </div>

        {/* CENTER ROW: Card Category & Title */}
        <div className="my-auto space-y-0.5 text-left">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-300 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
            <span>KARTU AKSES OTENTIKASI</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-white tracking-wide uppercase m-0 leading-tight">
            PSKS JABAR PROVINSI JAWA BARAT
          </h3>
          <p className="text-[9.5px] sm:text-[10.5px] font-bold text-emerald-200 tracking-wide m-0">
            {subRole}
          </p>
        </div>

        {/* BOTTOM ROW: Holder Info / Instruction */}
        <div className="flex items-end justify-between gap-2 pt-1 border-t border-emerald-500/20">
          <div className="min-w-0">
            <p className="text-[8px] sm:text-[9px] font-semibold text-emerald-300/90 uppercase tracking-wider m-0">
              Metode Validasi
            </p>
            <p className="text-[9.5px] sm:text-[10.5px] font-bold text-white truncate m-0">
              {nama ? `Pemegang: ${nama}` : 'Pemindai Kamera QR / Tap NFC'}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-black bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-md border border-amber-300/30 shrink-0">
            <QrCode className="w-3 h-3" />
            <span>TERENKRIPSI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
