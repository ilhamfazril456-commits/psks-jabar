import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, CheckCircle2, AlertOctagon } from 'lucide-react';
import { UserSession } from '../types';
import { PILLARS_CONFIG } from '../data/initialData';

const KEPAHLAWANAN_LABELS: Record<string, { title: string; icon: string }> = {
  pahlawan_nasional: { title: 'Pahlawan Nasional', icon: '🏅' },
  pkri: { title: 'PKRI (Perintis Kemerdekaan RI)', icon: '🚩' },
  janda_pkri: { title: 'Janda PKRI', icon: '🛡️' },
  keluarga_pahlawan: { title: 'Keluarga Pahlawan', icon: '👥' },
};

interface PillarAccessRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillarId: string | null;
  restrictionType?: 'pillar' | 'kepahlawanan';
  session: UserSession;
  onBackToHome: () => void;
}

export const PillarAccessRestrictedModal: React.FC<PillarAccessRestrictedModalProps> = ({
  isOpen,
  onClose,
  pillarId,
  restrictionType = 'pillar',
  session,
  onBackToHome,
}) => {
  if (!isOpen || !pillarId) return null;

  const isKepahlawanan = restrictionType === 'kepahlawanan';
  const targetKepahlawanan = KEPAHLAWANAN_LABELS[pillarId];
  const targetPillar = isKepahlawanan
    ? {
        id: pillarId,
        title: targetKepahlawanan?.title || pillarId.toUpperCase(),
        icon: targetKepahlawanan?.icon || '🏅',
      }
    : PILLARS_CONFIG[pillarId] || {
        id: pillarId,
        title: pillarId.toUpperCase(),
        icon: '📋',
      };

  const allowedList = isKepahlawanan
    ? session.allowedKepahlawanan || []
    : session.allowedPillars || [];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-rose-300 overflow-hidden flex flex-col my-auto transition-all transform scale-100 animate-in zoom-in-95 duration-200">
        {/* Top Header Banner with Gradient */}
        <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-rose-300 shadow-inner">
              <Lock className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="inline-block bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                OTORITAS TERBATAS — SUPERADMIN
              </span>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                {isKepahlawanan ? 'AKSES KEPAHLAWANAN DIKUNCI DEVELOPER' : 'AKSES PILAR DIKUNCI DEVELOPER'}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Targeted Pillar / Kepahlawanan Banner */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-rose-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
              {targetPillar.icon || '🔒'}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase text-rose-600 tracking-wider">
                {isKepahlawanan ? 'Menu Kepahlawanan Terkunci:' : 'Modul Pilar Terkunci:'}
              </div>
              <div className="text-sm sm:text-base font-black text-rose-950">
                {targetPillar.title}
              </div>
            </div>
          </div>

          {/* User Narrative */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            Mohon maaf Bapak/Ibu <strong className="text-slate-900">{session.nama}</strong> (<span className="font-mono text-slate-600">@{session.username || 'superadmin'}</span>), akun Anda <strong className="text-rose-700">tidak memiliki kewenangan</strong> untuk membuka atau mengelola {isKepahlawanan ? 'menu Gerbang Kepahlawanan' : 'basis data pada pilar'} ini.
          </p>

          {/* Allowed Items Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                {isKepahlawanan ? 'Kewenangan Kepahlawanan Akun Anda:' : 'Kewenangan Pilar Akun Anda:'}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {allowedList.length} {isKepahlawanan ? 'Menu Diizinkan' : 'Pilar Diizinkan'}
              </span>
            </div>

            {allowedList.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-2 bg-white rounded-xl border border-slate-200">
                {isKepahlawanan
                  ? 'Belum ada menu Kepahlawanan yang ditugaskan oleh Developer untuk akun ini.'
                  : 'Belum ada pilar yang ditugaskan oleh Developer untuk akun ini.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {allowedList.map((pKey) => {
                  const cfg = isKepahlawanan ? KEPAHLAWANAN_LABELS[pKey] : PILLARS_CONFIG[pKey];
                  return (
                    <div
                      key={pKey}
                      className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 text-slate-800 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px] font-bold truncate">
                        {cfg ? `${cfg.icon} ${cfg.title}` : pKey.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Policy Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-amber-950 text-[11px] leading-relaxed flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Kebijakan Otoritas Provinsi:</strong> Pembatasan hak akses pilar ini dikonfigurasi langsung oleh Lead Developer Sistem Informasi PSKS Jawa Barat. Apabila penugasan kedinasan Anda membutuhkan dispensasi akses modul ini, silakan hubungi Lead Developer Utama (<strong>Kang Ilham Fazril</strong>).
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onBackToHome();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0f2b5c] to-[#1a4a9c] hover:from-[#133773] hover:to-[#2257b3] text-amber-300 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-300" />
            <span>Kembali ke Beranda</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
