import React, { useEffect, useState } from 'react';
import { X, Printer, Download, QrCode, Shield, Sparkles, Copy, Check } from 'lucide-react';
import {
  generateQRDataUrl,
  PERMANENT_SUPERADMIN_QR_TOKEN,
  PERMANENT_DEVELOPER_QR_TOKEN,
} from '../utils/qrAuth';

interface PrintableQRCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScanner?: () => void;
}

export const PrintableQRCardModal: React.FC<PrintableQRCardModalProps> = ({
  isOpen,
  onClose,
  onOpenScanner,
}) => {
  const [superadminQrUrl, setSuperadminQrUrl] = useState('');
  const [developerQrUrl, setDeveloperQrUrl] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      generateQRDataUrl(PERMANENT_SUPERADMIN_QR_TOKEN).then(setSuperadminQrUrl);
      generateQRDataUrl(PERMANENT_DEVELOPER_QR_TOKEN).then(setDeveloperQrUrl);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (token: string, type: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(type);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[10001] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-[#d4af37] relative flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Header - Hidden in Print */}
        <div className="bg-gradient-to-r from-[#043e2e] via-[#064e3b] to-[#022319] text-white p-5 text-center relative border-b-4 border-[#d4af37] shrink-0 print:hidden">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 p-1.5 rounded-full transition-all cursor-pointer z-10"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 bg-[#d4af37] text-[#043e2e] text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-md">
            <Shield className="w-3.5 h-3.5" />
            <span>KARTU AKSES PERMANEN RESMI DINSOS JABAR</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
            KARTU FISIK AKSES QR OTORITAS PUSAT
          </h2>
          <p className="text-[11px] text-amber-200/90 font-medium mt-1 leading-snug">
            Cetak kartu ini atau simpan gambarnya di HP Anda untuk login instan kapan saja tanpa terpengaruh perubahan kata sandi.
          </p>
        </div>

        {/* Content Body - Printable Cards Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: KARTU SUPERADMIN PROVINSI */}
            <div className="bg-gradient-to-br from-[#043e2e] via-[#064e3b] to-[#022319] text-white rounded-2xl border-2 border-[#d4af37] p-5 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
              
              {/* Metallic Accent overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-[#d4af37]/40 pb-3">
                <div>
                  <span className="text-[9px] font-black bg-[#d4af37] text-[#043e2e] px-2 py-0.5 rounded uppercase tracking-wider">
                    KARTU AKSES UTAMA
                  </span>
                  <h3 className="text-base font-black text-amber-200 mt-1 m-0">
                    SUPERADMIN PROVINSI
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium m-0">
                    Dinas Sosial Provinsi Jawa Barat
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#d4af37] text-[#043e2e] flex items-center justify-center font-black shadow shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
              </div>

              {/* QR Code Frame */}
              <div className="bg-white p-3 rounded-2xl shadow-inner mx-auto border-2 border-[#d4af37] text-center w-48 h-48 flex items-center justify-center">
                {superadminQrUrl ? (
                  <img
                    src={superadminQrUrl}
                    alt="QR Superadmin (Pure B&W)"
                    className="w-full h-full object-contain filter contrast-125"
                  />
                ) : (
                  <div className="text-slate-400 text-xs font-bold">Memuat QR...</div>
                )}
              </div>

              <div className="bg-black/50 border border-[#d4af37]/50 rounded-xl p-2.5 text-center space-y-1 shadow-inner">
                <span className="text-[8.5px] font-black text-amber-300/90 uppercase tracking-wider block">
                  PERMANENT ACCESS KEY ID
                </span>
                <span className="text-[10.5px] font-mono font-bold text-white block truncate tracking-wide select-all">
                  {PERMANENT_SUPERADMIN_QR_TOKEN}
                </span>
                <div className="text-[8.5px] font-mono font-bold text-amber-300/90 pt-1 border-t border-white/15 tracking-wider">
                  program by ilham fazril
                </div>
              </div>

              <div className="flex gap-2 pt-1 print:hidden">
                <button
                  type="button"
                  onClick={() => handleCopy(PERMANENT_SUPERADMIN_QR_TOKEN, 'superadmin')}
                  className="flex-1 py-1.5 px-2 bg-emerald-950 hover:bg-emerald-900 border border-[#d4af37]/60 rounded-xl text-[11px] font-bold text-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedToken === 'superadmin' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
                {superadminQrUrl && (
                  <a
                    href={superadminQrUrl}
                    download="Kartu_QR_Superadmin_Dinsos_Jabar.png"
                    className="flex-1 py-1.5 px-2 bg-[#d4af37] hover:bg-[#b8901c] text-[#043e2e] rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PNG</span>
                  </a>
                )}
              </div>
            </div>

            {/* CARD 2: KARTU DEVELOPER UTAMA */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#043e2e] text-white rounded-2xl border-2 border-[#d4af37] p-5 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
              
              {/* Metallic Accent overlay */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-[#d4af37]/40 pb-3">
                <div>
                  <span className="text-[9px] font-black bg-amber-200 text-slate-900 px-2 py-0.5 rounded uppercase tracking-wider">
                    DEVELOPER SYSTEM
                  </span>
                  <h3 className="text-base font-black text-amber-200 mt-1 m-0">
                    ILHAM FAZRIL (DEVELOPER)
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium m-0">
                    Pusat Pengembangan PSKS Jabar
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#d4af37] text-[#043e2e] flex items-center justify-center font-black shadow shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* QR Code Frame */}
              <div className="bg-white p-3 rounded-2xl shadow-inner mx-auto border-2 border-[#d4af37] text-center w-48 h-48 flex items-center justify-center">
                {developerQrUrl ? (
                  <img
                    src={developerQrUrl}
                    alt="QR Developer (Pure B&W)"
                    className="w-full h-full object-contain filter contrast-125"
                  />
                ) : (
                  <div className="text-slate-400 text-xs font-bold">Memuat QR...</div>
                )}
              </div>

              <div className="bg-black/60 border border-[#d4af37]/50 rounded-xl p-2.5 text-center space-y-1 shadow-inner">
                <span className="text-[8.5px] font-black text-amber-300/90 uppercase tracking-wider block">
                  PERMANENT ACCESS KEY ID
                </span>
                <span className="text-[10.5px] font-mono font-bold text-white block truncate tracking-wide select-all">
                  {PERMANENT_DEVELOPER_QR_TOKEN}
                </span>
                <div className="text-[8.5px] font-mono font-bold text-amber-300/90 pt-1 border-t border-white/15 tracking-wider">
                  program by ilham fazril
                </div>
              </div>

              <div className="flex gap-2 pt-1 print:hidden">
                <button
                  type="button"
                  onClick={() => handleCopy(PERMANENT_DEVELOPER_QR_TOKEN, 'developer')}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-[#d4af37]/60 rounded-xl text-[11px] font-bold text-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedToken === 'developer' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
                {developerQrUrl && (
                  <a
                    href={developerQrUrl}
                    download="Kartu_QR_Developer_SI_PSKS_Jabar.png"
                    className="flex-1 py-1.5 px-2 bg-[#d4af37] hover:bg-[#b8901c] text-[#043e2e] rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PNG</span>
                  </a>
                )}
              </div>
            </div>

          </div>

          <div className="bg-amber-50 border-l-4 border-[#d4af37] p-3.5 rounded-r-2xl text-xs text-slate-700 leading-relaxed print:hidden">
            <span className="font-bold text-[#043e2e] block mb-0.5">💡 Catatan Sistem Keamanan:</span>
            Kode QR di atas telah dienkripsi dengan Permanent Token. Kapan pun Superadmin atau Developer mengubah kata sandi di sistem, kartu fisik QR ini <strong>tetap berlaku permanen</strong> untuk membuka otorisasi akses cepat.
          </div>

        </div>

        {/* Footer Actions - Hidden in Print */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
          {onOpenScanner ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#043e2e] hover:bg-[#065e44] text-white border border-[#d4af37] shadow transition-all cursor-pointer flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-[#d4af37]" />
              <span>Buka Kamera Pemindai QR</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#b8901c] to-[#d4af37] hover:scale-105 text-[#043e2e] shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Akses</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
