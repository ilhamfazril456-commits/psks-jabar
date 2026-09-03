import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Server,
  KeyRound,
  Eye,
  Search,
  ExternalLink,
  Printer,
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  Globe,
  FileCheck2,
  HelpCircle,
  Hash
} from 'lucide-react';

interface PrivacyTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'privacy' | 'terms';
}

export const PrivacyTermsModal: React.FC<PrivacyTermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const documentType = initialTab; // Strictly separate documents - NO connected button between them

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isPrivacy = documentType === 'privacy';

  // Cetak Dokumen Resmi yang Berfungsi Penuh
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      window.print();
      return;
    }

    const docTitle = isPrivacy
      ? 'KEBIJAKAN PRIVASI & PERLINDUNGAN DATA PRIBADI - DINAS SOSIAL JAWA BARAT'
      : 'SYARAT & KETENTUAN LAYANAN PSKS JABAR - DINAS SOSIAL JAWA BARAT';

    const modalContent = document.getElementById('printable-legal-content')?.innerHTML || '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Playfair+Display:wght@700;900&display=swap');
            @page {
              size: A4;
              margin: 20mm 15mm 20mm 15mm;
            }
            body {
              font-family: 'Plus Jakarta Sans', Arial, sans-serif;
              color: #1e293b;
              line-height: 1.6;
              font-size: 11pt;
              margin: 0;
              padding: 20px;
              background: #fff;
            }
            .kop-surat {
              display: flex;
              align-items: center;
              justify-content: center;
              border-bottom: 3px double #043e2e;
              padding-bottom: 12px;
              margin-bottom: 24px;
              text-align: center;
            }
            .kop-title h1 {
              font-family: 'Playfair Display', serif;
              font-size: 14pt;
              font-weight: 900;
              color: #043e2e;
              margin: 0 0 2px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kop-title h2 {
              font-size: 12pt;
              font-weight: 800;
              color: #064e3b;
              margin: 0 0 4px 0;
              text-transform: uppercase;
            }
            .kop-title p {
              font-size: 8.5pt;
              color: #475569;
              margin: 0;
            }
            .doc-header {
              text-align: center;
              margin-bottom: 24px;
              padding: 12px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
            }
            .doc-header h3 {
              font-size: 13pt;
              font-weight: 900;
              color: #043e2e;
              margin: 0 0 4px 0;
              text-transform: uppercase;
            }
            .doc-meta {
              font-size: 8.5pt;
              color: #64748b;
              font-weight: 600;
            }
            h4, section > div > h3, .section-title {
              font-size: 11pt;
              font-weight: 800;
              color: #043e2e;
              margin-top: 18px;
              margin-bottom: 8px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            p, li {
              font-size: 10pt;
              color: #334155;
              text-align: justify;
            }
            ul, ol {
              padding-left: 20px;
              margin-top: 6px;
              margin-bottom: 12px;
            }
            li {
              margin-bottom: 4px;
            }
            .highlight-box {
              background: #f0fdf4;
              border-left: 4px solid #043e2e;
              padding: 10px 14px;
              margin: 14px 0;
              font-size: 9.5pt;
            }
            .warning-box {
              background: #fff1f2;
              border-left: 4px solid #e11d48;
              padding: 10px 14px;
              margin: 14px 0;
              font-size: 9.5pt;
            }
            .signature-block {
              margin-top: 40px;
              display: flex;
              justify-content: flex-end;
              page-break-inside: avoid;
            }
            .signature-box {
              text-align: center;
              width: 250px;
              font-size: 10pt;
            }
            .sig-space {
              height: 65px;
            }
            .footer-note {
              margin-top: 30px;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
              font-size: 8pt;
              color: #94a3b8;
              text-align: center;
            }
            button, .no-print, input {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            <div class="kop-title">
              <h1>Pemerintah Daerah Provinsi Jawa Barat</h1>
              <h2>Dinas Sosial Provinsi Jawa Barat</h2>
              <p>Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522 • Telp: (022) 6641564</p>
              <p>Laman Resmi: https://dinsos.jabarprov.go.id • Email: dinsos@jabarprov.go.id</p>
            </div>
          </div>

          <div class="doc-header">
            <h3>${docTitle}</h3>
            <div class="doc-meta">
              Nomor Dokumen: DINSOS-JBR/PSKS JABAR/LEGAL/${new Date().getFullYear()} • Status: Berlaku Sah & Mengikat
            </div>
          </div>

          <div class="content-body">
            ${modalContent}
          </div>

          <div class="signature-block">
            <div class="signature-box">
              <p>Ditetapkan di: <strong>Bandung</strong><br/>Pada tanggal: <strong>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
              <p><strong>Kepala Dinas Sosial Provinsi Jawa Barat</strong></p>
              <div class="sig-space"></div>
              <p style="text-decoration: underline; font-weight: bold; margin-bottom: 2px;">OTORITAS PENGELOLA SISTEM INFORMASI</p>
              <p style="font-size: 8.5pt; color: #475569;">NIP. 19740815 199903 1 004</p>
            </div>
          </div>

          <div class="footer-note">
            Dokumen elektronik ini dicetak secara sah melalui Portal Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat.
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      id="privacy-terms-modal-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="privacy-terms-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-[#d4af37] overflow-hidden animate-scaleUp"
      >
        {/* TOP ELEGANT HEADER */}
        <div className="bg-gradient-to-r from-[#043e2e] via-[#064e3b] to-[#022319] text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between border-b-2 border-[#d4af37]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b8901c] to-[#d4af37] text-[#043e2e] flex items-center justify-center shadow-lg font-black shrink-0">
              {isPrivacy ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <Scale className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Dokumen Resmi Dinsos Jabar
                </span>
                <span className="text-[9px] sm:text-[10px] text-amber-300/80 font-mono font-bold">
                  Edisi 2026 • Terverifikasi
                </span>
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight m-0 mt-0.5">
                {isPrivacy
                  ? 'Kebijakan Privasi & Perlindungan Data Pribadi'
                  : 'Syarat & Ketentuan Layanan PSKS Jabar'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="btn-print-legal-doc"
              onClick={handlePrint}
              title="Cetak Dokumen Resmi (PDF/Kertas)"
              className="px-3 py-1.5 rounded-xl bg-emerald-800/80 hover:bg-[#d4af37] text-white hover:text-[#043e2e] border border-[#d4af37]/60 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak Dokumen</span>
            </button>
            <button
              id="btn-close-legal-modal-top"
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="Tutup Jendela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SUBHEADER: SEARCH BAR & METADATA (NO SWITCH TABS) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#043e2e]">
            {isPrivacy ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                <span>Naskah Regulasi Perlindungan Data Pribadi (UU PDP No. 27/2022)</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4 text-[#d4af37]" />
                <span>Naskah Perjanjian Layanan PSKS JABAR & Tata Kelola SPBE Jabar</span>
              </>
            )}
          </div>

          {/* Quick Search inside document */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-legal-clause"
              type="text"
              placeholder="Cari pasal / kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#043e2e] focus:ring-1 focus:ring-[#043e2e] placeholder-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE CONTENT) */}
        <div
          id="printable-legal-content"
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 text-slate-700 text-xs sm:text-[13px] leading-relaxed custom-scrollbar space-y-6"
        >
          {/* ======================================================== */}
          {/* DOKUMEN 1: KEBIJAKAN PRIVASI & PERLINDUNGAN DATA PRIBADI */}
          {/* ======================================================== */}
          {isPrivacy ? (
            <div className="space-y-6">
              {/* Highlight Box */}
              <div className="bg-emerald-50 border-l-4 border-[#043e2e] p-3.5 sm:p-4 rounded-r-2xl shadow-xs">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#043e2e] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-[#043e2e] text-xs sm:text-sm m-0">
                      Komitmen Perlindungan Privasi & Keamanan Data Aparatur & Publik
                    </h3>
                    <p className="text-slate-600 text-[11px] sm:text-xs mt-1 leading-normal m-0">
                      Pemerintah Daerah Provinsi Jawa Barat melalui Dinas Sosial Provinsi Jawa Barat berkomitmen penuh untuk menjunjung tinggi privasi, kerahasiaan, integritas, dan ketersediaan data seluruh aparatur negara, tenaga relawan sosial, serta masyarakat Jawa Barat sesuai amanat <strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong> dan standar SPBE Pemerintah Provinsi Jawa Barat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bab I: Landasan Hukum */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#043e2e] font-black text-xs flex items-center justify-center">1</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAB I — Landasan Hukum Pengelolaan Data
                  </h3>
                </div>
                <p className="text-slate-600">
                  Seluruh rangkaian pengumpulan, pemrosesan, pengolahan, penyimpanan, dan diseminasi data dalam Sistem Informasi Potensi & Sumber Kesejahteraan Sosial (PSKS JABAR) diselenggarakan atas dasar kepatuhan terhadap regulasi perundang-undangan Republik Indonesia, meliputi:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li><strong>Undang-Undang Nomor 27 Tahun 2022</strong> tentang Perlindungan Data Pribadi (UU PDP).</li>
                  <li><strong>Undang-Undang Nomor 11 Tahun 2008</strong> jo. <strong>Undang-Undang Nomor 1 Tahun 2024</strong> tentang Informasi dan Transaksi Elektronik (UU ITE).</li>
                  <li><strong>Undang-Undang Nomor 14 Tahun 2008</strong> tentang Keterbukaan Informasi Publik (UU KIP).</li>
                  <li><strong>Undang-Undang Nomor 11 Tahun 2009</strong> tentang Kesejahteraan Sosial.</li>
                  <li><strong>Peraturan Presiden Nomor 95 Tahun 2018</strong> tentang Sistem Pemerintahan Berbasis Elektronik (SPBE).</li>
                  <li><strong>Peraturan Presiden Nomor 39 Tahun 2019</strong> tentang Satu Data Indonesia.</li>
                  <li><strong>Peraturan Gubernur Jawa Barat</strong> tentang Tata Kelola Sistem Informasi dan Satu Data Kesejahteraan Sosial Jawa Barat.</li>
                </ul>
              </section>

              {/* Bab II: Klasifikasi Data yang Dikelola */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#043e2e] font-black text-xs flex items-center justify-center">2</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAB II — Jenis & Klasifikasi Data yang Dikelola
                  </h3>
                </div>
                <p className="text-slate-600">
                  Sistem mengelola data yang dikelompokkan ke dalam kategori sebagai berikut:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="font-bold text-[#043e2e] flex items-center gap-1.5 text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-[#d4af37]" />
                      Data Akun Kedinasan & Kredensial
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Meliputi Nama Lengkap Petugas, NIP, Wilayah Penugasan (27 Kab/Kota atau Provinsi Jabar), Username, Peran Otorisasi (*Developer*, *Superadmin*, *Admin Wilayah*, *User Terdaftar*), nomor telepon kedinasan, serta Kata Sandi terenkripsi secara satu arah (*one-way hash*).
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="font-bold text-[#043e2e] flex items-center gap-1.5 text-xs">
                      <Users className="w-3.5 h-3.5 text-[#d4af37]" />
                      Data Agregat 10 Pilar PSKS
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Data agregat dan operasional pilar sosial (Peksos, PSM, Tagana, LKS, Karang Taruna, LK3, PSK-M, WKSBM, KSB, Pendamping PKH) yang mencakup jumlah personil, sebaran wilayah kecamatan/desa, legalitas SK, dan status keaktifan kelembagaan di 27 Kabupaten/Kota.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="font-bold text-[#043e2e] flex items-center gap-1.5 text-xs">
                      <Server className="w-3.5 h-3.5 text-[#d4af37]" />
                      Data Forensik Teknis & Audit Trail
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Meliputi catatan alamat IP (*Internet Protocol*), cap waktu (*timestamp*) otentikasi, log penambahan/pengubahan/penghapusan data, jenis peramban, serta status sesi aktif untuk memastikan akuntabilitas forensik.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <h4 className="font-bold text-[#043e2e] flex items-center gap-1.5 text-xs">
                      <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                      Data Akses Publik (Tamu)
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Hanya menyimpan preferensi filter wilayah yang dipilih pengunjung dalam sesi lokal (*transient session*) tanpa mengumpulkan data pribadi sensitif dari masyarakat umum yang mengakses portal.
                    </p>
                  </div>
                </div>
              </section>

              {/* Bab III: Standar Kriptografi & Keamanan Sistem */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#043e2e] font-black text-xs flex items-center justify-center">3</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAB III — Standar Keamanan & Proteksi Siber
                  </h3>
                </div>
                <p className="text-slate-600">
                  Untuk melindungi kerahasiaan data dari akses tidak sah atau ancaman siber eksternal, sistem menerapkan standar teknis tingkat tinggi:
                </p>
                <div className="space-y-2 text-slate-600">
                  <div className="flex items-start gap-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px]"><strong>Enkripsi Adaptif Sandi:</strong> Seluruh kata sandi dilindungi menggunakan fungsi hashing satu arah adaptif dengan garam acak (*salted hashing*) yang tidak dapat didekripsi mentah oleh administrator sekalipun.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px]"><strong>Pertahanan Serangan Brute-Force:</strong> Mekanisme pembekuan akses otomatis (*Lockout Defense*) diaktifkan apabila terjadi 3 kali kegagalan input sandi berturut-turut untuk melindungi akun kedinasan.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px]"><strong>Verifikasi Visual Anti-Bot & QR Dinamis:</strong> Dilengkapi CAPTCHA alfanumerik acak serta kartu akses QR terotentikasi berenkripsi tinggi untuk login cepat petugas resmi.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-[11px]"><strong>Pemisahan Hak Akses Wilayah (RBAC):</strong> Admin kabupaten/kota hanya memiliki wewenang pada data di dalam batas yurisdiksinya tanpa izin modifikasi lintas daerah lain.</span>
                  </div>
                </div>
              </section>

              {/* Bab IV: Hak-Hak Subjek Data Pribadi (UU PDP) */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#043e2e] font-black text-xs flex items-center justify-center">4</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAB IV — Hak-Hak Subjek Data Sesuai UU PDP
                  </h3>
                </div>
                <p className="text-slate-600">
                  Berdasarkan Pasal 5 sampai Pasal 13 Undang-Undang Perlindungan Data Pribadi (UU PDP), setiap aparatur atau pemilik akun terdaftar memiliki hak mutlak sebagai berikut:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <strong className="text-[#043e2e] block mb-1 font-bold">1. Hak Akses & Perbaikan Data</strong>
                    Berhak melihat data pribadi kedinasan yang tersimpan dan meminta koreksi data yang keliru, tidak akurat, atau kedaluwarsa.
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <strong className="text-[#043e2e] block mb-1 font-bold">2. Hak Transparansi & Jejak Rekam</strong>
                    Berhak mengetahui riwayat otentikasi, status aktif sesi, serta catatan perubahan akun dalam rekam jejak audit (*audit trail*).
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <strong className="text-[#043e2e] block mb-1 font-bold">3. Hak Pengaduan & Restriksi</strong>
                    Berhak melaporkan dugaan kebocoran kredensial atau meminta pemulihan akun melalui Helpdesk Resmi Dinas Sosial Jabar.
                  </div>
                </div>
              </section>

              {/* Bab V: Penyimpanan, Retensi, dan Penghapusan Data */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#043e2e] font-black text-xs flex items-center justify-center">5</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAB V — Retensi, Pencadangan, & Penghapusan Akun
                  </h3>
                </div>
                <p className="text-slate-600">
                  Data disimpan di dalam infrastruktur komputasi awan berstandar pemerintah dengan cadangan berkala (*automated backup*). Apabila sebuah akun pengguna dihapus oleh Superadmin atau Developer:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Data kredensial akun bersangkutan secara permanen dihapus dari basis data otentikasi aktif.</li>
                  <li>Kuota/limit pendaftaran perangkat yang bersangkutan secara otomatis dipulihkan/berkurang, memberikan 1 kuota ganti pendaftaran baru.</li>
                  <li>Catatan rekapitulasi agregat pilar kesejahteraan sosial tetap diarsipkan demi kesinambungan statistik program sosial provinsi.</li>
                </ul>
              </section>
            </div>
          ) : (
            /* ======================================================== */
            /* DOKUMEN 2: SYARAT & KETENTUAN LAYANAN PSKS JABAR           */
            /* ======================================================== */
            <div className="space-y-6">
              {/* Highlight Box */}
              <div className="bg-amber-50 border-l-4 border-[#d4af37] p-3.5 sm:p-4 rounded-r-2xl shadow-xs">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-[#b8901c] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-amber-950 text-xs sm:text-sm m-0">
                      Ketentuan Resmi Penggunaan Portal PSKS Jabar
                    </h3>
                    <p className="text-amber-900 text-[11px] sm:text-xs mt-1 leading-normal m-0">
                      Syarat dan Ketentuan Layanan ini mengatur hak, kewajiban, dan tanggung jawab hukum seluruh aparatur, tenaga kesejahteraan sosial, serta masyarakat yang mengakses portal PSKS JABAR Provinsi Jawa Barat. Penggunaan portal ini merupakan bentuk persetujuan mengikat terhadap seluruh klausul di bawah ini.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bagian 1: Ketentuan Umum & Hak Cipta */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center">1</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAGIAN I — Kepemilikan Sistem & Hak Cipta Intelektual
                  </h3>
                </div>
                <p className="text-slate-600">
                  Sistem Informasi Potensi dan Sumber Kesejahteraan Sosial (PSKS JABAR) Jawa Barat beserta seluruh kode sumber, basis data, logo, antarmuka grafis, dan algoritma pendukung adalah hak kekayaan intelektual dan operasional penuh <strong>Pemerintah Daerah Provinsi Jawa Barat</strong> melalui <strong>Dinas Sosial Provinsi Jawa Barat</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Portal ini dibangun untuk menyatukan dan menyinkronkan data 10 pilar potensi sosial di 27 Kabupaten/Kota se-Jawa Barat secara terpadu (*One Data Social*).</li>
                  <li>Dilarang keras menyalin, menduplikasi, memodifikasi kode, memperjualbelikan, atau memanfaatkan aset digital sistem tanpa izin tertulis dari Kepala Dinas Sosial Provinsi Jawa Barat.</li>
                </ul>
              </section>

              {/* Bagian 2: Hak Akses & Klasifikasi Peran */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center">2</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAGIAN II — Hak Akses & Hierarki Peran Pengguna
                  </h3>
                </div>
                <p className="text-slate-600">
                  Tingkatan hak akses pada portal PSKS JABAR diatur secara ketat berdasarkan tugas pokok dan fungsi (Tupoksi):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-[#043e2e] block mb-1 font-bold">1. Developer Administrator</strong>
                    Memegang kewenangan penuh atas arsitektur basis data, kontrol saklar maintenance sistem, dan perbaikan infrastruktur teknis darurat.
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-[#043e2e] block mb-1 font-bold">2. Superadmin Provinsi</strong>
                    Memegang otoritas validasi pusat, penerbitan pengumuman melayang (*floating announcement*), manajemen user, serta rekapitulasi data 27 Kab/Kota.
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-[#043e2e] block mb-1 font-bold">3. Admin Wilayah (27 Kab/Kota)</strong>
                    Bertanggung jawab memvalidasi, memperbarui, dan mengelola entri personil 10 pilar pada wilayah kabupaten/kota masing-masing.
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-[#043e2e] block mb-1 font-bold">4. Pengunjung Publik (Tamu)</strong>
                    Diberikan akses melihat ringkasan agregat, peta persebaran wilayah, dan data statistik sosial terbuka tanpa izin pengeditan.
                  </div>
                </div>
              </section>

              {/* Bagian 3: Kewajiban Pengguna & Larangan Keras */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center">3</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAGIAN III — Kewajiban, Integritas, & Larangan Keras
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <strong className="text-[#043e2e] block mb-1 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Kewajiban Pengguna Terdaftar:
                    </strong>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-700">
                      <li>Mengisi dan memperbarui data pilar sosial dengan data riil, valid, dan dapat dipertanggungjawabkan secara hukum.</li>
                      <li>Menjaga kerahasiaan username, kata sandi, dan Kartu Akses QR resmi milik kedinasan.</li>
                      <li>Melakukan logout setelah selesai menggunakan konsol pengelola di perangkat umum/bersama.</li>
                      <li>Segera melaporkan jika terjadi indikasi penyalahgunaan kredensial dinas kepada administrator pusat.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                    <strong className="text-rose-900 block mb-1 font-bold text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Larangan Mutlak (Tindak Pelanggaran Hukum):
                    </strong>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-950">
                      <li>Meminjamkan, menyewakan, atau mengalihkan akun dinas kepada pihak ketiga tanpa wewenang tertulis.</li>
                      <li>Memalsukan identitas, menginput data fiktif, atau memanipulasi angka rekapitulasi bantuan/pilar sosial.</li>
                      <li>Melakukan upaya peretasan (*hacking*), *scraping*, injeksi script SQL/XSS, atau serangan DDoS terhadap server Dinsos Jabar.</li>
                      <li>Menggunakan bot otomatis untuk melakukan pendaftaran akun massal di luar batas wajar yang ditentukan.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Bagian 4: Mode Pemeliharaan & Saklar Maintenance */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center">4</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAGIAN IV — Pemeliharaan Rutin & Saklar Maintenance
                  </h3>
                </div>
                <p className="text-slate-600">
                  Dinas Sosial Provinsi Jawa Barat berhak mengaktifkan <strong>Saklar Mode Maintenance</strong> sewaktu-waktu untuk keperluan perbaikan darurat, peningkatan performa, audit siber, atau migrasi basis data. Selama masa pemeliharaan, akses login dapat dibatasi sementara demi menjaga integritas dan konsistensi data.
                </p>
              </section>

              {/* Bagian 5: Sanksi Hukum & Yurisdiksi */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-950 font-black text-xs flex items-center justify-center">5</span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                    BAGIAN V — Sanksi Disiplin & Penegakan Hukum ITE
                  </h3>
                </div>
                <p className="text-slate-600">
                  Setiap pelanggaran terhadap ketentuan layanan ini akan ditindaklanjuti secara tegas melalui:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-slate-900 block mb-1 font-bold">1. Sanksi Administratif & Kedinasan</strong>
                    Pemutusan sesi paksa (*Force-Logout*), pencabutan izin akses akun secara permanen, pembekuan status, dan pelaporan berita acara kepada pimpinan instansi terkait serta Badan Kepegawaian Daerah (BKD).
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <strong className="text-slate-900 block mb-1 font-bold">2. Penegakan Hukum Pidana</strong>
                    Proses hukum sesuai <strong>UU No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE</strong> serta Pasal 65–68 <strong>UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi</strong> dengan yurisdiksi Pengadilan Negeri di wilayah Jawa Barat.
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* CONTACT & OFFICIAL HELP CENTER BANNER */}
          <div className="bg-gradient-to-r from-slate-900 to-[#043e2e] text-white p-3.5 sm:p-4 rounded-2xl border border-emerald-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md mt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                <Building2 className="w-4 h-4" />
                <span>Sekretariat & Layanan Pengaduan Dinsos Jabar</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal m-0">
                Jl. Jend. H. Amir Machmud No. 331, Cigugur Tengah, Kec. Cimahi Tengah, Kota Cimahi, Jawa Barat 40522 • Telp: (022) 6641564
              </p>
            </div>
            <a
              href="mailto:dinsos@jabarprov.go.id"
              className="inline-flex items-center gap-1.5 bg-[#d4af37] hover:bg-amber-300 text-[#043e2e] font-black text-xs px-3.5 py-1.5 rounded-xl transition-all shadow shrink-0 cursor-pointer"
            >
              <span>Hubungi Dinsos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dokumen resmi ini mengikat secara sah seluruh pengguna PSKS Jabar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak</span>
            </button>
            <button
              id="btn-close-legal-modal-bottom"
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#043e2e] hover:bg-[#065e44] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Saya Mengerti & Tutup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
