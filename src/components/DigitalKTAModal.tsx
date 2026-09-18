import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { PILLARS_CONFIG } from '../data/initialData';

export interface DigitalKTAModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasKTA?: boolean;
  emptyReason?: string;
  memberData?: {
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

// Helper untuk menggambar rounded rect kompatibel di semua browser
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Helper untuk load gambar async
function loadImageAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load: ' + src));
    img.src = src;
  });
}

export const DigitalKTAModal: React.FC<DigitalKTAModalProps> = ({
  isOpen,
  onClose,
  hasKTA = true,
  emptyReason,
  memberData,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Handler kembali ke Pusat Akun dengan mengembalikan posisi scroll ke tombol KTA di Pusat Akun
  const handleBackToAccountCenter = () => {
    onClose();
    setTimeout(() => {
      const el =
        document.getElementById('btn-preview-kta-saya') ||
        document.getElementById('account-kta-anchor') ||
        document.getElementById('account-header-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  };

  // Temukan informasi pilar
  const allPillars = Object.values(PILLARS_CONFIG);
  const pillarInfo = memberData
    ? allPillars.find(
        (p) =>
          p.id === memberData.pillarId ||
          p.title.toLowerCase() === (memberData.pillarName || '').toLowerCase() ||
          p.shortName.toLowerCase() === (memberData.pillarName || '').toLowerCase()
      )
    : undefined;

  const pillarTitle = pillarInfo?.title || memberData?.pillarName || 'Potensi Sumber Kesejahteraan Sosial';
  const pillarShort = pillarInfo?.shortName || memberData?.pillarName || 'PSKS';

  // Format KTA & Hash
  const ktaNum =
    memberData?.ktaNumber ||
    `KTA-${(memberData?.pillarId || 'PSKS').toUpperCase()}-${(memberData?.nik || '3204').slice(-4)}-${new Date().getFullYear()}`;

  // QR Code Payload aman
  const qrPayload = memberData
    ? JSON.stringify({
        app: 'PSKS Jabar Juara',
        doc: 'KTA Digital Resmi',
        kta: ktaNum,
        nama: memberData.nama,
        nik: memberData.nik ? `${memberData.nik.substring(0, 6)}******${memberData.nik.slice(-4)}` : undefined,
        pilar: pillarShort,
        wilayah: memberData.wilayah,
        kec: memberData.kec,
        status: 'SAH_TERDAFTAR',
        pengesahan: memberData.approvedBy || 'Superadmin Dinas Sosial Provinsi Jawa Barat',
        validasi: 'https://dinsos.jabarprov.go.id/validasi-kta',
      })
    : '';

  // Generate QR Code data URL lokal (bebas CORS taint)
  useEffect(() => {
    if (memberData && qrPayload) {
      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 1,
        color: {
          dark: '#03291e',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch(() => {
          setQrDataUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              qrPayload
            )}&color=03291e&bgcolor=ffffff&qzone=1`
          );
        });
    }
  }, [memberData, qrPayload]);

  if (!isOpen) return null;

  // TAMPILAN JIKA BELUM MEMILIKI KTA DIGITAL (Belum disahkan oleh Superadmin)
  if (!hasKTA || !memberData) {
    return (
      <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 md:p-8 flex min-h-screen items-center justify-center animate-fadeIn">
        <div className="relative w-full max-w-md md:max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden my-auto p-6 sm:p-8 text-center animate-in zoom-in-95 duration-200">
          {/* Decorative glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close X Button in Header */}
          <button
            type="button"
            onClick={handleBackToAccountCenter}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup & Kembali ke Pusat Akun"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-5 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
            <AlertCircle className="w-9 h-9 sm:w-10 sm:h-10 text-amber-400 stroke-[1.8]" />
          </div>

          {/* Title: Anda Belum Memiliki KTA Digital */}
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2.5 tracking-tight">
            Anda Belum Memiliki KTA Digital
          </h3>

          {/* Penjelasan Alur Resmi */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {emptyReason ||
                'KTA Digital resmi hanya akan otomatis terbit dan dapat diakses setelah pendaftaran pilar Anda diverifikasi oleh Admin Wilayah dan disahkan oleh Superadmin Dinas Sosial Provinsi Jawa Barat.'}
            </p>
            <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2 text-[11px] text-amber-300/90 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Status KTA: Menunggu Pengesahan Resmi Superadmin</span>
            </div>
          </div>

          {/* Action Buttons: Tombol Nyaman Kembali ke Pusat Akun */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleBackToAccountCenter}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 hover:from-blue-600 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-950/60 border border-blue-400/40 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pusat Akun</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  // Unduh KTA dalam format PNG dengan visual 100% SAMA PERSIS dengan kartu di layar
  const handleDownload = async () => {
    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      // Rasio standar lanskap kartu ID Card CR-80 High Definition (1200 x 750)
      const w = 1200;
      const h = 750;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context 2D not available');
      }

      // 1. Gambar latar belakang kartu (Rounded Rect clip)
      ctx.save();
      drawRoundRect(ctx, 0, 0, w, h, 28);
      ctx.clip();

      // Gradasi Latar Belakang Botol Hijau Jabar
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#03291e');
      bgGrad.addColorStop(0.5, '#054432');
      bgGrad.addColorStop(1, '#021f17');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Radial Glow Emas (Kanan Atas)
      const radialGold = ctx.createRadialGradient(w, 0, 10, w, 0, 600);
      radialGold.addColorStop(0, 'rgba(212, 175, 55, 0.28)');
      radialGold.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = radialGold;
      ctx.fillRect(0, 0, w, h);

      // Radial Glow Zamrud (Kiri Bawah)
      const radialEmerald = ctx.createRadialGradient(0, h, 10, 0, h, 600);
      radialEmerald.addColorStop(0, 'rgba(16, 185, 129, 0.24)');
      radialEmerald.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = radialEmerald;
      ctx.fillRect(0, 0, w, h);

      // 2. Watermark Perisai (Shield) Khas Jawa Barat di sisi kanan
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      const scx = 940;
      const scy = 420;
      const sw = 360;
      const sh = 420;
      ctx.moveTo(scx - sw / 2, scy - sh / 2);
      ctx.lineTo(scx + sw / 2, scy - sh / 2);
      ctx.lineTo(scx + sw / 2, scy);
      ctx.quadraticCurveTo(scx + sw / 2, scy + sh / 2, scx, scy + sh / 2 + sh * 0.18);
      ctx.quadraticCurveTo(scx - sw / 2, scy + sh / 2, scx - sw / 2, scy);
      ctx.closePath();
      ctx.stroke();

      // Garis silang halus di dalam watermark
      ctx.beginPath();
      ctx.moveTo(scx, scy - sh / 2);
      ctx.lineTo(scx, scy + sh / 2 + sh * 0.18);
      ctx.moveTo(scx - sw / 2, scy);
      ctx.lineTo(scx + sw / 2, scy);
      ctx.stroke();
      ctx.restore();

      // 3. Pita Hologram Emas Atas & Bawah
      const pitaGrad = ctx.createLinearGradient(0, 0, w, 0);
      pitaGrad.addColorStop(0, '#f59e0b');
      pitaGrad.addColorStop(0.3, '#d4af37');
      pitaGrad.addColorStop(0.7, '#fef08a');
      pitaGrad.addColorStop(1, '#f59e0b');

      ctx.fillStyle = pitaGrad;
      ctx.fillRect(0, 0, w, 14); // Atas
      ctx.fillRect(0, h - 14, w, 14); // Bawah

      // 4. Border Ganda Emas Kartu
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      drawRoundRect(ctx, 4, 4, w - 8, h - 8, 26);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = 1.5;
      drawRoundRect(ctx, 16, 16, w - 32, h - 32, 20);
      ctx.stroke();

      // 5. Header KTA
      // Kotak Logo Jabar di Kiri
      const logoBoxX = 50;
      const logoBoxY = 40;
      const logoBoxSize = 90;
      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Gambar Logo Resmi Jabar
      try {
        const logoImg = await loadImageAsync('/official_logo_128.webp');
        ctx.drawImage(logoImg, logoBoxX + 8, logoBoxY + 8, logoBoxSize - 16, logoBoxSize - 16);
      } catch {
        // Fallback jika logo webp belum termuat
        ctx.fillStyle = '#054432';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JABAR', logoBoxX + logoBoxSize / 2, logoBoxY + logoBoxSize / 2);
      }

      // Teks Instansi di Samping Logo
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('PEMERINTAH PROVINSI JAWA BARAT', 160, 68);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('DINAS SOSIAL PROVINSI JAWA BARAT', 160, 100);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('✦ Satu Data 10 Pilar PSKS Jabar Juara', 160, 126);

      // Badge KTA DIGITAL di Kanan Atas
      const badgeW = 200;
      const badgeH = 44;
      const badgeX = w - 50 - badgeW;
      const badgeY = 48;

      ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
      drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🛡 KTA DIGITAL', badgeX + badgeW / 2, badgeY + 28);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(ktaNum, w - 50, 122);

      // Garis Pembatas Header Emas
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(50, 150);
      ctx.lineTo(w - 50, 150);
      ctx.stroke();

      // 6. Kolom 1: Pas Foto Anggota (Kiri)
      const fotoX = 50;
      const fotoY = 175;
      const fotoW = 210;
      const fotoH = 280;

      ctx.save();
      drawRoundRect(ctx, fotoX, fotoY, fotoW, fotoH, 18);
      ctx.clip();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(fotoX, fotoY, fotoW, fotoH);

      let fotoLoaded = false;
      if (memberData.fotoUrl) {
        try {
          const userPhoto = await loadImageAsync(memberData.fotoUrl);
          ctx.drawImage(userPhoto, fotoX, fotoY, fotoW, fotoH);
          fotoLoaded = true;
        } catch {
          fotoLoaded = false;
        }
      }

      if (!fotoLoaded) {
        // Placeholder Foto Berornamen
        const photoGrad = ctx.createLinearGradient(fotoX, fotoY, fotoX, fotoY + fotoH);
        photoGrad.addColorStop(0, '#334155');
        photoGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = photoGrad;
        ctx.fillRect(fotoX, fotoY, fotoW, fotoH);

        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎖', fotoX + fotoW / 2, fotoY + fotoH / 2 - 10);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('PSKS JABAR', fotoX + fotoW / 2, fotoY + fotoH / 2 + 30);
      }

      // Pita "TERDAFTAR SAH" di Bawah Foto
      ctx.fillStyle = 'rgba(5, 150, 105, 0.95)';
      ctx.fillRect(fotoX, fotoY + fotoH - 36, fotoW, 36);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TERDAFTAR SAH', fotoX + fotoW / 2, fotoY + fotoH - 13);
      ctx.restore();

      // Border Foto Emas
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      drawRoundRect(ctx, fotoX, fotoY, fotoW, fotoH, 18);
      ctx.stroke();

      // 7. Kolom 2: Informasi Identitas Anggota (Tengah)
      const dataX = 295;
      ctx.textAlign = 'left';

      // Nama Anggota
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('NAMA LENGKAP ANGGOTA', dataX, 195);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px sans-serif';
      ctx.fillText(memberData.nama, dataX, 230);

      if (memberData.nik) {
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 17px monospace';
        const maskedNik = `${memberData.nik.substring(0, 6)}******${memberData.nik.slice(-4)}`;
        ctx.fillText(`NIK: ${maskedNik}`, dataX, 258);
      }

      // Divider Tengah
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dataX, 280);
      ctx.lineTo(dataX + 540, 280);
      ctx.stroke();

      // Pilar PSKS
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('PILAR PSKS', dataX, 310);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 20px sans-serif';
      ctx.fillText(pillarTitle, dataX, 338);

      // Wilayah Penugasan
      const colWilX = dataX + 270;
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('WILAYAH PENUGASAN', colWilX, 310);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      const wilText = `${memberData.wilayah}${memberData.kec ? ` (Kec. ${memberData.kec})` : ''}`;
      ctx.fillText(wilText, colWilX, 338);

      // Divider Bawah
      ctx.beginPath();
      ctx.moveTo(dataX, 365);
      ctx.lineTo(dataX + 540, 365);
      ctx.stroke();

      // Info Pengesahan
      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 15px sans-serif';
      const approvedByText = memberData.approvedBy || 'Superadmin Dinas Sosial Provinsi Jawa Barat';
      ctx.fillText(`✓ Pengesahan: ${approvedByText}`, dataX, 395);

      // Masa Berlaku
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('📅 Masa Berlaku: Seumur Hidup / Selama Aktif', dataX, 425);

      // 8. Kolom 3: QR Code Validasi Resmi (Kanan)
      const qrBoxSize = 190;
      const qrBoxX = w - 50 - qrBoxSize;
      const qrBoxY = 175;

      ctx.fillStyle = '#ffffff';
      drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Gambar QR Code Asli
      if (qrDataUrl) {
        try {
          const qrImg = await loadImageAsync(qrDataUrl);
          ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, qrBoxSize - 20, qrBoxSize - 20);
        } catch {
          // Fallback bila QR gagal render
        }
      }

      // Label di bawah QR Code
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚏ PINDAI VALID', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 25);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText('Satu Data PSKS', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize + 44);

      // 9. Catatan Kaki Resmi Kartu (Footer Bawah)
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 485);
      ctx.lineTo(w - 50, 485);
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.fillText(
        'Dokumen Identitas Digital Sah 10 Pilar Potensi Sumber Kesejahteraan Sosial (PSKS) Provinsi Jawa Barat',
        50,
        515
      );

      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Verifikasi Online: dinsos.jabarprov.go.id', w - 50, 515);

      ctx.restore();

      // Unduh File Gambar PNG
      const downloadLink = document.createElement('a');
      downloadLink.download = `KTA_Digital_${memberData.nama.replace(/\s+/g, '_')}_${pillarShort}.png`;
      downloadLink.href = canvas.toDataURL('image/png', 1.0);
      downloadLink.click();
    } catch (err) {
      console.error('Gagal mengunduh KTA:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 md:p-8 flex min-h-screen items-center justify-center animate-fadeIn">
      {/* Modal Dialog Box: Pas di Tengah-Tengah Layar Laptop & Desktop */}
      <div className="relative w-full max-w-3xl my-auto bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Modal: Terbaca Jelas, Tidak Terpotong di Atas Layar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Kartu Tanda Anggota (KTA) Digital</span>
                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/40">
                  Resmi
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dokumen identitas sah terverifikasi Dinas Sosial Provinsi Jawa Barat
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBackToAccountCenter}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            title="Tutup & Kembali ke Pusat Akun"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content / Visual KTA Card */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* Petunjuk format lanskap memanjang pada HP */}
          <div className="sm:hidden flex items-center justify-between px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Format Lanskap ID Card (CR-80)</span>
            </span>
            <span className="flex items-center gap-1 text-amber-200">
              <span>Geser kartu</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>

          {/* Kontainer Responsif: Pada HP kartu memanjang normal dengan scroll horizontal mulus */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
            {/* Visual KTA Card: Memanjang Normal (min-w 580px di HP, 100% di Desktop) */}
            <div
              ref={cardRef}
              className="relative w-full min-w-[580px] md:min-w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-[#d4af37]/80 bg-gradient-to-br from-[#03291e] via-[#054432] to-[#021f17] text-white p-4 sm:p-6 select-none"
              style={{
                backgroundImage: `radial-gradient(circle at 100% 0%, rgba(212, 175, 55, 0.22) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(16, 185, 129, 0.25) 0%, transparent 60%)`,
              }}
            >
              {/* Watermark Perisai (Shield) Jawa Barat di Kanan Belakang */}
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none select-none">
                <ShieldCheck className="w-68 h-68 sm:w-76 sm:h-76 text-white" />
              </div>

              {/* Pita Hologram Emas Atas */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#d4af37] to-yellow-200" />

              {/* Header KTA: Berdampingan Horizontal Memanjang */}
              <div className="flex items-center justify-between gap-3 border-b border-[#d4af37]/35 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  {/* Kotak Logo Jabar Resmi */}
                  <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-amber-300/40">
                    <img
                      src="/official_logo_128.webp"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Coat_of_arms_of_West_Java.svg/200px-Coat_of_arms_of_West_Java.svg.png';
                      }}
                      alt="Logo Resmi Jawa Barat"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] sm:text-xs font-bold text-amber-200/90 tracking-wider leading-none">
                      PEMERINTAH PROVINSI JAWA BARAT
                    </div>
                    <div className="text-xs sm:text-base font-black text-white tracking-wide leading-tight mt-1">
                      DINAS SOSIAL PROVINSI JAWA BARAT
                    </div>
                    <div className="text-[10px] sm:text-xs text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>Satu Data 10 Pilar PSKS Jabar Juara</span>
                    </div>
                  </div>
                </div>

                {/* Hologram Badge & KTA No */}
                <div className="flex flex-col items-end shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border border-amber-300/50 text-[10px] sm:text-[11px] font-black text-amber-300 tracking-wider flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    KTA DIGITAL
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-300 mt-1 font-mono font-bold">
                    {ktaNum}
                  </span>
                </div>
              </div>

              {/* Body Info KTA: 3 Kolom Memanjang Normal (Foto - Identitas - QR Code) */}
              <div className="flex items-stretch gap-4 sm:gap-6 text-left">
                {/* Kolom 1: Pas Foto Anggota */}
                <div className="flex flex-col items-center justify-start shrink-0">
                  <div className="relative w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden border-2 border-[#d4af37] shadow-xl bg-slate-800">
                    {memberData.fotoUrl ? (
                      <img
                        src={memberData.fotoUrl}
                        alt={memberData.nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900 text-slate-300">
                        <Award className="w-10 h-10 text-[#d4af37]/80 mb-1" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-center px-1 leading-tight">
                          PSKS JABAR
                        </span>
                      </div>
                    )}
                    {/* Badge Sah Overlay Bawah Foto */}
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-600/95 text-white text-[9px] font-black py-0.5 text-center uppercase tracking-wider backdrop-blur-xs">
                      Terdaftar Sah
                    </div>
                  </div>
                </div>

                {/* Kolom 2: Informasi Identitas Anggota (Teks Tidak Terpotong) */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-2">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Nama Lengkap Anggota
                    </span>
                    <div className="text-sm sm:text-lg font-black text-white leading-tight mt-0.5">
                      {memberData.nama}
                    </div>
                    {memberData.nik && (
                      <div className="text-[10px] sm:text-xs font-mono text-emerald-300 font-bold mt-0.5">
                        NIK: {memberData.nik.substring(0, 6)}******{memberData.nik.slice(-4)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-white/10">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-200/80 uppercase block">
                        Pilar PSKS
                      </span>
                      <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 leading-snug">
                        {pillarTitle}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase block">
                        Wilayah Penugasan
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1 mt-0.5 leading-snug">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {memberData.wilayah}
                          {memberData.kec ? ` (Kec. ${memberData.kec})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Pengesahan Bawah: Teks Penuh Tanpa Terpotong */}
                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] text-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Pengesahan: <strong>{memberData.approvedBy || 'Superadmin Dinas Sosial Jawa Barat'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-300">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Masa Berlaku: <strong>Seumur Hidup / Selama Aktif</strong></span>
                    </div>
                  </div>
                </div>

                {/* Kolom 3: QR Code Validasi Resmi di Kanan */}
                <div className="flex flex-col items-center justify-center shrink-0 pl-2 border-l border-white/10">
                  <div className="p-1.5 rounded-xl bg-white shadow-md">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Validasi"
                        className="w-18 h-18 sm:w-22 sm:h-22 object-contain"
                      />
                    ) : (
                      <div className="w-18 h-18 sm:w-22 sm:h-22 flex items-center justify-center bg-slate-100 text-slate-400">
                        <QrCode className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-amber-200/90 font-mono mt-1.5 font-bold flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    Pindai Valid
                  </span>
                  <span className="text-[7px] sm:text-[8px] text-slate-400">
                    Satu Data Dinsos
                  </span>
                </div>
              </div>

              {/* Pita Hologram Bawah */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-200 via-[#d4af37] to-amber-400" />
            </div>
          </div>

          {/* Action Buttons: Berjarak Aman dan Tidak Tertutup Floating WhatsApp/Bot */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-6 sm:pb-2">
            <button
              type="button"
              onClick={handleBackToAccountCenter}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pusat Akun</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer active:scale-95"
                title="Bagikan Informasi KTA"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Tersalin!' : 'Bagikan'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer active:scale-95"
                title="Cetak KTA ke Kertas/Printer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'Menggambar KTA...' : 'Unduh (PNG)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

