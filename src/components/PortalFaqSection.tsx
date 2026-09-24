import React, { useState, useMemo } from 'react';
import { PortalFaqItem } from '../types';
import { FAQ_CATEGORIES, DEFAULT_PORTAL_FAQS } from '../data/defaultFaqs';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Bot,
  ExternalLink,
  BookOpen,
  Layers,
  FileCheck2,
  ShieldCheck,
  Headphones,
  X,
} from 'lucide-react';

interface PortalFaqSectionProps {
  faqs?: PortalFaqItem[];
  onOpenAiAssistant?: () => void;
  onOpenContact?: () => void;
}

export const PortalFaqSection: React.FC<PortalFaqSectionProps> = ({
  faqs = DEFAULT_PORTAL_FAQS,
  onOpenAiAssistant,
  onOpenContact,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    'faq-1': true, // Open the first FAQ by default for immediate preview
  });

  // Toggle accordion open/closed
  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand all / Collapse all
  const handleToggleAll = (expand: boolean) => {
    const nextState: Record<string, boolean> = {};
    if (expand) {
      filteredFaqs.forEach((faq) => {
        nextState[faq.id] = true;
      });
    }
    setOpenFaqIds(nextState);
  };

  // Filter FAQs (only show active ones to public)
  const activeFaqs = useMemo(() => {
    const source = faqs && faqs.length > 0 ? faqs : DEFAULT_PORTAL_FAQS;
    return source.filter((item) => item.isActive !== false);
  }, [faqs]);

  // Apply search query and category filter
  const filteredFaqs = useMemo(() => {
    let result = activeFaqs;

    if (selectedCategory !== 'semua') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => a.order - b.order);
  }, [activeFaqs, selectedCategory, searchQuery]);

  // Category Icon mapper
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

  const getCategoryBadgeLabel = (catId: string) => {
    const found = FAQ_CATEGORIES.find((c) => c.id === catId);
    return found ? found.label : 'Umum';
  };

  // Helper to format Markdown answer to clean JSX
  const renderFormattedAnswer = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Empty lines as spacing
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Check for bullet list items
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const isNumber = /^\d+\.\s/.test(line.trim());

      // Parse bolding **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const content = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet || isNumber) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-1 sm:ml-2 my-1 text-slate-700">
            <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
            <span className="leading-relaxed">{content}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed text-slate-700 my-1">
          {content}
        </p>
      );
    });
  };

  return (
    <section
      id="section-faq-portal"
      className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-14"
      aria-label="Pertanyaan yang Sering Diajukan"
    >
      {/* Container Card with Subtle Modern Backdrop */}
      <div className="bg-gradient-to-b from-white via-slate-50/70 to-emerald-50/20 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xl shadow-slate-200/50">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider mb-3 border border-emerald-300/80 shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>Pusat Tanya Jawab Resmi (FAQ)</span>
          </div>
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-2 sm:mb-3">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Dapatkan informasi lengkap dan transparan seputar 10 Pilar Potensi dan Sumber Kesejahteraan Sosial (PSKS), tata cara pendaftaran relawan mandiri, hingga layanan Dinas Sosial Provinsi Jawa Barat.
          </p>
        </div>

        {/* Search Bar & Stats */}
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 sm:left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pertanyaan... (contoh: syarat, verifikasi, pilar, KUBE, gratis)"
              className="w-full bg-white text-slate-900 text-xs sm:text-sm pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/20 shadow-sm transition-all outline-none placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 mb-6 sm:mb-8 scrollbar-thin scrollbar-thumb-slate-300">
          {FAQ_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-800/20 scale-[1.02]'
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Counter & Expand/Collapse All */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
          <span className="font-semibold">
            Menampilkan <span className="text-emerald-700 font-bold">{filteredFaqs.length}</span> pertanyaan
            {selectedCategory !== 'semua' && ` pada kategori "${getCategoryBadgeLabel(selectedCategory)}"`}
          </span>
          {filteredFaqs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAll(true)}
                className="text-[11px] font-semibold text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Buka Semua
              </button>
              <span>•</span>
              <button
                onClick={() => handleToggleAll(false)}
                className="text-[11px] font-semibold text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          )}
        </div>

        {/* FAQ List / Accordion */}
        <div className="space-y-2.5 sm:space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 sm:py-14 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
              <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                Tidak ditemukan pertanyaan yang cocok
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Kata kunci &quot;{searchQuery}&quot; tidak cocok dengan daftar pertanyaan FAQ saat ini. Anda dapat menanyakannya langsung ke Asisten AI kami.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('semua');
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filter
                </button>
                {onOpenAiAssistant && (
                  <button
                    onClick={onOpenAiAssistant}
                    className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Tanya Asisten AI</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredFaqs.map((item, idx) => {
              const isOpen = !!openFaqIds[item.id];
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl sm:rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-emerald-300 shadow-md ring-1 ring-emerald-500/20'
                      : 'border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  {/* Accordion Trigger Button */}
                  <button
                    type="button"
                    onClick={() => toggleFaq(item.id)}
                    className="w-full text-left p-3.5 sm:p-5 flex items-start justify-between gap-3 sm:gap-4 cursor-pointer select-none group"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3.5">
                      <span
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 transition-colors ${
                          isOpen
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200/80">
                            {getCategoryIcon(item.category)}
                            {getCategoryBadgeLabel(item.category)}
                          </span>
                        </div>
                        <h3
                          className={`text-xs sm:text-base font-bold leading-snug transition-colors ${
                            isOpen ? 'text-emerald-950' : 'text-slate-800 group-hover:text-emerald-800'
                          }`}
                        >
                          {item.question}
                        </h3>
                      </div>
                    </div>

                    <div
                      className={`p-1 sm:p-1.5 rounded-full transition-transform duration-200 shrink-0 mt-0.5 ${
                        isOpen
                          ? 'rotate-180 bg-emerald-100 text-emerald-800'
                          : 'rotate-0 bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </button>

                  {/* Accordion Content Panel */}
                  {isOpen && (
                    <div className="px-3.5 sm:px-5 pb-4 sm:pb-6 pt-1 sm:pt-2 border-t border-slate-100 text-xs sm:text-sm bg-slate-50/40">
                      <div className="pl-8 sm:pl-10 text-slate-700 space-y-1">
                        {renderFormattedAnswer(item.answer)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Interactive CTA Box */}
        <div className="mt-8 sm:mt-12 bg-gradient-to-r from-[#0d3b2f] via-[#043e2e] to-[#0d3b2f] text-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xl border border-emerald-600/30">
          <div className="flex items-start gap-3 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-[#043e2e] flex items-center justify-center shrink-0 shadow-md hidden xs:flex">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-lg font-black tracking-tight mb-1 text-emerald-100">
                Pertanyaan Anda Belum Terjawab di Sini?
              </h4>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 leading-relaxed max-w-xl">
                Konsultasikan langsung ke <strong>Asisten Virtual AI PSKS Jabar</strong> yang siap memandu 24/7, atau hubungi narahubung resmi Dinas Sosial Provinsi Jawa Barat.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
            {onOpenAiAssistant && (
              <button
                type="button"
                onClick={onOpenAiAssistant}
                className="w-full xs:w-auto bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-[#043e2e] font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Bot className="w-4 h-4" />
                <span>Tanya Asisten AI</span>
              </button>
            )}
            {onOpenContact && (
              <button
                type="button"
                onClick={onOpenContact}
                title="Hubungi Admin Dinsos via WhatsApp"
                className="w-full xs:w-auto bg-[#25d366]/20 hover:bg-[#25d366]/30 text-emerald-100 hover:text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-emerald-400/40 hover:border-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4 fill-current text-[#25d366] shrink-0" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.882-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Hubungi Kami</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
