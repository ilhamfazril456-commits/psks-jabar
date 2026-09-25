import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DocumentRepoItem } from '../types';
import {
  FileText,
  Download,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PublicDocumentRepoSectionProps {
  documents: DocumentRepoItem[];
  onOpenRepository: () => void;
  onDownloadDoc?: (doc: DocumentRepoItem) => void;
}

export const PublicDocumentRepoSection: React.FC<PublicDocumentRepoSectionProps> = ({
  documents,
  onOpenRepository,
  onDownloadDoc,
}) => {
  // Hanya ambil dokumen publik yang aktif
  const publicDocs = useMemo(() => {
    return documents.filter((d) => d.status === 'PUBLIK');
  }, [documents]);

  const totalCount = publicDocs.length;
  const totalDownloads = publicDocs.reduce((sum, d) => sum + (d.downloadCount || 0), 0);

  // State untuk ekspansi tampilan HP (Mobile)
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false);

  // Responsive items per view di Laptop/Desktop (3 di layar besar, 2 di tablet/laptop kecil)
  const [itemsPerView, setItemsPerView] = useState<number>(3);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1100) {
          setItemsPerView(3);
        } else if (window.innerWidth >= 768) {
          setItemsPerView(2);
        } else {
          setItemsPerView(1);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Basis data looping agar selalu aman untuk animasi menyambung tanpa patah
  const baseList = useMemo(() => {
    if (publicDocs.length === 0) return [];
    if (publicDocs.length === 1) return publicDocs;
    if (publicDocs.length === 2) return [...publicDocs, ...publicDocs];
    return publicDocs;
  }, [publicDocs]);

  const N = baseList.length;

  // Tiga set data (Kiri, Tengah, Kanan) untuk infinite continuous loop
  const displayDocs = useMemo(() => {
    if (N === 0) return [];
    if (N === 1) return baseList;
    return [...baseList, ...baseList, ...baseList];
  }, [baseList, N]);

  // Index aktif: mulai dari awal blok tengah (N)
  const [currentIndex, setCurrentIndex] = useState<number>(N);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isAnimatingRef = useRef<boolean>(false);

  // Sinkronkan currentIndex jika jumlah dokumen bertambah/berkurang di database
  useEffect(() => {
    setCurrentIndex(N);
  }, [N]);

  // Handler geser maju 1 dokumen
  const handleNext = useCallback(() => {
    if (N <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [N]);

  // Handler geser mundur 1 dokumen
  const handlePrev = useCallback(() => {
    if (N <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [N]);

  // Reset indeks secara hening ketika melewati batas set tengah (Seamless Infinite Loop)
  const handleTransitionEnd = () => {
    isAnimatingRef.current = false;
    if (N <= 1) return;

    if (currentIndex >= 2 * N) {
      // Sudah selesai animasi ke kanan, kembalikan posisi ke set tengah tanpa animasi
      setIsTransitioning(false);
      setCurrentIndex(currentIndex - N);
    } else if (currentIndex < N) {
      // Sudah selesai animasi ke kiri, kembalikan posisi ke set tengah tanpa animasi
      setIsTransitioning(false);
      setCurrentIndex(currentIndex + N);
    }
  };

  // Geser otomatis per 1 dokumen setiap 3 detik di laptop (Berhenti saat di-hover)
  useEffect(() => {
    if (N <= 1 || isHovered) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 3000);

    return () => clearTimeout(timer);
  }, [N, isHovered, currentIndex, handleNext]);

  // Helper styling kartu berdasarkan kategori dokumen (Background putih bersih, aksen dokumen berwarna kedinasan)
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'regulasi_kemensos':
        return {
          cardBorder: 'border-l-4 border-l-indigo-600 hover:border-indigo-400',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          downloadBtn: 'text-indigo-700 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300',
          categoryLabel: 'Regulasi Kemensos RI',
        };
      case 'pergub_jabar':
        return {
          cardBorder: 'border-l-4 border-l-amber-600 hover:border-amber-400',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          downloadBtn: 'text-amber-800 hover:bg-amber-50 border-amber-200 hover:border-amber-300',
          categoryLabel: 'Pergub Jawa Barat',
        };
      case 'sop_juknis':
        return {
          cardBorder: 'border-l-4 border-l-emerald-600 hover:border-emerald-400',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          downloadBtn: 'text-emerald-800 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300',
          categoryLabel: 'SOP & Petunjuk Teknis',
        };
      case 'format_blanko':
        return {
          cardBorder: 'border-l-4 border-l-purple-600 hover:border-purple-400',
          badge: 'bg-purple-50 text-purple-800 border-purple-200',
          downloadBtn: 'text-purple-800 hover:bg-purple-50 border-purple-200 hover:border-purple-300',
          categoryLabel: 'Format Blanko Resmi',
        };
      case 'panduan_sistem':
      default:
        return {
          cardBorder: 'border-l-4 border-l-teal-600 hover:border-teal-400',
          badge: 'bg-teal-50 text-teal-800 border-teal-200',
          downloadBtn: 'text-teal-800 hover:bg-teal-50 border-teal-200 hover:border-teal-300',
          categoryLabel: 'Panduan Sistem SIM-PSKS',
        };
    }
  };

  // Dokumen yang ditampilkan di HP: 3 pertama jika belum diperluas, atau seluruhnya jika diperluas
  const mobileVisibleDocs = isMobileExpanded ? publicDocs : publicDocs.slice(0, 3);

  // Render kartu individual
  const renderDocumentCard = (doc: DocumentRepoItem, uniqueKey: string) => {
    const styles = getCategoryStyles(doc.category);

    return (
      <div
        key={uniqueKey}
        className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group select-text h-full ${styles.cardBorder}`}
      >
        <div className="space-y-2">
          {/* Baris Kategori & Ukuran File */}
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
            <span className={`px-2 py-0.5 rounded-md border ${styles.badge} truncate max-w-[200px]`}>
              {styles.categoryLabel}
            </span>
            <span className="text-slate-400 shrink-0 font-medium">
              {doc.fileSize || 'PDF'}
            </span>
          </div>

          {/* Nomor Regulasi */}
          <div className="text-[11px] font-semibold text-slate-500 truncate" title={doc.nomorRegulasi}>
            {doc.nomorRegulasi}
          </div>

          {/* Judul Dokumen */}
          <h4
            onClick={onOpenRepository}
            className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-700 cursor-pointer transition-colors"
            title={doc.title}
          >
            {doc.title}
          </h4>

          {/* Deskripsi Singkat */}
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {doc.description || 'Dokumen regulasi dan pedoman resmi kedinasan Dinas Sosial Provinsi Jawa Barat.'}
          </p>
        </div>

        {/* Bagian Bawah Kartu: Info Realtime Unduhan & Tombol Unduh */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium text-[10px] sm:text-[11px]">
            {doc.downloadCount > 0 ? `${doc.downloadCount}x diunduh` : 'Belum diunduh'}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onDownloadDoc) {
                onDownloadDoc(doc);
              } else {
                onOpenRepository();
              }
            }}
            className={`inline-flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border bg-white transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ${styles.downloadBtn}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <section id="section-publik-unduh-dokumen" className="max-w-7xl mx-auto px-3 sm:px-6 my-8 sm:my-10 scroll-mt-24">
      {/* Container Utama: Polos, Bersih dengan Background Putih */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-7 md:p-8 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Arsip Resmi Dinas Sosial Provinsi Jawa Barat</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dokumen & Regulasi Kedinasan
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Akses terbuka regulasi resmi Kementerian Sosial RI, Peraturan Gubernur Jawa Barat, petunjuk teknis 10 pilar sosial, serta format blanko kedinasan.
            </p>
          </div>

          {/* Tombol Akses & Navigasi di Header (Khusus Laptop / Layar Lebar) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Tombol Navigasi Manual Geser Per 1 Dokumen */}
            <div className="flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={handlePrev}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                title="Geser 1 Dokumen ke Kiri"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                title="Geser 1 Dokumen ke Kanan"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              id="btn-lihat-semua-dokumen"
              onClick={onOpenRepository}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[#0f2b5c] hover:text-blue-700 text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer group"
            >
              <span>Lihat Semua Dokumen ({totalCount})</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Metrik Realtime Sederhana */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-slate-600 font-medium">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <strong className="text-slate-800">{totalCount}</strong> Dokumen Publik
            </span>
            <span className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <strong className="text-slate-800">{totalDownloads.toLocaleString('id-ID')}</strong> Total Unduhan Terdata
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Format Standar Resmi PDF & TTE
            </span>
          </div>

          {/* Indikator geser otomatis per 1 dokumen setiap 3 detik di laptop */}
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Geser otomatis per 1 dokumen setiap 3 detik (Arahkan kursor untuk menjeda / gunakan tombol panah)</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAMPILAN 1: LAPTOP / DESKTOP (MD KE ATAS) - CAROUSEL GESER PER 1 DOKUMEN MENYAMBUNG */}
        {/* ========================================================================= */}
        <div className="hidden md:block pt-3">
          {publicDocs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Belum ada dokumen publik yang dipublikasikan.
            </div>
          ) : N === 1 ? (
            <div className="max-w-md mx-auto py-2">
              {renderDocumentCard(publicDocs[0], 'single-doc')}
            </div>
          ) : (
            <div
              className="relative overflow-hidden group py-2"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Fade gradient halus di tepi kiri & kanan */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10"></div>
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10"></div>

              {/* Slider Track (Bergeser tepat sejauh 1 dokumen per step) */}
              <div
                className="flex items-stretch"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                  transition: isTransitioning ? 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
                }}
              >
                {displayDocs.map((doc, idx) => (
                  <div
                    key={`carousel-card-${idx}`}
                    className="shrink-0 px-2.5"
                    style={{ width: `${100 / itemsPerView}%` }}
                  >
                    {renderDocumentCard(doc, `laptop-doc-${idx}`)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAMPILAN 2: HP / MOBILE (DI BAWAH MD) - 3 DOKUMEN AWAL + TOMBOL RINGKAS DI BAWAH KE-3 */}
        {/* ========================================================================= */}
        <div className="block md:hidden pt-2 space-y-3.5">
          {publicDocs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada dokumen publik yang dipublikasikan.
            </div>
          ) : (
            <>
              {/* Daftar Dokumen Mobile */}
              <div className="space-y-3">
                {mobileVisibleDocs.map((doc, idx) => (
                  <div key={`mobile-doc-${doc.id}-${idx}`}>
                    {renderDocumentCard(doc, `mobile-${doc.id}-${idx}`)}
                  </div>
                ))}
              </div>

              {/* Tombol di Bawah Dokumen ke-3: Judul Ringkas sesuai Instruksi */}
              {totalCount > 3 && (
                <div className="pt-2">
                  {!isMobileExpanded ? (
                    <button
                      type="button"
                      id="btn-expand-dokumen-mobile"
                      onClick={() => setIsMobileExpanded(true)}
                      className="w-full py-3 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#0f2b5c] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-blue-700" />
                      <span>Lihat Semua Dokumen</span>
                      <ChevronDown className="w-4 h-4 text-blue-700" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="btn-collapse-dokumen-mobile"
                      onClick={() => setIsMobileExpanded(false)}
                      className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                    >
                      <span>Tampilkan Lebih Sedikit</span>
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
