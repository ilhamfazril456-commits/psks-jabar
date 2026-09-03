import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  X,
  Camera,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Lock,
  Info,
  Sun,
  Maximize2,
  Wifi,
  CreditCard,
  Radio,
  ArrowLeft,
  Smartphone,
  Scan,
} from 'lucide-react';
import { validateQRCardPayload, validateQRCardPayloadAsync } from '../utils/qrAuth';
import { SmartCardGraphic } from './SmartCardGraphic';

interface QRCardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (role: 'superadmin' | 'developer', nama: string, wilayah: string) => void;
  onOpenPrintCards?: () => void;
  mode?: 'login' | 'check';
  defaultTab?: 'qr' | 'nfc';
}

export const QRCardScannerModal: React.FC<QRCardScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  mode = 'login',
  defaultTab = 'qr',
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [scanSuccessResult, setScanSuccessResult] = useState<{
    nama: string;
    role: string;
    wilayah?: string;
    message: string;
    method?: 'qr' | 'nfc';
  } | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hasZoomSupport, setHasZoomSupport] = useState(false);

  // NFC states
  const [isNfcSupported, setIsNfcSupported] = useState<boolean | null>(null);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [nfcError, setNfcError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const isHandlingScanRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ndefControllerRef = useRef<AbortController | null>(null);

  // Haptic feedback & audio chimes
  const triggerSuccessFeedback = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 60]);
      }
    } catch (_) {}

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const beeps = [
        { delay: 0.0, freq: 1500, dur: 0.06 },
        { delay: 0.08, freq: 1850, dur: 0.06 },
        { delay: 0.16, freq: 2200, dur: 0.12 },
      ];

      beeps.forEach(({ delay, freq, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.7, ctx.currentTime + delay + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur + 0.02);
      });
    } catch (_) {}
  };

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (videoTrackRef.current) {
      try {
        videoTrackRef.current.stop();
      } catch (_) {}
      videoTrackRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setIsCameraStarting(false);
    setTorchEnabled(false);
    setHasTorchSupport(false);
    setHasZoomSupport(false);
  }, []);

  const handleScanResult = useCallback(
    async (decodedText: string, method: 'qr' | 'nfc' = 'qr') => {
      if (isHandlingScanRef.current) return;
      if (!decodedText || typeof decodedText !== 'string') return;

      let result = validateQRCardPayload(decodedText);
      if (!result.valid) {
        try {
          result = await validateQRCardPayloadAsync(decodedText);
        } catch (_) {}
      }

      if (result.valid && result.role) {
        isHandlingScanRef.current = true;
        triggerSuccessFeedback();
        stopCamera();
        stopNfcScanning();

        setScanSuccessResult({
          nama: result.nama || 'Akses Resmi',
          role: result.role === 'developer' ? 'DEVELOPER UTAMA' : 'SUPERADMIN PROVINSI',
          wilayah: result.wilayah || 'PROVINSI JAWA BARAT',
          message: result.message || (method === 'nfc' ? 'Otorisasi Tap SmartCard Berhasil!' : 'Otorisasi Kartu Berhasil!'),
          method,
        });

        if (mode === 'login' && onSuccessLogin) {
          setTimeout(() => {
            onSuccessLogin(result.role!, result.nama!, result.wilayah!);
            onClose();
          }, 600);
        }
      } else {
        if (method === 'qr') {
          setScannerError(result.message || 'Kartu QR tidak valid. Pastikan menggunakan Kartu Akses Resmi PSKS JABAR.');
        } else {
          setNfcError(result.message || 'Data SmartCard tidak valid.');
        }
      }
    },
    [mode, onSuccessLogin, onClose, stopCamera]
  );

  // Multi-engine high-accuracy BarcodeDetector & jsQR continuous frame scanner loop
  const startHardwareEngineLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const canvas = offscreenCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let hasBarcodeDetector = false;
    let barcodeDetector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'data_matrix', 'aztec'],
        });
        hasBarcodeDetector = true;
      } catch (_) {
        hasBarcodeDetector = false;
      }
    }

    let lastScanTime = 0;

    const processFrame = async (timestamp: number) => {
      const videoElem = videoRef.current;
      if (isHandlingScanRef.current || !videoElem || videoElem.readyState < 2 || videoElem.paused || videoElem.ended) {
        if (!isHandlingScanRef.current && isScanning) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
        }
        return;
      }

      // Throttle scan loop to ~30 FPS for high-precision detection
      if (timestamp - lastScanTime > 30) {
        lastScanTime = timestamp;

        // 1. Hardware Accelerated BarcodeDetector API (Ultra-Fast 1-2ms full-frame)
        if (hasBarcodeDetector && barcodeDetector) {
          try {
            const detectedBarcodes = await barcodeDetector.detect(videoElem);
            if (detectedBarcodes && detectedBarcodes.length > 0) {
              for (const code of detectedBarcodes) {
                if (code.rawValue) {
                  handleScanResult(code.rawValue, 'qr');
                  return;
                }
              }
            }
          } catch (_) {}
        }

        // 2. jsQR Multi-Pass High Accuracy Engine
        if (ctx && videoElem.videoWidth > 0 && videoElem.videoHeight > 0) {
          const vw = videoElem.videoWidth;
          const vh = videoElem.videoHeight;

          // Preserve high detail (up to 1280px) for tiny / dense QR codes
          const maxDim = 1280;
          let scale = 1;
          if (vw > maxDim || vh > maxDim) {
            scale = maxDim / Math.max(vw, vh);
          }
          const targetW = Math.floor(vw * scale);
          const targetH = Math.floor(vh * scale);

          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          ctx.drawImage(videoElem, 0, 0, targetW, targetH);
          const imgData = ctx.getImageData(0, 0, targetW, targetH);

          // Pass 1: Standard Full-Frame scan
          let qrCode = jsQR(imgData.data, targetW, targetH, {
            inversionAttempts: 'attemptBoth',
          });

          if (qrCode && qrCode.data) {
            handleScanResult(qrCode.data, 'qr');
            return;
          }

          // Pass 2: High-contrast binarization pass for glare / screen reflection / low contrast
          const data = new Uint8ClampedArray(imgData.data);
          const len = data.length;
          let sumLum = 0;
          for (let i = 0; i < len; i += 4) {
            sumLum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          }
          const threshold = Math.max(80, Math.min(180, (sumLum / (len / 4))));

          for (let i = 0; i < len; i += 4) {
            const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const val = avg > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }

          qrCode = jsQR(data, targetW, targetH, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data) {
            handleScanResult(qrCode.data, 'qr');
            return;
          }

          // Pass 3: Multi-Region / Zoomed Center Scan for tiny or shifted QR codes
          if (targetW > 400 && targetH > 400) {
            const cropW = Math.floor(targetW * 0.65);
            const cropH = Math.floor(targetH * 0.65);
            const cropX = Math.floor((targetW - cropW) / 2);
            const cropY = Math.floor((targetH - cropH) / 2);

            const centerImgData = ctx.getImageData(cropX, cropY, cropW, cropH);
            qrCode = jsQR(centerImgData.data, cropW, cropH, {
              inversionAttempts: 'attemptBoth',
            });

            if (qrCode && qrCode.data) {
              handleScanResult(qrCode.data, 'qr');
              return;
            }
          }
        }
      }

      if (!isHandlingScanRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  const startCamera = async () => {
    if (defaultTab !== 'qr') return;
    setScannerError(null);
    setCameraPermissionDenied(false);
    setIsCameraStarting(true);
    isHandlingScanRef.current = false;

    try {
      stopCamera();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera langsung (getUserMedia).');
      }

      let stream: MediaStream | null = null;

      // Robust 4-level constraint fallback sequence (Back Camera -> Ideal Back -> Front/Webcam -> Any Camera)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Level 1 (back camera 1080p) failed, trying Level 2 (back camera flexible):', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          });
        } catch (err2) {
          console.warn('Level 2 failed, trying Level 3 (laptop webcam / user camera):', err2);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' },
              audio: false,
            });
          } catch (err3) {
            console.warn('Level 3 failed, trying Level 4 (generic video true):', err3);
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
            } catch (err4: any) {
              console.error('All camera constraint levels failed:', err4);
              throw err4;
            }
          }
        }
      }

      if (!stream) {
        throw new Error('Kamera tidak menghasilkan aliran video.');
      }

      mediaStreamRef.current = stream;
      const tracks = stream.getVideoTracks();
      if (tracks && tracks.length > 0) {
        const track = tracks[0];
        videoTrackRef.current = track;

        const capabilities = (track as any).getCapabilities ? (track as any).getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorchSupport(true);
        }
        if (capabilities.zoom) {
          setHasZoomSupport(true);
        }
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          track.applyConstraints({
            advanced: [{ focusMode: 'continuous' } as any],
          }).catch(() => {});
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('video.play() was interrupted or rejected:', playErr);
        }
      }

      setIsScanning(true);
      setIsCameraStarting(false);
      startHardwareEngineLoop();
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setIsScanning(false);
      setIsCameraStarting(false);
      const errStr = (err?.name || err?.message || err?.toString() || '').toLowerCase();
      if (
        errStr.includes('notallowederror') ||
        errStr.includes('permission') ||
        errStr.includes('denied')
      ) {
        setCameraPermissionDenied(true);
        setScannerError(
          'Izin akses kamera belum disetujui browser. Silakan klik tombol "Izinkan Akses Kamera" di bawah atau izinkan pada pengaturan izin situs browser Anda.'
        );
      } else {
        setScannerError(
          'Gagal membuka kamera langsung. Pastikan kamera perangkat Anda aktif, terhubung, dan tidak sedang digunakan oleh aplikasi lain.'
        );
      }
    }
  };

  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    try {
      const nextTorch = !torchEnabled;
      await (videoTrackRef.current as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchEnabled(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const toggleZoom = async () => {
    const nextZoom = zoomLevel === 1 ? 2 : 1;
    setZoomLevel(nextZoom);

    if (videoTrackRef.current && (videoTrackRef.current as any).applyConstraints) {
      try {
        await (videoTrackRef.current as any).applyConstraints({
          advanced: [{ zoom: nextZoom }],
        });
      } catch (_) {}
    }
  };

  // Real Hardware NFC Scanning (Web NFC API)
  const startNfcScanning = async () => {
    setNfcError(null);
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setIsNfcSupported(false);
      return;
    }

    setIsNfcSupported(true);
    try {
      const controller = new AbortController();
      ndefControllerRef.current = controller;

      const ndef = new (window as any).NDEFReader();
      await ndef.scan({ signal: controller.signal });
      setIsNfcScanning(true);

      ndef.onreading = (event: any) => {
        const { message } = event;
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const textDecoder = new TextDecoder(record.encoding || 'utf-8');
            const text = textDecoder.decode(record.data);
            handleScanResult(text, 'nfc');
            return;
          } else if (record.recordType === 'url') {
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(record.data);
            handleScanResult(text, 'nfc');
            return;
          }
        }
      };

      ndef.onreadingerror = () => {
        setNfcError('Gagal membaca chip NFC. Pastikan kartu didekatkan dengan stabil pada sensor NFC perangkat.');
      };
    } catch (err: any) {
      console.warn('NDEFReader scan error:', err);
      setIsNfcScanning(false);
      setNfcError('Sensor NFC belum diizinkan atau tidak aktif pada perangkat ini.');
    }
  };

  const stopNfcScanning = () => {
    if (ndefControllerRef.current) {
      try {
        ndefControllerRef.current.abort();
      } catch (_) {}
      ndefControllerRef.current = null;
    }
    setIsNfcScanning(false);
  };

  // Manage camera/NFC lifecycle on modal open/close
  useEffect(() => {
    let mountTimer: any;

    if (!isOpen) {
      stopCamera();
      stopNfcScanning();
      setScanSuccessResult(null);
      setScannerError(null);
      setNfcError(null);
      isHandlingScanRef.current = false;
      return;
    }

    if (!scanSuccessResult) {
      if (defaultTab === 'qr') {
        stopNfcScanning();
        mountTimer = setTimeout(() => {
          startCamera();
        }, 100);
      } else if (defaultTab === 'nfc') {
        stopCamera();
        startNfcScanning();
      }
    }

    return () => {
      if (mountTimer) clearTimeout(mountTimer);
      stopCamera();
      stopNfcScanning();
    };
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] w-full h-full bg-black flex flex-col select-none overflow-hidden animate-fadeIn">
      {/* ========================================================================= */}
      {/* TOP LUXURY APPBAR (FULL WIDTH HEADER WITH BACK BUTTON) */}
      {/* ========================================================================= */}
      <div className="w-full bg-gradient-to-r from-[#022319] via-[#043e2e] to-[#01140f] text-white px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b-2 border-[#d4af37] shrink-0 z-30 shadow-2xl">
        {/* Tombol Kembali ke Tampilan Sebelumnya */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 bg-black/40 hover:bg-black/70 text-amber-200 hover:text-white px-3.5 py-2 rounded-xl border border-[#d4af37]/40 hover:border-[#d4af37] transition-all cursor-pointer shadow-md group"
          title="Kembali ke Pilihan Smart Card"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform text-[#d4af37]" />
          <span className="font-black text-xs sm:text-sm tracking-wide">Kembali</span>
        </button>

        {/* Center Title & Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#d4af37] text-[#043e2e] text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            {defaultTab === 'qr' ? <QrCode className="w-3 h-3" /> : <Wifi className="w-3 h-3 rotate-90" />}
            <span>{defaultTab === 'qr' ? 'PEMINDAI KODE QR TINGKAT TINGGI' : 'SENSOR TAP SMARTCARD'}</span>
          </div>
          <h2 className="text-sm sm:text-lg font-black text-white m-0 tracking-tight flex items-center justify-center gap-1.5 mt-0.5">
            <CreditCard className="w-4 h-4 text-[#d4af37]" />
            <span>Smart Card PSKS JABAR</span>
          </h2>
        </div>

        {/* Right Action: Close or Flash/Zoom Controls */}
        <div className="flex items-center gap-2">
          {defaultTab === 'qr' && (
            <>
              {hasTorchSupport && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl border transition-all cursor-pointer shadow-md ${
                    torchEnabled
                      ? 'bg-amber-400 text-slate-950 border-white'
                      : 'bg-black/40 text-amber-200 border-white/20 hover:bg-black/60'
                  }`}
                  title={torchEnabled ? 'Matikan Flash' : 'Nyalakan Flash'}
                >
                  <Sun className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={toggleZoom}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer shadow-md flex items-center gap-1 ${
                  zoomLevel > 1
                    ? 'bg-[#d4af37] text-slate-950 border-white'
                    : 'bg-black/40 text-amber-200 border-white/20 hover:bg-black/60'
                }`}
                title="Zoom 2x"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{zoomLevel > 1 ? '2x' : '1x'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white bg-black/40 hover:bg-black/70 p-2 rounded-xl border border-white/20 transition-all cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT: FULL SCREEN IMMERSIVE HUD */}
      {/* ========================================================================= */}
      <div className="relative flex-1 w-full h-full bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
        {/* SUCCESS STATE POPUP OVERLAY */}
        {scanSuccessResult ? (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gradient-to-b from-[#022319] via-[#043e2e] to-[#01140f] text-white rounded-3xl p-6 sm:p-8 text-center space-y-5 border-2 border-[#d4af37] shadow-[0_25px_60px_rgba(212,175,55,0.4)] relative overflow-hidden animate-scaleUp">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#d4af37]/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#d4af37]/20 rounded-full animate-ping pointer-events-none" />
                <div className="absolute -inset-2 bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#f3e5ab] rounded-full blur-md opacity-75" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-[#b8901c] via-[#d4af37] to-[#f3e5ab] text-slate-950 rounded-full flex items-center justify-center shadow-2xl border-2 border-amber-100 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-[#043e2e] stroke-[2.5]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>OTORISASI SMART CARD RESMI</span>
                </span>

                <h3 className="text-2xl font-black text-amber-200 tracking-tight pt-1 m-0">
                  {scanSuccessResult.nama}
                </h3>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest m-0">
                  {scanSuccessResult.role}
                </p>
              </div>

              <div className="bg-[#01140f]/90 border border-[#065e44] rounded-2xl p-4 text-left space-y-2.5 text-xs text-emerald-100 shadow-inner">
                <div className="flex justify-between items-center border-b border-[#065e44] pb-2">
                  <span className="text-emerald-300/70 font-semibold">Status Kartu:</span>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    AKTIF & TEROTORISASI
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#065e44] pb-2">
                  <span className="text-emerald-300/70 font-semibold">Metode Masuk:</span>
                  <span className="font-bold text-amber-200">
                    {scanSuccessResult.method === 'nfc' ? '📡 Sensor NFC Contactless' : '📷 Pemindai Kamera QR Code'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-[#065e44] pb-2">
                  <span className="text-emerald-300/70 font-semibold">Wilayah Tugas:</span>
                  <span className="font-bold text-white">{scanSuccessResult.wilayah || 'PROVINSI JAWA BARAT'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/70 font-semibold">Keamanan:</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    Enkripsi Key Bcrypt Valid
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#f3e5ab] text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Selesai & Masuk</span>
                </button>
              </div>
            </div>
          </div>
        ) : defaultTab === 'qr' ? (
          /* ========================================================================= */
          /* FULL-SCREEN QR CODE CAMERA SCANNER (PAS LAYAR & AKURASI TINGGI)           */
          /* ========================================================================= */
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
            {/* Realtime Video Stream - Full Screen Cover */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: `scale(${zoomLevel})`,
                filter: 'contrast(1.15) brightness(1.02) saturate(1.08)',
              }}
            />

            {/* Dark Mask with Clear Centered Target Area */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
              <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 border-2 border-[#d4af37]/80 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* Gold Reticles on 4 Corners */}
                <div className="absolute -top-3 -left-3 w-10 h-10 border-t-4 border-l-4 border-[#d4af37] rounded-tl-2xl drop-shadow-[0_0_15px_rgba(212,175,55,1)]" />
                <div className="absolute -top-3 -right-3 w-10 h-10 border-t-4 border-r-4 border-[#d4af37] rounded-tr-2xl drop-shadow-[0_0_15px_rgba(212,175,55,1)]" />
                <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-4 border-l-4 border-[#d4af37] rounded-bl-2xl drop-shadow-[0_0_15px_rgba(212,175,55,1)]" />
                <div className="absolute -bottom-3 -right-3 w-10 h-10 border-b-4 border-r-4 border-[#d4af37] rounded-br-2xl drop-shadow-[0_0_15px_rgba(212,175,55,1)]" />

                {/* Laser Scan Line */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent shadow-[0_0_25px_#d4af37] absolute animate-scan-line pointer-events-none z-10" />

                {/* Center Crosshair Target */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-12 h-0.5 bg-[#d4af37]" />
                  <div className="w-0.5 h-12 bg-[#d4af37]" />
                </div>

                {/* Inside Target Badge */}
                <div className="absolute bottom-3 inset-x-0 text-center px-3">
                  <span className="bg-black/80 backdrop-blur-md text-amber-200 font-black text-[10px] sm:text-xs px-3.5 py-1.5 rounded-full border border-amber-300/50 shadow-lg inline-block">
                    Arahkan Kode QR • Deteksi Otomatis Segala Sudut & Posisi
                  </span>
                </div>
              </div>
            </div>

            {/* Top Status Banner Overlay */}
            <div className="absolute top-4 inset-x-0 z-20 flex justify-center px-4">
              <div className="bg-slate-900/90 backdrop-blur-md text-white border border-[#d4af37]/60 font-black text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Sensor Pemindai Omnidirectional Seluruh Layar Aktif</span>
              </div>
            </div>

            {/* Error Banner */}
            {scannerError && (
              <div className="absolute top-16 inset-x-4 max-w-md mx-auto z-30 bg-red-950/90 text-red-200 border-2 border-red-500 p-3 rounded-2xl text-xs font-bold flex items-start gap-2.5 shadow-2xl backdrop-blur-md animate-fadeIn">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{scannerError}</span>
                </div>
              </div>
            )}

            {/* Loading / Starting Camera State */}
            {isCameraStarting && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-3 z-30">
                <div className="w-14 h-14 rounded-full border-4 border-[#d4af37] border-t-transparent animate-spin" />
                <p className="text-sm font-black text-amber-200 m-0">
                  Menyiapkan Pemindai Kamera...
                </p>
                <p className="text-xs text-slate-300 m-0 max-w-xs">
                  Mohon tunggu sebentar atau klik "Izinkan" jika muncul notifikasi izin kamera browser.
                </p>
              </div>
            )}

            {/* Permission Denied UI */}
            {cameraPermissionDenied && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-40">
                <div className="w-16 h-16 bg-amber-500/20 text-[#d4af37] rounded-3xl flex items-center justify-center border-2 border-[#d4af37]/50 shadow-2xl animate-pulse">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-lg font-black text-amber-200 m-0">
                    Izin Akses Kamera Diperlukan
                  </h3>
                  <p className="text-xs text-slate-300 font-medium m-0 leading-relaxed">
                    Aplikasi memerlukan izin akses kamera langsung untuk memindai kode QR pada kartu Smart Card fisik Anda secara real-time.
                  </p>
                </div>

                <div className="w-full max-w-xs space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-3 bg-gradient-to-r from-[#b8901c] via-[#d4af37] to-[#f3e5ab] text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-amber-200"
                  >
                    <Camera className="w-4 h-4 text-slate-950" />
                    <span>Izinkan & Buka Kamera Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-6 inset-x-4 z-20 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={startCamera}
                className="bg-black/70 hover:bg-black/90 text-amber-200 border border-[#d4af37]/60 px-4 py-2.5 rounded-full font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xl backdrop-blur-md"
                title="Muat Ulang Kamera Langsung"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Muat Ulang Kamera</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 px-5 py-2.5 rounded-full font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xl backdrop-blur-md"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Kembali</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* FULL-SCREEN TAP SMARTCARD (NFC CONTACTLESS SENSOR)                        */
          /* ========================================================================= */
          <div className="relative w-full h-full flex flex-col items-center justify-between p-3 sm:p-5 md:p-6 bg-gradient-to-b from-[#022319] via-[#043e2e] to-[#01140f] text-white overflow-y-auto">
            {/* Ambient Background Glow & Radar Pulse */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border border-emerald-400/20 animate-ping opacity-30" />
              <div className="w-80 h-80 sm:w-[420px] sm:h-[420px] rounded-full border border-[#d4af37]/20 animate-pulse opacity-25 absolute" />
              <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-emerald-500/10 blur-3xl absolute" />
            </div>

            {/* Top NFC Status & Critical Notice */}
            <div className="relative z-10 text-center space-y-1.5 shrink-0 my-1 max-w-lg mx-auto w-full px-2">
              <div className="inline-flex items-center gap-2 bg-[#022319]/90 backdrop-blur-md text-[#d4af37] border border-[#d4af37]/50 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-black shadow-lg">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>SENSOR NFC 13.56 MHz AKTIF</span>
              </div>
              
              <p className="text-xs sm:text-sm text-slate-200 font-medium m-0">
                Menunggu deteksi fisik kartu Smart Card pada sensor perangkat
              </p>

              {/* Explicit Mandatory Requirement Notice: NFC Feature & Active State */}
              <div className="bg-[#032d20]/90 border border-[#d4af37]/60 rounded-xl px-3 py-1.5 shadow-md flex items-center justify-center gap-2 text-amber-200 text-[11px] sm:text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Pastikan perangkat Anda memiliki fitur NFC dan dalam kondisi Aktif</span>
              </div>
            </div>

            {/* Center Animated Smart Card Graphic */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center w-full max-w-md px-2 py-1">
              {/* Radio Contactless Waves */}
              <div className="flex items-center justify-center mb-1.5">
                <div className="relative">
                  <Wifi className="w-7 h-7 sm:w-9 sm:h-9 text-cyan-300 rotate-90 animate-pulse drop-shadow-[0_0_12px_#22d3ee]" />
                  <div className="absolute -inset-1.5 rounded-full bg-cyan-400/20 blur-md animate-ping" />
                </div>
              </div>

              {/* Physical Smart Card Representation matching official design with controlled height */}
              <div className="w-full flex justify-center transform transition-transform hover:scale-[1.02]">
                <SmartCardGraphic 
                  role="SUPERADMIN ACCOUNT" 
                  isInteractive={false} 
                  className="!max-w-[290px] sm:!max-w-[340px] md:!max-w-[360px]"
                />
              </div>

              {/* Guide Note with compact, elegant layout */}
              <div className="mt-2.5 sm:mt-3 space-y-0.5 text-center max-w-sm mx-auto px-2">
                <p className="text-xs sm:text-sm font-black text-cyan-200 m-0">
                  Tempelkan Kartu ke Sensor NFC
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium m-0 leading-relaxed">
                  Dekatkan kartu Smart Card ke area sensor NFC smartphone atau alat card reader NFC eksternal laptop Anda.
                </p>
              </div>
            </div>

            {/* Error or Unsupported Notice */}
            {isNfcSupported === false && (
              <div className="relative z-10 w-full max-w-md bg-amber-950/90 border border-amber-400/70 rounded-2xl p-2.5 sm:p-3 text-xs text-amber-200 flex items-start gap-2 shadow-xl backdrop-blur-md my-1 shrink-0">
                <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white text-[11.5px] sm:text-xs m-0">Sensor NFC Browser Tidak Terdeteksi Otomatis</p>
                  <p className="text-[10.5px] sm:text-[11px] text-amber-200/90 mt-0.5 m-0 leading-relaxed">
                    Fitur Web NFC aktif pada Android Chrome atau card reader NFC terhubung. Pada laptop tanpa NFC, gunakan <strong>Pemindai Kamera QR</strong>.
                  </p>
                </div>
              </div>
            )}

            {nfcError && (
              <div className="relative z-10 w-full max-w-md bg-red-950/90 border border-red-400 rounded-xl p-2.5 text-xs text-red-200 flex items-center gap-2 my-1 shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[11px] sm:text-xs">{nfcError}</span>
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="relative z-10 w-full max-w-md flex items-center justify-center gap-3 shrink-0 my-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 sm:py-3 bg-slate-900/90 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all cursor-pointer shadow-xl border border-white/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <ArrowLeft className="w-4 h-4 text-[#d4af37]" />
                <span>Kembali ke Pilihan Smart Card</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
