import React, { useState } from 'react';
import { UserSession, AdminMessage } from '../types';
import {
  Inbox,
  X,
  Send,
  CheckCheck,
  Trash2,
  Mail,
  ShieldCheck,
  Code2,
  Clock,
  Sparkles,
  Check,
  MessageSquare
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const WILAYAH_JABAR_LIST = [
  'Kota Bandung',
  'Kota Banjar',
  'Kota Bekasi',
  'Kota Bogor',
  'Kota Cimahi',
  'Kota Cirebon',
  'Kota Depok',
  'Kota Sukabumi',
  'Kota Tasikmalaya',
  'Kab. Bandung',
  'Kab. Bandung Barat',
  'Kab. Bekasi',
  'Kab. Bogor',
  'Kab. Ciamis',
  'Kab. Cianjur',
  'Kab. Cirebon',
  'Kab. Garut',
  'Kab. Indramayu',
  'Kab. Karawang',
  'Kab. Kuningan',
  'Kab. Majalengka',
  'Kab. Pangandaran',
  'Kab. Purwakarta',
  'Kab. Subang',
  'Kab. Sukabumi',
  'Kab. Sumedang',
  'Kab. Tasikmalaya',
];

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  messages: AdminMessage[];
  onSendMessage?: (msg: Omit<AdminMessage, 'id' | 'createdAt'>) => void;
  onMarkAsRead?: (msgId: string) => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  isOpen,
  onClose,
  session,
  messages,
  onSendMessage,
  onMarkAsRead,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');
  const [isComposing, setIsComposing] = useState(false);

  // Form states for new message
  const [targetWilayah, setTargetWilayah] = useState('Semua Wilayah');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sendNotice, setSendNotice] = useState<string | null>(null);
  const [showPopupSuccess, setShowPopupSuccess] = useState<string | null>(null);

  // Fitur Inbox dilarang keras untuk akun role user
  if (!isOpen || session.role === 'user') return null;

  // Filter messages relevant to this logged-in user:
  // Admin Wilayah ONLY sees messages directed to their specific Wilayah or 'Semua Wilayah'.
  // Superadmin & Developer can see ALL sent and received messages.
  const userWilayah = (session.wilayah || '').trim();
  const isSuperadminOrDev = session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper;

  const userMessages = messages.filter((m) => {
    // Superadmin and Developer see ALL messages
    if (isSuperadminOrDev) return true;

    // Broadcast messages intended for all regions
    if (m.targetWilayah === 'Semua Wilayah') return true;

    // Region-specific message: check if targetWilayah matches user's assigned wilayah
    if (userWilayah && m.targetWilayah) {
      const target = m.targetWilayah.toLowerCase().trim();
      const userW = userWilayah.toLowerCase().trim();

      if (target === userW) return true;

      // Handle matching variations (e.g. "Kota Cimahi" vs "Cimahi") while preventing Kota vs Kab cross-visibility
      if (target.replace('kota ', '').replace('kab. ', '').trim() === userW.replace('kota ', '').replace('kab. ', '').trim()) {
        if (target.includes('kota') && userW.includes('kab')) return false;
        if (target.includes('kab') && userW.includes('kota')) return false;
        return true;
      }
    }

    // Otherwise, region does not match -> HIDDEN from this admin
    return false;
  });

  const isDev = session.role === 'developer' || session.isDeveloper;
  const isSuperadmin = session.role === 'superadmin';

  const unreadCount = userMessages.filter((m) => {
    if (m.isRead) return false;
    if (isDev) return true;
    if (isSuperadmin) {
      if (m.senderRole === 'superadmin') return false;
      return true;
    }
    return true;
  }).length;

  const filteredMessages = userMessages.filter((m) => {
    if (filterMode === 'unread') {
      if (m.isRead) return false;
      if (isSuperadmin && !isDev && m.senderRole === 'superadmin') return false;
      return true;
    }
    return true;
  });

  const handleMarkAsRead = async (msg: AdminMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      if (onMarkAsRead) {
        onMarkAsRead(msg.id);
      }
      try {
        await updateDoc(doc(db, 'admin_messages', msg.id), {
          isRead: true,
        });
      } catch (err) {
        console.error('Error updating read status:', err);
      }
    }
  };

  const handleDeleteMessage = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'admin_messages', id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) return;

    const senderTitle =
      session.role === 'developer' || session.isDeveloper
        ? 'Developer PSKS Jabar'
        : 'Superadmin Provinsi Jawa Barat';

    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('id-ID', { month: 'short' })} ${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    if (onSendMessage) {
      onSendMessage({
        senderName: session.nama || senderTitle,
        senderRole: (session.role === 'developer' || session.isDeveloper ? 'developer' : 'superadmin'),
        targetWilayah: targetWilayah,
        subject: subject,
        content: content,
        timestamp: formattedDate,
        isRead: false,
      });
    }

    const isBroadcast = targetWilayah === 'Semua Wilayah';
    const targetDesc = isBroadcast
      ? 'Semua Admin Wilayah (Broadcast 27 Kab/Kota Jawa Barat)'
      : targetWilayah;

    setSendNotice(
      isBroadcast
        ? '📢 Pesan resmi broadcast berhasil dikirimkan ke 27 Admin Wilayah Kab/Kota!'
        : `✅ Pesan resmi berhasil dikirimkan ke "${targetWilayah}"!`
    );
    setShowPopupSuccess(
      isBroadcast
        ? 'Pesan resmi Anda telah berhasil dikirimkan secara serentak ke 27 Admin Wilayah Kabupaten & Kota se-Jawa Barat!'
        : `Pesan resmi Anda ke "${targetDesc}" telah berhasil dikirim dan tersimpan di Inbox admin tujuan!`
    );
    setSubject('');
    setContent('');
    setIsComposing(false);
    setTimeout(() => setSendNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-[#d4af37] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#043e2e] to-[#064e3b] text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37] text-[#043e2e] flex items-center justify-center shadow-md font-extrabold relative">
              <Inbox className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#043e2e] animate-bounce">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#f3e5ab] m-0 flex items-center gap-2">
                <span>Pesan Masuk & Instruksi Admin</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-rose-500/30 text-rose-200 border border-rose-400/40 px-2 py-0.5 rounded-full font-extrabold">
                    {unreadCount} Pesan Baru
                  </span>
                )}
              </h2>
              <p className="text-xs text-emerald-200/90 m-0">
                Layanan komunikasi internal {session.wilayah ? `[${session.wilayah}]` : 'Provinsi Jawa Barat'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTICE FEEDBACK */}
        {sendNotice && (
          <div className="bg-emerald-50 border-b border-emerald-300 text-emerald-900 px-4 py-2.5 text-xs font-bold flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>{sendNotice}</span>
          </div>
        )}

        {/* NAVBAR TAB FILTER & ACTION */}
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setFilterMode('all');
                setIsComposing(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                !isComposing && filterMode === 'all'
                  ? 'bg-[#043e2e] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Pesan ({userMessages.length})
            </button>
            <button
              onClick={() => {
                setFilterMode('unread');
                setIsComposing(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                !isComposing && filterMode === 'unread'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <span>Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {isSuperadminOrDev && (
            <button
              onClick={() => {
                setIsComposing(true);
                setSelectedMessage(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isComposing
                  ? 'bg-[#d4af37] text-[#043e2e]'
                  : 'bg-[#043e2e] text-white hover:bg-[#064e3b]'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Kirim Pesan</span>
            </button>
          )}
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* COMPOSE FORM (IF ACTIVE) */}
          {isComposing ? (
            <form onSubmit={handleSendSubmit} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h3 className="text-sm font-black text-[#043e2e] m-0 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#d4af37]" />
                  <span>Kirim Pesan Resmi Ke Admin Wilayah</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Tujuan Pesan:
                </label>
                <select
                  value={targetWilayah}
                  onChange={(e) => setTargetWilayah(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                >
                  <option value="Semua Wilayah">📢 Semua Admin Wilayah (Broadcast 27 Kab/Kota)</option>
                  {WILAYAH_JABAR_LIST.map((wil) => (
                    <option key={wil} value={wil}>
                      📍 {wil}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subjek / Judul Pesan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemutakhiran Data Lapangan Semester II"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pesan / Instruksi Kerja:
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan petunjuk atau informasi penting untuk admin wilayah..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#043e2e] text-[#f3e5ab] hover:bg-[#064e3b] shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Kirim Pesan Sekarang</span>
                </button>
              </div>
            </form>
          ) : selectedMessage ? (
            /* MESSAGE DETAIL VIEW */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        selectedMessage.senderRole === 'developer'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {selectedMessage.senderRole === 'developer' ? 'DEVELOPER PSKS JABAR' : 'SUPERADMIN PROVINSI'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {selectedMessage.timestamp}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#043e2e] m-0">
                    {selectedMessage.subject}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold m-0">
                    Dari: <strong>{selectedMessage.senderName}</strong> | Ditujukan: <strong>{selectedMessage.targetWilayah}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1 rounded-lg bg-slate-200"
                >
                  Kembali ke Daftar
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                {selectedMessage.content}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={(e) => handleDeleteMessage(selectedMessage.id, e)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pesan Ini</span>
                </button>

                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 bg-[#043e2e] text-white font-extrabold text-xs rounded-xl shadow cursor-pointer"
                >
                  Tutup Pesan
                </button>
              </div>
            </div>
          ) : filteredMessages.length > 0 ? (
            /* MESSAGES LIST */
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleMarkAsRead(msg)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  msg.isRead
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-emerald-50/70 border-emerald-500/60 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.senderRole === 'developer'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-[#043e2e] text-[#d4af37]'
                    }`}
                  >
                    {msg.senderRole === 'developer' ? (
                      <Code2 className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#043e2e]">
                        {msg.senderName}
                      </span>
                      {!msg.isRead && (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                          BARU
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-semibold">
                        • {msg.targetWilayah}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 m-0">
                      {msg.subject}
                    </h4>

                    <p className="text-xs text-slate-600 font-normal line-clamp-2 m-0">
                      {msg.content}
                    </p>

                    <p className="text-[10px] text-slate-400 font-semibold m-0 pt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {msg.timestamp}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 space-y-2">
                  <button
                    onClick={(e) => handleDeleteMessage(msg.id, e)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                    title="Hapus Pesan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {msg.isRead ? (
                    <span title="Sudah Dibaca">
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                    </span>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Mail className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600 m-0">
                {filterMode === 'unread' ? 'Tidak Ada Pesan Belum Dibaca' : 'Kotak Masuk Pesan Masih Kosong'}
              </p>
              <p className="text-[11px] text-slate-400 m-0">
                Pesan resmi dari Superadmin Provinsi atau Developer akan tampil di sini.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-semibold">
            Status Akun Active: <strong className="text-[#043e2e]">{session.nama} ({session.role})</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#043e2e] text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer hover:bg-[#064e3b]"
          >
            Tutup Inbox
          </button>
        </div>
      </div>

      {/* POP-UP NOTIFICATION MODAL */}
      {showPopupSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-emerald-500 max-w-sm w-full p-6 text-center space-y-4 relative animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-400 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[#043e2e] m-0">
                Pesan Berhasil Dikirim!
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-2 leading-relaxed">
                {showPopupSuccess}
              </p>
            </div>

            <button
              onClick={() => setShowPopupSuccess(null)}
              className="w-full py-2.5 bg-[#043e2e] hover:bg-[#064e3b] text-[#f3e5ab] font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
