import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Wifi, 
  Radio, 
  Smartphone, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Info, 
  Lock, 
  Zap, 
  Cpu, 
  Layers, 
  Scan, 
  RotateCcw, 
  Fingerprint, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  Globe,
  Download,
  Terminal,
  Sliders,
  RefreshCw,
  Eye,
  KeyRound
} from 'lucide-react';
import { SmartCardGraphic } from './SmartCardGraphic';
import { UserSession } from '../types';
import { 
  PERMANENT_SUPERADMIN_QR_TOKEN, 
  PERMANENT_DEVELOPER_QR_TOKEN,
  generateQRDataUrl 
} from '../utils/qrAuth';

interface SmartAccessCardSectionProps {
  session?: UserSession;
}

const DEFAULT_VERCEL_URL = 'https://psks-jabar.vercel.app';

export const SmartAccessCardSection: React.FC<SmartAccessCardSectionProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'qr' | 'nfc'>('all');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSuperadminUrl, setCopiedSuperadminUrl] = useState(false);
  const [copiedDeveloperUrl, setCopiedDeveloperUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  
  // NFC Writing states
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const [nfcWriteStatus, setNfcWriteStatus] = useState<string | null>(null);
  const [nfcWriteError, setNfcWriteError] = useState<string | null>(null);

  // Vercel & Domain configuration
  const [domainMode, setDomainMode] = useState<'vercel' | 'custom' | 'origin'>('vercel');
  const [customVercelDomain, setCustomVercelDomain] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('psks_custom_vercel_domain');
      if (stored && !stored.includes('web-psks-jabar')) {
        return stored;
      }
      return DEFAULT_VERCEL_URL;
    }
    return DEFAULT_VERCEL_URL;
  });

  // Automatically migrate legacy web-psks-jabar domain in localStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('psks_custom_vercel_domain');
      if (stored && stored.includes('web-psks-jabar')) {
        localStorage.setItem('psks_custom_vercel_domain', DEFAULT_VERCEL_URL);
      }
    }
  }, []);

  // Target role selection (Superadmin vs Developer)
  const isDevSession = session?.role === 'developer' || session?.isDeveloper;
  const [targetRole, setTargetRole] = useState<'superadmin' | 'developer'>(
    isDevSession ? 'developer' : 'superadmin'
  );

  // QR Code on physical card back (render real scannable QR image)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrPayloadType, setQrPayloadType] = useState<'link' | 'token'>('link');

  // Compute resolved active base URL
  const activeBaseUrl = React.useMemo(() => {
    if (domainMode === 'vercel') return DEFAULT_VERCEL_URL;
    if (domainMode === 'origin') {
      return typeof window !== 'undefined' ? window.location.origin : DEFAULT_VERCEL_URL;
    }
    return customVercelDomain.trim().replace(/\/+$/, '') || DEFAULT_VERCEL_URL;
  }, [domainMode, customVercelDomain]);

  // Links via Vercel domain
  const superadminVercelUrl = `${activeBaseUrl}/?smartcard_auth=${encodeURIComponent(PERMANENT_SUPERADMIN_QR_TOKEN)}`;
  const developerVercelUrl = `${activeBaseUrl}/?smartcard_auth=${encodeURIComponent(PERMANENT_DEVELOPER_QR_TOKEN)}`;
  
  const activeTargetUrl = targetRole === 'developer' ? developerVercelUrl : superadminVercelUrl;
  const tokenToProgram = targetRole === 'developer' ? PERMANENT_DEVELOPER_QR_TOKEN : PERMANENT_SUPERADMIN_QR_TOKEN;
  
  const userRole = targetRole;
  const userName = targetRole === 'developer' 
    ? (session?.nama || 'Ilham Fazril (Developer)') 
    : 'Superadmin Pusat Dinsos Jabar';

  // Persist custom Vercel domain
  const handleCustomDomainChange = (val: string) => {
    setCustomVercelDomain(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('psks_custom_vercel_domain', val);
    }
  };

  // Generate real scannable QR Code image for the card back
  useEffect(() => {
    let isSubscribed = true;
    const contentToEncode = qrPayloadType === 'link' ? activeTargetUrl : tokenToProgram;
    
    generateQRDataUrl(contentToEncode)
      .then((url) => {
        if (isSubscribed) {
          setQrCodeDataUrl(url);
        }
      })
      .catch((e) => {
        console.warn('Error generating QR data URL:', e);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeTargetUrl, tokenToProgram, qrPayloadType]);

  // Copy handlers
  const handleCopySuperadminLink = () => {
    try {
      navigator.clipboard.writeText(superadminVercelUrl);
      setCopiedSuperadminUrl(true);
      setTimeout(() => setCopiedSuperadminUrl(false), 2500);
    } catch (_) {}
  };

  const handleCopyDeveloperLink = () => {
    try {
      navigator.clipboard.writeText(developerVercelUrl);
      setCopiedDeveloperUrl(true);
      setTimeout(() => setCopiedDeveloperUrl(false), 2500);
    } catch (_) {}
  };

  const handleCopyActiveNfcUrl = () => {
    try {
      navigator.clipboard.writeText(activeTargetUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch (_) {}
  };

  const handleCopyToken = () => {
    try {
      navigator.clipboard.writeText(tokenToProgram);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    } catch (_) {}
  };

  // Download QR Code PNG
  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `smartcard_qr_jabar_${targetRole}_${qrPayloadType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Web NFC Writer
  const handleWriteNfcCard = async () => {
    setNfcWriteError(null);
    setNfcWriteStatus('Mempersiapkan sensor NFC... Silakan tempelkan kartu 13,56 MHz ke bagian belakang HP.');
    setIsNfcWriting(true);

    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setIsNfcWriting(false);
      setNfcWriteError('Browser atau perangkat ini belum mendukung Web NFC API secara langsung. Silakan gunakan aplikasi gratis "NFC Tools" di HP dengan menyalin tautan Vercel di bawah.');
      return;
    }

    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [
          { recordType: 'url', data: activeTargetUrl },
          { recordType: 'text', data: tokenToProgram }
        ]
      });

      setIsNfcWriting(false);
      setNfcWriteStatus(`✅ Berhasil! Kartu Smart Card NFC 13,56 MHz telah sukses diprogram untuk ${targetRole === 'developer' ? 'Developer (Ilham Fazril)' : 'Superadmin Pusat'} via domain Vercel. Sekarang kartu ini dapat ditempelkan ke HP mana saja untuk login otomatis!`);
      
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([80, 50, 100]);
        }
      } catch (_) {}
    } catch (err: any) {
      console.warn('NFC Write error:', err);
      setIsNfcWriting(false);
      setNfcWriteError(`Gagal menulis kartu NFC: ${err.message || 'Izin NFC ditolak atau kartu bergeser terlalu cepat.'}`);
    }
  };

  // KHUSUS TAMPILAN SUPERADMIN: HANYA TAMPILAN VISUAL KARTU DAN PANDUAN PENGGUNAAN
  // Tanpa hak melihat atau mengubah link smart card (hak akses eksklusif developer)
  if (!isDevSession) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* 1. SUPERADMIN HEADER BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#043e2e]" />
                <span>Otentikasi Fisik Resmi • Dinsos Prov. Jabar</span>
              </div>
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
                <span>Smart Acces Card</span>
                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                  KARTU SUPERADMIN
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Tampilan visual kartu fisik resmi dan panduan operasional Smart Access Card untuk otentikasi cepat Superadmin Dinas Sosial Provinsi Jawa Barat tanpa perlu mengetik kredensial secara manual.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Kartu Fisik Terdaftar</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>13,56 MHz NFC Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. VISUAL SMART ACCESS CARD (SISI DEPAN & BELAKANG) & PANDUAN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* SISI KARTU INTERAKTIF */}
          <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-200 p-6 flex flex-col justify-between items-center text-center shadow-sm relative overflow-hidden group">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                <CreditCard className="w-4 h-4 text-[#043e2e]" />
                <span>VISUALISASI KARTU SUPERADMIN</span>
              </div>
              <button
                type="button"
                id="btn-flip-superadmin-card"
                onClick={() => setCardFlipped(!cardFlipped)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold text-emerald-800 transition-all cursor-pointer hover:scale-105"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{cardFlipped ? 'Lihat Sisi Depan' : 'Balik (Sisi Belakang)'}</span>
              </button>
            </div>

            {/* Presentation Card Graphic */}
            <div className="my-6 w-full flex flex-col items-center justify-center min-h-[230px]">
              {!cardFlipped ? (
                <div className="w-full flex flex-col items-center animate-fadeIn">
                  <SmartCardGraphic
                    role="superadmin"
                    nama="Superadmin Pusat Dinsos Jabar"
                    isInteractive={true}
                    className="shadow-xl"
                  />
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                    <Fingerprint className="w-3.5 h-3.5 text-[#043e2e]" />
                    <span>Sisi Depan: Chip EMV Emas & Antena NFC Mifare 13,56 MHz</span>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[340px] sm:max-w-[380px] aspect-[16/10] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-[#d4af37] text-white shadow-xl flex flex-col justify-between text-left animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                    <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
                      <span>SMART SECURITY PASSBACK</span>
                    </div>
                    <div className="text-[9px] font-mono font-bold text-slate-300">
                      ID: JBR-002-SA
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3.5 my-auto">
                    <div className="p-1.5 rounded-xl bg-white border-2 border-[#d4af37] shadow-lg flex items-center justify-center shrink-0">
                      {qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code Superadmin"
                          className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded-md"
                        />
                      ) : (
                        <QrCode className="w-18 h-18 text-slate-950" />
                      )}
                    </div>

                    <div className="space-y-1 text-xs min-w-0">
                      <p className="font-extrabold text-white leading-tight truncate">
                        Superadmin Pass (Pusat)
                      </p>
                      <p className="text-[9.5px] text-emerald-300 font-medium leading-snug">
                        Pindai QR fisik dengan kamera ponsel untuk otentikasi seketika.
                      </p>
                      <div className="inline-flex items-center gap-1 text-[8.5px] font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400">
                        <span>HARDWARE AES-256</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[8.5px] text-slate-400 border-t border-slate-800 pt-1.5 flex justify-between items-center">
                    <span>Dinas Sosial Provinsi Jawa Barat</span>
                    <span className="text-amber-400 font-semibold font-mono">RESMI TERVERIFIKASI</span>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-left space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Tipe Kartu:</span>
                <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[10.5px]">
                  Superadmin Pusat
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                <span>Standar Microchip:</span>
                <span className="font-mono font-semibold text-slate-700">Mifare Classic / NTAG 13.56 MHz</span>
              </div>
            </div>
          </div>

          {/* SISI PANDUAN LENGKAP PENGGUNAAN */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            {/* PANDUAN 1: SCAN QR FISIK */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#d4af37] transition-all p-5 sm:p-6 shadow-sm space-y-3.5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-[#043e2e] text-[#d4af37] shadow-md shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                        METODE 1 (OPTICAL SCAN)
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">Universal Kamera HP & Laptop</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      1. Login Cepat QR Code di Belakang Kartu
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-medium">
                  Setiap <strong>Smart Access Card</strong> fisik Superadmin dicetak dengan QR Code beresolusi tinggi di sisi belakang:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-[11px]">
                      <Scan className="w-4 h-4 text-[#043e2e]" />
                      <span>Aplikasi Kamera Bawaan HP:</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Arahkan kamera HP ke sisi belakang kartu. Notifikasi browser akan muncul untuk membuka portal PSKS Jabar dan langsung login otomatis ke akun Superadmin.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-slate-900 text-[11px]">
                      <Lock className="w-4 h-4 text-[#043e2e]" />
                      <span>Pemindai In-Portal Smart Gate:</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Buka modal <strong>Smart Security Gate</strong> pada web PSKS Jabar, arahkan kartu ke webcam laptop untuk otentikasi tanpa input password.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PANDUAN 2: NFC CONTACTLESS TAP */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-600 transition-all p-5 sm:p-6 shadow-sm space-y-3.5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#043e2e] to-emerald-800 text-amber-300 shadow-md shrink-0">
                    <Wifi className="w-6 h-6 rotate-90" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        METODE 2 (CONTACTLESS TAP)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700">Frekuensi 13,56 MHz</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      2. Login Instan Tempel Kartu (NFC)
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-medium">
                  Selain melalui kamera, Smart Access Card juga ditanamkan microchip <strong>Mifare Standard 13,56 MHz</strong> untuk otentikasi sentuh cepat (<em>Contactless Tap-to-Login</em>):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-[#043e2e] text-[11px]">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span>Tempel Kartu ke Belakang HP:</span>
                    </div>
                    <p className="text-[11px] text-slate-700">
                      Cukup tempelkan Smart Card fisik ke sensor NFC smartphone berfitur NFC untuk membuka browser dan login dalam waktu &lt; 0.5 detik.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center gap-2 font-black text-amber-900 text-[11px]">
                      <Cpu className="w-4 h-4 text-amber-700" />
                      <span>Bypass Kredensial Instan:</span>
                    </div>
                    <p className="text-[11px] text-slate-700">
                      Payload terenkripsi yang tertanam di kartu langsung divalidasi oleh portal PSKS Jabar secara aman tanpa risiko lupa kata sandi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. PANDUAN KEAMANAN & INFORMASI HAK AKSES DEVELOPER */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 border-[#d4af37] text-white space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2.5 rounded-xl bg-[#043e2e] text-[#d4af37] border border-[#d4af37]/40 shadow-md">
              <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                KEBIJAKAN HAK AKSES KEAMANAN
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Panduan Operasional & Privasi Kartu Fisik
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Otoritas Developer Sistem</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Hak akses untuk mengubah konfigurasi domain, membuat tautan baru, dan memprogram ulang chip NFC sepenuhnya merupakan wewenang Developer Sistem (Ilham Fazril).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Kerahasiaan Kartu Fisik</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Kartu fisik Smart Access Card adalah tanda pengenal dan kunci akses khusus Superadmin. Harap jaga fisik kartu dan hindari memindahtangankan kepada pihak yang tidak berwenang.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Kartu Hilang atau Rusak</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Apabila kartu fisik mengalami kerusakan fisik, chip tidak merespon, atau kartu hilang, segera hubungi Developer Sistem untuk penonaktifan token dan penerbitan kartu baru.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN RESMI DEVELOPER (TIDAK BERUBAH - AKSES PENUH PENGEMBANG)
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. SECTION HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-slate-200 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#043e2e]" />
              <span>Sistem Otentikasi Smart Card & Integrasi Vercel</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 flex items-center gap-3">
              <span>Smart Access Card</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300">
                VERCEL GATEWAY
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Infrastruktur otentikasi fisik tanpa ketik sandi untuk Superadmin & Developer. Akses bypass terintegrasi langsung dengan domain produksi <strong className="text-emerald-800 font-bold">{DEFAULT_VERCEL_URL}</strong> melalui tautan NDEF, QR Code Terenkripsi, serta chip NFC Mifare 13,56 MHz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-900">
              <Globe className="w-4 h-4 text-emerald-700" />
              <span>Vercel Cloud Online</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>13,56 MHz Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED VERCEL DOMAIN CONFIGURATOR & SWITCHER */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl border-2 border-[#d4af37] p-5 sm:p-6 shadow-xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#043e2e] text-[#d4af37] border border-[#d4af37]/40 shadow-md">
              <Globe className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  DOMAIN VERCEL RESMI
                </span>
                <span className="text-[10px] font-mono text-amber-300">AKUN VERCEL AKTIF</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Pilihan Domain Sumber Smart Card
              </h3>
            </div>
          </div>

          {/* Domain Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold">
            <button
              type="button"
              id="btn-domain-vercel"
              onClick={() => setDomainMode('vercel')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                domainMode === 'vercel'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Vercel Resmi
            </button>
            <button
              type="button"
              id="btn-domain-custom"
              onClick={() => setDomainMode('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                domainMode === 'custom'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚙️ Kustom Vercel
            </button>
            <button
              type="button"
              id="btn-domain-origin"
              onClick={() => setDomainMode('origin')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                domainMode === 'origin'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📍 Host Sesi Ini
            </button>
          </div>
        </div>

        {/* Domain Input / Info Box */}
        {domainMode === 'custom' ? (
          <div className="space-y-2">
            <label className="text-xs font-bold text-amber-300 block">
              Masukkan URL Akun Vercel atau Domain Kustom Anda:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="input-custom-vercel-url"
                value={customVercelDomain}
                onChange={(e) => handleCustomDomainChange(e.target.value)}
                placeholder="https://psks-jabar.vercel.app"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-xs font-mono text-emerald-300 focus:outline-none focus:border-amber-400 shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleCustomDomainChange(DEFAULT_VERCEL_URL)}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer whitespace-nowrap"
              >
                Reset Default
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              *Tautan akan otomatis memperbarui parameter smart card pada seluruh tautan dan kode QR.
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                Basis Domain Tautan Aktif:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                {activeBaseUrl}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                ✅ Rekomendasi Permanen Kartu Fisik
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. DUA TAUTAN VERCEL UTAMA: SUPERADMIN & DEVELOPER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#043e2e]" />
            <span>Tautan Akses Instan Smart Card via Vercel</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            Klik untuk salin atau langsung uji login
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CARD A: LINK SUPERADMIN VERCEL */}
          <div className="bg-white rounded-3xl border-2 border-emerald-300 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-800 to-[#043e2e] text-emerald-200 shadow-md shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      SUPERADMIN PUSAT
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700">Dinsos Jabar</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    Link Smart Card Superadmin (Vercel)
                  </h4>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block">
                URL Tautan Auto-Login Superadmin:
              </label>
              <div className="p-3 rounded-xl bg-slate-900 font-mono text-[10.5px] text-emerald-300 break-all select-all border border-emerald-700/50 shadow-inner">
                {superadminVercelUrl}
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Token Kriptografi: <code className="text-emerald-700 font-bold">{PERMANENT_SUPERADMIN_QR_TOKEN}</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-copy-superadmin-vercel"
                onClick={handleCopySuperadminLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {copiedSuperadminUrl ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Link Superadmin</span>
                  </>
                )}
              </button>

              <a
                href={superadminVercelUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-test-superadmin-vercel"
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-emerald-500"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>Uji Buka Tab</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setTargetRole('superadmin');
                  setCardFlipped(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Pilih dan lihat QR Code kartu"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Lihat QR</span>
              </button>
            </div>
          </div>

          {/* CARD B: LINK DEVELOPER VERCEL (ILHAM FAZRIL) */}
          <div className="bg-white rounded-3xl border-2 border-amber-300 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-amber-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 shadow-md shrink-0">
                  <CreditCard className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                      DEVELOPER UTAMA
                    </span>
                    <span className="text-[10px] font-mono text-amber-800">Ilham Fazril</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                    Link Smart Card Developer (Vercel)
                  </h4>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block">
                URL Tautan Auto-Login Akun Developer:
              </label>
              <div className="p-3 rounded-xl bg-slate-900 font-mono text-[10.5px] text-amber-300 break-all select-all border border-amber-600/50 shadow-inner">
                {developerVercelUrl}
              </div>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Token Kriptografi: <code className="text-amber-700 font-bold">{PERMANENT_DEVELOPER_QR_TOKEN}</code>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-copy-developer-vercel"
                onClick={handleCopyDeveloperLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {copiedDeveloperUrl ? (
                  <>
                    <Check className="w-4 h-4 text-amber-200" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Link Developer</span>
                  </>
                )}
              </button>

              <a
                href={developerVercelUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="btn-test-developer-vercel"
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-amber-500"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                <span>Uji Buka Tab</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setTargetRole('developer');
                  setCardFlipped(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Pilih dan lihat QR Code kartu"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Lihat QR</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE CARD SHOWCASE & SCANNABLE QR ON CARD BACK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: INTERACTIVE 3D VIRTUAL SMART CARD (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-200 p-6 flex flex-col justify-between items-center text-center shadow-sm relative overflow-hidden group">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-xs font-black text-slate-800">
              <CreditCard className="w-4 h-4 text-[#043e2e]" />
              <span>VISUALISASI SMART CARD FISIK</span>
            </div>
            <button
              type="button"
              id="btn-flip-smartcard"
              onClick={() => setCardFlipped(!cardFlipped)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800 transition-all cursor-pointer hover:scale-105"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{cardFlipped ? 'Lihat Depan Kartu' : 'Balik (QR Belakang)'}</span>
            </button>
          </div>

          {/* Interactive Card Presentation Box */}
          <div className="my-6 w-full flex flex-col items-center justify-center min-h-[230px]">
            {!cardFlipped ? (
              <div className="w-full flex flex-col items-center animate-fadeIn">
                <SmartCardGraphic
                  role={userRole}
                  nama={userName}
                  isInteractive={true}
                  className="shadow-xl"
                />
                <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <Fingerprint className="w-3.5 h-3.5 text-[#043e2e]" />
                  <span>Sisi Depan: Chip EMV Emas & Antena NFC Mifare 13,56 MHz</span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[340px] sm:max-w-[380px] aspect-[16/10] rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-[#d4af37] text-white shadow-xl flex flex-col justify-between text-left animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                  <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
                    <span>SMART SECURITY PASSBACK</span>
                  </div>
                  <div className="text-[9px] font-mono font-bold text-slate-300">
                    ID: JBR-{targetRole === 'developer' ? '001-DEV' : '002-SA'}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3.5 my-auto">
                  {/* REAL SCANNABLE QR CODE IMAGE */}
                  <div className="p-1.5 rounded-xl bg-white border-2 border-[#d4af37] shadow-lg flex items-center justify-center shrink-0">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt={`QR Code ${targetRole}`}
                        className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded-md"
                      />
                    ) : (
                      <QrCode className="w-18 h-18 text-slate-950" />
                    )}
                  </div>

                  <div className="space-y-1 text-xs min-w-0">
                    <p className="font-extrabold text-white leading-tight truncate">
                      {targetRole === 'developer' ? 'Developer Pass (Ilham Fazril)' : 'Superadmin Pass (Pusat)'}
                    </p>
                    <p className="text-[9.5px] text-emerald-300 font-medium leading-snug">
                      Pindai dengan kamera ponsel untuk buka web Vercel & auto-login seketika.
                    </p>
                    <div className="inline-flex items-center gap-1 text-[8.5px] font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400">
                      <span>VERCEL AES-256</span>
                    </div>
                  </div>
                </div>

                <div className="text-[8.5px] text-slate-400 border-t border-slate-800 pt-1.5 flex justify-between items-center">
                  <span>Dinas Sosial Provinsi Jawa Barat</span>
                  <span className="text-amber-400 font-semibold font-mono">{qrPayloadType === 'link' ? 'URL Vercel' : 'Raw Token'}</span>
                </div>
              </div>
            )}
          </div>

          {/* QR Options & Download Actions */}
          <div className="w-full bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Target Kartu:</span>
              <div className="flex items-center gap-1 font-black text-xs">
                <button
                  type="button"
                  onClick={() => setTargetRole('superadmin')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    targetRole === 'superadmin'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Superadmin
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRole('developer')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-all ${
                    targetRole === 'developer'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Developer
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-[11px] font-medium text-slate-600">Isi QR Belakang:</span>
              <div className="flex items-center gap-1 text-[10.5px]">
                <button
                  type="button"
                  onClick={() => setQrPayloadType('link')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    qrPayloadType === 'link'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Link Vercel
                </button>
                <button
                  type="button"
                  onClick={() => setQrPayloadType('token')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${
                    qrPayloadType === 'token'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Token Saja
                </button>
              </div>
            </div>

            {cardFlipped && (
              <button
                type="button"
                id="btn-download-smartcard-qr"
                onClick={handleDownloadQr}
                className="w-full mt-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>Unduh Gambar QR Code Siap Cetak (PNG)</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 2 DISTINCT AUTHENTICATION METHOD EXPLANATIONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* METHOD 1: QR CODE ACCESS CARD */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-[#d4af37] transition-all p-5 sm:p-6 shadow-sm space-y-3.5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 to-[#043e2e] text-[#d4af37] shadow-md shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                      METODE 1 (OPTICAL SCAN)
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Universal Kamera HP & Laptop</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    1. Login Cepat QR Code di Belakang Kartu
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p className="font-medium">
                Setiap <strong>Smart Access Card</strong> fisik dicetak dengan QR Code beresolusi tinggi di sisi belakang:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-[11px]">
                    <Scan className="w-4 h-4 text-[#043e2e]" />
                    <span>Aplikasi Kamera Bawaan HP:</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Arahkan kamera HP ke sisi belakang kartu. Notifikasi browser akan muncul untuk membuka domain Vercel resmi dan langsung login otomatis.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-[11px]">
                    <Lock className="w-4 h-4 text-[#043e2e]" />
                    <span>Pemindai In-Portal:</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Buka modal <strong>Smart Security Gate</strong> pada web PSKS Jabar, arahkan kartu ke webcam/kamera laptop untuk otentikasi tanpa input password.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* METHOD 2: NFC (MIFARE 13.56 MHz) TAP AUTHENTICATION */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-emerald-600 transition-all p-5 sm:p-6 shadow-sm space-y-3.5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#043e2e] to-emerald-800 text-amber-300 shadow-md shrink-0">
                  <Wifi className="w-6 h-6 rotate-90" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      METODE 2 (CONTACTLESS TAP)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">Frekuensi 13,56 MHz</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    2. Login Instan Tap Kartu Smart Card (NFC)
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p className="font-medium">
                Selain melalui kamera, Smart Access Card juga ditanamkan microchip <strong>Mifare Standard 13,56 MHz</strong> untuk otentikasi sentuh cepat (*Contactless Tap-to-Login*):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-[#043e2e] text-[11px]">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>TAP Kartu ke Belakang HP:</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Cukup tempelkan Smart Card fisik ke sensor NFC smartphone berfitur NFC untuk membuka browser dan login dalam waktu &lt; 0.5 detik.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-amber-900 text-[11px]">
                    <Cpu className="w-4 h-4 text-amber-700" />
                    <span>Bypass Kredensial Instan:</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Payload NDEF terenkripsi yang tertulis pada kartu langsung divalidasi oleh sistem PSKS Jabar tanpa perlu mengingat atau mengetik password.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 5. PEMROGRAMAN CHIP SMART CARD NFC 13.56 MHz (ONE-TOUCH & NFC TOOLS) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-3xl border-2 border-[#d4af37] p-6 sm:p-7 shadow-xl text-white space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#043e2e] text-[#d4af37] border border-[#d4af37]/40 shadow-lg">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                  MODUL PEMROGRAMAN DEVELOPER
                </span>
                <span className="text-[10px] font-mono text-emerald-400">13,56 MHz (NTAG / MIFARE)</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                Pemrograman Chip Smart Card & Payload NDEF
              </h3>
            </div>
          </div>

          {/* Target Role Selector */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-800 border border-slate-700 text-xs font-bold">
            <button
              type="button"
              id="btn-target-superadmin"
              onClick={() => setTargetRole('superadmin')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                targetRole === 'superadmin'
                  ? 'bg-gradient-to-r from-emerald-600 to-[#043e2e] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👑 Untuk Superadmin
            </button>
            <button
              type="button"
              id="btn-target-developer"
              onClick={() => setTargetRole('developer')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                targetRole === 'developer'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛠️ Untuk Developer (Ilham)
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
          Gunakan modul ini untuk memprogram kartu fisik NFC (Mifare 13,56 MHz / NTAG213 / NTAG215) atau membagikan link akses cepat via domain Vercel. Target aktif: <strong className={targetRole === 'developer' ? 'text-amber-300' : 'text-emerald-400'}>{targetRole === 'developer' ? 'Developer Sistem (Ilham Fazril)' : 'Superadmin Pusat Dinsos Jabar'}</strong>.
        </p>

        {/* ACTIVE TARGET PAYLOAD BOX */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border-2 border-emerald-500/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TAUTAN PAYLOAD AKTIF ({targetRole.toUpperCase()} VIA VERCEL):</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-copy-active-nfc-url"
                onClick={handleCopyActiveNfcUrl}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin URL Vercel</span>
                  </>
                )}
              </button>
              <button
                type="button"
                id="btn-copy-active-token"
                onClick={handleCopyToken}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-amber-200" />
                    <span>Token Tersalin!</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Salin Token ({tokenToProgram})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/80 font-mono text-[10.5px] text-emerald-300 break-all select-all">
            {activeTargetUrl}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            💡 Tautan ini dapat langsung ditempelkan ke aplikasi "NFC Tools" atau diuji langsung pada peramban smartphone.
          </p>
        </div>

        {/* INTERACTIVE ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OPTION A: DIRECT WEB NFC WRITER */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                <Zap className="w-4 h-4" />
                <span>OPSI 1: Tulis Otomatis via Browser (Web NFC API)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tulis langsung ke kartu Smart Card NFC dari HP Android berfitur NFC. Target: <strong className="text-white">{targetRole === 'superadmin' ? 'Superadmin' : 'Developer'}</strong>.
              </p>
            </div>

            {nfcWriteStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-medium leading-relaxed animate-fadeIn">
                {nfcWriteStatus}
              </div>
            )}

            {nfcWriteError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-medium leading-relaxed animate-fadeIn flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{nfcWriteError}</span>
              </div>
            )}

            <button
              type="button"
              id="btn-write-nfc-card"
              onClick={handleWriteNfcCard}
              disabled={isNfcWriting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-4 h-4" />
              <span>{isNfcWriting ? 'Mendengarkan Sensor NFC... Dekatkan Kartu' : `Tulis ke Kartu Smart Card NFC (${targetRole === 'superadmin' ? 'Superadmin' : 'Developer'})`}</span>
            </button>
          </div>

          {/* OPTION B: COPY NDEF RECORD FOR NFC TOOLS APP */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                <Smartphone className="w-4 h-4" />
                <span>OPSI 2: Tulis via Aplikasi "NFC Tools" (Android / iOS)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Salin tautan NDEF Vercel resmi untuk diprogram melalui aplikasi gratis <strong>NFC Tools</strong>:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-[10px] text-emerald-300 break-all select-all">
                {activeTargetUrl}
              </div>
            </div>

            <button
              type="button"
              id="btn-copy-payload-ndef"
              onClick={handleCopyActiveNfcUrl}
              className="w-full py-3 px-4 rounded-xl bg-[#043e2e] hover:bg-[#06533e] border border-[#d4af37] text-[#d4af37] text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Tautan Payload Vercel Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Tautan NDEF ({targetRole === 'superadmin' ? 'Superadmin' : 'Developer'})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* STEP-BY-STEP NFC TOOLS GUIDE */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-300">
            <Info className="w-4 h-4" />
            <span>PANDUAN PRAKTIS PROGRAM KARTU DENGAN APLIKASI GRATIS "NFC TOOLS":</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px] text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300 block">Langkah 1:</span>
              <span>Download aplikasi <strong>NFC Tools</strong> di Play Store / App Store, lalu buka menu <strong>Write (Tulis)</strong>.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300 block">Langkah 2:</span>
              <span>Pilih <strong>Add a record (Tambah Catatan)</strong> ➔ Pilih <strong>URL / URI</strong>.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300 block">Langkah 3:</span>
              <span>Paste (tempel) tautan Vercel yang telah disalin di atas ke dalam kolom URL, lalu klik <strong>OK</strong>.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">Langkah 4: Selesai!</span>
              <span>Klik <strong>Write / 1 Bytes</strong> lalu tempelkan kartu Smart Card 13,56 MHz ke belakang HP.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
