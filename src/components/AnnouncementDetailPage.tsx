import React, { useState } from 'react';
import { AnnouncementConfig, UserSession } from '../types';
import { BackToHomeButton } from './BackToHomeButton';
import {
  Volume2,
  Calendar,
  ShieldCheck,
  Share2,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Printer,
  Sparkles,
  Radio,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface AnnouncementDetailPageProps {
  announcement: AnnouncementConfig;
  session: UserSession;
  onBackToHome: () => void;
}

export const AnnouncementDetailPage: React.FC<AnnouncementDetailPageProps> = ({
  announcement,
  session,
  onBackToHome,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    const fullText = `${announcement.title}\n${announcement.subtitle || ''}\n\n${announcement.content}\n\nDiterbitkan oleh: ${announcement.publishedBy || 'Dinas Sosial Jawa Barat'} (${announcement.publishedAt || ''})`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation & Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-top-announcement-detail" />

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              title="Salin Teks Pengumuman"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
              title="Cetak Dokumen Pengumuman"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden xs:inline">Cetak</span>
            </button>
          </div>
        </div>

        {/* Main Document Card */}
        <article className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Header Banner Background / Photo */}
          {announcement.photoUrl && (
            <div className="relative w-full aspect-video sm:aspect-[21/9] bg-slate-900 overflow-hidden border-b border-amber-200/60">
              <img
                src={announcement.photoUrl}
                alt={announcement.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4 sm:p-8">
                <div className="space-y-2 text-white">
                  <div className="inline-flex items-center gap-1.5 bg-[#043e2e]/90 border border-[#d4af37] px-3 py-1 rounded-full text-[11px] font-extrabold text-amber-300 shadow-md">
                    <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>PENGUMUMAN RESMI DINAS SOSIAL PROVINSI JAWA BARAT</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Article Header & Metadata */}
          <div className="p-6 sm:p-8 lg:p-10 space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  SIARAN TERBIT RESMI
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-semibold bg-slate-100 px-3 py-1 rounded-md">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {announcement.publishedAt || 'Agustus 2026'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#043e2e] leading-tight tracking-tight">
                {announcement.title}
              </h1>

              {announcement.subtitle && (
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 font-semibold leading-relaxed">
                  {announcement.subtitle}
                </p>
              )}
            </div>

            {/* Author / Publisher Banner */}
            <div className="bg-gradient-to-r from-amber-50/80 via-amber-100/40 to-slate-50 border border-amber-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#043e2e] to-[#085a43] text-amber-300 flex items-center justify-center font-black shadow-md border border-amber-400/40">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#043e2e] uppercase tracking-wide">
                    {announcement.publishedBy || 'Otoritas Pusat Dinas Sosial Provinsi Jawa Barat'}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Sistem Pemantauan Terintegrasi 10 Pilar PSKS Jawa Barat
                  </p>
                </div>
              </div>

              {announcement.actionType === 'url' && announcement.linkUrl && (
                <a
                  href={announcement.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#043e2e] text-amber-300 hover:bg-[#065e44] text-xs font-extrabold px-3.5 py-2 rounded-xl border border-amber-400/40 shadow-xs transition-colors"
                >
                  <span>Kunjungi Tautan Terlampir</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Main Rich Content */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Isi Lengkap Pemberitahuan</span>
              </h3>

              <div className="prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal bg-slate-50/60 p-5 sm:p-7 rounded-2xl border border-slate-200/80">
                {announcement.content || 'Tidak ada teks isi pengumuman yang dicantumkan.'}
              </div>
            </div>

            {/* Official Footer Verification Notice */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2 text-[#043e2e] font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Dokumen Sah Otoritas Dinas Sosial Provinsi Jawa Barat</span>
              </div>
              <span>ID Warta: {announcement.id || 'ANNOUNCEMENT-JABAR-2026'}</span>
            </div>
          </div>
        </article>

        {/* Bottom Back Button */}
        <div className="flex justify-center pt-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-announcement-detail" />
        </div>
      </div>
    </div>
  );
};
