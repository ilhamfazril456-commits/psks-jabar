import React from 'react';
import { DocumentRepoItem } from '../types';
import {
  FileText,
  Download,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
  Layers,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
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
  // Hanya ambil dokumen publik
  const publicDocs = documents.filter((d) => d.status === 'PUBLIK');
  const totalCount = publicDocs.length;
  const totalDownloads = publicDocs.reduce((sum, d) => sum + (d.downloadCount || 0), 0);

  // Ambil 3 sampel dokumen untuk kartu pratinjau
  const featuredDocs = publicDocs.slice(0, 3);

  // Helper styling kartu berdasarkan kategori dokumen (Background tetap putih bersih, aksen dokumen berwarna)
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'regulasi_kemensos':
        return {
          cardBorder: 'border-l-4 border-l-indigo-600 hover:border-indigo-400',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
          downloadBtn: 'text-indigo-700 hover:bg-indigo-50',
          categoryLabel: 'Regulasi Kemensos RI',
        };
      case 'pergub_jabar':
        return {
          cardBorder: 'border-l-4 border-l-amber-600 hover:border-amber-400',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          downloadBtn: 'text-amber-800 hover:bg-amber-50',
          categoryLabel: 'Pergub Jawa Barat',
        };
      case 'sop_juknis':
        return {
          cardBorder: 'border-l-4 border-l-emerald-600 hover:border-emerald-400',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          downloadBtn: 'text-emerald-800 hover:bg-emerald-50',
          categoryLabel: 'SOP & Petunjuk Teknis',
        };
      case 'format_blanko':
        return {
          cardBorder: 'border-l-4 border-l-purple-600 hover:border-purple-400',
          badge: 'bg-purple-50 text-purple-800 border-purple-200',
          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
          downloadBtn: 'text-purple-800 hover:bg-purple-50',
          categoryLabel: 'Format Blanko Resmi',
        };
      case 'panduan_sistem':
      default:
        return {
          cardBorder: 'border-l-4 border-l-teal-600 hover:border-teal-400',
          badge: 'bg-teal-50 text-teal-800 border-teal-200',
          iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
          downloadBtn: 'text-teal-800 hover:bg-teal-50',
          categoryLabel: 'Panduan Sistem SIM-PSKS',
        };
    }
  };

  return (
    <section id="section-publik-unduh-dokumen" className="max-w-7xl mx-auto px-3 sm:px-6 my-8 sm:my-10 scroll-mt-24">
      {/* Container Utama: Polos, Bersih dengan Background Putih */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
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

          {/* Tombol Akses Repositori Bersih & Rapi */}
          <button
            type="button"
            id="btn-lihat-semua-dokumen"
            onClick={onOpenRepository}
            className="inline-flex items-center justify-center gap-2 self-start sm:self-center px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[#0f2b5c] hover:text-blue-700 text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer shrink-0 group"
          >
            <span>Lihat Semua Dokumen ({totalCount})</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Metrik Realtime Sederhana */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 py-3.5 text-xs text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <strong className="text-slate-800">{totalCount}</strong> Dokumen Publik
          </span>
          <span className="flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <strong className="text-slate-800">{totalDownloads.toLocaleString('id-ID')}</strong> Total Unduhan Terdata
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 hidden sm:flex">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Format Standar Resmi PDF & TTE
          </span>
        </div>

        {/* Kartu Dokumen Berwarna (Sesuai Kategori Dokumen) */}
        {featuredDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            {featuredDocs.map((doc) => {
              const styles = getCategoryStyles(doc.category);
              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group ${styles.cardBorder}`}
                >
                  <div className="space-y-2">
                    {/* Baris Kategori & Ukuran */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-md border ${styles.badge} truncate`}>
                        {styles.categoryLabel}
                      </span>
                      <span className="text-slate-400 shrink-0 font-medium">
                        {doc.fileSize}
                      </span>
                    </div>

                    {/* Nomor Regulasi */}
                    <div className="text-[11px] font-semibold text-slate-500 truncate">
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
                      {doc.description}
                    </p>
                  </div>

                  {/* Bagian Bawah Kartu: Info Realtime Unduhan & Tombol Unduh */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
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
                      className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer ${styles.downloadBtn}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
