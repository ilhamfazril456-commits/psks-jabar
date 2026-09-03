import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { UserSession, AppSettings, PSKSDataRecord, AdminAccount, AdminMessage } from '../types';
import { DeveloperControlPanel, SettingsMenuSection } from './DeveloperControlPanel';
import { BackToHomeButton } from './BackToHomeButton';

interface SuperadminSettingsPageProps {
  session: UserSession;
  onBackToHome: () => void;
  appSettings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void> | void;
  allPillarData?: Record<string, PSKSDataRecord[]>;
  adminAccounts?: AdminAccount[];
  adminMessages?: AdminMessage[];
  onNavigateToTab?: (tab: string) => void;
}

export const SuperadminSettingsPage: React.FC<SuperadminSettingsPageProps> = ({
  session,
  onBackToHome,
  appSettings,
  onSaveSettings,
  allPillarData,
  adminAccounts,
  adminMessages,
  onNavigateToTab,
}) => {
  const [selectedSection, setSelectedSection] = useState<SettingsMenuSection | null>(null);

  // Autoscroll down to the settings container when entering the settings page
  useEffect(() => {
    const timer = setTimeout(() => {
      const el =
        document.getElementById('settings-hero-header') ||
        document.getElementById('settings-top-anchor') ||
        document.getElementById('pengaturan-section');
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

  return (
    <div id="pengaturan-section" className="min-h-[80vh] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb & Navigation Top */}
        <div id="settings-top-anchor" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {selectedSection === null ? (
              <BackToHomeButton onClick={onBackToHome} id="btn-back-top-settings" />
            ) : (
              <button
                type="button"
                id="btn-back-settings-top"
                onClick={() => setSelectedSection(null)}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border-2 border-[#d4af37] font-extrabold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37]" />
                <span>← Menu Pengaturan</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 bg-emerald-900/10 border border-emerald-800/20 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-semibold text-[#043e2e]">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37]" />
            <span>Mode Khusus: {session.role.toUpperCase()}</span>
          </div>
        </div>

        {/* Embedded Settings Control Panel */}
        <DeveloperControlPanel
          inline={true}
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
              <BackToHomeButton onClick={onBackToHome} id="btn-back-bottom-settings" />
            ) : (
              <button
                type="button"
                id="btn-back-settings-bottom"
                onClick={() => setSelectedSection(null)}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#043e2e] hover:bg-[#06533e] text-[#d4af37] border-2 border-[#d4af37] font-extrabold text-xs sm:text-sm transition-all shadow-xs hover:shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d4af37]" />
                <span>← Menu Pengaturan</span>
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            <span>PSKS JABAR Provinsi Jawa Barat • Panel Pengaturan Sistem</span>
          </div>
        </div>
      </div>
    </div>
  );
};

