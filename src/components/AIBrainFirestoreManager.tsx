import React, { useState, useEffect } from 'react';
import {
  Brain,
  BookOpen,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Flame,
  Activity,
  Layers,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  GraduationCap,
  Edit3,
  ChevronDown,
  ChevronUp,
  FileText,
  Database,
  X,
} from 'lucide-react';
import {
  AIBrainConfig,
  AIVocabularyDoc,
  AIKnowledgeDoc,
  MASTER_AI_BRAIN_CONFIG,
  getAIBrainConfig,
  saveAIBrainConfig,
  getAIVocabulary,
  saveAIVocabularyItem,
  deleteAIVocabularyItem,
  getAIKnowledgeList,
  saveAIKnowledgeItem,
  deleteAIKnowledgeItem,
  subscribeToAIBrain,
  subscribeToAIVocabulary,
  subscribeToAIKnowledge,
} from '../services/aiKnowledgeFirestoreService';

export const AIBrainFirestoreManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brain' | 'vocabulary' | 'knowledge' | 'simulation'>('brain');

  // Brain State
  const [brainConfig, setBrainConfig] = useState<AIBrainConfig>(MASTER_AI_BRAIN_CONFIG);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [contextRules, setContextRules] = useState('');
  const [dialogueExamples, setDialogueExamples] = useState('');
  const [isSavingBrain, setIsSavingBrain] = useState(false);
  const [brainSuccessMsg, setBrainSuccessMsg] = useState<string | null>(null);

  // Vocabulary State
  const [vocabularyList, setVocabularyList] = useState<AIVocabularyDoc[]>([]);
  const [vocabSearch, setVocabSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newCanonical, setNewCanonical] = useState('');
  const [newCategory, setNewCategory] = useState<'konteks_utama' | 'slang' | 'sunda' | 'typo' | 'singkatan' | 'emosi_komplain'>('konteks_utama');
  const [newIntent, setNewIntent] = useState('');
  const [vocabSuccessMsg, setVocabSuccessMsg] = useState<string | null>(null);

  // Knowledge Base State
  const [knowledgeList, setKnowledgeList] = useState<AIKnowledgeDoc[]>([]);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [selectedKnowledgeCat, setSelectedKnowledgeCat] = useState<string>('all');
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});
  const [kTopic, setKTopic] = useState('');
  const [kTitle, setKTitle] = useState('');
  const [kCategory, setKCategory] = useState<'pilar' | 'layanan' | 'faq' | 'regulasi' | 'security' | 'identitas' | 'panduan'>('pilar');
  const [kKeywords, setKKeywords] = useState('');
  const [kSummary, setKSummary] = useState('');
  const [kContent, setKContent] = useState('');
  const [knowledgeSuccessMsg, setKnowledgeSuccessMsg] = useState<string | null>(null);
  const [isSavingKnowledge, setIsSavingKnowledge] = useState(false);

  // Load Brain and Vocabulary on mount with Realtime Listeners
  useEffect(() => {
    let isMounted = true;

    getAIBrainConfig().then((config) => {
      if (isMounted) {
        setBrainConfig(config);
        setSystemInstruction(config.systemInstruction || MASTER_AI_BRAIN_CONFIG.systemInstruction);
        setContextRules(config.contextRules || MASTER_AI_BRAIN_CONFIG.contextRules);
        setDialogueExamples(config.dialogueExamples || MASTER_AI_BRAIN_CONFIG.dialogueExamples);
      }
    });

    getAIVocabulary().then((list) => {
      if (isMounted) {
        setVocabularyList(list);
      }
    });

    getAIKnowledgeList().then((kList) => {
      if (isMounted) {
        setKnowledgeList(kList);
      }
    });

    // Realtime subscriptions
    const unsubBrain = subscribeToAIBrain((updated) => {
      if (isMounted) {
        setBrainConfig(updated);
        setSystemInstruction(updated.systemInstruction);
        setContextRules(updated.contextRules);
        setDialogueExamples(updated.dialogueExamples);
      }
    });

    const unsubVocab = subscribeToAIVocabulary((updatedList) => {
      if (isMounted) {
        setVocabularyList(updatedList);
      }
    });

    const unsubKnowledge = subscribeToAIKnowledge((updatedKList) => {
      if (isMounted) {
        setKnowledgeList(updatedKList);
      }
    });

    return () => {
      isMounted = false;
      unsubBrain();
      unsubVocab();
      unsubKnowledge();
    };
  }, []);

  // Save Brain to Firestore
  const handleSaveBrain = async () => {
    setIsSavingBrain(true);
    try {
      await saveAIBrainConfig({
        systemInstruction,
        contextRules,
        dialogueExamples,
        updatedAt: new Date().toISOString(),
      });
      setBrainSuccessMsg('Otak & Instruksi Sistem AI Berhasil Disimpan ke Supabase!');
      setTimeout(() => setBrainSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan otak AI ke Supabase: ' + (err?.message || err));
    } finally {
      setIsSavingBrain(false);
    }
  };

  // Reset Brain to Default
  const handleResetBrain = async () => {
    if (confirm('Kembalikan Otak & Instruksi Sistem AI ke format bawaan resmi Pemprov Jabar?')) {
      setSystemInstruction(MASTER_AI_BRAIN_CONFIG.systemInstruction);
      setContextRules(MASTER_AI_BRAIN_CONFIG.contextRules);
      setDialogueExamples(MASTER_AI_BRAIN_CONFIG.dialogueExamples);
      setIsSavingBrain(true);
      try {
        await saveAIBrainConfig(MASTER_AI_BRAIN_CONFIG);
        setBrainSuccessMsg('Otak AI dikembalikan ke setelan standar dan tersimpan di Firestore.');
        setTimeout(() => setBrainSuccessMsg(null), 4000);
      } catch (err: any) {
        alert('Gagal mereset: ' + err?.message);
      } finally {
        setIsSavingBrain(false);
      }
    }
  };

  // Add Vocabulary word to Firestore
  const handleAddVocabulary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newCanonical.trim()) {
      alert('Kata dan Padanan Resmi tidak boleh kosong.');
      return;
    }

    try {
      const item: AIVocabularyDoc = {
        id: `v_${newWord.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        word: newWord.trim().toLowerCase(),
        canonical: newCanonical.trim().toLowerCase(),
        category: newCategory,
        intent: newIntent.trim() || undefined,
      };

      await saveAIVocabularyItem(item);
      setNewWord('');
      setNewCanonical('');
      setNewIntent('');
      setIsAddingVocab(false);
      setVocabSuccessMsg(`Kata "${item.word}" berhasil disimpan ke Kamus Firestore!`);
      setTimeout(() => setVocabSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Gagal menyimpan kata ke kamus: ' + err?.message);
    }
  };

  // Delete Vocabulary word from Firestore
  const handleDeleteVocab = async (id: string, word: string) => {
    if (confirm(`Hapus kata "${word}" dari kamus Firestore?`)) {
      try {
        await deleteAIVocabularyItem(id);
        setVocabSuccessMsg(`Kata "${word}" dihapus dari Firestore.`);
        setTimeout(() => setVocabSuccessMsg(null), 3000);
      } catch (err: any) {
        alert('Gagal menghapus: ' + err?.message);
      }
    }
  };

  // Knowledge Base Handlers
  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kTitle.trim() || !kContent.trim() || !kTopic.trim()) {
      alert('Topik, Judul, dan Isi Materi Pengetahuan wajib diisi.');
      return;
    }

    setIsSavingKnowledge(true);
    try {
      const docId = editingKnowledgeId || `k_${kTopic.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
      const kwArray = kKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const docItem: AIKnowledgeDoc = {
        id: docId,
        topic: kTopic.trim().toLowerCase(),
        title: kTitle.trim(),
        category: kCategory,
        keywords: kwArray.length > 0 ? kwArray : [kTopic.trim().toLowerCase()],
        summary: kSummary.trim() || kTitle.trim(),
        content: kContent.trim(),
        updatedAt: new Date().toISOString(),
      };

      await saveAIKnowledgeItem(docItem);

      // Reset form
      setEditingKnowledgeId(null);
      setKTopic('');
      setKTitle('');
      setKKeywords('');
      setKSummary('');
      setKContent('');
      setIsAddingKnowledge(false);
      setKnowledgeSuccessMsg(`Materi pengetahuan "${docItem.title}" berhasil disimpan ke Supabase!`);
      setTimeout(() => setKnowledgeSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan materi pengetahuan: ' + (err?.message || err));
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  const handleEditKnowledge = (item: AIKnowledgeDoc) => {
    setEditingKnowledgeId(item.id);
    setKTopic(item.topic);
    setKTitle(item.title);
    setKCategory(item.category || 'pilar');
    setKKeywords(item.keywords.join(', '));
    setKSummary(item.summary);
    setKContent(item.content);
    setIsAddingKnowledge(true);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteKnowledge = async (id: string, title: string) => {
    if (confirm(`Hapus materi pengetahuan "${title}" dari Supabase?`)) {
      try {
        await deleteAIKnowledgeItem(id);
        setKnowledgeSuccessMsg(`Materi pengetahuan "${title}" berhasil dihapus.`);
        setTimeout(() => setKnowledgeSuccessMsg(null), 3000);
      } catch (err: any) {
        alert('Gagal menghapus: ' + (err?.message || err));
      }
    }
  };

  const handleCancelKnowledgeEdit = () => {
    setEditingKnowledgeId(null);
    setKTopic('');
    setKTitle('');
    setKKeywords('');
    setKSummary('');
    setKContent('');
    setIsAddingKnowledge(false);
  };

  const toggleExpandDoc = (id: string) => {
    setExpandedDocIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered Knowledge
  const filteredKnowledge = knowledgeList.filter((k) => {
    const matchSearch =
      !knowledgeSearch ||
      k.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.topic.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.summary.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.content.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
      k.keywords.some((kw) => kw.toLowerCase().includes(knowledgeSearch.toLowerCase()));

    const matchCategory =
      selectedKnowledgeCat === 'all' ||
      (selectedKnowledgeCat === 'pilar' && (k.category === 'pilar' || k.topic.includes('tagana') || k.topic.includes('peksos') || k.topic.includes('psm') || k.topic.includes('tksk') || k.topic.includes('lks') || k.topic.includes('karangtaruna') || k.topic.includes('lk3') || k.topic.includes('pensos') || k.topic.includes('badanusaha') || k.topic.includes('slrt'))) ||
      k.category === selectedKnowledgeCat;

    return matchSearch && matchCategory;
  });

  // Filtered vocabulary
  const filteredVocabulary = vocabularyList.filter((v) => {
    const matchSearch =
      !vocabSearch ||
      v.word.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      v.canonical.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      (v.intent && v.intent.toLowerCase().includes(vocabSearch.toLowerCase()));
    const matchCategory = selectedCategory === 'all' || v.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* HEADER WITH REALTIME STATUS */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#043e2e] border-2 border-[#d4af37]/60 text-white shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-black text-white">Otak & Kamus AI di Supabase</h4>
                <span className="text-[10px] font-extrabold bg-[#d4af37] text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Realtime Sync
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                Pusat instruksi sistem, kamus kosakata, dan pemahaman sambungan konteks tersimpan 100% di Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-emerald-500/50">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <div className="text-[11px] font-bold text-slate-300">
              <span className="text-white block font-mono">Supabase: ai_config, ai_vocabulary &amp; ai_knowledge_base</span>
              <span className="text-emerald-400 text-[10px]">● Terhubung &amp; Terproteksi</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('brain')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'brain'
                ? 'bg-[#d4af37] text-slate-950 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Otak &amp; Instruksi Sistem</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocabulary')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vocabulary'
                ? 'bg-[#d4af37] text-slate-950 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kamus Kosakata ({vocabularyList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'bg-[#d4af37] text-slate-950 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Kamus Pengetahuan / Knowledge Base ({knowledgeList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'simulation'
                ? 'bg-[#d4af37] text-slate-950 shadow-md scale-102'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Aturan &amp; Simulasi Konteks</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BRAIN INSTRUCTIONS */}
      {activeTab === 'brain' && (
        <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
          {brainSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{brainSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-700" />
                <span>Instruksi Sistem Utama (System Instruction)</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Supabase table: ai_config/system_brain
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Instruksi dasar yang dibaca oleh AI pada setiap awal percakapan, memuat pemahaman peran resmi, kesantunan kedinasan, salam Islami, dan kerahasiaan data.
            </p>
            <textarea
              rows={8}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#043e2e] leading-relaxed"
              placeholder="Masukkan instruksi sistem AI..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-700" />
              <span>Aturan Pemeliharaan Riwayat &amp; Konteks (Context Rules)</span>
            </label>
            <p className="text-xs text-slate-500 font-medium">
              Aturan eksplisit agar AI selalu memeriksa 2 pesan sebelumnya saat menemukan kata ganti atau pertanyaan elipsis.
            </p>
            <textarea
              rows={5}
              value={contextRules}
              onChange={(e) => setContextRules(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#043e2e] leading-relaxed"
              placeholder="Masukkan aturan konteks..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-700" />
              <span>Contoh Simulasi Percakapan (Few-Shot Dialogue Examples)</span>
            </label>
            <p className="text-xs text-slate-500 font-medium">
              Contoh dialog interaktif sebagai panduan model untuk menyambung konteks antar-pilar sosial.
            </p>
            <textarea
              rows={5}
              value={dialogueExamples}
              onChange={(e) => setDialogueExamples(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#043e2e] leading-relaxed"
              placeholder="Masukkan contoh dialog..."
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetBrain}
              disabled={isSavingBrain}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Reset ke Standar Pemprov</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBrain}
              disabled={isSavingBrain}
              className="px-6 py-2.5 rounded-xl bg-[#043e2e] hover:bg-[#065f46] text-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingBrain ? 'Menyimpan ke Firestore...' : 'Simpan Otak AI ke Supabase'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: VOCABULARY DICTIONARY */}
      {activeTab === 'vocabulary' && (
        <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
          {vocabSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{vocabSuccessMsg}</span>
            </div>
          )}

          {/* TOP ACTIONS & SEARCH */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Semua Kosakata' },
                { id: 'konteks_utama', label: 'Konteks Utama' },
                { id: 'slang', label: 'Bahasa Santai & Gaul' },
                { id: 'sunda', label: 'Bahasa Sunda' },
                { id: 'singkatan', label: 'Singkatan' },
                { id: 'typo', label: 'Salah Ketik / Typo' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap cursor-pointer transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#043e2e] text-[#d4af37] shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder="Cari kata di kamus..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddingVocab(!isAddingVocab)}
                className="px-3 py-1.5 rounded-xl bg-[#043e2e] text-amber-300 text-xs font-black flex items-center gap-1.5 cursor-pointer hover:bg-[#065f46] shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kata</span>
              </button>
            </div>
          </div>

          {/* ADD VOCABULARY MODAL / FORM */}
          {isAddingVocab && (
            <form onSubmit={handleAddVocabulary} className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-700" />
                  <span>Tambah Entri Kamus Baru ke Firestore</span>
                </h5>
                <button
                  type="button"
                  onClick={() => setIsAddingVocab(false)}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950"
                >
                  Tutup
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Kata Input / Slang / Sunda</label>
                  <input
                    type="text"
                    required
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Contoh: ngiluan, daftr, katar"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Padanan / Makna Resmi</label>
                  <input
                    type="text"
                    required
                    value={newCanonical}
                    onChange={(e) => setNewCanonical(e.target.value)}
                    placeholder="Contoh: proses pendaftaran psks"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium"
                  >
                    <option value="konteks_utama">Konteks Utama</option>
                    <option value="slang">Bahasa Santai / Slang</option>
                    <option value="sunda">Bahasa Sunda</option>
                    <option value="singkatan">Singkatan</option>
                    <option value="typo">Salah Ketik (Typo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Intent / Aksi (Opsional)</label>
                  <input
                    type="text"
                    value={newIntent}
                    onChange={(e) => setNewIntent(e.target.value)}
                    placeholder="Contoh: register_process"
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#043e2e] text-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm hover:bg-[#065f46]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan ke Supabase</span>
                </button>
              </div>
            </form>
          )}

          {/* VOCABULARY LIST TABLE */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Kata / Frasa Input</th>
                    <th className="p-3">Padanan Konteks Resmi</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Intensi Terkait</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredVocabulary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                        Tidak ada entri kamus yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredVocabulary.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {item.word}
                        </td>
                        <td className="p-3 font-semibold text-emerald-900">
                          {item.canonical}
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              item.category === 'konteks_utama'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : item.category === 'sunda'
                                ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                : item.category === 'slang'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {item.category.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {item.intent || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteVocab(item.id, item.word)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer transition-all"
                            title="Hapus kata dari Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE BASE (BASIS PENGETAHUAN LENGKAP & REALTIME) */}
      {activeTab === 'knowledge' && (
        <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
          {knowledgeSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{knowledgeSuccessMsg}</span>
            </div>
          )}

          {/* HEADER & ACTION BUTTON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Kamus Materi &amp; Basis Pengetahuan AI ({knowledgeList.length} Dokumen)
                </h4>
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-md font-mono">
                  ai_knowledge_base
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kumpulan rujukan materi resmi 10 Pilar PSKS, SOP, regulasi, dan prosedur bantuan Dinsos Jabar yang dibaca AI saat menjawab pertanyaan spesifik.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isAddingKnowledge) {
                  handleCancelKnowledgeEdit();
                } else {
                  setIsAddingKnowledge(true);
                  setEditingKnowledgeId(null);
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#043e2e] hover:bg-[#065f46] text-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-sm shrink-0 self-start sm:self-center"
            >
              {isAddingKnowledge ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Tutup Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Materi Pengetahuan</span>
                </>
              )}
            </button>
          </div>

          {/* FORM TAMBAH / EDIT PENGETAHUAN */}
          {isAddingKnowledge && (
            <form
              onSubmit={handleSaveKnowledge}
              className="p-5 rounded-2xl bg-amber-50/50 border-2 border-amber-300 space-y-4 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-700" />
                  <span>{editingKnowledgeId ? 'Edit Materi Pengetahuan' : 'Tambah Materi Pengetahuan Baru ke Firestore'}</span>
                </h5>
                <span className="text-[10px] font-mono text-amber-800">
                  {editingKnowledgeId ? `ID: ${editingKnowledgeId}` : 'ID Otomatis Dibuat'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Topik / ID Singkat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: tagana, bansos_dtks, peksos"
                    value={kTopic}
                    onChange={(e) => setKTopic(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#043e2e]"
                  />
                  <span className="text-[9px] text-slate-400">Kata kunci topik untuk pencocokan cepat</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Kategori Dokumen <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={kCategory}
                    onChange={(e) => setKCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                  >
                    <option value="pilar">10 Pilar Relawan PSKS</option>
                    <option value="layanan">Layanan Sosial &amp; Bantuan</option>
                    <option value="regulasi">Regulasi, Perda &amp; Hukum</option>
                    <option value="faq">FAQ &amp; Prosedur Teknis</option>
                    <option value="security">Keamanan &amp; Privasi</option>
                    <option value="identitas">Identitas &amp; Profil Sistem</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Kata Kunci / Keywords <span className="text-slate-400">(Koma)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: banjir, dapur umum, evakuasi"
                    value={kKeywords}
                    onChange={(e) => setKKeywords(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#043e2e]"
                  />
                  <span className="text-[9px] text-slate-400">Dipisah dengan koma untuk retrieval AI</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Judul Materi Pengetahuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Prosedur Operasional Tanggap Bencana Tagana Jabar"
                  value={kTitle}
                  onChange={(e) => setKTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Ringkasan Cepat (Summary Singkat)
                </label>
                <input
                  type="text"
                  placeholder="Ringkasan 1-2 kalimat untuk konteks cepat"
                  value={kSummary}
                  onChange={(e) => setKSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Isi Materi Pengetahuan Lengkap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Tuliskan pengetahuan lengkap, poin-poin persyaratan, dasar hukum, alur koordinasi, atau langkah konkret yang harus disampaikan AI kepada masyarakat..."
                  value={kContent}
                  onChange={(e) => setKContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#043e2e] leading-relaxed font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelKnowledgeEdit}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingKnowledge}
                  className="px-5 py-2 rounded-xl bg-[#043e2e] hover:bg-[#065f46] text-[#d4af37] text-xs font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingKnowledge ? 'Menyimpan...' : 'Simpan Materi ke Supabase'}</span>
                </button>
              </div>
            </form>
          )}

          {/* SEARCH & CATEGORY FILTER */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pengetahuan berdasarkan judul, topik, kata kunci, atau isi materi..."
                value={knowledgeSearch}
                onChange={(e) => setKnowledgeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#043e2e]"
              />
            </div>

            <select
              value={selectedKnowledgeCat}
              onChange={(e) => setSelectedKnowledgeCat(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043e2e] cursor-pointer"
            >
              <option value="all">Semua Kategori ({knowledgeList.length})</option>
              <option value="pilar">10 Pilar Relawan PSKS</option>
              <option value="layanan">Layanan Sosial &amp; Bantuan</option>
              <option value="regulasi">Regulasi &amp; Perda</option>
              <option value="faq">FAQ &amp; Prosedur Teknis</option>
              <option value="security">Keamanan &amp; Privasi</option>
              <option value="identitas">Identitas &amp; Profil Sistem</option>
            </select>
          </div>

          {/* LIST OF KNOWLEDGE CARDS */}
          <div className="space-y-3">
            {filteredKnowledge.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">Tidak ada materi pengetahuan yang cocok dengan filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setKnowledgeSearch('');
                    setSelectedKnowledgeCat('all');
                  }}
                  className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
                >
                  Reset Pencarian &amp; Filter
                </button>
              </div>
            ) : (
              filteredKnowledge.map((item) => {
                const isExpanded = !!expandedDocIds[item.id];
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#d4af37]/60 transition-all space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#043e2e] text-[#d4af37] uppercase tracking-wider font-mono">
                            {item.topic}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                            {item.category?.replace('_', ' ').toUpperCase() || 'MATERI UMUM'}
                          </span>
                          {item.updatedAt && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              Update: {new Date(item.updatedAt).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-black text-slate-900 leading-snug">
                          {item.title}
                        </h5>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditKnowledge(item)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-emerald-800 cursor-pointer transition-all flex items-center gap-1 text-[11px] font-bold"
                          title="Edit Materi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteKnowledge(item.id, item.title)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 cursor-pointer transition-all flex items-center gap-1 text-[11px] font-bold"
                          title="Hapus dari Firestore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {item.summary}
                    </p>

                    {/* KEYWORDS CHIPS */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-bold text-slate-400">Keywords:</span>
                      {item.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>

                    {/* EXPANDABLE FULL CONTENT */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleExpandDoc(item.id)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer transition-all"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Tutup Isi Materi Lengkap</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Buka Isi Materi Pengetahuan Lengkap (Rujukan AI)</span>
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed animate-fadeIn">
                          {item.content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONTEXT RULES & SIMULATION */}
      {activeTab === 'simulation' && (
        <div className="space-y-6 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-900 font-black">
              <Sparkles className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Simulasi Resolusi Konteks Otomatis (Context Continuity)
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Pola penyambungan konteks percakapan riil yang telah aktif di sistem.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SIMULASI 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h5 className="text-xs font-black text-slate-900">Simulasi 1: Pertanyaan Sambungan Antar-Pilar</h5>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">Pesan 1 (User Tamu):</span>
                  <p className="font-semibold text-slate-800 mt-0.5">&quot;Gimana cara gabung jadi PSM di Jabar?&quot;</p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 block">Jawaban 1 (AI PSKS):</span>
                  <p className="text-emerald-950 mt-0.5">
                    &quot;Untuk bergabung menjadi Pekerja Sosial Masyarakat (PSM) di Jawa Barat, Anda bisa mendaftar melalui kelurahan setempat dengan melengkapi berkas administrasi...&quot;
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">Pesan 2 (User Tamu - Pertanyaan Elipsis):</span>
                  <p className="font-semibold text-slate-800 mt-0.5">&quot;Kalau TKSK sama juga gak?&quot;</p>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300">
                  <span className="text-[10px] font-bold text-amber-800 block">AI Cerdas (Paham &amp; Menyambung):</span>
                  <p className="text-amber-950 font-medium mt-0.5">
                    AI langsung tahu kata <em>&quot;sama juga gak&quot;</em> berarti menanyakan <strong>cara pendaftaran</strong>. AI menjawab perbedaannya: untuk TKSK ada seleksi khusus dari Dinas Sosial tingkat Kabupaten/Kota jika ada posisi yang kosong.
                  </p>
                </div>
              </div>
            </div>

            {/* SIMULASI 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <h5 className="text-xs font-black text-slate-900">Simulasi 2: Kata Ganti &amp; Persyaratan Administrasi</h5>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">Pesan 1 (User):</span>
                  <p className="font-semibold text-slate-800 mt-0.5">&quot;Syaratnya apa aja?&quot; atau &quot;Bawa apa aja?&quot;</p>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-bold text-purple-800 block">Resolusi Kamus &amp; Konteks:</span>
                  <p className="text-purple-950 font-medium mt-0.5">
                    Kamus otomatis memetakan <em>&quot;syarat / bawa apa aja&quot;</em> ke <strong>Kriteria Administrasi</strong>. Dan riwayat obrolan mengaitkan langsung dengan pilar atau layanan yang sedang dibahas sebelumnya.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 block">Pertanyaan Lokasi:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">&quot;Di mana lokasinya?&quot; / &quot;Berapa lama prosesnya?&quot;</p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 block">AI Cerdas:</span>
                  <p className="text-emerald-950 font-medium mt-0.5">
                    AI langsung melihat 2 pesan sebelumnya untuk menemukan objek (misal: pendaftaran, verifikasi berkas, atau kantor Dinsos) tanpa meminta klarifikasi berulang.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
