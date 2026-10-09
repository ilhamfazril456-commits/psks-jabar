import React, { useState, useMemo } from 'react';
import { UserSession, PortalFaqItem } from '../types';
import { FAQ_CATEGORIES, DEFAULT_PORTAL_FAQS } from '../data/defaultFaqs';
import { BackToHomeButton } from './BackToHomeButton';
import {
  ArrowLeft,
  Plus,
  Search,
  RotateCcw,
  Edit3,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
  Layers,
  FileCheck2,
  ShieldCheck,
  Headphones,
  BookOpen,
  Sparkles,
  AlertTriangle,
  X,
  Save,
  Check,
  Filter,
} from 'lucide-react';

interface FAQManagementPageProps {
  session: UserSession;
  faqs?: PortalFaqItem[];
  onBackToHome: () => void;
  onSaveFaq: (faq: PortalFaqItem) => Promise<boolean>;
  onDeleteFaq: (faqId: string) => Promise<boolean>;
  onSeedDefaults: () => Promise<boolean>;
}

export const FAQManagementPage: React.FC<FAQManagementPageProps> = ({
  session,
  faqs = DEFAULT_PORTAL_FAQS,
  onBackToHome,
  onSaveFaq,
  onDeleteFaq,
  onSeedDefaults,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<PortalFaqItem | null>(null);

  // Form states
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('pilar_psks');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [activeTabPreview, setActiveTabPreview] = useState<'editor' | 'preview'>('editor');

  // Deletion & Reset Confirm states
  const [deletingFaq, setDeletingFaq] = useState<PortalFaqItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Loading & Toast states
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Stats calculation
  const totalCount = faqs.length;
  const activeCount = faqs.filter((f) => f.isActive !== false).length;
  const draftCount = faqs.filter((f) => f.isActive === false).length;

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    let result = [...faqs];

    if (filterCategory !== 'semua') {
      result = result.filter((f) => f.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => a.order - b.order);
  }, [faqs, filterCategory, searchQuery]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingFaq(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormCategory('pilar_psks');
    // Calculate next order
    const maxOrder = faqs.reduce((max, item) => Math.max(max, item.order || 0), 0);
    setFormOrder(maxOrder + 1);
    setFormIsActive(true);
    setActiveTabPreview('editor');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (faq: PortalFaqItem) => {
    setEditingFaq(faq);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category || 'pilar_psks');
    setFormOrder(faq.order || 1);
    setFormIsActive(faq.isActive !== false);
    setActiveTabPreview('editor');
    setIsModalOpen(true);
  };

  // Save form submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      showToast('Pertanyaan dan Jawaban wajib diisi!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const itemToSave: PortalFaqItem = {
        id: editingFaq ? editingFaq.id : `faq-${Date.now()}`,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        category: formCategory,
        order: Number(formOrder) || 1,
        isActive: formIsActive,
        createdAt: editingFaq?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: session.nama || 'Superadmin Dinsos',
      };

      await onSaveFaq(itemToSave);
      setIsModalOpen(false);
      showToast(
        editingFaq
          ? 'Perubahan pertanyaan FAQ berhasil disimpan!'
          : 'Pertanyaan FAQ baru berhasil ditambahkan dan ditayangkan!'
      );
    } catch (err: any) {
      console.error('Error saving FAQ:', err);
      showToast('Gagal menyimpan data FAQ: ' + (err.message || 'Kesalahan jaringan'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Direct toggle active status
  const handleToggleActive = async (faq: PortalFaqItem) => {
    try {
      const updated: PortalFaqItem = {
        ...faq,
        isActive: !faq.isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: session.nama || 'Superadmin Dinsos',
      };
      await onSaveFaq(updated);
      showToast(
        updated.isActive
          ? `Pertanyaan "${faq.question.slice(0, 30)}..." kini AKTIF ditayangkan ke publik.`
          : `Pertanyaan "${faq.question.slice(0, 30)}..." kini DINONAKTIFKAN (Draft).`
      );
    } catch (err: any) {
      showToast('Gagal mengubah status tayang: ' + err.message, 'error');
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingFaq) return;
    setIsSaving(true);
    try {
      await onDeleteFaq(deletingFaq.id);
      showToast(`Pertanyaan "${deletingFaq.question.slice(0, 30)}..." berhasil dihapus.`);
      setDeletingFaq(null);
    } catch (err: any) {
      showToast('Gagal menghapus pertanyaan: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm reset to defaults
  const handleConfirmReset = async () => {
    setIsSaving(true);
    try {
      await onSeedDefaults();
      showToast('Daftar FAQ berhasil dipulihkan ke 11 pertanyaan bawaan resmi Dinas Sosial Jabar!');
      setIsResetConfirmOpen(false);
    } catch (err: any) {
      showToast('Gagal memulihkan FAQ bawaan: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'pilar_psks':
        return <Layers className="w-3.5 h-3.5" />;
      case 'pendaftaran':
        return <FileCheck2 className="w-3.5 h-3.5" />;
      case 'akun_keamanan':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'bantuan_kontak':
        return <Headphones className="w-3.5 h-3.5" />;
      default:
        return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  const getCategoryLabel = (catId: string) => {
    const found = FAQ_CATEGORIES.find((c) => c.id === catId);
    return found ? found.label : catId;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs sm:text-sm font-bold transition-all transform duration-300 animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600 shadow-emerald-900/30'
              : 'bg-rose-800 text-white border-rose-600 shadow-rose-900/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Banner */}
      <header className="bg-gradient-to-r from-[#043e2e] via-[#0d3b2f] to-[#128c7e] text-white py-6 sm:py-8 px-4 sm:px-8 shadow-lg border-b border-emerald-700/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="mb-3">
              <BackToHomeButton onClick={onBackToHome} variant="glass" id="btn-back-top-faq-manage" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 uppercase tracking-wider">
                Pusat Kendali Superadmin & Developer
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2">
              <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300" />
              <span>Kelola Tanya Jawab Portal (FAQ Management)</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
              Tambah, edit, hapus, dan atur prioritas pertanyaan yang sering diajukan di portal publik PSKS Jabar secara *realtime* di Supabase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={handleOpenCreateModal}
              className="flex-1 md:flex-initial bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-[#043e2e] font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tambah FAQ Baru</span>
            </button>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 sm:py-3 rounded-xl border border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Pulihkan ke 11 Pertanyaan Default"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 sm:mt-8 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Pertanyaan
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{totalCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-emerald-200 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
            <p className="text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Tayang Aktif</span>
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700">{activeCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-amber-200 shadow-xs bg-gradient-to-br from-white to-amber-50/40">
            <p className="text-[11px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Draft (Nonaktif)</span>
            </p>
            <p className="text-xl sm:text-2xl font-black text-amber-700">{draftCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Kategori</span>
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {FAQ_CATEGORIES.length - 1} Kategori
            </p>
          </div>
        </div>

        {/* Toolbar (Search & Filter) */}
        <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam daftar pertanyaan atau jawaban..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:border-emerald-600 focus:bg-white outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Table / Card List */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Belum ada pertanyaan yang cocok
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Tidak ada data FAQ yang sesuai dengan filter atau kata kunci saat ini.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pertanyaan Sekarang</span>
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div
                key={faq.id}
                className={`bg-white rounded-xl sm:rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
                  faq.isActive !== false
                    ? 'border-slate-200 hover:border-slate-300 shadow-xs'
                    : 'border-amber-200 bg-amber-50/20 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                  {/* Left: Order, Category, Question, & Answer Preview */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                      #{faq.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          {getCategoryIcon(faq.category)}
                          <span>{getCategoryLabel(faq.category)}</span>
                        </span>
                        {faq.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Eye className="w-3 h-3 text-emerald-700" />
                            <span>Tayang Publik</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <EyeOff className="w-3 h-3 text-amber-700" />
                            <span>Draft (Disembunyikan)</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-2">
                        {faq.question}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-normal">
                        {faq.answer}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span>Diperbarui: {new Date(faq.updatedAt || Date.now()).toLocaleDateString('id-ID')}</span>
                        {faq.updatedBy && <span>• Oleh: {faq.updatedBy}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-start shrink-0 pt-1">
                    {/* Toggle Active Switch */}
                    <button
                      onClick={() => handleToggleActive(faq)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border ${
                        faq.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={faq.isActive !== false ? 'Sembunyikan dari publik' : 'Tayangkan ke publik'}
                    >
                      {faq.isActive !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{faq.isActive !== false ? 'Aktif' : 'Draft'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(faq)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Edit Pertanyaan & Jawaban"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingFaq(faq)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer border border-rose-200/60"
                      title="Hapus Pertanyaan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="pt-6 sm:pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-faq-manage" className="w-fit self-start" />
          <div className="text-[11px] sm:text-xs text-slate-500 font-semibold text-center sm:text-right">
            <span>Portal Tanya Jawab Resmi (FAQ) • Dinas Sosial Provinsi Jawa Barat</span>
          </div>
        </div>
      </main>

      {/* MODAL: Tambah / Edit FAQ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-fadeIn pt-14 sm:pt-6 pb-12">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto max-h-[85vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0 sticky top-0 z-10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
                  {editingFaq ? 'Mode Sunting Data' : 'Tambah Pertanyaan Baru'}
                </span>
                <h3 className="text-base sm:text-lg font-black leading-tight mt-0.5">
                  {editingFaq ? 'Edit Pertanyaan & Jawaban FAQ' : 'Buat FAQ Baru untuk Portal'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              {/* Category & Order Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori FAQ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:border-emerald-600 focus:bg-white outline-none"
                  >
                    <option value="pilar_psks">10 Pilar PSKS</option>
                    <option value="pendaftaran">Pendaftaran Mandiri</option>
                    <option value="akun_keamanan">Akun & Keamanan Data</option>
                    <option value="bantuan_kontak">Bantuan & Layanan Dinsos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Urut Prioritas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:border-emerald-600 focus:bg-white outline-none"
                    placeholder="Contoh: 1, 2, 3..."
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Urutan lebih kecil (misal 1) akan muncul paling atas.
                  </span>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 focus:border-emerald-600 focus:bg-white outline-none"
                  placeholder="Contoh: Bagaimana cara mendaftar anggota Karang Taruna?"
                />
              </div>

              {/* Answer Tab Switcher: Editor vs Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-700">
                    Jawaban Resmi <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveTabPreview('editor')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                        activeTabPreview === 'editor'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Editor Teks
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTabPreview('preview')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                        activeTabPreview === 'preview'
                          ? 'bg-white text-emerald-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pratinjau Hasil
                    </button>
                  </div>
                </div>

                {activeTabPreview === 'editor' ? (
                  <>
                    <textarea
                      required
                      rows={6}
                      value={formAnswer}
                      onChange={(e) => setFormAnswer(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-medium text-slate-900 focus:border-emerald-600 focus:bg-white outline-none leading-relaxed"
                      placeholder="Tuliskan jawaban yang ringkas, jelas, dan akurat. Mendukung format cetak tebal **kata** dan daftar poin bullet (- poin)..."
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Tip: Gunakan tanda bintang ganda (contoh: <code>**teks tebal**</code>) untuk menebalkan kata penting.
                    </span>
                  </>
                ) : (
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[150px] text-slate-700 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">
                    {formAnswer ? (
                      formAnswer
                    ) : (
                      <span className="text-slate-400 italic">Belum ada teks jawaban untuk dipratinjau.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Toggle Tayang Switch */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Status Tayang ke Publik</p>
                  <p className="text-[11px] text-slate-500">
                    {formIsActive
                      ? 'Pertanyaan ini akan langsung muncul di beranda portal publik.'
                      : 'Pertanyaan ini hanya tersimpan sebagai draft dan tidak terlihat oleh publik.'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {deletingFaq && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Hapus Pertanyaan FAQ Ini?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Pertanyaan &quot;<span className="font-bold text-slate-800">{deletingFaq.question}</span>&quot; akan dihapus permanen dari portal. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingFaq(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Reset ke Default */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-amber-200 shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Pulihkan ke Pertanyaan Bawaan?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Sistem akan memulihkan 11 daftar pertanyaan FAQ bawaan resmi Dinas Sosial Jawa Barat ke database Supabase.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Memproses...' : 'Ya, Pulihkan Default'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
