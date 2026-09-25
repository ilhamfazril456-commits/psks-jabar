import React, { useState, useMemo } from 'react';
import { UserSession, DocumentRepoItem, DocumentCategory } from '../types';
import { DOCUMENT_CATEGORIES } from '../data/defaultDocuments';
import { downloadOfficialPdf } from '../utils/officialPdfGenerator';
import { BackToHomeButton } from './BackToHomeButton';
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  Eye,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  RotateCcw,
  Scale,
  Landmark,
  FileCheck,
  FileSpreadsheet,
  BookOpen,
  Filter,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  X,
  Save,
  Check,
  Printer,
  Calendar,
  Layers,
  ExternalLink,
  QrCode,
  Tag,
  Building2,
  Lock,
  Globe,
  Loader2,
  UploadCloud,
  FileUp,
} from 'lucide-react';

interface DocumentRepositoryPageProps {
  session: UserSession;
  documents: DocumentRepoItem[];
  onBackToHome: () => void;
  onSaveDocument: (doc: DocumentRepoItem) => Promise<boolean>;
  onDeleteDocument: (docId: string) => Promise<boolean>;
  onSeedDefaults: () => Promise<boolean>;
  onIncrementDownload: (docId: string, currentCount: number) => Promise<void>;
}

export const DocumentRepositoryPage: React.FC<DocumentRepositoryPageProps> = ({
  session,
  documents,
  onBackToHome,
  onSaveDocument,
  onDeleteDocument,
  onSeedDefaults,
  onIncrementDownload,
}) => {
  const isSuperadminOrDev =
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) &&
    session.statusActive === 'SAH_TERDAFTAR';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'semua'>('semua');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Loading & Toast state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Preview Modal state
  const [previewDoc, setPreviewDoc] = useState<DocumentRepoItem | null>(null);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentRepoItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategory>('regulasi_kemensos');
  const [formNomor, setFormNomor] = useState('');
  const [formTahun, setFormTahun] = useState<number | string>(2026);
  const [formTanggal, setFormTanggal] = useState('');
  const [formInstansi, setFormInstansi] = useState('Dinas Sosial Provinsi Jawa Barat');
  const [formDescription, setFormDescription] = useState('');
  const [formFileSize, setFormFileSize] = useState('1.5 MB');
  const [formPageCount, setFormPageCount] = useState<number>(10);
  const [formStatus, setFormStatus] = useState<'PUBLIK' | 'INTERNAL_ADMIN'>('PUBLIK');
  const [formTags, setFormTags] = useState('');
  const [formPdfFileName, setFormPdfFileName] = useState('');
  const [formPdfDataUrl, setFormPdfDataUrl] = useState('');
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Deletion Modal state
  const [deletingDoc, setDeletingDoc] = useState<DocumentRepoItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null), 4000;
    });
  };

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Dokumen berstatus INTERNAL_ADMIN hanya dapat dilihat oleh Superadmin / Developer
    if (!isSuperadminOrDev) {
      result = result.filter((d) => d.status === 'PUBLIK');
    }

    if (selectedCategory !== 'semua') {
      result = result.filter((d) => d.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.nomorRegulasi.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.instansi.toLowerCase().includes(q) ||
          (d.tags && d.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [documents, selectedCategory, searchQuery]);

  // Statistics
  const totalCount = documents.length;
  const kemensosCount = documents.filter((d) => d.category === 'regulasi_kemensos').length;
  const pergubCount = documents.filter((d) => d.category === 'pergub_jabar').length;
  const sopCount = documents.filter((d) => d.category === 'sop_juknis').length;
  const blankoCount = documents.filter((d) => d.category === 'format_blanko').length;
  const totalDownloads = documents.reduce((sum, d) => sum + (d.downloadCount || 0), 0);

  // Handle Download PDF
  const handleDownload = async (docItem: DocumentRepoItem) => {
    setDownloadingId(docItem.id);
    try {
      await downloadOfficialPdf(docItem);
      await onIncrementDownload(docItem.id, docItem.downloadCount || 0);
      showToast(`Dokumen "${docItem.title}" berhasil diunduh dalam format PDF resmi!`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Gagal menghasilkan file PDF resmi. Silakan coba kembali.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  // Handle PDF File Upload (Upload PDF yang sudah jadi)
  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Berkas harus berformat PDF resmi (.pdf)!', 'error');
      return;
    }

    setIsReadingPdf(true);
    // Hitung ukuran aktual berkas (KB atau MB) secara realtime apa adanya
    const sizeMb = file.size / (1024 * 1024);
    const sizeStr = sizeMb >= 1 ? `${sizeMb.toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    setFormFileSize(sizeStr);
    setFormPdfFileName(file.name);

    // Otomatis isi judul jika belum diisi oleh admin
    if (!formTitle.trim()) {
      const autoTitle = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[-_]/g, ' ')
        .trim();
      setFormTitle(autoTitle);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormPdfDataUrl(reader.result as string);
      setIsReadingPdf(false);
      showToast(`Berkas "${file.name}" (${sizeStr}) berhasil dimuat!`, 'success');
    };
    reader.onerror = () => {
      setIsReadingPdf(false);
      showToast('Gagal membaca berkas PDF. Silakan pilih kembali.', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFormTitle('');
    setFormCategory('regulasi_kemensos');
    setFormNomor('');
    setFormTahun(new Date().getFullYear());
    setFormTanggal(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    setFormInstansi('Dinas Sosial Provinsi Jawa Barat');
    setFormDescription('');
    setFormFileSize('1.5 MB');
    setFormPageCount(10);
    setFormStatus('PUBLIK');
    setFormTags('PSKS, Jabar, Regulasi');
    setFormPdfFileName('');
    setFormPdfDataUrl('');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: DocumentRepoItem) => {
    setEditingDoc(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormNomor(item.nomorRegulasi);
    setFormTahun(item.tahun);
    setFormTanggal(item.tanggalDitetapkan || '');
    setFormInstansi(item.instansi);
    setFormDescription(item.description);
    setFormFileSize(item.fileSize);
    setFormPageCount(item.pageCount);
    setFormStatus(item.status);
    setFormTags(item.tags ? item.tags.join(', ') : '');
    setFormPdfFileName(item.fileName || '');
    setFormPdfDataUrl(item.fileDataUrl || '');
    setIsFormOpen(true);
  };

  // Save Document
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Judul dokumen wajib diisi!', 'error');
      return;
    }
    if (!formNomor.trim()) {
      showToast('Nomor regulasi kedinasan wajib diisi!', 'error');
      return;
    }

    setIsSaving(true);
    const docId = editingDoc ? editingDoc.id : `doc-${Date.now()}`;
    const parsedTags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const docPayload: DocumentRepoItem = {
      id: docId,
      title: formTitle.trim(),
      category: formCategory,
      nomorRegulasi: formNomor.trim(),
      tahun: formTahun,
      tanggalDitetapkan: formTanggal.trim(),
      instansi: formInstansi.trim(),
      description: formDescription.trim(),
      fileSize: formFileSize.trim() || '1.5 MB',
      pageCount: Number(formPageCount) || 10,
      status: formStatus,
      downloadCount: editingDoc ? editingDoc.downloadCount : 0,
      tags: parsedTags.length > 0 ? parsedTags : ['Regulasi'],
      createdAt: editingDoc ? editingDoc.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: session.nama || 'Superadmin Jabar',
      fileType: 'PDF',
      fileName: formPdfFileName || undefined,
      fileDataUrl: formPdfDataUrl || undefined,
      pdfType: editingDoc?.pdfType || 'uploaded_official_doc',
    };

    const success = await onSaveDocument(docPayload);
    setIsSaving(false);

    if (success) {
      setIsFormOpen(false);
      showToast(editingDoc ? 'Dokumen berhasil diperbarui!' : 'Dokumen baru berhasil diterbitkan!', 'success');
    } else {
      showToast('Gagal menyimpan dokumen ke database. Coba lagi.', 'error');
    }
  };

  // Delete Document
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    const success = await onDeleteDocument(deletingDoc.id);
    if (success) {
      showToast(`Dokumen "${deletingDoc.title}" berhasil dihapus.`, 'success');
    } else {
      showToast('Gagal menghapus dokumen dari server.', 'error');
    }
    setDeletingDoc(null);
  };

  // Reset to Defaults
  const handleConfirmReset = async () => {
    setIsResetConfirmOpen(false);
    const success = await onSeedDefaults();
    if (success) {
      showToast('Seluruh arsip dokumen resmi berhasil dikembalikan ke standar kedinasan!', 'success');
    } else {
      showToast('Gagal memulihkan dokumen bawaan.', 'error');
    }
  };

  const getCategoryMeta = (cat: DocumentCategory | 'semua') => {
    return DOCUMENT_CATEGORIES.find((c) => c.id === cat) || DOCUMENT_CATEGORIES[0];
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-bold transition-all duration-300 animate-slideDown ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50 shadow-emerald-950/40'
              : 'bg-rose-950 text-rose-200 border-rose-500/50 shadow-rose-950/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Bar with Navigation & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <BackToHomeButton onClick={onBackToHome} id="btn-back-top-document-repository" className="w-fit self-start" />

        <div className="text-[11px] sm:text-xs font-bold text-slate-500 bg-white/90 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs text-center sm:text-right">
          <span>Pusat Unduh Dokumen & Regulasi Kedinasan • Dinsos Jabar</span>
        </div>
      </div>

      {/* Hero Banner Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#06152d] via-[#0f2b5c] to-[#1a3a6c] text-white p-6 sm:p-10 shadow-2xl border-2 border-[#d4af37]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>FITUR 10: REPOSITORI & PUSAT DOKUMEN RESMI KEDINASAN</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">
            Pusat Unduh Dokumen & Regulasi Kedinasan
          </h2>

          <p className="text-xs sm:text-base text-blue-100/90 font-medium leading-relaxed">
            Arsip lengkap regulasi resmi Kementerian Sosial RI, Peraturan Gubernur Jawa Barat, Standar Operasional Prosedur (SOP) 10 Pilar PSKS, petunjuk teknis operasional 27 Kabupaten/Kota, serta format blanko kedinasan ber-Tanda Tangan Elektronik (TTE BSrE BSSN).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] sm:text-xs font-semibold text-blue-200">
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 border border-blue-400/30 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Real PDF Generator Ber-Kop Resmi
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 border border-blue-400/30 px-3 py-1 rounded-lg">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              Validasi Kode QR & Segel BSrE
            </span>
            <span className="inline-flex items-center gap-1.5 bg-blue-950/70 border border-blue-400/30 px-3 py-1 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              Dinas Sosial Pemda Provinsi Jawa Barat
            </span>
          </div>
        </div>
      </div>

      {/* Quick Statistics Counters */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Dokumen
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#0f2b5c] mt-1">{totalCount}</div>
          <div className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold mt-0.5">Semua Kategori</div>
        </div>

        <div className="bg-white border border-indigo-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Permensos RI
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-1">{kemensosCount}</div>
          <div className="text-[9px] sm:text-[10px] text-indigo-600 font-semibold mt-0.5">Regulasi Nasional</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider">
            Pergub Jabar
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">{pergubCount}</div>
          <div className="text-[9px] sm:text-[10px] text-amber-600 font-semibold mt-0.5">Payung Hukum Jabar</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
            SOP & Juknis
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">{sopCount}</div>
          <div className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold mt-0.5">Standar Lapangan</div>
        </div>

        <div className="bg-white border border-purple-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs font-bold text-purple-800 uppercase tracking-wider">
            Blanko Resmi
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-950 mt-1">{blankoCount}</div>
          <div className="text-[9px] sm:text-[10px] text-purple-600 font-semibold mt-0.5">Siap Unduh & Isi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Unduhan
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#d4af37] mt-1">
            {totalDownloads.toLocaleString('id-ID')}
          </div>
          <div className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5">Akses Masyarakat</div>
        </div>
      </div>

      {/* Admin Action Bar (Superadmin & Developer) - Ditempatkan rapi di atas filter dokumen, bukan di header atas */}
      {isSuperadminOrDev && (
        <div className="bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#06152d] text-white p-4 sm:p-5 rounded-2xl border-2 border-amber-400/50 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-black text-amber-300 text-xs sm:text-sm uppercase tracking-wider">
                Panel Pengelola Dokumen Kedinasan (Superadmin)
              </div>
              <div className="text-[11px] sm:text-xs text-blue-200 font-medium">
                Terbitkan regulasi baru, kelola naskah TTE resmi, atau pulihkan dokumen ke standar kedinasan.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              id="btn-tambah-dokumen-baru"
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8901c] hover:opacity-95 text-[#0f2b5c] font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md border border-amber-200 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#0f2b5c] stroke-[3]" />
              <span>Tambah Dokumen Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              title="Pulihkan dokumen kedinasan bawaan"
              className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20 transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari regulasi, nomor naskah, topik, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0f2b5c] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0f2b5c] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kotak Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#0f2b5c] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Baris
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {DOCUMENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0f2b5c] text-amber-300 border-[#0f2b5c] shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Listings */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-black text-slate-700">Tidak Ada Dokumen yang Sesuai</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ditemukan dokumen regulasi yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba ganti kata kunci atau pilih kategori lain.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('semua');
            }}
            className="text-xs font-bold text-[#0f2b5c] hover:underline pt-2 inline-block cursor-pointer"
          >
            Bersihkan Pencarian
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (2 per baris di HP, 3 per baris di Laptop) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDocuments.map((docItem) => {
            const catMeta = getCategoryMeta(docItem.category);
            const isDownloading = downloadingId === docItem.id;

            return (
              <div
                key={docItem.id}
                className="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 hover:border-amber-300 p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden text-left hover:-translate-y-1"
              >
                {/* Top Accent Gradient Bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#0f2b5c] via-[#d4af37] to-[#0f2b5c] absolute top-0 left-0" />

                <div className="space-y-3">
                  {/* Category Badge & Security Status */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border leading-none ${catMeta.badgeColor}`}
                    >
                      {catMeta.shortLabel}
                    </span>

                    <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                      {docItem.status === 'PUBLIK' ? (
                        <>
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>Publik</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Internal Admin</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Title & Regulation Number */}
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-[#0f2b5c] group-hover:text-blue-900 transition-colors leading-snug line-clamp-2">
                      {docItem.title}
                    </h3>
                    <div className="text-[11px] font-extrabold text-amber-700 mt-1 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{docItem.nomorRegulasi}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-3">
                    {docItem.description}
                  </p>

                  {/* Metadata Chips */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[120px]">{docItem.instansi}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      <span>{docItem.fileSize} ({docItem.pageCount} Hal)</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Download className="w-3 h-3 text-emerald-600" />
                      <span>{docItem.downloadCount.toLocaleString('id-ID')} unduhan</span>
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(docItem)}
                      className="bg-slate-100 hover:bg-slate-200 text-[#0f2b5c] font-extrabold text-xs py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0f2b5c]" />
                      <span>Pratinjau</span>
                    </button>

                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={() => handleDownload(docItem)}
                      className="bg-gradient-to-r from-[#0f2b5c] to-[#1a4a9c] hover:from-[#143b7d] hover:to-[#2358b5] text-amber-300 font-extrabold text-xs py-2 px-3 rounded-xl shadow-sm border border-amber-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                          <span>Membuat PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-amber-300" />
                          <span>Unduh PDF</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Superadmin & Developer Quick Controls */}
                  {isSuperadminOrDev && (
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(docItem)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Dokumen"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingDoc(docItem)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {filteredDocuments.map((docItem) => {
            const catMeta = getCategoryMeta(docItem.category);
            const isDownloading = downloadingId === docItem.id;

            return (
              <div
                key={docItem.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border leading-none ${catMeta.badgeColor}`}
                    >
                      {catMeta.shortLabel}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700">
                      {docItem.nomorRegulasi}
                    </span>
                    <span className="text-[10px] text-slate-400">• {docItem.tahun}</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-[#0f2b5c]">
                    {docItem.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                    {docItem.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-slate-500 font-semibold pt-1">
                    <span>Instansi: {docItem.instansi}</span>
                    <span>Ukuran: {docItem.fileSize} ({docItem.pageCount} Hal)</span>
                    <span className="text-emerald-700 font-bold">{docItem.downloadCount.toLocaleString('id-ID')} unduhan</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(docItem)}
                    className="bg-slate-100 hover:bg-slate-200 text-[#0f2b5c] font-extrabold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0f2b5c]" />
                    <span>Lihat</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={() => handleDownload(docItem)}
                    className="bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 font-extrabold text-xs py-2 px-4 rounded-xl shadow-xs border border-amber-400/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>Unduh PDF</span>
                  </button>

                  {isSuperadminOrDev && (
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(docItem)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingDoc(docItem)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="pt-6 sm:pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-document-repo" className="w-fit self-start" />
        <div className="text-[11px] sm:text-xs text-slate-500 font-semibold text-center sm:text-right">
          <span>Pusat Unduh Dokumen & Regulasi Kedinasan • Dinas Sosial Provinsi Jawa Barat</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PREVIEW DOKUMEN & KOP RESMI */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-300 overflow-hidden my-3 sm:my-6 flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)]">
            {/* Modal Header */}
            <div className="bg-[#0f2b5c] text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-400/40 shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
                  Pratinjau Dokumen Kedinasan Resmi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Styled Kop Surat & Legal Content */}
            <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm font-sans flex-1">
              {/* Kop Surat Visualizer */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1 relative">
                <div className="text-xs sm:text-sm font-extrabold uppercase text-[#0f2b5c] tracking-wider">
                  Pemerintah Daerah Provinsi Jawa Barat
                </div>
                <div className="text-lg sm:text-2xl font-black uppercase text-[#0f2b5c] tracking-tight">
                  Dinas Sosial
                </div>
                <div className="text-[10px] sm:text-xs text-slate-600">
                  Jalan Raya Rajiman Nomor 6 Telepon (022) 4261452 Fax (022) 4261453 Bandung 40171
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Laman Resmi: dinsos.jabarprov.go.id | Pos-el: info-dinsos@jabarprov.go.id
                </div>
                <div className="h-0.5 w-full bg-[#d4af37] mt-3" />
              </div>

              {/* Title & Regulation Box */}
              <div className="text-center space-y-2 py-2">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                  SALINAN DOKUMEN RESMI
                </div>
                <h4 className="text-base sm:text-lg font-black text-[#0f2b5c] uppercase leading-tight">
                  {previewDoc.title}
                </h4>
                <div className="inline-block bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-black text-slate-800">
                  NOMOR: {previewDoc.nomorRegulasi}
                </div>
              </div>

              {/* Description & Substansi */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-xs font-bold text-[#0f2b5c] uppercase">Deskripsi & Ruang Lingkup:</div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  {previewDoc.description}
                </p>
              </div>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Instansi Penerbit</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{previewDoc.instansi}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Tahun / Tanggal</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{previewDoc.tanggalDitetapkan || previewDoc.tahun}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Format & Ukuran</div>
                  <div className="font-extrabold text-slate-800 mt-0.5">{previewDoc.fileSize} ({previewDoc.pageCount} Halaman)</div>
                </div>
              </div>

              {/* Electronic Signature, Purple Wet Stamp & BSrE Stamp Banner */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-300 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
                {/* Info TTE & Pejabat */}
                <div className="space-y-1.5 text-center md:text-left z-10 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-md border border-blue-200 uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
                    <span>Tersertifikasi Elektronik (TTE) BSrE BSSN</span>
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-[#0f2b5c] uppercase">
                    Kepala Dinas Sosial Pemerintah Daerah Provinsi Jawa Barat
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Drs. H. ANDRA WIJAYA, M.Si.
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Pembina Utama Madya • NIP. 19680514 199303 1 004
                  </div>
                </div>

                {/* Stempel Basah Kedinasan Digital (Warna Ungu/Kebiruan #4338ca) */}
                <div className="shrink-0 flex items-center justify-center relative select-none">
                  <div className="w-24 h-24 rounded-full border-2 border-[#4338ca] text-[#4338ca] flex flex-col items-center justify-center p-1 relative shadow-xs bg-indigo-50/20 rotate-[-4deg]">
                    <div className="w-[86px] h-[86px] rounded-full border border-[#4338ca] flex flex-col items-center justify-center p-1 text-center">
                      <div className="text-[6.5px] font-black tracking-tight leading-none uppercase">PEMDA PROV. JABAR</div>
                      <div className="h-px w-10 bg-[#4338ca] my-0.5" />
                      <div className="text-[8px] font-black uppercase tracking-wider leading-none">DINAS SOSIAL</div>
                      <div className="h-px w-10 bg-[#4338ca] my-0.5" />
                      <div className="text-[5.5px] font-black uppercase tracking-tight">★ RESMI & SAH ★</div>
                    </div>
                  </div>
                </div>

                {/* QR Code Validasi BSrE BSSN */}
                <div className="shrink-0 bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
                  <QrCode className="w-12 h-12 mx-auto text-[#0f2b5c]" />
                  <div className="text-[8px] font-black text-slate-700 mt-1 uppercase">Validasi TTE BSrE</div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
                Telah diunduh sebanyak <strong className="text-slate-800">{previewDoc.downloadCount.toLocaleString('id-ID')} kali</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownload(previewDoc);
                  }}
                  className="w-full sm:w-auto bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md border border-amber-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Unduh Dokumen PDF Asli</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH / EDIT DOKUMEN BARU (SUPERADMIN & DEVELOPER) */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 flex justify-center items-start">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-300 overflow-hidden my-3 sm:my-6 flex flex-col max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)]">
            {/* Modal Header: Selalu tampil di atas, tidak terpotong */}
            <div className="bg-[#0f2b5c] text-white p-4 sm:p-5 flex items-center justify-between border-b border-amber-400/40 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
                  {editingDoc ? 'Edit Data Dokumen Kedinasan' : 'Tambah & Unggah Dokumen PDF Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Dapat di-scroll leluasa di laptop maupun HP */}
            <form id="form-dokumen-kedinasan" onSubmit={handleSaveSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1 min-h-0">
              {/* AREA UPLOAD FILE PDF SUDAH JADI */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50/80 transition-colors">
                <input
                  type="file"
                  id="upload-pdf-file-input"
                  accept="application/pdf"
                  onChange={handlePdfFileSelect}
                  className="hidden"
                />

                {formPdfFileName ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                            PDF Terlampir
                          </span>
                          <span className="text-xs font-bold text-slate-600">{formFileSize}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5" title={formPdfFileName}>
                          {formPdfFileName}
                        </div>
                      </div>
                    </div>
                    <label
                      htmlFor="upload-pdf-file-input"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Ganti PDF</span>
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="upload-pdf-file-input"
                    className="flex flex-col items-center justify-center text-center py-5 px-3 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-200 border border-blue-300 flex items-center justify-center text-blue-700 transition-colors mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-blue-950 group-hover:text-blue-800">
                      Pilih / Unggah Berkas PDF Resmi Kedinasan
                    </span>
                    <span className="text-[11px] text-slate-500 max-w-md mt-1">
                      Superadmin atau Developer dapat langsung mengunggah file PDF yang sudah jadi. Ukuran dan nama file akan terhitung otomatis apa adanya.
                    </span>
                  </label>
                )}
              </div>

              {/* Judul Dokumen */}
              <div>
                <label className="block font-black text-slate-800 mb-1">Judul Dokumen / Regulasi *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Peraturan Menteri Sosial RI Nomor ... tentang ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c] focus:bg-white"
                />
              </div>

              {/* Kategori & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">Kategori Dokumen *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  >
                    <option value="regulasi_kemensos">Regulasi & Permensos RI</option>
                    <option value="pergub_jabar">Peraturan Gubernur Jabar</option>
                    <option value="sop_juknis">SOP & Petunjuk Teknis</option>
                    <option value="format_blanko">Format Blanko & Formulir</option>
                    <option value="panduan_sistem">Panduan SIM-PSKS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">Hak Akses *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'PUBLIK' | 'INTERNAL_ADMIN')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  >
                    <option value="PUBLIK">Publik (Dapat Diunduh Semua)</option>
                    <option value="INTERNAL_ADMIN">Khusus Admin & Operator</option>
                  </select>
                </div>
              </div>

              {/* Nomor Regulasi & Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">Nomor Regulasi / Naskah *</label>
                  <input
                    type="text"
                    required
                    value={formNomor}
                    onChange={(e) => setFormNomor(e.target.value)}
                    placeholder="Contoh: Permensos No. 28/2018"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">Tahun Regulasi *</label>
                  <input
                    type="number"
                    required
                    value={formTahun}
                    onChange={(e) => setFormTahun(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  />
                </div>
              </div>

              {/* Instansi & Tanggal Ditetapkan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">Instansi Penerbit</label>
                  <input
                    type="text"
                    value={formInstansi}
                    onChange={(e) => setFormInstansi(e.target.value)}
                    placeholder="Dinas Sosial Provinsi Jawa Barat"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">Tanggal Ditetapkan</label>
                  <input
                    type="text"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    placeholder="Contoh: 26 Desember 2018"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-black text-slate-800 mb-1">Deskripsi & Ruang Lingkup</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ringkasan isi regulasi, pasal pokok, dan panduan penggunaan..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                />
              </div>

              {/* Ukuran File & Jumlah Halaman */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1">Ukuran File (Otomatis dari PDF)</label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    placeholder="Contoh: 1.8 MB"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1">Jumlah Halaman</label>
                  <input
                    type="number"
                    value={formPageCount}
                    onChange={(e) => setFormPageCount(Number(e.target.value))}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block font-black text-slate-800 mb-1">Tagar (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Karang Taruna, Permensos, Pemuda, PSKS"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-[#0f2b5c]"
                />
              </div>
            </form>

            {/* Modal Footer: Selalu terpancang di bawah, tidak terpotong */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="form-dokumen-kedinasan"
                disabled={isSaving || isReadingPdf}
                className="bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md border border-amber-400/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving || isReadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingDoc ? 'Simpan Perubahan' : 'Terbitkan Dokumen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONFIRMASI HAPUS DOKUMEN */}
      {/* ========================================================================= */}
      {deletingDoc && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border-2 border-rose-300">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h4 className="text-base font-black text-slate-900">Konfirmasi Hapus Dokumen</h4>

            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus dokumen <strong className="text-rose-700">&quot;{deletingDoc.title}&quot;</strong> dari repositori publik?
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI RESET STANDAR KEDINASAN */}
      {/* ========================================================================= */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border-2 border-amber-300">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h4 className="text-base font-black text-slate-900">Pulihkan Dokumen Standar Kedinasan?</h4>

            <p className="text-xs text-slate-600">
              Tindakan ini akan mengembalikan seluruh 10 berkas regulasi resmi (Permensos RI, Pergub Jabar, Juknis TAGANA, SOP 10 Pilar PSKS, dan Blanko Resmi) ke dalam Firestore dan memulihkan pengaturan default.
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="bg-[#0f2b5c] hover:bg-[#143b7d] text-amber-300 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md border border-amber-400/40 transition-all cursor-pointer"
              >
                Pulihkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
