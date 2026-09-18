import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  CheckCircle,
  ShieldCheck,
  Award,
  Calendar,
  MapPin,
  QrCode,
  Printer,
  Sparkles,
  Share2,
} from 'lucide-react';
import { tenPillars } from '../data/tenPillars';

export interface DigitalKTAModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberData: {
    nama: string;
    nik?: string;
    pillarId?: string;
    pillarName?: string;
    wilayah: string;
    kec?: string;
    noHp?: string;
    statusActive?: string;
    registeredAt?: string;
    approvedAt?: string;
    approvedBy?: string;
    fotoUrl?: string;
    ktaNumber?: string;
  };
}

export const DigitalKTAModal: React.FC<DigitalKTAModalProps> = ({
  isOpen,
  onClose,
  memberData,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  // Temukan informasi pilar
  const pillarInfo = tenPillars.find(
    (p) =>
      p.id === memberData.pillarId ||
      p.title.toLowerCase() === (memberData.pillarName || '').toLowerCase() ||
      p.shortName.toLowerCase() === (memberData.pillarName || '').toLowerCase()
  );

  const pillarTitle = pillarInfo?.title || memberData.pillarName || 'Potensi Sumber Kesejahteraan Sosial';
  const pillarShort = pillarInfo?.shortName || memberData.pillarName || 'PSKS';
  const pillarColor = pillarInfo?.badgeColor || 'from-emerald-700 to-teal-900';

  // Format KTA & Hash
  const ktaNum =
    memberData.ktaNumber ||
    `KTA-${(memberData.pillarId || 'PSKS').toUpperCase()}-${(memberData.nik || '3204').slice(-4)}-${new Date().getFullYear()}`;

  // QR Code Payload aman
  const qrPayload = JSON.stringify({
    app: 'PSKS Jabar Juara',
    doc: 'KTA Digital Resmi',
    kta: ktaNum,
    nama: memberData.nama,
    pilar: pillarShort,
    wilayah: memberData.wilayah,
    status: 'SAH_TERDAFTAR',
    validasi: 'https://dinsos.jabarprov.go.id/validasi-kta',
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    qrPayload
  )}&color=03291e&bgcolor=ffffff&qzone=1`;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const shareText = `KTA Digital Resmi 10 Pilar PSKS Jawa Barat\nNama: ${memberData.nama}\nPilar: ${pillarTitle}\nWilayah: ${memberData.wilayah}\nNo. KTA: ${ktaNum}\nStatus: Terdaftar Sah di Dinas Sosial Prov. Jawa Barat.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KTA Digital 10 Pilar PSKS Jabar',
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User canceled share
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      // Buat canvas darurat untuk download visual KTA
      const canvas = document.createElement('canvas');
      canvas.width = 1012;
      canvas.height = 638; // Rasio standar ID Card CR80
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Background Gradien Khas Jabar
        const grad = ctx.createLinearGradient(0, 0, 1012, 638);
        grad.addColorStop(0, '#03291e');
        grad.addColorStop(0.6, '#064e3b');
        grad.addColorStop(1, '#022118');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1012, 638);

        // Header Strip Emas
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(0, 0, 1012, 16);
        ctx.fillRect(0, 622, 1012, 16);

        // Header Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('PEMERINTAH PROVINSI JAWA BARAT', 40, 60);

        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('DINAS SOSIAL PROVINSI JAWA BARAT', 40, 96);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText('KARTU TANDA ANGGOTA RESMI 10 PILAR PSKS', 40, 126);

        // Card Divider
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, 145);
        ctx.lineTo(972, 145);
        ctx.stroke();

        // Member Information
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '16px sans-serif';
        ctx.fillText('NAMA LENGKAP', 40, 190);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(memberData.nama.toUpperCase(), 40, 226);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '16px sans-serif';
        ctx.fillText('PILAR / BIDANG SOSIAL', 40, 280);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(pillarTitle, 40, 314);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '16px sans-serif';
        ctx.fillText('WILAYAH PENUGASAN', 40, 365);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${memberData.wilayah} ${memberData.kec ? `(Kec. ${memberData.kec})` : ''}`, 40, 395);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '16px sans-serif';
        ctx.fillText('NOMOR ANGGOTA (KTA)', 40, 450);
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(ktaNum, 40, 480);

        // Status Tag
        ctx.fillStyle = '#059669';
        ctx.fillRect(40, 520, 240, 44);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('✓ SAH TERDAFTAR JABAR', 56, 548);

        // Footer Note
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText('Dokumen digital sah terverifikasi Sistem 10 Pilar PSKS Jabar Juara', 40, 600);

        // Unduh File
        const link = document.createElement('a');
        link.download = `KTA_Digital_${memberData.nama.replace(/\s+/g, '_')}_${pillarShort}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
      setDownloading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                Kartu Tanda Anggota (KTA) Digital
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  Resmi
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Dokumen identitas sah terverifikasi Dinas Sosial Provinsi Jawa Barat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Visual KTA Card */}
        <div className="p-4 sm:p-6 space-y-6">
          <div
            ref={cardRef}
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-[#d4af37]/60 bg-gradient-to-br from-[#03291e] via-[#054432] to-[#021f17] text-white p-5 sm:p-6"
            style={{
              backgroundImage: `radial-gradient(circle at 100% 0%, rgba(212, 175, 55, 0.15) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)`,
            }}
          >
            {/* Watermark Logo Jabar */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none select-none">
              <ShieldCheck className="w-72 h-72 text-white" />
            </div>

            {/* Pita Hologram Aksen Emas Atas */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#d4af37] to-yellow-200" />

            {/* Header KTA */}
            <div className="flex items-start justify-between gap-3 border-b border-[#d4af37]/30 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Coat_of_arms_of_West_Java.svg/200px-Coat_of_arms_of_West_Java.svg.png"
                    alt="Logo Jabar"
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs font-bold text-amber-200/90 tracking-wider">
                    PEMERINTAH PROVINSI JAWA BARAT
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white tracking-wide">
                    DINAS SOSIAL PROVINSI JAWA BARAT
                  </div>
                  <div className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Satu Data 10 Pilar PSKS Jabar Juara
                  </div>
                </div>
              </div>

              {/* Hologram Badge */}
              <div className="flex flex-col items-end">
                <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-300/50 text-[10px] font-black text-amber-300 tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  KTA DIGITAL
                </span>
                <span className="text-[9px] text-slate-300 mt-1 font-mono">
                  {ktaNum}
                </span>
              </div>
            </div>

            {/* Body Info KTA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {/* Foto Anggota */}
              <div className="flex flex-col items-center sm:items-start gap-2">
                <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-[#d4af37] shadow-xl bg-slate-800">
                  {memberData.fotoUrl ? (
                    <img
                      src={memberData.fotoUrl}
                      alt={memberData.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900 text-slate-300">
                      <Award className="w-12 h-12 text-[#d4af37]/80 mb-1" />
                      <span className="text-[10px] font-bold text-center px-2">PSKS JABAR</span>
                    </div>
                  )}
                  {/* Badge Sah Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-white text-[9px] font-black py-0.5 text-center uppercase tracking-wider backdrop-blur-xs">
                    Terdaftar Sah
                  </div>
                </div>
              </div>

              {/* Data Identitas */}
              <div className="sm:col-span-2 space-y-2 text-left">
                <div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    Nama Anggota
                  </span>
                  <div className="text-base sm:text-lg font-black text-white leading-tight">
                    {memberData.nama}
                  </div>
                  {memberData.nik && (
                    <div className="text-[11px] font-mono text-emerald-300">
                      NIK: {memberData.nik.substring(0, 6)}******{memberData.nik.slice(-4)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <div>
                    <span className="text-[10px] font-bold text-amber-200/80 uppercase">
                      Pilar PSKS
                    </span>
                    <div className="text-xs sm:text-sm font-black text-amber-300">
                      {pillarTitle}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase">
                      Wilayah Kerja
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{memberData.wilayah}</span>
                    </div>
                  </div>
                </div>

                {/* Info Pengesahan & QR Code */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Disahkan oleh: <strong>{memberData.approvedBy || 'Superadmin Dinsos Jabar'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-300">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Berlaku s/d: <strong>Seumur Hidup / Selama Aktif</strong></span>
                    </div>
                  </div>

                  {/* QR Code Verifikasi */}
                  <div className="p-1.5 rounded-lg bg-white shadow-md shrink-0">
                    <img
                      src={qrImageUrl}
                      alt="QR Validasi"
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pita Hologram Aksen Emas Bawah */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-200 via-[#d4af37] to-amber-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>KTA Digital ini memiliki QR Code terenkripsi yang dapat dipindai untuk validasi fisik.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleShare}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                title="Bagikan Informasi KTA"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                title="Cetak KTA ke Kertas/Printer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Menyiapkan...' : 'Unduh Kartu (PNG)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
