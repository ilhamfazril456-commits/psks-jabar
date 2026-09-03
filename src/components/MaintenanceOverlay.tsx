import React, { useState } from 'react';
import { UserSession, AppSettings } from '../types';
import { ShieldAlert, Wrench, Lock, KeyRound } from 'lucide-react';

interface MaintenanceOverlayProps {
  session: UserSession;
  appSettings: AppSettings;
  currentTab?: string;
  onNavigateToTab?: (tab: string) => void;
  onDeveloperLogin?: (role: 'developer' | 'superadmin' | 'admin', nama: string, wilayah: string) => void;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  session,
  appSettings,
  currentTab,
  onNavigateToTab,
  onDeveloperLogin,
}) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRole, setLoginRole] = useState<'superadmin' | 'developer'>('superadmin');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginErr] = useState<string | null>(null);

  // Developer is ALWAYS EXEMPT from maintenance
  if (session.isDeveloper || session.role === 'developer') {
    return null;
  }

  // Exempt when active tab is the maintenance console or superadmin settings page
  if (currentTab === 'admin_maintenance' || currentTab === 'superadmin_settings') {
    return null;
  }

  const isWilayahMatch = (wil: string, map?: Record<string, boolean>) => {
    if (!map || !wil) return false;
    if (map[wil] === true) return true;
    const matchKey = Object.keys(map).find(
      (k) => k.toLowerCase().trim() === wil.toLowerCase().trim()
    );
    return matchKey ? map[matchKey] === true : false;
  };

  let isBlocked = false;
  let titleRole = '';
  let messageContent = '';

  if (session.role === 'user') {
    const isWilMaintenance = isWilayahMatch(session.wilayah, appSettings.maintenanceUserWilayah);
    if (appSettings.maintenanceUser || isWilMaintenance) {
      isBlocked = true;
      titleRole = `PENGUNJUNG / USER PUBLIK (${session.wilayah || 'Jawa Barat'})`;
      messageContent = appSettings.maintenanceMsgUser;
    }
  } else if (session.role === 'admin') {
    const isWilMaintenance = isWilayahMatch(session.wilayah, appSettings.maintenanceAdminWilayah);
    if (appSettings.maintenanceAdmin || isWilMaintenance) {
      isBlocked = true;
      titleRole = `ADMIN REGIONAL (${session.wilayah || 'WILAYAH'})`;
      messageContent = appSettings.maintenanceMsgAdmin;
    }
  } else if (session.role === 'superadmin' && appSettings.maintenanceSuperadmin) {
    isBlocked = true;
    titleRole = 'SUPERADMIN PROVINSI';
    messageContent = appSettings.maintenanceMsgSuperadmin;
  }

  if (!isBlocked) return null;

  const handlePerformAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr(null);

    const u = loginUser.trim().toLowerCase();
    const p = loginPass.trim();

    if (!u || !p) {
      setLoginErr('Mohon isi username dan password!');
      return;
    }

    if (loginRole === 'superadmin' || u.includes('superadmin')) {
      if ((u === 'superadmin' || u === 'admin_provinsi') && (p === 'super12345jabar' || p === 'superadmin123' || p === '123456')) {
        if (onDeveloperLogin) {
          onDeveloperLogin('superadmin', 'Superadmin Provinsi Jabar', 'Provinsi Jabar');
        }
        setShowLoginModal(false);
        if (onNavigateToTab) {
          onNavigateToTab('admin_maintenance');
        }
        return;
      }
    }

    if (loginRole === 'developer' || u.includes('ilham') || u.includes('dev')) {
      if ((u === 'developer' || u === 'admin_ilham') && (p === 'IlhamSangDeveloper' || p === 'developer123' || p === '123456')) {
        if (onDeveloperLogin) {
          onDeveloperLogin('developer', 'Developer Administrator', 'Pusat Developer Jabar');
        }
        setShowLoginModal(false);
        if (onNavigateToTab) {
          onNavigateToTab('admin_maintenance');
        }
        return;
      }
    }

    setLoginErr('Username atau password pengelola tidak valid!');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fadeIn select-none">
      <div className="bg-white rounded-3xl shadow-2xl border-4 border-rose-600 max-w-lg w-full overflow-hidden text-center relative flex flex-col">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 text-white p-6 relative">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <Wrench className="w-8 h-8 text-[#f3e5ab] animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <span className="bg-rose-950/80 text-[#f3e5ab] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-[#f3e5ab]/30">
            PERINGATAN PEMELIHARAAN SISTEM
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white mt-2 m-0 tracking-tight">
            SISTEM DALAM MAINTENANCE
          </h2>
          <p className="text-xs text-rose-100 font-semibold mt-1">
            Hak Akses: {titleRole}
          </p>
        </div>

        {/* Message Box */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <h4 className="font-extrabold text-xs text-rose-950 uppercase tracking-wider">
                Informasi Resmi Developer & Pengelola
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
              {messageContent || 'Mohon maaf, sistem sedang dalam pemeliharaan berkala.'}
            </p>
          </div>

          {/* MAINTENANCE INFORMATION & NOTICE */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="text-center text-xs text-slate-600 font-medium leading-relaxed">
              Akses sistem akan otomatis normal kembali setelah saklar pemeliharaan dimatikan oleh pengelola resmi.
            </div>
          </div>
        </div>
      </div>

      {/* LOGIN MODAL UNLOCKER */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-[#d4af37] max-w-md w-full p-6 space-y-4 relative text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#043e2e] text-[#d4af37] flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#043e2e] m-0">
                    Otentikasi Pengelola Maintenance
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold m-0">
                    Masuk untuk membuka konsol dan mematikan saklar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="text-slate-400 hover:text-slate-700 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loginErr && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-xl font-bold">
                ⚠️ {loginErr}
              </div>
            )}

            <form onSubmit={handlePerformAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Hak Akses:</label>
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as 'superadmin' | 'developer')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                >
                  <option value="superadmin">Superadmin Provinsi Jabar</option>
                  <option value="developer">Developer System</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username:</label>
                <input
                  type="text"
                  placeholder="superadmin"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#043e2e]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#043e2e] text-[#f3e5ab] hover:bg-[#065e44] shadow-md cursor-pointer"
                >
                  Masuk Konsol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

