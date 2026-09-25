import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft, Info, Lock } from 'lucide-react';
import { UserSession, AppSettings, PSKSDataRecord, AdminAccount, AdminMessage } from '../types';
import { DeveloperControlPanel, SettingsMenuSection } from './DeveloperControlPanel';
import { BackToHomeButton } from './BackToHomeButton';

interface WebsiteInfoManagementPageProps {
  session: UserSession;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  onBackToHome: () => void;
  allPillarData?: Record<string, PSKSDataRecord[]>;
  adminAccounts?: AdminAccount[];
  adminMessages?: AdminMessage[];
}

export const WebsiteInfoManagementPage: React.FC<WebsiteInfoManagementPageProps> = ({
  session,
  appSettings,
  onSaveSettings,
  onBackToHome,
  allPillarData,
  adminAccounts,
  adminMessages,
}) => {
  const [selectedSection, setSelectedSection] = useState<SettingsMenuSection | null>(null);

  const isAuthorized =
    (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) &&
    session.statusActive === 'SAH_TERDAFTAR';

  useEffect(() => {
    const timer = setTimeout(() => {
      const el =
        document.getElementById('website-info-hero-header') ||
        document.getElementById('website-info-top-anchor') ||
        document.getElementById('website-info-section');
      if (el) {
        const rect = el.getBoundingClientRect();
        const offset = 75;
        const targetY = window.pageYOffset + rect.top - offset;
        window.scrollTo({ top: Math.max(70, targetY), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Lock className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold">Akses Dibatasi</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6">Halaman ini hanya dapat diakses oleh Superadmin & Developer.</p>
        <BackToHomeButton onClick={onBackToHome} variant="light" />
      </div>
    );
  }

  return (
    <div id="website-info-section" className="min-h-[85vh] bg-slate-50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation Top */}
        <div id="website-info-top-anchor" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {selectedSection === null ? (
              <BackToHomeButton onClick={onBackToHome} id="btn-back-top-website-info" variant="light" />
            ) : (
              <button
                type="button"
                id="btn-back-info-menu-top"
                onClick={() => setSelectedSection(null)}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 text-[#0f2b5c] hover:text-[#1a4a9c] border-2 border-slate-300 hover:border-slate-400 font-black text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-inherit" />
                <span>Kembali</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 px-3 py-1.5 rounded-full text-xs font-black shadow-xs">
              <Info className="w-3.5 h-3.5 text-emerald-700" />
              <span>FITUR 14</span>
            </span>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-900/10 border border-emerald-800/20 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold text-[#043e2e]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Otoritas: {session.role.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Embedded DeveloperControlPanel with viewFilter="info_only" (8 Menus strictly preserved) */}
        <DeveloperControlPanel
          inline={true}
          viewFilter="info_only"
          appSettings={appSettings}
          onSaveSettings={onSaveSettings}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          allPillarData={allPillarData}
          adminAccounts={adminAccounts}
          adminMessages={adminMessages}
          session={session}
        />

        {/* Bottom Navigation Bar */}
        <div className="pt-4 sm:pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            {selectedSection === null ? (
              <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-website-info" variant="light" />
            ) : (
              <button
                type="button"
                id="btn-back-info-menu-bottom"
                onClick={() => {
                  setSelectedSection(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 text-[#0f2b5c] hover:text-[#1a4a9c] border-2 border-slate-300 hover:border-slate-400 font-black text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-inherit" />
                <span>Kembali</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
