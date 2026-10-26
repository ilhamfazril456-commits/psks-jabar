import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Bot,
  X,
  Send,
  RotateCcw,
  Copy,
  Check,
  User,
  BookOpen,
  Search,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Crown,
  Terminal,
  HelpCircle,
  Code2,
  Shuffle,
  Zap,
  CheckCircle2,
  Layers,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  Phone,
  FileText,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { UserSession, UserRole, PillarId, PSKSDataRecord, AppSettings } from '../types';
import { ROLE_QUESTION_CATALOG, AIQuestionItem } from '../data/aiQuestions';
import {
  getComprehensiveSmartAnswer,
  verifyAndTrackAnswerAccuracy,
  getSystemStateMetrics,
  buildRegionalPillarBreakdown,
  resolveMemberVerificationQuery,
  resolveRegionalPillarDataQuery,
  resolveSensitivePrivacyQuery,
  resolvePinSecurityQuery,
  resolveOffTopicPublicQuery,
} from '../data/aiKnowledge';
import { resolveDinsosAddressQuery } from '../data/dinsosAddressDirectory';
import { ensureAIKnowledgeSeeded } from '../services/aiKnowledgeFirestoreService';
import { PILLARS_CONFIG, KAB_KOTA_ONLY } from '../data/initialData';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVerified?: boolean;
  trackingSource?: 'verified_exact' | 'state_grounded' | 'ai_model_verified' | 'knowledge_fallback';
}

interface ActionTag {
  type: 'tab' | 'pillar';
  target: string;
  label: string;
}

interface AIAssistantWidgetProps {
  session?: UserSession;
  currentTab?: string;
  activePillar?: PillarId | null;
  allPillarData?: Record<string, PSKSDataRecord[]>;
  appSettings?: AppSettings;
  onNavigateTab?: (tab: string) => void;
  onSelectPillar?: (pillarId: PillarId) => void;
}

// Fast & Fluid Typing Animation Helper Component for AI Bot Replies
interface TypingFormattedTextProps {
  content: string;
  isAnimated: boolean;
  isStreaming?: boolean;
  session?: UserSession;
  onScrollToBottom?: () => void;
  onComplete?: () => void;
  onNavigateTab?: (tab: string) => void;
  onSelectPillar?: (pillarId: PillarId) => void;
  onSendMessage?: (text: string) => void;
}

const TypingFormattedText: React.FC<TypingFormattedTextProps> = ({
  content,
  isAnimated,
  isStreaming = false,
  session,
  onScrollToBottom,
  onComplete,
  onNavigateTab,
  onSelectPillar,
  onSendMessage,
}) => {
  // Extract interactive action tags: [[action:tab:ID:Label]] or [[action:pillar:ID:Label]]
  // STRICT SECURITY GUARD: Filter out unauthorized tabs for guest/user/admin roles
  const { cleanText, actions } = useMemo(() => {
    const actionRegex = /\[\[action:(tab|pillar):([a-zA-Z0-9_\-]+):(.*?)]]/g;
    const foundActions: ActionTag[] = [];
    const isSuperadminOrDev =
      session?.statusActive === 'SAH_TERDAFTAR' &&
      (session?.role === 'superadmin' || session?.role === 'developer' || session?.isDeveloper === true);
    const isDeveloper =
      session?.statusActive === 'SAH_TERDAFTAR' &&
      (session?.role === 'developer' || session?.isDeveloper === true);
    const isSuperadmin =
      session?.statusActive === 'SAH_TERDAFTAR' &&
      session?.role === 'superadmin';
    const isAdmin =
      session?.statusActive === 'SAH_TERDAFTAR' && session?.role === 'admin';

    const superadminOnlyTabs = [
      'admin_manage',
      'admin_monitor',
      'admin_maintenance',
      'superadmin_settings',
      'activity_logs',
      'announcement_manage',
      'floating_wa_manage',
      'user_manage',
      'task_manage',
      'faq_manage',
      'document_repository',
      'bg_logo_manage',
      'profile_kadinas_manage',
      'social_media_manage',
      'regional_logo_manage',
      'website_info_manage',
    ];

    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      const type = match[1] as 'tab' | 'pillar';
      let target = match[2];
      let label = match[3];

      // Strict access filter & normalization: NEVER allow admin management button to unauthorized roles
      if (type === 'tab') {
        // Alias Normalizations so no tab target is ever an unrecognized/empty view
        if (target === 'account') {
          target = 'akun';
        }
        if (target === 'monitoring') {
          target = 'admin_monitor';
        }
        if (target === 'maintenance') {
          target = 'admin_maintenance';
        }
        if (target === 'task_manager') {
          target = 'task_manage';
        }
        if (target === 'pillars') {
          target = 'beranda';
        }

        // ROLE-BASED ACCESS CONTROL FOR PIN SECURITY:
        // Superadmin must NEVER be given developer-only pin_security_manage; route to subnavigasi 'Ubah PIN'
        if (target === 'pin_security_manage') {
          if (isSuperadmin) {
            target = 'ubah_pin';
            label = 'Buka Menu Ubah PIN';
          } else if (!isDeveloper) {
            continue;
          }
        }

        // Ubah PIN: only for superadmin and developer
        if ((target === 'ubah_pin' || target === 'account_ubah_pin') && !isSuperadminOrDev) {
          continue;
        }

        // Developer-only tabs
        if (target === 'dev_panel' && !isDeveloper) {
          continue;
        }

        if (superadminOnlyTabs.includes(target) && !isSuperadminOrDev) {
          continue;
        }
        if (target === 'terima_pendaftaran' && !isAdmin && !isSuperadminOrDev) {
          continue;
        }
        // Aturan Khusus: Ketika seseorang mengaku Ilham Fazril / developer di selain akun developer,
        // jangan tampilkan button buka halaman login atau hubungi admin dinsos
        const isImpersonationReply =
          content.includes('Anti-Prompt Injection') ||
          content.includes('Role-Based Access Control') ||
          content.includes('tidak dapat memvalidasi identitas') ||
          content.includes('tidak diizinkan memvalidasi identitas') ||
          content.includes('mengaktifkan hak akses pengembang');
        if (isImpersonationReply && (target === 'login' || target === 'contact')) {
          continue;
        }
      }

      // Avoid duplicates
      if (!foundActions.some(a => a.type === type && a.target === target)) {
        foundActions.push({
          type,
          target,
          label,
        });
      }
    }
    const clean = content.replace(actionRegex, '').trim();
    return { cleanText: clean, actions: foundActions };
  }, [content, session]);

  const [displayedLength, setDisplayedLength] = useState(
    isStreaming ? cleanText.length : (isAnimated ? 0 : cleanText.length)
  );
  const [isDone, setIsDone] = useState(!isAnimated && !isStreaming);

  useEffect(() => {
    if (isStreaming) {
      setDisplayedLength(cleanText.length);
      setIsDone(false);
      if (onScrollToBottom) onScrollToBottom();
      return;
    }

    if (!isAnimated) {
      setDisplayedLength(cleanText.length);
      setIsDone(true);
      return;
    }

    setDisplayedLength(0);
    setIsDone(false);

    let currentIndex = 0;
    const totalLength = cleanText.length;
    // High-speed typing stream animation: lightning-fast world-class AI streaming feel (~0.2s - 0.4s total)
    const chunkSize = Math.max(4, Math.ceil(totalLength / 35));
    const intervalMs = 8;

    const timer = setInterval(() => {
      currentIndex = Math.min(currentIndex + chunkSize, totalLength);
      setDisplayedLength(currentIndex);
      if (onScrollToBottom) onScrollToBottom();

      if (currentIndex >= totalLength) {
        setIsDone(true);
        if (onComplete) onComplete();
        clearInterval(timer);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [cleanText, isAnimated, isStreaming]);

  const currentText = cleanText.slice(0, displayedLength);

  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line;

      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      if (isBullet) {
        formattedLine = line.trim().substring(2);
      }

      // Check for markdown link [Label](url)
      const linkMatch = formattedLine.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const [fullMatch, linkText, linkUrl] = linkMatch;
        const [before, after] = formattedLine.split(fullMatch);
        const isWhatsApp = linkUrl.includes('wa.me') || linkUrl.includes('whatsapp');

        return (
          <div key={idx} className="my-2 leading-relaxed break-words [overflow-wrap:anywhere]">
            {before}
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md my-1 ${
                isWhatsApp
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-102 active:scale-98'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isWhatsApp && <MessageCircle className="w-4 h-4" />}
              <span>{linkText}</span>
            </a>
            {after}
          </div>
        );
      }

      const parts = formattedLine.split(/(\*\*.*?\*\*)/g);

      return (
        <div
          key={idx}
          className={`${
            isBullet ? 'flex items-start gap-2 my-1 pl-1' : 'my-0.5'
          } leading-relaxed break-words [overflow-wrap:anywhere]`}
        >
          {isBullet && <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>}
          <span className="break-words [overflow-wrap:anywhere] flex-1">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-extrabold text-amber-200">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </span>
        </div>
      );
    });
  };

  const handleSkipTyping = () => {
    if (!isDone && !isStreaming) {
      setDisplayedLength(cleanText.length);
      setIsDone(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <div
      className="relative cursor-pointer select-text break-words [overflow-wrap:anywhere]"
      onClick={handleSkipTyping}
      title={!isDone && !isStreaming ? 'Klik untuk tampilkan semua teks seketika' : undefined}
    >
      {isStreaming && cleanText.length === 0 ? (
        <div className="flex items-center gap-2 py-1">
          <span className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></span>
          </span>
          <span className="text-[11px] text-amber-300/80 font-medium italic">Sedang menyusun respon real-time...</span>
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{formatText(currentText)}</div>
      )}

      {(!isDone || isStreaming) && cleanText.length > 0 && (
        <span className="inline-block w-2 h-3.5 bg-amber-400 ml-1 animate-pulse align-middle font-bold rounded-xs shadow-xs" />
      )}

      {/* Rich Action Cards when response is complete */}
      {actions.length > 0 && isDone && !isStreaming && (
        <div className="mt-3.5 pt-2.5 border-t border-slate-700/60 flex flex-col gap-2">
          <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Aksi & Rekomendasi Terkait</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {actions.map((act, aIdx) => {
              const pillarKeys: string[] = ['psm', 'tagana', 'tksk', 'karangtaruna', 'peksos', 'lks', 'lk3', 'pensos', 'badanusaha', 'slrt_puskesos'];
              const isPillarAction = act.type === 'pillar' || pillarKeys.includes(act.target);
              const pConfig = isPillarAction ? PILLARS_CONFIG[act.target as PillarId] : null;

              return (
                <div
                  key={aIdx}
                  className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-xl p-2.5 transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                        isPillarAction
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isPillarAction ? <Layers className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {isPillarAction ? (pConfig?.shortName || 'Pilar PSKS') : 'Navigasi Portal'}
                        </div>
                        <div className="text-[11.5px] font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {act.label}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (act.type === 'tab') {
                            if (pillarKeys.includes(act.target)) {
                              onSelectPillar?.(act.target as PillarId);
                            } else if (act.target === 'account') {
                              onNavigateTab?.('akun');
                            } else if (act.target === 'pin_security_manage' && session?.role !== 'developer' && !session?.isDeveloper) {
                              onNavigateTab?.('ubah_pin');
                            } else {
                              onNavigateTab?.(act.target);
                            }
                          } else if (act.type === 'pillar') {
                            onSelectPillar?.(act.target as PillarId);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-lg text-[10.5px] font-bold shadow transition-transform transform active:scale-95 cursor-pointer"
                      >
                        <span>Buka</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      {isPillarAction && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendMessage?.(`Bagaimana alur pendaftaran dan syarat menjadi relawan ${pConfig?.title || act.label}?`);
                          }}
                          className="hidden sm:inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                          title="Tanyakan syarat & alur pendaftaran"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          <span>Syarat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contextual Smart Action Card if message mentions Dinsos Hotline */}
      {actions.length === 0 && isDone && !isStreaming && cleanText.includes('0811-222-0144') && (
        <div className="mt-3 pt-2 border-t border-slate-700/60">
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-bold text-emerald-400 uppercase">Hotline Resmi Dinsos Jabar</div>
                <div className="text-[11px] font-bold text-white">0811-222-0144 (WhatsApp)</div>
              </div>
            </div>
            <a
              href="https://wa.me/628112220144"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10.5px] font-bold transition-all shadow-sm"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Hubungi</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  session,
  currentTab = 'beranda',
  activePillar = null,
  allPillarData,
  appSettings,
  onNavigateTab,
  onSelectPillar,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnreadInBackground, setHasUnreadInBackground] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Speech Recognition (Voice-to-Text) State
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Dynamic recommendation rotation seed (updates on every question & every user tab/pillar navigation)
  const [rotationSeed, setRotationSeed] = useState<number>(() => Math.floor(Math.random() * 100));

  // Question Catalog Drawer State
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickScrollRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  // Compute live database metrics for grounding answers
  const liveMetrics = useMemo(() => {
    return getSystemStateMetrics(allPillarData);
  }, [allPillarData]);

  // Compute live regional metrics across all 27 Kab/Kota and per-pillar breakdown
  const regionalMetrics = useMemo(() => {
    return buildRegionalPillarBreakdown(allPillarData);
  }, [allPillarData]);

  // Ensure AI Knowledge Base is synchronized with Cloud Firestore
  useEffect(() => {
    ensureAIKnowledgeSeeded().catch((err) => {
      console.warn('[AI Assistant] Knowledge base initial check notice:', err);
    });
  }, []);

  // Listen for global request to open AI Assistant (e.g. from FAQ or Header buttons)
  useEffect(() => {
    const handleOpenExternal = () => {
      setIsOpen(true);
      setRotationSeed((prev) => prev + 1);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
    };
    window.addEventListener('open-ai-assistant', handleOpenExternal);
    return () => {
      window.removeEventListener('open-ai-assistant', handleOpenExternal);
    };
  }, []);

  // Voice-to-Text handler using browser Web Speech API
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceToast('Browser ini belum mendukung Web Speech API untuk suara.');
      setTimeout(() => setVoiceToast(null), 3500);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceToast('Mendengarkan suara... Silakan berbicara');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInputMessage((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
          setVoiceToast(null);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[AI Assistant Voice Error]:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceToast('Izin akses mikrofon ditolak. Izinkan mikrofon di browser Anda.');
        } else if (event.error === 'no-speech') {
          setVoiceToast('Suara tidak terdeteksi. Silakan coba bicara lagi.');
        } else {
          setVoiceToast(`Gagal input suara (${event.error})`);
        }
        setTimeout(() => setVoiceToast(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTimeout(() => {
          setVoiceToast((curr) => (curr?.startsWith('Mendengarkan') ? null : curr));
        }, 1200);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('[AI Assistant] Gagal memulai pengenalan suara:', err);
      setIsListening(false);
      setVoiceToast('Gagal mengaktifkan mikrofon.');
      setTimeout(() => setVoiceToast(null), 3000);
    }
  };

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setHasUnreadInBackground(false);
    }
  }, [isOpen]);

  const currentRole: UserRole = (session?.role as UserRole) || 'user';
  // Developer identification: strictly restricted to authenticated developer account
  const isDeveloperUser =
    session?.statusActive === 'SAH_TERDAFTAR' &&
    (currentRole === 'developer' || session?.isDeveloper === true);

  // LISTENER: Trigger recommendation updates and reset horizontal scroll whenever tab or active pillar changes
  useEffect(() => {
    // Increment rotation seed to dynamically reorganize question pool
    setRotationSeed((prev) => prev + 1);

    // Scroll quick recommendations list back to start smoothly so new context questions are front and center
    if (quickScrollRef.current) {
      quickScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // If navigating to a pillar detail, automatically sync catalog category
    if (currentTab === 'pillar_detail' && activePillar && PILLARS_CONFIG[activePillar]) {
      const pInfo = PILLARS_CONFIG[activePillar];
      setSelectedCategory(pInfo.title);
    }
  }, [currentTab, activePillar]);

  const roleCatalog = useMemo(() => {
    return ROLE_QUESTION_CATALOG[currentRole] || ROLE_QUESTION_CATALOG.user;
  }, [currentRole]);

  // All questions for current role
  const allRoleQuestions = useMemo(() => {
    const questions: AIQuestionItem[] = [];
    roleCatalog.forEach((group) => {
      questions.push(...group.questions);
    });
    return questions;
  }, [roleCatalog]);

  // Context Label for Current Page
  const contextLabel = useMemo(() => {
    if (currentTab === 'pillar_detail' && activePillar && PILLARS_CONFIG[activePillar]) {
      return `Detail ${PILLARS_CONFIG[activePillar].title}`;
    }
    const isSuperadminOrDev =
      session?.statusActive === 'SAH_TERDAFTAR' &&
      (session?.role === 'superadmin' || session?.role === 'developer');

    if (isSuperadminOrDev) {
      if (currentTab === 'admin_manage') return 'Kelola Data Wilayah';
      if (currentTab === 'admin_monitor') return 'Monitoring & Laporan';
      if (currentTab === 'admin_maintenance') return 'Pengaturan Maintenance';
      if (currentTab === 'superadmin_settings') return 'Super Admin Provinsi';
    }
    if (currentTab === 'akun') return 'Pusat Akun & Verifikasi';
    if (currentTab === 'profil') return 'Profil Dinsos Jabar';
    if (currentTab === 'contact') return 'Kontak & Bantuan';
    return 'Beranda PSKS JABAR';
  }, [currentTab, activePillar, session]);

  // Dynamic Context-Aware Quick Questions Engine
  const quickQuestions = useMemo(() => {
    const contextSpecificItems: AIQuestionItem[] = [];

    // 1. When on Pillar Detail page: Add dynamic questions directly related to that active pillar
    if (currentTab === 'pillar_detail' && activePillar && PILLARS_CONFIG[activePillar]) {
      const pInfo = PILLARS_CONFIG[activePillar];
      contextSpecificItems.push(
        {
          id: `dyn-pillar-tugas-${activePillar}`,
          category: pInfo.title,
          role: currentRole,
          question: `Apa tugas pokok, fungsi, dan wewenang ${pInfo.title} (${pInfo.shortName})?`,
          hint: `Tupoksi resmi ${pInfo.shortName}`,
        },
        {
          id: `dyn-pillar-count-${activePillar}`,
          category: pInfo.title,
          role: currentRole,
          question: `Berapa jumlah personil ${pInfo.title} yang terdaftar di database saat ini?`,
          hint: `Statistik riil anggota ${pInfo.title}`,
        },
        {
          id: `dyn-pillar-format-${activePillar}`,
          category: pInfo.title,
          role: currentRole,
          question: `Bagaimana format data dan syarat sertifikasi/SK untuk ${pInfo.shortName}?`,
          hint: `Atribut data & verifikasi`,
        },
        ...(currentRole === 'superadmin' ? [{
          id: `dyn-pillar-kta-${activePillar}`,
          category: pInfo.title,
          role: currentRole,
          question: `Bagaimana cara mencetak KTA Digital QR Code untuk anggota ${pInfo.title}?`,
          hint: `Cetak kartu anggota resmi`,
        }] : [{
          id: `dyn-pillar-reg-${activePillar}`,
          category: pInfo.title,
          role: currentRole,
          question: `Bagaimana alur pendaftaran dan syarat menjadi anggota ${pInfo.title}?`,
          hint: `Alur pendaftaran & syarat`,
        }])
      );
    }

    // 2. When on Admin Data Management (Superadmin & Developer ONLY)
    const isSuperadminOrDev =
      session?.statusActive === 'SAH_TERDAFTAR' &&
      (session?.role === 'superadmin' || session?.role === 'developer');

    if (currentTab === 'admin_manage' && isSuperadminOrDev) {
      contextSpecificItems.push(
        {
          id: 'dyn-admin-sop',
          category: 'Kelola Data',
          role: currentRole,
          question: 'Bagaimana SOP penambahan personil/lembaga pilar sosial baru di wilayah saya?',
          hint: 'Panduan input anggota baru',
        },
        {
          id: 'dyn-admin-dup',
          category: 'Kelola Data',
          role: currentRole,
          question: 'Bagaimana sistem mendeteksi dan mencegah duplikasi data NIK/NIP saat penginputan?',
          hint: 'Pencegahan duplikasi NIK',
        },
        {
          id: 'dyn-admin-mutasi',
          category: 'Kelola Data',
          role: currentRole,
          question: 'Bagaimana cara memutasi personil yang pindah tugas antar kecamatan di daerah saya?',
          hint: 'Mutasi data personil',
        },
        {
          id: 'dyn-admin-batch',
          category: 'Kelola Data',
          role: currentRole,
          question: 'Bagaimana cara mencetak Kartu Anggota Digital secara massal format A4 (8 kartu)?',
          hint: 'Cetak massal siap potong',
        }
      );
    }

    // 3. When on Admin Monitoring & Reports
    if (currentTab === 'admin_monitor') {
      contextSpecificItems.push(
        {
          id: 'dyn-mon-excel',
          category: 'Monitoring',
          role: currentRole,
          question: 'Bagaimana cara mengekspor rekapitulasi data pilar ke format Excel (.xlsx) resmi?',
          hint: 'Unduh rekapitulasi data',
        },
        {
          id: 'dyn-mon-pdf',
          category: 'Monitoring',
          role: currentRole,
          question: 'Bagaimana cara mencetak lembar rekapitulasi bertandatangan digital dalam format PDF?',
          hint: 'Cetak PDF resmi',
        },
        {
          id: 'dyn-mon-musrenbang',
          category: 'Monitoring',
          role: currentRole,
          question: 'Bagaimana menyusun data statistik pilar untuk bahan Musrenbang Kabupaten/Kota?',
          hint: 'Penyusunan bahan Musrenbang',
        }
      );
    }

    // 4. When on Maintenance Settings
    if (currentTab === 'admin_maintenance') {
      contextSpecificItems.push(
        {
          id: 'dyn-maint-switch',
          category: 'Maintenance',
          role: currentRole,
          question: 'Bagaimana cara mengaktifkan Mode Maintenance khusus untuk role Publik (User) tanpa mematikan akses Admin?',
          hint: 'Saklar maintenance role',
        },
        {
          id: 'dyn-maint-region',
          category: 'Maintenance',
          role: currentRole,
          question: 'Bagaimana cara mengaktifkan Mode Maintenance granular hanya untuk satu Kabupaten/Kota tertentu?',
          hint: 'Maintenance per wilayah',
        },
        {
          id: 'dyn-maint-banner',
          category: 'Maintenance',
          role: currentRole,
          question: 'Bagaimana cara menulis dan memperbarui pesan pengumuman pemeliharaan darurat di layar pengguna?',
          hint: 'Kustomisasi pesan broadcast',
        }
      );
    }

    // 5. When on Superadmin Settings
    if (currentTab === 'superadmin_settings') {
      contextSpecificItems.push(
        {
          id: 'dyn-sa-all',
          category: 'Super Admin',
          role: currentRole,
          question: 'Bagaimana cara memantau total agregat 10 Pilar se-27 Kabupaten/Kota secara real-time?',
          hint: 'Monitoring agregat provinsi',
        },
        {
          id: 'dyn-sa-reset',
          category: 'Super Admin',
          role: currentRole,
          question: 'Bagaimana SOP mereset PIN / kata sandi Admin Daerah yang lupa kredensial login?',
          hint: 'Reset kredensial daerah',
        },
        {
          id: 'dyn-sa-audit',
          category: 'Super Admin',
          role: currentRole,
          question: 'Bagaimana cara membaca log Audit Trail untuk melacak siapa yang mengubah data pilar tertentu?',
          hint: 'Forensik audit keamanan',
        },
        {
          id: 'dyn-sa-satudata',
          category: 'Super Admin',
          role: currentRole,
          question: 'Bagaimana integrasi data PSKS JABAR dengan platform Satu Data Jawa Barat dan DTKS Kemensos?',
          hint: 'Sinkronisasi data eksternal',
        }
      );
    }

    // Filter catalog pool (excluding developer question)
    const pool = allRoleQuestions.filter(
      (q) => !q.question.toLowerCase().includes('developer') && !q.question.toLowerCase().includes('pembuat')
    );

    // Combine contextual questions first, then rotated pool
    const combinedPool = [...contextSpecificItems, ...pool];

    if (combinedPool.length === 0) {
      return [];
    }

    // Deterministic pseudo-random shuffle offset based on rotationSeed
    const startIndex = (rotationSeed * 2) % combinedPool.length;
    const rotatedItems: AIQuestionItem[] = [];

    for (let i = 0; i < combinedPool.length; i++) {
      const idx = (startIndex + i) % combinedPool.length;
      rotatedItems.push(combinedPool[idx]);
    }

    return rotatedItems.slice(0, 16);
  }, [currentTab, activePillar, allRoleQuestions, rotationSeed, currentRole]);

  // Filtered questions in the Catalog Drawer
  const filteredCatalogQuestions = useMemo(() => {
    let list = allRoleQuestions;
    if (selectedCategory !== 'all') {
      const group = roleCatalog.find((g) => g.category === selectedCategory);
      list = group ? group.questions : list;
    }
    if (catalogSearch.trim()) {
      const s = catalogSearch.toLowerCase();
      list = list.filter(
        (q) =>
          q.question.toLowerCase().includes(s) ||
          q.category.toLowerCase().includes(s) ||
          (q.hint && q.hint.toLowerCase().includes(s))
      );
    }
    return list;
  }, [allRoleQuestions, selectedCategory, catalogSearch, roleCatalog]);

  // Scroll Quick Questions horizontally
  const handleScrollQuick = (direction: 'left' | 'right') => {
    if (quickScrollRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      quickScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Rotate questions manually
  const handleShuffleQuestions = () => {
    setRotationSeed((prev) => prev + 1);
  };

  // Re-initialize / Reset chat history when session changes & rotate recommendations on entry
  useEffect(() => {
    const isUserLoggedIn = session && session.statusActive === 'SAH_TERDAFTAR';
    const userRoleTitle = currentRole.toUpperCase();
    const userRegion = session?.wilayah || 'Jawa Barat';

    let welcomeText = '';

    if (isDeveloperUser) {
      welcomeText = `Sampurasun! Halo **Ilham** 🚀 (Developer Mode)\nSaya **Asisten AI PSKS Jabar**.\n\nYoo Ham! Santai aja, mau ngutak-ngatik kodingan apa kita hari ini? Developer Control Panel, validasi RBAC, optimasi Supabase, atau mau simulasi fitur gokil lainnya? Gas langsung sebutin aja bro! 😎⚡`;
    } else if (isUserLoggedIn) {
      const displayName = session.nama;
      let roleDescription = 'informasi seputar 10 Pilar PSKS dan sebaran data Jawa Barat';
      if (currentRole === 'admin') {
        roleDescription = `tata kelola dan rekapitulasi data pilar di wilayah **${userRegion}**, verifikasi berkas pendaftaran, dan ekspor laporan`;
      } else if (currentRole === 'superadmin') {
        roleDescription = `pengawasan agregat 27 Kab/Kota, manajemen akun admin daerah, 8 fitur beranda & pengaturan, saklar maintenance, dan audit trail`;
      } else {
        roleDescription = `panduan pendaftaran pilar sosial, pengecekan status berkas pengajuan, serta informasi 10 Pilar PSKS Jawa Barat`;
      }

      welcomeText = `Sampurasun, selamat datang **Bapak/Ibu ${displayName}**!\nSaya **Asisten AI PSKS Jabar**.\n\nSebagai **${userRoleTitle === 'USER' ? 'Pengguna Terdaftar' : userRoleTitle}** untuk wilayah **${userRegion}**, saya siap membantu ${roleDescription}.\n\nAda yang bisa saya bantu atau jelaskan hari ini?`;
    } else {
      welcomeText = `Sampurasun, selamat datang **Bapak/Ibu**!\nSaya **Asisten AI PSKS Jabar**.\n\nSaya siap memberikan informasi resmi mengenai **10 Pilar PSKS**, alur pendaftaran mandiri relawan baru, sebaran data 27 Kabupaten/Kota, dan layanan sosial Dinas Sosial Provinsi Jawa Barat. Ada yang bisa saya bantu?`;
    }

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date(),
        isVerified: true,
        trackingSource: 'verified_exact',
      },
    ]);
  }, [session?.nama, session?.wilayah, session?.role, session?.statusActive, currentRole, isDeveloperUser]);

  // Close widget helper to ensure all states cleanly reset
  const closeWidget = () => {
    setIsOpen(false);
    setIsCatalogOpen(false);
    setIsHovered(false);
  };

  // Click outside listener (Safe mouse detection for desktop, avoids mobile touch jitter)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!target || !(target instanceof Node) || !target.isConnected) return;
      if (widgetRef.current && !widgetRef.current.contains(target)) {
        closeWidget();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isCatalogOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isCatalogOpen]);

  // Toggle open and rotate questions each time user enters/opens widget
  const handleToggleWidget = () => {
    setIsHovered(false);
    if (!isOpen) {
      setRotationSeed((prev) => prev + 1);
      setIsOpen(true);
    } else {
      closeWidget();
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    if (isCatalogOpen) setIsCatalogOpen(false);

    // Rotate quick suggestions immediately on every question asked so questions never stay stale
    setRotationSeed((prev) => prev + 1);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');

    // Instant Real-Time Grounding Interceptor (Direct access to allPillarData state & UU PDP Privacy)
    // Delivers sub-50ms instant response without sluggishness, exactly matching user request
    const roleForContext: UserRole = isDeveloperUser ? 'developer' : currentRole;
    const offTopicCheck = resolveOffTopicPublicQuery(textToSend, roleForContext, isDeveloperUser);
    const pinCheck = resolvePinSecurityQuery(textToSend, roleForContext, session?.nama);
    const privacyCheck = resolveSensitivePrivacyQuery(textToSend);
    const memberCheck = resolveMemberVerificationQuery(textToSend, allPillarData, session?.wilayah);
    const regionalCheck = resolveRegionalPillarDataQuery(textToSend, allPillarData, session?.wilayah);

    if (offTopicCheck || pinCheck || privacyCheck || memberCheck || regionalCheck) {
      const instantReply = offTopicCheck || pinCheck || privacyCheck || memberCheck || regionalCheck;
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: instantReply!,
        timestamp: new Date(),
        isVerified: true,
        trackingSource: (offTopicCheck || pinCheck || privacyCheck) ? 'verified_exact' : 'state_grounded',
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);
      if (isOpenRef.current) {
        setTypingMessageId(botMsg.id);
      } else {
        setTypingMessageId(null);
        setHasUnreadInBackground(true);
      }
      return;
    }

    setIsLoading(true);

    const botMsgId = `bot-${Date.now()}`;
    const initialBotMsg: Message = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isVerified: false,
      trackingSource: 'ai_model_verified',
    };
    setMessages((prev) => [...prev, initialBotMsg]);
    setStreamingMessageId(botMsgId);

    try {
      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Role and user context strictly based on actual authenticated session
      const roleForContext: UserRole = isDeveloperUser ? 'developer' : currentRole;
      const isUserAuthenticated = session?.statusActive === 'SAH_TERDAFTAR';
      const nameForContext = isUserAuthenticated && session?.nama ? session.nama : 'Tamu Publik';

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: true,
          messages: historyPayload,
          userContext: {
            nama: nameForContext,
            wilayah: session?.wilayah || 'Jawa Barat',
            role: roleForContext,
            statusActive: session?.statusActive || 'GUEST',
            currentTab,
            activePillar,
            kadinasName: appSettings?.kadinasName,
            liveSummary: {
              totalRecords: liveMetrics.totalRecords,
              pillarCounts: liveMetrics.pillarCounts,
              totalsByRegion: regionalMetrics.totalsByRegion,
              pillarsByRegion: regionalMetrics.pillarsByRegion,
            },
          },
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let accumulatedText = '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                setMessages((prev) =>
                  prev.map((m) => (m.id === botMsgId ? { ...m, content: accumulatedText } : m))
                );
                scrollToBottom();
              } else if (parsed.error) {
                console.warn('[AI Stream] SSE chunk error:', parsed.error);
              }
            } catch {
              // Ignore partial JSON parse errors
            }
          }
        }
      } else {
        const data = await res.json();
        if (res.ok && data?.reply) {
          accumulatedText = data.reply;
        }
      }

      const previousAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';

      // Run answer verification and grounding system against local system state
      const verifiedResult = verifyAndTrackAnswerAccuracy(
        textToSend,
        accumulatedText,
        roleForContext,
        nameForContext,
        session?.wilayah,
        currentTab,
        activePillar,
        allPillarData,
        appSettings,
        previousAssistantMessage
      );

      const finalContent = verifiedResult.finalContent || accumulatedText;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: finalContent,
                isVerified: verifiedResult.isAccurate,
                trackingSource: verifiedResult.source,
              }
            : m
        )
      );

      setStreamingMessageId(null);
      if (!isOpenRef.current) {
        setHasUnreadInBackground(true);
      }
    } catch (err: any) {
      console.warn('[AI Assistant] Server unreachable, using verified local knowledge engine:', err);

      const previousAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
      const roleForContext: UserRole = isDeveloperUser ? 'developer' : currentRole;
      const isUserAuthenticated = session?.statusActive === 'SAH_TERDAFTAR';
      const nameForContext = isUserAuthenticated && session?.nama ? session.nama : 'Tamu Publik';

      const verifiedResult = verifyAndTrackAnswerAccuracy(
        textToSend,
        '',
        roleForContext,
        nameForContext,
        session?.wilayah,
        currentTab,
        activePillar,
        allPillarData,
        appSettings,
        previousAssistantMessage
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content: verifiedResult.finalContent,
                isVerified: verifiedResult.isAccurate,
                trackingSource: verifiedResult.source,
              }
            : m
        )
      );
      setStreamingMessageId(null);
      if (!isOpenRef.current) {
        setHasUnreadInBackground(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setRotationSeed((prev) => prev + 1);
    let resetText = '';
    if (isDeveloperUser) {
      resetText = `Percakapan di-reset nih. Siap lanjut, **Ilham Fazril**! Ada arsitektur kode atau modul lain yang mau kita diskusikan bareng?`;
    } else if (session?.statusActive === 'SAH_TERDAFTAR' && session?.nama) {
      resetText = `Percakapan diperbarui. Ada hal lain yang ingin Anda tanyakan seputar peran **${currentRole === 'user' ? 'Pengguna Terdaftar' : currentRole.toUpperCase()}** di wilayah ${session?.wilayah || 'Jawa Barat'}?`;
    } else {
      resetText = `Percakapan diperbarui. Ada hal lain seputar PSKS Jawa Barat yang ingin Anda tanyakan?`;
    }

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: resetText,
        timestamp: new Date(),
        isVerified: true,
        trackingSource: 'verified_exact',
      },
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'developer':
        return {
          icon: <Terminal className="w-3 h-3 text-purple-400 shrink-0" />,
          label: 'DEVELOPER',
          bg: 'bg-purple-950/90 text-purple-300 border-purple-700/60',
        };
      case 'superadmin':
        return {
          icon: <Crown className="w-3 h-3 text-amber-400 shrink-0" />,
          label: 'SUPER ADMIN',
          bg: 'bg-amber-950/90 text-amber-300 border-amber-700/60',
        };
      case 'admin':
        return {
          icon: <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />,
          label: 'ADMIN DAERAH',
          bg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60',
        };
      default:
        return {
          icon: <User className="w-3 h-3 text-cyan-400 shrink-0" />,
          label: 'PUBLIK / TAMU',
          bg: 'bg-slate-900/90 text-cyan-300 border-slate-700/70',
        };
    }
  };

  const roleBadge = getRoleBadge(currentRole);

  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formattedLine = line;

      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      if (isBullet) {
        formattedLine = line.trim().substring(2);
      }

      const parts = formattedLine.split(/(\*\*.*?\*\*)/g);

      return (
        <div
          key={idx}
          className={`${
            isBullet ? 'flex items-start gap-2 my-1 pl-1' : 'my-0.5'
          } leading-relaxed break-words [overflow-wrap:anywhere]`}
        >
          {isBullet && <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>}
          <span className="break-words [overflow-wrap:anywhere] flex-1">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={pIdx} className="font-extrabold text-amber-200">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <>
      {/* Mobile Backdrop (Intentional tap outside to close, prevents accidental touchstart auto-close while typing/scrolling on mobile) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWidget}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-40 sm:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div
        ref={widgetRef}
        className="select-none"
      >
        {/* Floating Trigger Button (Tampil saat chat tertutup) */}
        {!isOpen && (
          <div className="fixed bottom-[70px] right-3.5 sm:bottom-[88px] sm:right-6 z-50 flex flex-col items-end">
            <button
              id="btn-open-ai-assistant"
              type="button"
              onClick={handleToggleWidget}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative flex items-center bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 text-white p-2.5 sm:p-3.5 rounded-full shadow-[0_8px_25px_rgba(16,185,129,0.4)] border border-emerald-500/50 transition-all duration-300 cubic-bezier(0.16,1,0.3,1) hover:shadow-[0_10px_30px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 cursor-pointer select-none touch-manipulation ring-2 ring-emerald-400/40"
              title="Tanya Asisten AI PSKS JABAR"
            >
              {/* Soft Glowing Ring Layer with Gentle Opacity Transition */}
              <span
                className={`absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-amber-300 blur-sm transition-opacity duration-300 pointer-events-none ${
                  isHovered || isLoading ? 'opacity-80 animate-pulse' : 'opacity-30'
                }`}
              />

              {/* Unread / Background Completed Answer Badge */}
              {hasUnreadInBackground && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-slate-950 items-center justify-center text-[8px] font-black text-slate-950">
                    ✓
                  </span>
                </span>
              )}

              {/* Loading in background indicator badge */}
              {isLoading && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-400 border-t-transparent bg-slate-950" />
                </span>
              )}

              {/* Consistent Fixed Dimension Icon Container */}
              <div className="relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 shrink-0 aspect-square">
                <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300 shrink-0 animate-bounce transition-transform duration-300 ease-out group-hover:scale-105" />
              </div>

              {/* Smooth Opacity & Width Transition Text Label */}
              <div
                className={`relative hidden sm:flex items-center overflow-hidden transition-all duration-300 cubic-bezier(0.16,1,0.3,1) ${
                  isHovered ? 'max-w-[180px] opacity-100 ml-2.5' : 'max-w-0 opacity-0 ml-0'
                }`}
              >
                <span className="text-[11px] sm:text-xs font-black whitespace-nowrap pr-1.5 sm:pr-2.5 leading-none flex items-center tracking-wide text-white drop-shadow-sm transition-opacity duration-300">
                  {isLoading ? 'AI Menjawab...' : hasUnreadInBackground ? 'Jawaban Siap!' : 'Chat Asisten AI'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* AI Chat Window Modal: Ultra Responsive with Anti-Collision Math */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="fixed inset-x-2.5 xs:inset-x-3.5 top-[76px] bottom-3 sm:inset-auto sm:fixed sm:bottom-6 sm:right-6 sm:top-auto z-50 w-auto sm:w-[430px] md:w-[465px] sm:h-[min(480px,calc(100dvh-130px))] sm:max-h-[calc(100dvh-130px)] flex flex-col bg-slate-950/98 backdrop-blur-2xl border border-emerald-500/40 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden select-text"
              style={{ boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95)' }}
            >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-800/50 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-amber-300 shadow-md border border-emerald-300/40 shrink-0">
                  {isDeveloperUser ? (
                    <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                  ) : (
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                      Asisten AI PSKS JABAR
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[8.5px] sm:text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-500/40 font-mono font-bold shrink-0 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <p className="text-[9.5px] sm:text-[10px] text-emerald-300/80 font-medium truncate">
                    {isDeveloperUser
                      ? 'Sesi Khusus Developer • Ilham Fazril'
                      : session?.statusActive === 'SAH_TERDAFTAR'
                      ? `Akun Terdaftar • ${session?.nama || 'Pengguna'}`
                      : 'Kecerdasan Buatan Dinsos Prov. Jawa Barat'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1">
                {/* Toggle Question Catalog Button */}
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(!isCatalogOpen)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold ${
                    isCatalogOpen
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/80'
                  }`}
                  title="Buka Rekomendasi Puluhan Pertanyaan Pintar"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline">Katalog</span>
                  <span className="text-[10px]">({allRoleQuestions.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetChat}
                  className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg transition-all cursor-pointer"
                  title="Mulai Ulang Percakapan"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  type="button"
                  onClick={closeWidget}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all cursor-pointer"
                  title="Tutup Chat"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Role & Context Bar */}
            <div className="px-3 py-1.5 bg-slate-900/95 border-b border-emerald-900/40 flex items-center justify-between text-[9.5px] sm:text-[10px] text-slate-300 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-black border ${roleBadge.bg}`}
                >
                  {roleBadge.icon}
                  <span className="truncate">{roleBadge.label}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-300/90 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50 truncate">
                  <Layers className="w-2.5 h-2.5 text-amber-400" />
                  <span className="truncate">{contextLabel}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleShuffleQuestions}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer bg-slate-800/60 hover:bg-slate-800 px-1.5 py-0.5 rounded transition-colors shrink-0 ml-1"
                title="Putar & Segarkan Rekomendasi Pertanyaan"
              >
                <Shuffle className="w-2.5 h-2.5" />
                <span>Putar Topik</span>
              </button>
            </div>

            {/* CATALOG VIEW / DRAWER */}
            <AnimatePresence>
              {isCatalogOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '100%' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex-1 bg-slate-950 flex flex-col overflow-hidden z-20 border-b border-slate-800 min-h-0"
                >
                  {/* Catalog Header & Search */}
                  <div className="p-2.5 sm:p-3 bg-slate-900/95 border-b border-slate-800 space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <h4 className="text-xs font-bold text-white">
                          Rekomendasi Pertanyaan ({roleBadge.label})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCatalogOpen(false)}
                        className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer font-medium"
                      >
                        Kembali ke Chat
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder={`Cari dari ${allRoleQuestions.length} pertanyaan ${roleBadge.label}...`}
                        className="w-full bg-slate-950 text-white placeholder-slate-500 text-[11px] pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        className={`text-[9.5px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                          selectedCategory === 'all'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Semua ({allRoleQuestions.length})
                      </button>
                      {roleCatalog.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCategory(cat.category)}
                          className={`text-[9.5px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                            selectedCategory === cat.category
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {cat.category} ({cat.questions.length})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catalog Question List */}
                  <div className="flex-1 p-2.5 sm:p-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-0">
                    {filteredCatalogQuestions.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 space-y-2">
                        <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="text-xs">Tidak ada pertanyaan yang sesuai dengan kata kunci.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSearch('');
                            setSelectedCategory('all');
                          }}
                          className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                        >
                          Reset Pencarian
                        </button>
                      </div>
                    ) : (
                      filteredCatalogQuestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSendMessage(item.question)}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/80 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group flex items-start justify-between gap-2 shadow-xs"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 group-hover:bg-emerald-900/90 text-amber-300 font-bold">
                                {item.category}
                              </span>
                              {item.hint && (
                                <span className="text-[9px] text-slate-400 group-hover:text-emerald-200 truncate">
                                  • {item.hint}
                                </span>
                              )}
                            </div>
                            <p className="text-[11.5px] font-medium text-slate-200 group-hover:text-white leading-snug break-words [overflow-wrap:anywhere]">
                              {item.question}
                            </p>
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5 text-slate-400 group-hover:text-white transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Normal Messages Body */}
            {!isCatalogOpen && (
              <>
                <div className="flex-1 p-3 sm:p-3.5 space-y-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent min-h-0">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 sm:gap-2.5 ${
                        msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950'
                            : 'bg-emerald-900/90 text-amber-300 border border-emerald-700/60'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : isDeveloperUser ? (
                          <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                        ) : (
                          <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                      </div>

                      {/* Bubble with anti-overflow and responsive text */}
                      <div
                        className={`group relative max-w-[88%] sm:max-w-[85%] rounded-2xl p-2.5 sm:p-3.5 text-[11.5px] sm:text-[12.5px] leading-relaxed break-words [overflow-wrap:anywhere] ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-none shadow-md border border-emerald-400/30'
                            : 'bg-slate-900/95 text-slate-100 rounded-tl-none border border-slate-800 shadow-inner'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <TypingFormattedText
                            content={msg.content}
                            session={session}
                            isAnimated={msg.id === typingMessageId}
                            isStreaming={msg.id === streamingMessageId}
                            onScrollToBottom={scrollToBottom}
                            onComplete={() => setTypingMessageId(null)}
                            onNavigateTab={onNavigateTab}
                            onSelectPillar={onSelectPillar}
                            onSendMessage={handleSendMessage}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                            {formatText(msg.content)}
                          </div>
                        )}

                        {/* Timestamp, Verification Badge & Actions */}
                        <div
                          className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t text-[8.5px] sm:text-[9px] ${
                            msg.role === 'user'
                              ? 'border-emerald-500/40 text-emerald-100/70'
                              : 'border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {msg.role === 'assistant' && (
                              msg.trackingSource === 'ai_model_verified' ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[8px] sm:text-[8.5px] text-cyan-300 font-semibold bg-cyan-950/80 px-1.5 py-0.5 rounded-full border border-cyan-700/60 shadow-xs"
                                  title="Respon bersifat informatif umum yang disusun oleh AI Generatif"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                  <span>Verifikasi: AI Generatif</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[8px] sm:text-[8.5px] text-emerald-300 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-600/60 shadow-xs"
                                  title="Jawaban diverifikasi langsung dari database lokal & data sistem resmi"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                  <span>Verifikasi: Berhasil</span>
                                </span>
                              )
                            )}
                          </div>

                          {msg.role === 'assistant' && (
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
                              title="Salin Tanggapan AI"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-900/90 text-amber-300 border border-emerald-700/60 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" style={{ animationDuration: '2s' }} />
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 text-slate-300 rounded-2xl rounded-tl-none p-2.5 sm:p-3 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        <span className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium ml-1">Menyusun & memverifikasi jawaban...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Scrollable Contextual Quick Prompts Carousel with Navigation Arrows & Dynamic Rotate */}
                {!isLoading && (
                  <div className="relative px-2 py-1.5 sm:px-2.5 sm:py-2 bg-slate-900/95 border-t border-slate-800 flex items-center gap-1 shrink-0">
                    {/* Left Scroll Button */}
                    <button
                      type="button"
                      onClick={() => handleScrollQuick('left')}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-full shadow-sm shrink-0 cursor-pointer"
                      title="Geser ke kiri"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Scrollable Container with All Quick Pills */}
                    <div
                      ref={quickScrollRef}
                      className="flex-1 overflow-x-auto flex items-center gap-1.5 scrollbar-none scroll-smooth py-0.5"
                    >
                      {/* Pinned & Dynamically Rotated Question Pills */}
                      {quickQuestions.map((q) => {
                        return (
                          <button
                            key={`${q.id}-${rotationSeed}`}
                            type="button"
                            onClick={() => handleSendMessage(q.question)}
                            className="whitespace-nowrap text-[10px] font-medium px-2.5 py-1 rounded-full transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1 bg-slate-800/90 hover:bg-emerald-950 hover:border-emerald-500/60 text-slate-200 hover:text-amber-200 border border-slate-700/80"
                            title={q.hint || q.question}
                          >
                            <span>{q.question}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Scroll Button */}
                    <button
                      type="button"
                      onClick={() => handleScrollQuick('right')}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-full shadow-sm shrink-0 cursor-pointer"
                      title="Geser ke kanan"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Voice Input Toast / Feedback Banner */}
                {voiceToast && (
                  <div className="px-3 py-1.5 bg-slate-950/95 border-t border-amber-500/30 text-amber-300 text-[10.5px] font-medium flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isListening ? 'bg-red-500 animate-ping' : 'bg-amber-400'}`} />
                      <span className="truncate">{voiceToast}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVoiceToast(null)}
                      className="text-slate-400 hover:text-white p-0.5 cursor-pointer shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-2 sm:p-2.5 bg-slate-900 border-t border-emerald-900/40 flex items-center gap-1.5 sm:gap-2 shrink-0"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isListening
                        ? 'Sedang mendengarkan suara Anda...'
                        : isDeveloperUser
                        ? 'Halo Ilham, mau eksekusi atau uji kodingan apa nih? Gas ketik...'
                        : session?.statusActive === 'SAH_TERDAFTAR' && session?.nama
                        ? `Halo Bapak/Ibu ${session.nama}, tanya seputar ${contextLabel}...`
                        : `Tanya seputar ${contextLabel}...`
                    }
                    disabled={isLoading}
                    className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-[11px] sm:text-xs px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 min-w-0"
                  />

                  {/* Voice-to-Text Microphone Button */}
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    disabled={isLoading}
                    className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-md ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse ring-2 ring-red-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700'
                    }`}
                    title={isListening ? 'Berhenti mendengarkan' : 'Bicara dengan Suara (Voice-to-Text)'}
                  >
                    {isListening ? (
                      <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};
