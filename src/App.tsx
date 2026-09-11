import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserSession,
  PillarId,
  PSKSDataRecord,
  AdminAccount,
  AppSettings,
  AdminMessage,
  PillarRegistrationSubmission,
  AnnouncementConfig,
  TaskItem,
} from './types';
import {
  DEFAULT_PILLAR_DATA,
  DEFAULT_ADMIN_ACCOUNTS,
  PILLARS_CONFIG,
  DEFAULT_SUBMISSIONS,
  DEFAULT_TASK_ITEMS,
  KAB_KOTA_ONLY,
} from './data/initialData';
import { hashPassword } from './utils/crypto';
import { stripDangerousTags } from './utils/sanitize';
import { DEFAULT_APP_SETTINGS } from './data/defaultSettings';
import { OFFICIAL_ECOOFFICE_VIDEO } from './assets/officialEcoOfficeVideo';
import { DEFAULT_ANNOUNCEMENT_CONFIG } from './data/defaultAnnouncement';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { BannerBadge } from './components/BannerBadge';
import { PillarsGrid } from './components/PillarsGrid';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { MaintenanceOverlay } from './components/MaintenanceOverlay';
import { FloatingAnnouncementModal } from './components/FloatingAnnouncementModal';
import { BackToHomeButton } from './components/BackToHomeButton';

import { SmartGateModal } from './components/SmartGateModal';

// Dynamic module loaders with non-blocking prefetching capability
export const loadHomePSKSAnalytics = () => import('./components/HomePSKSAnalytics');
export const loadProfilePage = () => import('./components/ProfilePage');
export const loadContactPage = () => import('./components/ContactPage');
export const loadAccountPage = () => import('./components/AccountPage');
export const loadAdminRegistrationManager = () => import('./components/AdminRegistrationManager');

// Code-split heavy subpages, analytics, and admin panels to optimize PageSpeed and initial load
const HomePSKSAnalytics = React.lazy(() => loadHomePSKSAnalytics().then(m => ({ default: m.HomePSKSAnalytics })));
const Section11Admin = React.lazy(() => import('./components/Section11Admin').then(m => ({ default: m.Section11Admin })));
const JabarRegionalMap = React.lazy(() => import('./components/JabarRegionalMap').then(m => ({ default: m.JabarRegionalMap })));
const AdminRegistrationManager = React.lazy(() => loadAdminRegistrationManager().then(m => ({ default: m.AdminRegistrationManager })));
const PillarDetailView = React.lazy(() => import('./components/PillarDetailView').then(m => ({ default: m.PillarDetailView })));
const ProfilePage = React.lazy(() => loadProfilePage().then(m => ({ default: m.ProfilePage })));
const ContactPage = React.lazy(() => loadContactPage().then(m => ({ default: m.ContactPage })));
const AccountPage = React.lazy(() => loadAccountPage().then(m => ({ default: m.AccountPage })));
const AdminManagementPage = React.lazy(() => import('./components/AdminManagementPage').then(m => ({ default: m.AdminManagementPage })));
const AdminMonitoringPage = React.lazy(() => import('./components/AdminMonitoringPage').then(m => ({ default: m.AdminMonitoringPage })));
const SuperadminSettingsPage = React.lazy(() => import('./components/SuperadminSettingsPage').then(m => ({ default: m.SuperadminSettingsPage })));
const InboxModal = React.lazy(() => import('./components/InboxModal').then(m => ({ default: m.InboxModal })));
const AIAssistantWidget = React.lazy(() => import('./components/AIAssistantWidget').then(m => ({ default: m.AIAssistantWidget })));
const DeveloperControlPanel = React.lazy(() => import('./components/DeveloperControlPanel').then(m => ({ default: m.DeveloperControlPanel })));
const MaintenanceManagementPage = React.lazy(() => import('./components/MaintenanceManagementPage').then(m => ({ default: m.MaintenanceManagementPage })));
const ActivityLogPage = React.lazy(() => import('./components/ActivityLogPage').then(m => ({ default: m.ActivityLogPage })));
const UserManagementPage = React.lazy(() => import('./components/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const TaskManagerPage = React.lazy(() => import('./components/TaskManagerPage').then(m => ({ default: m.TaskManagerPage })));
const AnnouncementManagementPage = React.lazy(() => import('./components/AnnouncementManagementPage').then(m => ({ default: m.AnnouncementManagementPage })));
const AnnouncementDetailPage = React.lazy(() => import('./components/AnnouncementDetailPage').then(m => ({ default: m.AnnouncementDetailPage })));
const FloatingWaManagerPage = React.lazy(() => import('./components/FloatingWaManagerPage').then(m => ({ default: m.FloatingWaManagerPage })));
const UserRegistrationHistoryPage = React.lazy(() => import('./components/UserRegistrationHistoryPage').then(m => ({ default: m.UserRegistrationHistoryPage })));
import { Inbox, ArrowRight, ClipboardList } from 'lucide-react';

const LoginSuccessModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.LoginSuccessModal })));
const LogoutConfirmModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.LogoutConfirmModal })));
const LogoutSuccessModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.LogoutSuccessModal })));
const AccountDeletedRemoteModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.AccountDeletedRemoteModal })));
const AccountEditedRemoteModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.AccountEditedRemoteModal })));
const AccountFrozenRemoteModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.AccountFrozenRemoteModal })));
const MultipleSessionWarningModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.MultipleSessionWarningModal })));

import { db, handleFirestoreError, isQuotaError, OperationType } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { recordSystemActivity } from './lib/activityLogger';
import { subscribeToRealtimeVideo } from './lib/videoSync';
import { validateQRCardPayload } from './utils/qrAuth';
import { removeAccountFromQuota } from './services/ipRegistrationService';

function cleanFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

export default function App() {
  // 1. Session State
  const [session, setSession] = useState<UserSession>(() => {
    const role = (sessionStorage.getItem('session_user_role') || 'user') as 'user' | 'admin' | 'superadmin' | 'developer';
    const nama = sessionStorage.getItem('session_user_nama') || 'Tamu Publik';
    const wilayah = sessionStorage.getItem('session_user_wilayah') || 'Kota Cimahi';
    const statusActive = (sessionStorage.getItem('statusLoginActive') || 'GUEST') as 'SAH_TERDAFTAR' | 'GUEST';
    const isDeveloper = role === 'developer';
    const sessionToken = sessionStorage.getItem('session_token') || undefined;
    const loginTimestamp = sessionStorage.getItem('login_timestamp') ? Number(sessionStorage.getItem('login_timestamp')) : undefined;
    return { role, nama, wilayah, statusActive, isDeveloper, sessionToken, loginTimestamp };
  });

  // 1b. Global App Settings state with Firestore Real-time Sync & Permanent Persistence
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const initial = { ...DEFAULT_APP_SETTINGS };
    try {
      const localLogo = localStorage.getItem('dinsos_logo_url');
      if (localLogo && localLogo !== 'LOCAL_STORAGE_SAVED_PHOTO') initial.logoUrl = localLogo;
      const localKadinas = localStorage.getItem('dinsos_kadinas_photo_url');
      if (localKadinas && localKadinas !== 'LOCAL_STORAGE_SAVED_PHOTO') initial.kadinasPhotoUrl = localKadinas;
      const localBgPhoto = localStorage.getItem('dinsos_bg_photo_url');
      const isAiOfficePhoto = (u: string | null) => u && (u.includes('eco_office_') || u.includes('dinsos_jabar_building') || u.includes('facade') || u.includes('poster'));
      if (localBgPhoto && isAiOfficePhoto(localBgPhoto)) {
        localStorage.removeItem('dinsos_bg_photo_url');
      } else if (localBgPhoto && localBgPhoto !== 'LOCAL_STORAGE_SAVED_PHOTO') {
        initial.bgPhotoUrl = localBgPhoto;
      }
      const localBgVideo = localStorage.getItem('dinsos_bg_video_url');
      if (localBgVideo && localBgVideo !== 'LOCAL_STORAGE_SAVED_VIDEO') initial.bgVideoUrl = localBgVideo;
      const localBgMode = localStorage.getItem('dinsos_bg_mode') as 'photo' | 'video' | null;
      if (localBgMode === 'photo' && !initial.bgPhotoUrl) {
        initial.bgMode = 'video';
        localStorage.setItem('dinsos_bg_mode', 'video');
      } else if (localBgMode) {
        initial.bgMode = localBgMode;
      }
      const localContact = localStorage.getItem('dinsos_contact_links');
      if (localContact) {
        try {
          const parsedContact = JSON.parse(localContact);
          if (parsedContact && typeof parsedContact === 'object') {
            initial.socialLinks = { ...DEFAULT_APP_SETTINGS.socialLinks, ...parsedContact };
          }
        } catch {}
      }
      const localAnn = localStorage.getItem('dinsos_announcement');
      if (localAnn) {
        try {
          const parsed = JSON.parse(localAnn);
          if (parsed && typeof parsed === 'object') {
            initial.announcement = {
              ...DEFAULT_ANNOUNCEMENT_CONFIG,
              ...parsed,
            };
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    return initial;
  });
  const [isDeveloperPanelOpen, setIsDeveloperPanelOpen] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const quotaExceededRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('psks_sync_queue');
      return raw ? JSON.parse(raw).length : 0;
    } catch {
      return 0;
    }
  });

  const addToSyncQueue = (item: { collection: string; docId: string; type: 'SET' | 'DELETE'; data?: any }) => {
    try {
      const raw = localStorage.getItem('psks_sync_queue');
      const queue = raw ? JSON.parse(raw) : [];
      const filtered = queue.filter((q: any) => !(q.collection === item.collection && q.docId === item.docId));
      filtered.push({ ...item, id: `${item.collection}-${item.docId}-${Date.now()}` });
      localStorage.setItem('psks_sync_queue', JSON.stringify(filtered));
      setPendingSyncCount(filtered.length);
    } catch (e) {
      console.error('Failed to add item to sync queue', e);
    }
  };

  const processSyncQueue = async () => {
    setIsSyncing(true);
    try {
      // 1. Uji koneksi langsung ke server Firestore untuk memeriksa apakah kuota harian telah direset oleh Google
      try {
        await getDocFromServer(doc(db, 'app_settings', 'global'));
        // Jika pembacaan dari server berhasil tanpa error resource-exhausted, reset status kuota!
        quotaExceededRef.current = false;
        setIsQuotaExceeded(false);
      } catch (testErr) {
        if (isQuotaError(testErr)) {
          quotaExceededRef.current = true;
          setIsQuotaExceeded(true);
          alert(
            `⚠️ Batas Kuota Harian Firestore Masih Belum Direset.\n\n` +
            `Catatan Waktu Reset:\n` +
            `Kuota harian gratis Firebase Firestore (Spark / Free Tier) direset oleh Google secara global pada MIDNIGHT PACIFIC TIME (PST/PDT), yaitu sekitar pukul 14:00 - 15:00 WIB (bukan jam 07:00 pagi WIB).\n\n` +
            `Semua perubahan data Anda tetap tersimpan aman di Cache Lokal & Antrean Offline pada perangkat Anda.`
          );
          setIsSyncing(false);
          return;
        }
      }

      // 2. Jika koneksi server aman, lakukan proses sinkronisasi antrean offline
      const raw = localStorage.getItem('psks_sync_queue');
      const queue = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(queue) || queue.length === 0) {
        quotaExceededRef.current = false;
        setIsQuotaExceeded(false);
        alert(`✅ Koneksi Server Terhubung Normal!\n\nFirestore sudah aktif kembali dan tidak ada antrean data offline yang tertunda.`);
        setIsSyncing(false);
        return;
      }

      const remainingQueue = [...queue];
      let successCount = 0;

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        try {
          if (item.type === 'SET') {
            await setDoc(doc(db, item.collection, item.docId), item.data);
          } else if (item.type === 'DELETE') {
            await deleteDoc(doc(db, item.collection, item.docId));
          }
          successCount++;
          remainingQueue.shift();
        } catch (err) {
          if (isQuotaError(err)) {
            quotaExceededRef.current = true;
            setIsQuotaExceeded(true);
            alert(`⚠️ Kuota terlampaui saat proses sinkronisasi. ${successCount} data berhasil terkirim sebelum kuota habis kembali.`);
            break;
          }
          console.error(`Sync queue item failed (${item.collection}/${item.docId}):`, err);
        }
      }

      localStorage.setItem('psks_sync_queue', JSON.stringify(remainingQueue));
      setPendingSyncCount(remainingQueue.length);

      if (remainingQueue.length === 0) {
        quotaExceededRef.current = false;
        setIsQuotaExceeded(false);
      }

      if (successCount > 0 && remainingQueue.length === 0) {
        alert(`✅ Sinkronisasi Berhasil!\n\n${successCount} data perubahan offline/cache lokal telah sukses tersimpan permanen ke server Firestore.`);
      }
    } catch (e) {
      console.error('Failed processing sync queue', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Smart cache: public visitors use cached settings if fresh (< 30 minutes)
    const isPublicGuest = session.statusActive !== 'SAH_TERDAFTAR';
    if (isPublicGuest && gateModalOpen) {
      return;
    }
    const lastFetch = Number(localStorage.getItem('dinsos_settings_cache_time') || '0');
    const hasCachedSettings = !!localStorage.getItem('dinsos_logo_url');
    if (isPublicGuest && hasCachedSettings && Date.now() - lastFetch < 30 * 60 * 1000) {
      return;
    }

    const settingsRef = doc(db, 'app_settings', 'global');
    const unsubscribe = onSnapshot(
      settingsRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AppSettings;
          // Fallback to local storage if Firestore holds placeholder marker
          if (data.logoUrl === 'LOCAL_STORAGE_SAVED_PHOTO') {
            const local = localStorage.getItem('dinsos_logo_url');
            if (local && local !== 'LOCAL_STORAGE_SAVED_PHOTO') data.logoUrl = local;
          }
          if (data.kadinasPhotoUrl === 'LOCAL_STORAGE_SAVED_PHOTO') {
            const local = localStorage.getItem('dinsos_kadinas_photo_url');
            if (local && local !== 'LOCAL_STORAGE_SAVED_PHOTO') data.kadinasPhotoUrl = local;
          }
          if (data.bgPhotoUrl === 'LOCAL_STORAGE_SAVED_PHOTO') {
            const local = localStorage.getItem('dinsos_bg_photo_url');
            if (local && local !== 'LOCAL_STORAGE_SAVED_PHOTO') data.bgPhotoUrl = local;
          }
          if (data.bgPhotoUrl && (data.bgPhotoUrl.includes('eco_office_') || data.bgPhotoUrl.includes('dinsos_jabar_building') || data.bgPhotoUrl.includes('poster'))) {
            data.bgPhotoUrl = '';
            data.bgMode = 'video';
          }
          if (data.bgVideoUrl === 'LOCAL_STORAGE_SAVED_VIDEO' || !data.bgVideoUrl) {
            const local = localStorage.getItem('dinsos_bg_video_url');
            if (local && local !== 'LOCAL_STORAGE_SAVED_VIDEO') {
              data.bgVideoUrl = local;
            } else {
              data.bgVideoUrl = OFFICIAL_ECOOFFICE_VIDEO;
            }
          }
          if (!data.bgMode) {
            data.bgMode = 'video';
          }
          if (data.announcement) {
            try {
              localStorage.setItem('dinsos_announcement', JSON.stringify(data.announcement));
            } catch {}
            if (!data.announcement.active) {
              setIsFloatingAnnouncementOpen(false);
            }
          }
          try {
            localStorage.setItem('dinsos_settings_cache_time', String(Date.now()));
          } catch {}
          setAppSettings(data);
        } else {
          setAppSettings(DEFAULT_APP_SETTINGS);
        }

        // For public guests, disconnect listener after 1 initial fetch to avoid persistent stream
        if (isPublicGuest && unsubscribe) {
          unsubscribe();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'app_settings/global');
        if (isQuotaError(error)) {
          quotaExceededRef.current = true;
          setIsQuotaExceeded(true);
        }
      }
    );

    return () => unsubscribe();
  }, [session.statusActive]);

  // Realtime Sync Video Background across all connected devices (Gated to Admin sessions only)
  useEffect(() => {
    // Only subscribe to video chunks if logged in as Admin or Developer
    if (session.statusActive !== 'SAH_TERDAFTAR' && session.role !== 'developer') return;
    const unsubVideo = subscribeToRealtimeVideo((videoBase64) => {
      setAppSettings((prev) => ({
        ...prev,
        bgVideoUrl: videoBase64,
        bgMode: 'video',
      }));
    });
    return () => unsubVideo();
  }, [session.statusActive, session.role]);

  // Instant Smart Card NFC 13.56 MHz Auto-Login Handler on URL Tap
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const nfcToken =
        urlParams.get('smartcard_auth') ||
        urlParams.get('nfc_auth') ||
        urlParams.get('nfc_key') ||
        urlParams.get('nfc_token') ||
        urlParams.get('nfc') ||
        hashParams.get('smartcard_auth') ||
        hashParams.get('nfc_auth') ||
        hashParams.get('nfc');

      if (nfcToken) {
        const authResult = validateQRCardPayload(nfcToken);
        if (authResult && authResult.valid && authResult.role) {
          // Play success chime & haptic vibration
          try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([60, 40, 90]);
            }
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const ctx = new AudioContextClass();
              [1400, 1800, 2200].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.08);
                gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + i * 0.08 + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + i * 0.08 + 0.12);
              });
            }
          } catch (_) {}

          handleLogin(authResult.role, authResult.nama || 'Superadmin Jabar', authResult.wilayah || 'PROVINSI JAWA BARAT');
          recordSystemActivity({
            session: {
              role: authResult.role,
              nama: authResult.nama || 'Superadmin Jabar',
              wilayah: authResult.wilayah || 'PROVINSI JAWA BARAT',
              statusActive: 'SAH_TERDAFTAR',
              isDeveloper: authResult.role === 'developer',
            },
            category: 'SYSTEM',
            actionType: 'UPDATE',
            targetCollection: 'app_settings',
            targetId: 'smart_card_nfc_auth',
            details: `Akses Login Instan Terverifikasi via Smart Card NFC 13.56 MHz (${authResult.nama})`,
          });

          // Clean URL params seamlessly
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    } catch (e) {
      console.warn('Smart Card NFC auto-login error:', e);
    }
  }, []);

  // User intent-based prefetching for instant, zero-latency transitions
  const handlePrefetchTab = useCallback((tab: string) => {
    try {
      if (tab === 'profil') {
        loadProfilePage();
      } else if (tab === 'contact') {
        loadContactPage();
      } else if (tab === 'akun') {
        loadAccountPage();
      } else if (tab === 'terima_pendaftaran') {
        loadAdminRegistrationManager();
      }
    } catch (_) {}
  }, []);

  // Background prefetching for primary subpages (Profile, Contact)
  // Strictly scheduled with requestIdleCallback + 4000ms delay after window load
  // to guarantee ZERO impact on PageSpeed / Core Web Vitals (FCP, LCP, TBT)
  useEffect(() => {
    // Respect user's Data Saver mode or slow connections
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (nav?.connection?.saveData || nav?.connection?.effectiveType === '2g') {
      return;
    }

    const scheduleSilentPrefetch = () => {
      const runIdle = (cb: () => void) => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(cb, { timeout: 8000 });
        } else {
          setTimeout(cb, 200);
        }
      };

      // 1. Prefetch ProfilePage first during browser idle
      runIdle(() => {
        loadProfilePage().catch(() => {});
      });

      // 2. Prefetch ContactPage staggered after Profile
      runIdle(() => {
        setTimeout(() => {
          loadContactPage().catch(() => {});
        }, 1500);
      });

      // 3. Prefetch AccountPage staggered after Contact
      runIdle(() => {
        setTimeout(() => {
          loadAccountPage().catch(() => {});
        }, 3000);
      });
    };

    let timer: any;
    if (document.readyState === 'complete') {
      timer = setTimeout(scheduleSilentPrefetch, 4000);
    } else {
      const onWindowLoaded = () => {
        timer = setTimeout(scheduleSilentPrefetch, 4000);
      };
      window.addEventListener('load', onWindowLoaded, { once: true });
      return () => {
        window.removeEventListener('load', onWindowLoaded);
        clearTimeout(timer);
      };
    }

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleSaveAppSettings = async (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    
    // Save locally for instant rendering & offline backup across sessions
    if (newSettings.logoUrl) {
      localStorage.setItem('dinsos_logo_url', newSettings.logoUrl);
    }
    if (newSettings.bgMode) {
      localStorage.setItem('dinsos_bg_mode', newSettings.bgMode);
    }
    if (newSettings.bgPhotoUrl) {
      localStorage.setItem('dinsos_bg_photo_url', newSettings.bgPhotoUrl);
    }
    if (newSettings.bgVideoUrl) {
      localStorage.setItem('dinsos_bg_video_url', newSettings.bgVideoUrl);
    }
    if (newSettings.kadinasPhotoUrl) {
      localStorage.setItem('dinsos_kadinas_photo_url', newSettings.kadinasPhotoUrl);
    }
    if (newSettings.socialLinks) {
      localStorage.setItem('dinsos_contact_links', JSON.stringify(newSettings.socialLinks));
    }
    if (newSettings.announcement) {
      try {
        localStorage.setItem('dinsos_announcement', JSON.stringify(newSettings.announcement));
      } catch {}
      if (!newSettings.announcement.active) {
        setIsFloatingAnnouncementOpen(false);
      }
    }

    // Sanitize for Firestore to prevent 1MB document size crash on large video files
    const firestoreSettings: AppSettings = { ...newSettings };
    if (firestoreSettings.logoUrl && firestoreSettings.logoUrl.length > 800000) {
      firestoreSettings.logoUrl = 'LOCAL_STORAGE_SAVED_PHOTO';
    }
    if (firestoreSettings.bgVideoUrl && firestoreSettings.bgVideoUrl.length > 500000) {
      firestoreSettings.bgVideoUrl = 'LOCAL_STORAGE_SAVED_VIDEO';
    }
    if (firestoreSettings.bgPhotoUrl && firestoreSettings.bgPhotoUrl.length > 500000) {
      firestoreSettings.bgPhotoUrl = 'LOCAL_STORAGE_SAVED_PHOTO';
    }
    if (firestoreSettings.kadinasPhotoUrl && firestoreSettings.kadinasPhotoUrl.length > 800000) {
      firestoreSettings.kadinasPhotoUrl = 'LOCAL_STORAGE_SAVED_PHOTO';
    }

    if (quotaExceededRef.current || isQuotaExceeded) {
      addToSyncQueue({ collection: 'app_settings', docId: 'global', type: 'SET', data: firestoreSettings });
      return;
    }

    try {
      await setDoc(doc(db, 'app_settings', 'global'), firestoreSettings);
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'app_settings', docId: 'global', type: 'SET', data: firestoreSettings });
    }
  };

  // 2. Deleted IDs tracking
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('psks_deleted_ids') || '[]');
    } catch {
      return [];
    }
  });

  // 2b. Deleted Admin Account IDs tracking
  const [deletedAdminIds, setDeletedAdminIds] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('psks_deleted_admin_ids') || '[]');
      if (Array.isArray(parsed)) {
        return parsed
          .map((s) => String(s || '').toLowerCase().trim())
          .filter((s) => Boolean(s) && !s.startsWith('kab.') && !s.startsWith('kota ') && !s.includes('provinsi'));
      }
      return [];
    } catch {
      return [];
    }
  });

  // 3. Pillar Datasets with Firestore Real-time Sync
  const [allPillarData, setAllPillarData] = useState<Record<string, PSKSDataRecord[]>>(() => {
    const rawDeleted = localStorage.getItem('psks_deleted_ids');
    let delList: string[] = [];
    try {
      if (rawDeleted) delList = JSON.parse(rawDeleted);
    } catch {
      delList = [];
    }

    try {
      const cached = localStorage.getItem('psks_all_pillar_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          const filtered: Record<string, PSKSDataRecord[]> = {};
          for (const [k, records] of Object.entries(parsed)) {
            if (Array.isArray(records)) {
              filtered[k] = records.filter((r) => !delList.includes(r.id));
            }
          }
          if (Object.keys(filtered).length > 0) return filtered;
        }
      }
    } catch {}

    const initial: Record<string, PSKSDataRecord[]> = {};
    for (const [k, records] of Object.entries(DEFAULT_PILLAR_DATA)) {
      initial[k] = records.filter((r) => !delList.includes(r.id));
    }
    return initial;
  });

  useEffect(() => {
    // SMART CACHE & SUMMARY PATTERN FOR WEST JAVA PUBLIC TRAFFIC
    // Public visitors use cached/aggregated data (valid 30 mins) to prevent burning reads.
    const isPublicGuest = session.statusActive !== 'SAH_TERDAFTAR';
    if (isPublicGuest && gateModalOpen) {
      return;
    }
    const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
    const lastFetch = Number(localStorage.getItem('psks_cache_timestamp') || '0');
    const hasCachedData = !!localStorage.getItem('psks_all_pillar_data');

    if (isPublicGuest && hasCachedData && Date.now() - lastFetch < CACHE_TTL_MS) {
      return;
    }

    let unsubscribe: (() => void) | null = null;
    const timer = setTimeout(() => {
      unsubscribe = onSnapshot(
        collection(db, 'psks_records'),
        (snapshot) => {
          // Run queue processing if connection restored
          processSyncQueue();

          if (snapshot.empty) {
            const fallback: Record<string, PSKSDataRecord[]> = {};
            for (const [k, records] of Object.entries(DEFAULT_PILLAR_DATA)) {
              fallback[k] = records.filter((r) => !deletedIds.includes(r.id));
            }
            setAllPillarData(fallback);
            try {
              localStorage.setItem('psks_all_pillar_data', JSON.stringify(fallback));
              localStorage.setItem('psks_cache_timestamp', String(Date.now()));
            } catch {}
          } else {
            const loaded: Record<string, PSKSDataRecord[]> = {};
            Object.keys(DEFAULT_PILLAR_DATA).forEach((k) => (loaded[k] = []));

            snapshot.docs.forEach((docSnap) => {
              if (deletedIds.includes(docSnap.id)) return;

              const data = docSnap.data() as PSKSDataRecord & { pillarId?: string };
              const pKey = data.pillarId || 'peksos';
              if (!loaded[pKey]) {
                loaded[pKey] = [];
              }
              loaded[pKey].push({
                ...data,
                id: docSnap.id,
                wilayah: data.wilayah || 'Kota Bandung',
                kec: data.kec || 'Kecamatan Pusat',
                nama: data.nama || '',
                nik: data.nik || '',
                sertifikasi: data.sertifikasi || 'CERT-2026',
                hp: data.hp || '081234567890',
                lembaga: data.lembaga || 'Lembaga Pemerintah',
                status: data.status || 'Aktif',
              });
            });

            // Fallback merge for features that have no docs in Firestore yet
            Object.keys(DEFAULT_PILLAR_DATA).forEach((k) => {
              if (!loaded[k] || loaded[k].length === 0) {
                const defaults = DEFAULT_PILLAR_DATA[k] || [];
                loaded[k] = defaults.filter((r) => !deletedIds.includes(r.id));
              }
            });

            setAllPillarData(loaded);
            try {
              localStorage.setItem('psks_all_pillar_data', JSON.stringify(loaded));
              localStorage.setItem('psks_cache_timestamp', String(Date.now()));
            } catch {}
          }

          // For public guests, disconnect listener after 1 initial fetch so we don't hold open streams
          if (isPublicGuest && unsubscribe) {
            unsubscribe();
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'psks_records');
          if (isQuotaError(error)) {
            quotaExceededRef.current = true;
            setIsQuotaExceeded(true);
          }
          try {
            const cached = localStorage.getItem('psks_all_pillar_data');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed === 'object') {
                setAllPillarData(parsed);
                return;
              }
            }
          } catch {}

          const fallback: Record<string, PSKSDataRecord[]> = {};
          for (const [k, records] of Object.entries(DEFAULT_PILLAR_DATA)) {
            fallback[k] = records.filter((r) => !deletedIds.includes(r.id));
          }
          setAllPillarData(fallback);
        }
      );
    }, 400);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [deletedIds, session.statusActive]);

  // 5. Smart Gate Modal & Login Modal State (Direct new visitors to initial gate automatically on arrival)
  const [gateModalOpen, setGateModalOpen] = useState<boolean>(() => {
    const entered = sessionStorage.getItem('has_entered_gate');
    const statusActive = sessionStorage.getItem('statusLoginActive');
    return !entered && statusActive !== 'SAH_TERDAFTAR';
  });
  const [pendingPillarId, setPendingPillarId] = useState<PillarId | null>(null);
  const [openLoginModalOnAkun, setOpenLoginModalOnAkun] = useState(false);

  // 3. Admin Accounts List with Firestore Real-time Sync
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => {
    try {
      const cached = localStorage.getItem('psks_admin_accounts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ADMIN_ACCOUNTS;
  });

  const adminAccountsRef = useRef(adminAccounts);
  useEffect(() => {
    adminAccountsRef.current = adminAccounts;
  }, [adminAccounts]);

  useEffect(() => {
    // Only subscribe to admin_accounts if the user is an active admin or actively attempting login
    if (session.statusActive !== 'SAH_TERDAFTAR' && !gateModalOpen) {
      return;
    }

    let unsubscribe: (() => void) | null = null;
    const delay = session.statusActive === 'SAH_TERDAFTAR' ? 100 : 2500;
    const timer = setTimeout(() => {
      unsubscribe = onSnapshot(
        collection(db, 'admin_accounts'),
        (snapshot) => {
          const rawDeletedAdmin = localStorage.getItem('psks_deleted_admin_ids');
        let currentDeletedAdmins: string[] = [];
        try {
          if (rawDeletedAdmin) {
            const parsed = JSON.parse(rawDeletedAdmin);
            if (Array.isArray(parsed)) {
              currentDeletedAdmins = parsed
                .map((s) => String(s || '').toLowerCase().trim())
                .filter((s) => Boolean(s) && !s.startsWith('kab.') && !s.startsWith('kota ') && !s.includes('provinsi'));
            }
          }
        } catch {}

        const isAccountDeleted = (id?: string, uname?: string) => {
          const idLower = (id || '').toLowerCase().trim();
          const unameLower = (uname || '').toLowerCase().trim();
          return (
            (idLower && currentDeletedAdmins.includes(idLower)) ||
            (unameLower && currentDeletedAdmins.includes(unameLower))
          );
        };

        if (snapshot.empty) {
          const filteredDefaults = DEFAULT_ADMIN_ACCOUNTS.filter((def) => {
            const defUname = (def.username || '').toLowerCase().trim();
            return defUname !== 'admin_ilham' && !isAccountDeleted(def.id, def.username);
          });
          setAdminAccounts(filteredDefaults);
        } else {
          const loadedMap = new Map<string, AdminAccount>();
          snapshot.docs.forEach((d) => {
            const data = d.data() as Omit<AdminAccount, 'id'>;
            const uname = (data.username || '').toLowerCase().trim();

            if (uname === 'admin_ilham') {
              return;
            }

            const defaultMatch = DEFAULT_ADMIN_ACCOUNTS.find(
              (def) => def.id === d.id || (def.username || '').toLowerCase().trim() === uname
            );

            // For 27 regional admin accounts, enforce new 12+ character semantic password
            let plainPass = data.passwordPolos || defaultMatch?.passwordPolos || (data.username ? `${data.username}123` : '123456');
            let passHash = data.passwordHash || defaultMatch?.passwordHash || hashPassword(plainPass);

            if (defaultMatch && defaultMatch.role === 'admin' && defaultMatch.passwordPolos) {
              const isOldPass = !data.passwordPolos ||
                data.passwordPolos === 'bandung123' ||
                data.passwordPolos.includes('Secure99') ||
                data.passwordPolos !== defaultMatch.passwordPolos;
              if (isOldPass) {
                plainPass = defaultMatch.passwordPolos;
                passHash = defaultMatch.passwordHash || hashPassword(defaultMatch.passwordPolos);
              }
            }

            loadedMap.set(d.id, {
              id: d.id,
              username: data.username || defaultMatch?.username || '',
              namaAdmin: data.namaAdmin || defaultMatch?.namaAdmin || '',
              wilayahTugas: data.wilayahTugas || defaultMatch?.wilayahTugas || '',
              role: data.role || defaultMatch?.role || 'admin',
              passwordHash: passHash,
              terakhirLogin: data.terakhirLogin || defaultMatch?.terakhirLogin || '2026-08-01 08:00',
              ...data,
              passwordPolos: plainPass,
              registeredIp: data.registeredIp || undefined,
              deviceId: data.deviceId || undefined,
            });
          });

          // Ensure default regional & developer accounts exist in state with valid Bcrypt hashes (unless deleted)
          for (const def of DEFAULT_ADMIN_ACCOUNTS) {
            const defUname = (def.username || '').toLowerCase().trim();
            if (defUname === 'admin_ilham' || isAccountDeleted(def.id, def.username)) {
              continue;
            }

            const existing = Array.from(loadedMap.values()).find(
              (a) => a.id === def.id || (a.username || '').toLowerCase().trim() === defUname
            );

            if (!existing) {
              const enriched: AdminAccount = {
                ...def,
                username: def.username || '',
                namaAdmin: def.namaAdmin || '',
                wilayahTugas: def.wilayahTugas || '',
                passwordHash: def.passwordHash || hashPassword(def.passwordPolos || ''),
              };
              loadedMap.set(def.id, enriched);
            } else {
              const existingName = existing.namaAdmin || '';
              const hasPersonalName = /aep|dedi|rina|saepulloh|herdiana|setyowati/i.test(existingName);
              const needsBcryptHash = !existing.passwordHash || !/^\$2[aby]\$\d{2}\$/.test(existing.passwordHash);
              const isOldRegionalPass = def.role === 'admin' && (
                !existing.passwordPolos ||
                existing.passwordPolos === 'bandung123' ||
                existing.passwordPolos.includes('Secure99') ||
                existing.passwordPolos !== def.passwordPolos
              );

              if (hasPersonalName || needsBcryptHash || isOldRegionalPass || !existing.namaAdmin || !existing.username || !existing.wilayahTugas) {
                const updatedHash = isOldRegionalPass
                  ? (def.passwordHash || hashPassword(def.passwordPolos || ''))
                  : (existing.passwordHash && /^\$2[aby]\$\d{2}\$/.test(existing.passwordHash)
                    ? existing.passwordHash
                    : hashPassword(existing.passwordPolos || def.passwordPolos || ''));

                const updatedPolos = isOldRegionalPass ? def.passwordPolos : (existing.passwordPolos || def.passwordPolos);

                const sanitized: AdminAccount = {
                  ...existing,
                  username: existing.username || def.username || '',
                  namaAdmin: (hasPersonalName || !existing.namaAdmin) ? def.namaAdmin : existing.namaAdmin,
                  wilayahTugas: existing.wilayahTugas || def.wilayahTugas || '',
                  role: existing.role || def.role || 'admin',
                  passwordPolos: updatedPolos,
                  passwordHash: updatedHash,
                };
                loadedMap.set(existing.id, sanitized);
              }
            }
          }

          const rawList = Array.from(loadedMap.values()).filter((a) => {
            const u = (a.username || '').toLowerCase().trim();
            return u !== 'admin_ilham';
          });

          // Deduplicate by unique Username or ID
          const dedupedMap = new Map<string, AdminAccount>();
          rawList.forEach((acc) => {
            const key = (acc.username || acc.id || '').toLowerCase().trim();
            if (key && !dedupedMap.has(key)) {
              dedupedMap.set(key, acc);
            }
          });

          const finalList = Array.from(dedupedMap.values());
          setAdminAccounts(finalList);
          try {
            localStorage.setItem('psks_admin_accounts', JSON.stringify(finalList));
          } catch {}
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admin_accounts');
        if (isQuotaError(error)) {
          quotaExceededRef.current = true;
          setIsQuotaExceeded(true);
        }
        const cached = localStorage.getItem('psks_admin_accounts');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAdminAccounts(parsed);
              return;
            }
          } catch {}
        }
        setAdminAccounts(DEFAULT_ADMIN_ACCOUNTS);
      }
    );
    }, delay);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [session.statusActive, gateModalOpen]);

  // 3.2 Real-Time Presencing Heartbeat & Screen Visibility/Activity Tracking for Active Admin Sessions
  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;

    let lastInteractionTime = Date.now();

    const updateActivity = () => {
      lastInteractionTime = Date.now();
    };

    // User activity listeners
    window.addEventListener('mousemove', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });

    const sendHeartbeat = async () => {
      const currentList = adminAccountsRef.current;
      const matched = currentList.find(
        (a) =>
          (session.role === 'developer' && a.role === 'developer') ||
          (session.role === 'superadmin' && a.role === 'superadmin') ||
          (a.username || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
          (a.namaAdmin || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
          (a.id || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
          (a.role === session.role && (a.wilayahTugas || '').toLowerCase().trim() === (session.wilayah || '').toLowerCase().trim())
      );
      if (!matched) return;

      const isVisible = document.visibilityState === 'visible';
      const isRecentActivity = Date.now() - lastInteractionTime < 2 * 60 * 1000; // 2 minutes

      let statusLayar: 'AKTIF_LAYAR' | 'LATAR_BELAKANG' | 'AFK_IDLE' | 'OFFLINE' = 'OFFLINE';
      let statusKoneksi: 'ONLINE' | 'OFFLINE' | 'IDLE' = 'OFFLINE';
      let isOnline = false;
      let isScreenActive = false;

      if (isVisible) {
        if (isRecentActivity) {
          statusLayar = 'AKTIF_LAYAR';
          statusKoneksi = 'ONLINE';
          isOnline = true;
          isScreenActive = true;
        } else {
          statusLayar = 'AFK_IDLE';
          statusKoneksi = 'IDLE';
          isOnline = true;
          isScreenActive = false;
        }
      } else {
        statusLayar = 'LATAR_BELAKANG';
        statusKoneksi = 'ONLINE';
        isOnline = true;
        isScreenActive = false;
      }

      const nowIso = new Date().toISOString();

      // ALWAYS update local React state so active session user is recorded as ONLINE regardless of Firestore quota
      setAdminAccounts((prev) =>
        prev.map((acc) =>
          acc.id === matched.id ||
          (acc.role === matched.role && (acc.wilayahTugas || '').toLowerCase().trim() === (matched.wilayahTugas || '').toLowerCase().trim()) ||
          (acc.role === 'developer' && matched.role === 'developer') ||
          (acc.role === 'superadmin' && matched.role === 'superadmin')
            ? {
                ...acc,
                isOnline,
                isScreenActive,
                statusKoneksi,
                statusLayar,
                lastActive: nowIso,
                lastHeartbeat: nowIso,
              }
            : acc
        )
      );

      // Attempt remote Firestore write if quota not exceeded
      if (!quotaExceededRef.current && !isQuotaExceeded) {
        try {
          await setDoc(
            doc(db, 'admin_accounts', matched.id),
            {
              isOnline,
              isScreenActive,
              statusKoneksi,
              statusLayar,
              lastActive: nowIso,
              lastHeartbeat: nowIso,
            },
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `admin_accounts/${matched.id}`);
          if (isQuotaError(err)) {
            quotaExceededRef.current = true;
            setIsQuotaExceeded(true);
          }
        }
      }
    };

    // Initial heartbeat
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 35000); // 35 seconds optimized heartbeat to conserve Firestore quota

    // Instant status update on tab visibility or focus change
    const handleVisibilityOrFocusChange = () => {
      sendHeartbeat();
    };

    const handleUnload = () => {
      if (quotaExceededRef.current) return;
      const currentList = adminAccountsRef.current;
      const matched = currentList.find(
        (a) =>
          (session.role === 'developer' && a.role === 'developer') ||
          (session.role === 'superadmin' && a.role === 'superadmin') ||
          (a.username || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
          (a.namaAdmin || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
          (a.id || '').toLowerCase().trim() === (session.nama || '').toLowerCase().trim() ||
          (a.role === session.role && (a.wilayahTugas || '').toLowerCase().trim() === (session.wilayah || '').toLowerCase().trim())
      );
      if (!matched) return;

      const nowIso = new Date().toISOString();
      try {
        setDoc(
          doc(db, 'admin_accounts', matched.id),
          {
            isOnline: false,
            isScreenActive: false,
            statusKoneksi: 'OFFLINE',
            statusLayar: 'OFFLINE',
            lastActive: nowIso,
            terakhirLogin: 'Terakhir aktif baru saja',
          },
          { merge: true }
        ).catch(() => {});
      } catch {
        // ignore on unload
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);
    window.addEventListener('focus', handleVisibilityOrFocusChange);
    window.addEventListener('blur', handleVisibilityOrFocusChange);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange);
      window.removeEventListener('focus', handleVisibilityOrFocusChange);
      window.removeEventListener('blur', handleVisibilityOrFocusChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [session.statusActive, session.role, session.nama, session.isDeveloper, session.wilayah, isQuotaExceeded]);

  // 3.5 Firestore Real-Time Listener for Admin Messages
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;

    const messagesRef = collection(db, 'admin_messages');
    const unsubscribe = onSnapshot(
      messagesRef,
      (snapshot) => {
        if (snapshot.empty) {
          setAdminMessages([]);
        } else {
          const loadedMsgs: AdminMessage[] = [];
          snapshot.docs.forEach((docSnap) => {
            if (docSnap.id === 'msg_init_1' || docSnap.id === 'msg_init_2') {
              return;
            }
            loadedMsgs.push({ id: docSnap.id, ...(docSnap.data() as Omit<AdminMessage, 'id'>) });
          });
          loadedMsgs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setAdminMessages(loadedMsgs);
          try {
            localStorage.setItem('psks_admin_messages', JSON.stringify(loadedMsgs));
          } catch {}
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admin_messages');
        if (isQuotaError(error)) {
          quotaExceededRef.current = true;
          setIsQuotaExceeded(true);
        }
        const cached = localStorage.getItem('psks_admin_messages');
        if (cached) {
          try {
            setAdminMessages(JSON.parse(cached));
          } catch {}
        }
      }
    );

    return () => unsubscribe();
  }, [session.statusActive]);

  // Compute unread messages count for active user (Superadmin & Dev see all, Admin Wilayah sees only theirs / broadcast)
  const unreadMessagesCount = adminMessages.filter((m) => {
    if (m.isRead) return false;

    const userRole = session.role;
    const isDev = userRole === 'developer';
    const isSuperadmin = userRole === 'superadmin';

    // 1. Developer sees all unread messages
    if (isDev) return true;

    // 2. Superadmin: if message was sent by superadmin, do NOT show unread badge to superadmin
    if (isSuperadmin) {
      if (m.senderRole === 'superadmin') return false;
      return true;
    }

    // 3. Admin Wilayah: receives if targeted to 'Semua Wilayah' or matches user's Wilayah
    if (m.targetWilayah === 'Semua Wilayah') return true;

    const userWilayah = (session.wilayah || '').trim();
    if (userWilayah && m.targetWilayah) {
      const target = m.targetWilayah.toLowerCase().trim();
      const userW = userWilayah.toLowerCase().trim();
      if (target === userW) return true;
      if (target.replace('kota ', '').replace('kab. ', '').trim() === userW.replace('kota ', '').replace('kab. ', '').trim()) {
        if (target.includes('kota') && userW.includes('kab')) return false;
        if (target.includes('kab') && userW.includes('kota')) return false;
        return true;
      }
    }
    return false;
  }).length;

  const handleSendMessage = async (msgData: Omit<AdminMessage, 'id' | 'createdAt' | 'isRead'>) => {
    const newId = `msg_${Date.now()}`;
    const newMsg: AdminMessage = {
      ...msgData,
      senderName: stripDangerousTags(msgData.senderName),
      subject: stripDangerousTags(msgData.subject),
      content: stripDangerousTags(msgData.content),
      id: newId,
      createdAt: Date.now(),
      isRead: false,
    };

    setAdminMessages((prev) => {
      const next = [newMsg, ...prev];
      try {
        localStorage.setItem('psks_admin_messages', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (quotaExceededRef.current || isQuotaExceeded) {
      addToSyncQueue({ collection: 'admin_messages', docId: newId, type: 'SET', data: newMsg });
      return;
    }

    try {
      await setDoc(doc(db, 'admin_messages', newId), newMsg);
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'admin_messages', docId: newId, type: 'SET', data: newMsg });
    }
  };

  const handleMarkMessageAsRead = async (msgId: string) => {
    setAdminMessages((prev) => {
      const next = prev.map((m) => (m.id === msgId ? { ...m, isRead: true } : m));
      try {
        localStorage.setItem('psks_admin_messages', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (quotaExceededRef.current || isQuotaExceeded) {
      return;
    }

    try {
      await setDoc(doc(db, 'admin_messages', msgId), { isRead: true }, { merge: true });
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
    }
  };

  // 3b. Submissions State with Firestore Real-time Listener (Single Source of Truth)
  const [submissions, setSubmissions] = useState<PillarRegistrationSubmission[]>(() => {
    try {
      const cached = localStorage.getItem('psks_registration_submissions');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return DEFAULT_SUBMISSIONS;
  });

  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;

    const submissionsRef = collection(db, 'registration_submissions');
    const unsubscribe = onSnapshot(
      submissionsRef,
      (snapshot) => {
        if (snapshot.empty) {
          setSubmissions([]);
          try {
            localStorage.setItem('psks_registration_submissions', JSON.stringify([]));
          } catch {}
        } else {
          const loaded: PillarRegistrationSubmission[] = [];
          snapshot.docs.forEach((docSnap) => {
            loaded.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<PillarRegistrationSubmission, 'id'>),
            });
          });
          loaded.sort(
            (a, b) =>
              new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          setSubmissions(loaded);
          try {
            localStorage.setItem('psks_registration_submissions', JSON.stringify(loaded));
          } catch {}
        }
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          'registration_submissions'
        );
      }
    );

    return () => unsubscribe();
  }, [session.statusActive]);

  // 3c. Task Items State (Manajemen Tugas Operasional Wilayah) with Real-time Firestore Listener
  const [taskItems, setTaskItems] = useState<TaskItem[]>(() => {
    try {
      const cached = localStorage.getItem('psks_task_items');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TASK_ITEMS;
  });

  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;

    const tasksRef = collection(db, 'task_items');
    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore collection is empty, seed with DEFAULT_TASK_ITEMS
          if (DEFAULT_TASK_ITEMS.length > 0) {
            DEFAULT_TASK_ITEMS.forEach(async (task) => {
              try {
                await setDoc(doc(db, 'task_items', task.id), cleanFirestoreData(task));
              } catch {}
            });
          }
        } else {
          const loaded: TaskItem[] = [];
          snapshot.docs.forEach((docSnap) => {
            loaded.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<TaskItem, 'id'>),
            });
          });
          loaded.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setTaskItems(loaded);
          try {
            localStorage.setItem('psks_task_items', JSON.stringify(loaded));
          } catch {}
        }
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.LIST,
          'task_items'
        );
      }
    );

    return () => unsubscribe();
  }, [session.statusActive]);

  // 4. Navigation State & Scroll Position Memory
  const [currentTab, setCurrentTab] = useState<string>('beranda');
  const [activePillar, setActivePillar] = useState<PillarId | null>(null);
  const dashboardScrollYRef = useRef<number>(0);
  const shouldRestoreDashboardScrollRef = useRef<boolean>(false);

  // Track scroll position on main dashboard (beranda) in real-time
  useEffect(() => {
    const handleScroll = () => {
      if (currentTab === 'beranda') {
        dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentTab]);

  // Popups State
  const [loginSuccessData, setLoginSuccessData] = useState<{
    role: string;
    nama: string;
    wilayah: string;
  } | null>(null);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  // Real-time Session & Account Remote Action Modals
  const [showAccountDeletedModal, setShowAccountDeletedModal] = useState(false);
  const [showAccountEditedModal, setShowAccountEditedModal] = useState(false);
  const [showAccountFrozenModal, setShowAccountFrozenModal] = useState(false);
  const [showMultipleSessionModal, setShowMultipleSessionModal] = useState(false);

  // Floating Announcement State & Real-time Trigger
  const [activeAnnouncementDetail, setActiveAnnouncementDetail] = useState<AnnouncementConfig | null>(null);
  const [isFloatingAnnouncementOpen, setIsFloatingAnnouncementOpen] = useState(false);
  const hasTriggeredAnnouncementRef = useRef(false);

  // Check if announcement targets current session
  const isAnnouncementTargeted = (ann?: AnnouncementConfig, s: UserSession = session) => {
    if (!ann || !ann.active) return false;
    // Developer role target check
    if (s.role === 'developer') {
      return ann.targetDeveloper !== undefined ? !!ann.targetDeveloper : true;
    }
    // Superadmin target check
    if (s.role === 'superadmin') {
      return ann.targetSuperadmin !== undefined ? !!ann.targetSuperadmin : true;
    }
    // Admin wilayah target check
    if (s.role === 'admin') {
      const targetMap = ann.targetAdminWilayah || {};
      return targetMap[s.wilayah] !== undefined ? !!targetMap[s.wilayah] : true;
    }
    // Tamu / User Publik target check
    const targetUserMap = ann.targetUserWilayah || {};
    return targetUserMap[s.wilayah] !== undefined ? !!targetUserMap[s.wilayah] : true;
  };

  // Helper to trigger announcement after a smooth delay (2 seconds) without colliding with other popups
  const triggerTargetedAnnouncementWithDelay = (delayMs = 2000, targetSession: UserSession = session) => {
    if (!appSettings.announcement?.active) return;
    if (!isAnnouncementTargeted(appSettings.announcement, targetSession)) return;
    setTimeout(() => {
      setIsFloatingAnnouncementOpen(true);
    }, delayMs);
  };

  // Real-time trigger on website arrival or when announcement status changes in Firestore
  useEffect(() => {
    if (!appSettings.announcement?.active) {
      setIsFloatingAnnouncementOpen(false);
      return;
    }

    // Auto-trigger on initial visit only if no login/gate modal is actively open
    if (
      !hasTriggeredAnnouncementRef.current &&
      !loginSuccessData &&
      !gateModalOpen
    ) {
      if (isAnnouncementTargeted(appSettings.announcement, session)) {
        hasTriggeredAnnouncementRef.current = true;
        const timer = setTimeout(() => {
          setIsFloatingAnnouncementOpen(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [appSettings.announcement, session, loginSuccessData, gateModalOpen]);

  // Sync Session to sessionStorage
  useEffect(() => {
    // Pastikan otomatis tampil dari paling atas beranda saat baru masuk / render pertama
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('session_user_role', session.role);
    sessionStorage.setItem('session_user_nama', session.nama);
    sessionStorage.setItem('session_user_wilayah', session.wilayah);
    sessionStorage.setItem('statusLoginActive', session.statusActive);
    if (session.sessionToken) {
      sessionStorage.setItem('session_token', session.sessionToken);
    } else {
      sessionStorage.removeItem('session_token');
    }
    if (session.loginTimestamp) {
      sessionStorage.setItem('login_timestamp', String(session.loginTimestamp));
    } else {
      sessionStorage.removeItem('login_timestamp');
    }
  }, [session]);

  // Handlers
  const handleSelectPillar = (pillarId: PillarId) => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setActivePillar(pillarId);
    setCurrentTab('pillar_detail');
  };

  const handleOpenAccountConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('admin_manage');
  };

  const handleOpenMonitoringConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('admin_monitor');
  };

  const handleOpenActivityLogConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('activity_logs');
  };

  const handleOpenMaintenanceConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('admin_maintenance');
  };

  const handleOpenUserAccountConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('user_manage');
  };

  const handleOpenTaskManagerConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('task_manage');
  };

  const handleOpenAnnouncementConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('announcement_manage');
  };

  const handleOpenFloatingWaConsole = () => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setCurrentTab('floating_wa_manage');
  };

  const handleOpenAnnouncementDetail = (ann?: AnnouncementConfig) => {
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    setActiveAnnouncementDetail(ann || appSettings.announcement || DEFAULT_ANNOUNCEMENT_CONFIG);
    setCurrentTab('announcement_detail');
  };

  const handleBackToDashboard = () => {
    shouldRestoreDashboardScrollRef.current = true;
    setCurrentTab('beranda');
    setActivePillar(null);
  };

  const handleBackToHome = () => {
    shouldRestoreDashboardScrollRef.current = true;
    setCurrentTab('beranda');
    setActivePillar(null);
  };

  useEffect(() => {
    if (currentTab === 'beranda' && shouldRestoreDashboardScrollRef.current) {
      shouldRestoreDashboardScrollRef.current = false;
      const targetY = dashboardScrollYRef.current || 0;

      const restoreScroll = () => {
        window.scrollTo({
          top: targetY,
          behavior: 'smooth',
        });
      };

      requestAnimationFrame(restoreScroll);
      const timer1 = setTimeout(restoreScroll, 50);
      const timer2 = setTimeout(restoreScroll, 150);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (currentTab !== 'beranda' || !shouldRestoreDashboardScrollRef.current) {
      if (currentTab === 'superadmin_settings') {
        const timer = setTimeout(() => {
          const el = document.getElementById('pengaturan-section') || document.getElementById('settings-top-anchor');
          if (el) {
            const rect = el.getBoundingClientRect();
            const targetY = window.pageYOffset + rect.top - 80;
            window.scrollTo({ top: Math.max(0, targetY + 30), behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }
        }, 80);
        return () => clearTimeout(timer);
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, [currentTab, activePillar]);

  const handleConfirmGuestRegion = (region: string) => {
    const updated: UserSession = {
      role: 'user',
      nama: 'Tamu Publik',
      wilayah: region,
      statusActive: 'GUEST',
    };
    setSession(updated);
    sessionStorage.setItem('has_entered_gate', 'true');
    setGateModalOpen(false);

    if (pendingPillarId) {
      setActivePillar(pendingPillarId);
      setCurrentTab('pillar_detail');
      setPendingPillarId(null);
    } else {
      setCurrentTab('beranda');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Trigger top notification toast for Guest as well
    setLoginSuccessData({
      role: 'guest',
      nama: 'Tamu Publik',
      wilayah: region,
    });
  };

  const handleNavigateToLoginFromGate = () => {
    setOpenLoginModalOnAkun(true);
    setCurrentTab('akun');
  };

  const handleLogin = (
    role: 'user' | 'admin' | 'superadmin' | 'developer',
    nama: string,
    wilayah: string
  ) => {
    const statusActive = 'SAH_TERDAFTAR';
    const isDeveloper = role === 'developer';
    
    // Generate unique session token & timestamp for Single Session & 24h Timeout
    const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const loginTimestamp = Date.now();

    const newSession: UserSession = { 
      role, 
      nama, 
      wilayah, 
      statusActive, 
      isDeveloper, 
      sessionToken, 
      loginTimestamp 
    };
    setSession(newSession);
    sessionStorage.setItem('has_entered_gate', 'true');
    setGateModalOpen(false);

    // Format current login timestamp
    const now = new Date();
    const formattedLogin = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    // Mark matching account as online & record session token, status, and login timestamp in state & database
    const matched = adminAccounts.find(
      (a) =>
        (a.username || '').toLowerCase().trim() === (nama || '').toLowerCase().trim() ||
        (a.namaAdmin || '').toLowerCase().trim() === (nama || '').toLowerCase().trim() ||
        (a.role === role && (a.wilayahTugas || '').toLowerCase().trim() === (wilayah || '').toLowerCase().trim())
    );

    if (matched) {
      handleUpdateAdminAccount({
        ...matched,
        isOnline: true,
        statusKoneksi: 'ONLINE',
        statusLayar: 'AKTIF_LAYAR',
        terakhirLogin: formattedLogin,
        sessionToken: sessionToken,
        loginTimestamp: loginTimestamp,
      });
    }

    // Show animated checkmark "Login Berhasil" modal for authenticated sessions
    setLoginSuccessData({ role, nama, wilayah });
  };

  const handleCloseLoginSuccess = () => {
    if (loginSuccessData) {
      setLoginSuccessData(null);

      if (pendingPillarId) {
        setActivePillar(pendingPillarId);
        setCurrentTab('pillar_detail');
        setPendingPillarId(null);
      } else {
        setCurrentTab('beranda');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);
  };

  const handleForceLogout = (reason?: string) => {
    // Set offline status for logging out admin account
    if (session.statusActive === 'SAH_TERDAFTAR') {
      const matched = adminAccounts.find(
        (a) =>
          (a.username || '').toLowerCase() === (session.nama || '').toLowerCase() ||
          (a.wilayahTugas || '').toLowerCase() === (session.wilayah || '').toLowerCase()
      );
      if (matched) {
        handleUpdateAdminAccount({
          ...matched,
          isOnline: false,
          statusKoneksi: 'OFFLINE',
          terakhirLogin: reason || 'Sesi diakhiri',
        });
      }
    }

    const reset: UserSession = {
      role: 'user',
      nama: 'Tamu Publik',
      wilayah: 'Kota Cimahi',
      statusActive: 'GUEST',
    };
    setSession(reset);
    sessionStorage.removeItem('has_entered_gate');
    sessionStorage.removeItem('session_user_role');
    sessionStorage.removeItem('session_user_nama');
    sessionStorage.removeItem('session_user_wilayah');
    sessionStorage.removeItem('statusLoginActive');
    sessionStorage.removeItem('session_token');
    sessionStorage.removeItem('login_timestamp');
    setActivePillar(null);
    setCurrentTab('beranda');
    setGateModalOpen(true);
  };

  const handleCompleteLogout = () => {
    setShowLogoutSuccess(false);
    handleForceLogout('Baru saja keluar');
  };

  // 4. Session Timeout & Real-time Account State Listener (Deletion, Editing, & Multiple Sessions)
  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;

    const userUname = (session.nama || '').toLowerCase().trim();
    const userWilayah = (session.wilayah || '').toLowerCase().trim();

    // 1. Check deletion in deletedAdminIds list (Req 3)
    const isDeletedByIds =
      deletedAdminIds.includes(userUname) ||
      deletedAdminIds.includes((session.nama || '').trim());

    if (isDeletedByIds) {
      if (!showAccountDeletedModal) {
        setShowAccountDeletedModal(true);
      }
      return;
    }

    if (adminAccounts.length > 0) {
      const matched = adminAccounts.find((a) => {
        const aUname = (a.username || '').toLowerCase().trim();
        const aWil = (a.wilayahTugas || '').toLowerCase().trim();
        if (session.role === 'developer') {
          return a.role === 'developer';
        }
        if (session.role === 'superadmin') {
          return a.role === 'superadmin' || aUname.includes('superadmin');
        }
        return aUname === userUname || (a.role === session.role && aWil === userWilayah);
      });

      // 2. Check deletion if not matched in adminAccounts (Req 3)
      if (!matched && !showAccountDeletedModal) {
        setShowAccountDeletedModal(true);
        return;
      }

      if (matched) {
        // 3. Check Account Frozen (Remote Freeze Trigger)
        if (matched.isFrozen || matched.statusAkun === 'DIBEKUKAN') {
          if (!showAccountFrozenModal) {
            setShowAccountFrozenModal(true);
          }
          return;
        }

        // 4. Check Account Edited (Req 4) - only when edited by admin while user is actively logged in
        const loginTime = session.loginTimestamp || Number(sessionStorage.getItem('login_timestamp')) || 0;
        if (
          session.role !== 'developer' &&
          matched.lastUpdatedTimestamp &&
          loginTime > 0 &&
          matched.lastUpdatedTimestamp > loginTime + 4000
        ) {
          if (!showAccountEditedModal) {
            setShowAccountEditedModal(true);
          }
          return;
        }

        // 5. Check Multiple Session Active / Login on another device (Req 5)
        const localToken = session.sessionToken || sessionStorage.getItem('session_token');
        if (matched.sessionToken && localToken && matched.sessionToken !== localToken) {
          if (!showMultipleSessionModal) {
            setShowMultipleSessionModal(true);
          }
          return;
        }
      }
    }

    // 6. Inactivity (30 Menit) & 24-Hour Session Timeout for Diskominfo Compliance
    let lastActivityTime = Date.now();
    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // User activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const now = Date.now();
      const loginTime = session.loginTimestamp || Number(sessionStorage.getItem('login_timestamp')) || 0;
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      const THIRTY_MINUTES_INACTIVITY = 30 * 60 * 1000;

      // Check 30-Minute Idle Inactivity
      if (now - lastActivityTime > THIRTY_MINUTES_INACTIVITY) {
        clearInterval(interval);
        activityEvents.forEach((evt) => window.removeEventListener(evt, updateActivity));
        alert('⏳ Sesi Berakhir Otomatis (Inactivity Timeout 30 Menit):\nSistem mengunci sesi secara otomatis demi keamanan karena tidak ada aktivitas selama 30 menit. Silakan login kembali.');
        handleForceLogout('Tidak Aktif (30 Menit)');
        return;
      }

      // Check 24-Hour Absolute Expiration
      if (loginTime > 0 && now - loginTime > TWENTY_FOUR_HOURS) {
        clearInterval(interval);
        activityEvents.forEach((evt) => window.removeEventListener(evt, updateActivity));
        alert('⏳ Sesi Kedaluwarsa (Session Timeout 24 Jam):\nSesi login Anda telah otomatis berakhir setelah 24 jam. Silakan lakukan login ulang untuk melanjutkan.');
        handleForceLogout('Kedaluwarsa (24 Jam)');
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((evt) => window.removeEventListener(evt, updateActivity));
    };
  }, [
    session,
    adminAccounts,
    deletedAdminIds,
    showAccountDeletedModal,
    showAccountEditedModal,
    showAccountFrozenModal,
    showMultipleSessionModal,
  ]);

  // Real-time Instant Security Kickout Listener (Targeted directly from Superadmin/Developer actions)
  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;
    if (session.role === 'developer') return; // Developer is immune to security kickouts

    const unsubscribe = onSnapshot(
      doc(db, 'security_signals', 'live'),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        if (!data || !data.timestamp || !data.action) return;

        // 1. Only respond to signals sent STRICTLY AFTER the user's login timestamp (at least 2s after login)
        const loginTime = session.loginTimestamp || Number(sessionStorage.getItem('login_timestamp')) || 0;
        if (loginTime > 0 && data.timestamp <= loginTime + 2000) return;

        // 2. Only respond to fresh signals sent within the last 30 seconds
        if (Date.now() - data.timestamp > 30000) return;

        // 3. If the signal was triggered by the current user themselves, ignore
        const actorName = (data.by || '').toLowerCase().trim();
        const userUname = (session.nama || '').toLowerCase().trim();
        if (actorName && actorName === userUname) return;

        const userWilayah = (session.wilayah || '').toLowerCase().trim();
        const targetUname = (data.targetUsername || '').toLowerCase().trim();
        const targetId = (data.targetId || '').toLowerCase().trim();
        const targetWil = (data.targetWilayah || '').toLowerCase().trim();

        const isMatch =
          (targetUname && (targetUname === userUname || targetUname === (session.nama || '').toLowerCase().trim())) ||
          (targetId && targetId === userUname) ||
          (targetWil && targetWil === userWilayah && session.role === 'admin');

        if (isMatch) {
          if (data.action === 'FREEZE') {
            setShowAccountFrozenModal(true);
          } else if (data.action === 'DELETE') {
            setShowAccountDeletedModal(true);
          } else if (data.action === 'PASSWORD' || data.action === 'UPDATE') {
            setShowAccountEditedModal(true);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'security_signals/live');
      }
    );

    return () => unsubscribe();
  }, [session]);

  const handleAddRecord = async (
    newRecord: Omit<PSKSDataRecord, 'id'>,
    targetPillarId?: PillarId
  ) => {
    const pillarKey = targetPillarId || activePillar;
    if (!pillarKey) return;
    const recordId = `${pillarKey}-${Date.now()}`;
    const fullRecord = { ...newRecord, id: recordId, pillarId: pillarKey };

    setAllPillarData((prev) => {
      const updated = {
        ...prev,
        [pillarKey]: [...(prev[pillarKey] || []), fullRecord],
      };
      try {
        localStorage.setItem('psks_all_pillar_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const pilarName = (pillarKey || 'PSKS').toUpperCase();
    const memberName = newRecord.nama || 'Anggota Baru';
    const memberWilayah = newRecord.wilayah || session.wilayah || 'Jawa Barat';
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;

    // Record audit activity log (bypassed for developer)
    recordSystemActivity({
      session,
      category: 'PSKS',
      actionType: 'CREATE',
      targetCollection: 'psks_records',
      targetId: recordId,
      targetName: memberName,
      targetPillar: pilarName,
      targetWilayah: memberWilayah,
      details: `${actorLabel} telah MENAMBAHKAN anggota baru Pilar ${pilarName} atas nama [${memberName}] (Wilayah: ${memberWilayah})`,
    });

    if (quotaExceededRef.current || isQuotaExceeded) {
      addToSyncQueue({ collection: 'psks_records', docId: recordId, type: 'SET', data: fullRecord });
      return;
    }

    try {
      await setDoc(doc(db, 'psks_records', recordId), cleanFirestoreData(fullRecord));
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'psks_records', docId: recordId, type: 'SET', data: fullRecord });
    }
  };

  const handleAddSubmission = async (
    newSubmission: Omit<
      PillarRegistrationSubmission,
      'id' | 'submittedAt' | 'submittedAtFormatted' | 'status'
    >
  ) => {
    const newId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const submissionData: PillarRegistrationSubmission = {
      ...newSubmission,
      id: newId,
      submittedAt: now.toISOString(),
      submittedAtFormatted: now.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'PENDING',
    };

    setSubmissions((prev) => {
      const updated = [submissionData, ...prev];
      try {
        const rawMy = localStorage.getItem('psks_my_submission_ids');
        const myIds = rawMy ? JSON.parse(rawMy) : [];
        if (!myIds.includes(newId)) {
          myIds.unshift(newId);
          localStorage.setItem('psks_my_submission_ids', JSON.stringify(myIds));
        }
      } catch {}
      return updated;
    });

    try {
      const docRef = doc(db, 'registration_submissions', newId);
      await setDoc(docRef, cleanFirestoreData(submissionData));
    } catch (error) {
      console.error('Failed to save submission to Firestore:', error);
    }
  };

  const handleApproveSubmission = async (submission: PillarRegistrationSubmission) => {
    const updatedSubmission: PillarRegistrationSubmission = {
      ...submission,
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: session.nama || session.username || 'Admin Wilayah',
    };

    setSubmissions((prev) => {
      return prev.map((s) => (s.id === submission.id ? updatedSubmission : s));
    });

    // Audit Log for Approval
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;
    const memberName = submission.nama || submission.recordData?.nama || 'Pemohon';
    const pilarTitle = (PILLARS_CONFIG[submission.pillarId]?.title || submission.pillarId).toUpperCase();
    const wilLabel = submission.wilayah || session.wilayah || 'Jawa Barat';

    recordSystemActivity({
      session,
      category: 'PSKS',
      actionType: 'APPROVE',
      targetCollection: 'registration_submissions',
      targetId: submission.id,
      targetName: memberName,
      targetPillar: pilarTitle,
      targetWilayah: wilLabel,
      details: `${actorLabel} MENERIMA "${memberName}" sebagai anggota ${pilarTitle} (Wilayah: ${wilLabel})`,
    });

    // 1. Update status in Firestore
    try {
      const docRef = doc(db, 'registration_submissions', submission.id);
      await setDoc(docRef, cleanFirestoreData(updatedSubmission), { merge: true });
    } catch (error) {
      console.error('Failed to approve submission in Firestore:', error);
    }

    // 2. Register record into pillar data in Firestore and local state
    if (submission.recordData) {
      const targetPillar = submission.pillarId;
      const cleanRecord: Omit<PSKSDataRecord, 'id'> = {
        ...submission.recordData,
        wilayah: submission.wilayah,
        status: 'Aktif',
      };
      await handleAddRecord(cleanRecord, targetPillar);
    }
  };

  const handleRejectSubmission = async (submissionId: string, notes?: string) => {
    const updatedSubmission = {
      status: 'REJECTED' as const,
      reviewNotes: notes || 'Berkas pengajuan belum memenuhi syarat verifikasi administrasi.',
      reviewedAt: new Date().toISOString(),
      reviewedBy: session.nama || session.username || 'Admin Wilayah',
    };

    const targetSub = submissions.find((s) => s.id === submissionId);
    const memberName = targetSub?.nama || targetSub?.recordData?.nama || 'Pemohon';
    const pilarTitle = (PILLARS_CONFIG[targetSub?.pillarId || 'peksos']?.title || targetSub?.pillarId || 'PSKS').toUpperCase();
    const wilLabel = targetSub?.wilayah || session.wilayah || 'Jawa Barat';
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;
    const reasonText = notes ? ` Alasan: ${notes}` : '';

    setSubmissions((prev) => {
      return prev.map((s) =>
        s.id === submissionId ? { ...s, ...updatedSubmission } : s
      );
    });

    // Audit Log for Rejection
    recordSystemActivity({
      session,
      category: 'PSKS',
      actionType: 'REJECT',
      targetCollection: 'registration_submissions',
      targetId: submissionId,
      targetName: memberName,
      targetPillar: pilarTitle,
      targetWilayah: wilLabel,
      details: `${actorLabel} MENOLAK pendaftaran "${memberName}" sebagai anggota ${pilarTitle} (Wilayah: ${wilLabel}).${reasonText}`,
    });

    try {
      const docRef = doc(db, 'registration_submissions', submissionId);
      await setDoc(docRef, cleanFirestoreData(updatedSubmission), { merge: true });
    } catch (error) {
      console.error('Failed to reject submission in Firestore:', error);
    }
  };

  const handleBatchApproveSubmissions = async (submissionIds: string[]) => {
    if (!submissionIds.length) return;
    const now = new Date().toISOString();
    const reviewer = session.nama || session.username || 'Superadmin Jabar';

    const updatedList = submissions.map((s) => {
      if (submissionIds.includes(s.id)) {
        return {
          ...s,
          status: 'APPROVED' as const,
          reviewedAt: now,
          reviewedBy: reviewer,
        };
      }
      return s;
    });

    setSubmissions(updatedList);

    for (const id of submissionIds) {
      const sub = submissions.find((item) => item.id === id);
      if (sub) {
        try {
          const docRef = doc(db, 'registration_submissions', id);
          await setDoc(
            docRef,
            cleanFirestoreData({
              ...sub,
              status: 'APPROVED',
              reviewedAt: now,
              reviewedBy: reviewer,
            }),
            { merge: true }
          );
          if (sub.recordData) {
            await handleAddRecord(
              {
                ...sub.recordData,
                wilayah: sub.wilayah,
                status: 'Aktif',
              },
              sub.pillarId
            );
          }
        } catch (e) {
          console.error('Error during batch approve for submission', id, e);
        }
      }
    }
  };

  // Task Operations (Manajemen Tugas Operasional Wilayah)
  const handleCreateTask = async (taskPayload: Omit<TaskItem, 'id' | 'createdAt' | 'createdAtFormatted'>) => {
    const now = new Date();
    const newId = `task-${now.getTime()}`;
    const newTask: TaskItem = {
      ...taskPayload,
      id: newId,
      createdAt: now.toISOString(),
      createdAtFormatted: now.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: taskPayload.status || 'PENDING',
      progressPercent: taskPayload.progressPercent || 0,
      assignedBy: session.nama || session.username || 'Superadmin Jabar',
    };

    setTaskItems((prev) => {
      const updated = [newTask, ...prev];
      try {
        localStorage.setItem('psks_task_items', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    recordSystemActivity({
      session,
      category: 'TASK',
      actionType: 'CREATE',
      targetCollection: 'task_items',
      targetId: newId,
      targetName: newTask.title,
      targetWilayah: newTask.targetWilayah,
      details: `${session.nama || 'Superadmin'} MEMBUAT TUGAS BARU: "${newTask.title}" untuk wilayah ${newTask.targetWilayah} (Prioritas: ${newTask.priority})`,
    });

    try {
      const docRef = doc(db, 'task_items', newId);
      await setDoc(docRef, cleanFirestoreData(newTask));
    } catch (err) {
      console.error('Failed to save task to Firestore:', err);
    }
  };

  const handleUpdateTask = async (task: TaskItem) => {
    const updatedTask: TaskItem = {
      ...task,
      updatedAt: new Date().toISOString(),
    };

    setTaskItems((prev) => {
      const updated = prev.map((t) => (t.id === task.id ? updatedTask : t));
      try {
        localStorage.setItem('psks_task_items', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    recordSystemActivity({
      session,
      category: 'TASK',
      actionType: 'UPDATE',
      targetCollection: 'task_items',
      targetId: task.id,
      targetName: task.title,
      targetWilayah: task.targetWilayah,
      details: `${session.nama || 'Admin'} MEMPERBARUI TUGAS: "${task.title}" (Status: ${task.status}, Progres: ${task.progressPercent || 0}%)`,
    });

    try {
      const docRef = doc(db, 'task_items', task.id);
      await setDoc(docRef, cleanFirestoreData(updatedTask), { merge: true });
    } catch (err) {
      console.error('Failed to update task in Firestore:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const targetTask = taskItems.find((t) => t.id === taskId);

    setTaskItems((prev) => {
      const updated = prev.filter((t) => t.id !== taskId);
      try {
        localStorage.setItem('psks_task_items', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (targetTask) {
      recordSystemActivity({
        session,
        category: 'TASK',
        actionType: 'DELETE',
        targetCollection: 'task_items',
        targetId: taskId,
        targetName: targetTask.title,
        targetWilayah: targetTask.targetWilayah,
        details: `${session.nama || 'Superadmin'} MENGHAPUS TUGAS: "${targetTask.title}" (${targetTask.targetWilayah})`,
      });
    }

    try {
      await deleteDoc(doc(db, 'task_items', taskId));
    } catch (err) {
      console.error('Failed to delete task from Firestore:', err);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    // 0. Find the record being deleted to generate a detailed audit trail
    let deletedRecord: PSKSDataRecord | undefined;
    for (const list of Object.values(allPillarData)) {
      const found = list.find((r) => r.id === recordId);
      if (found) {
        deletedRecord = found;
        break;
      }
    }

    const pilarName = (deletedRecord?.pillarId || activePillar || 'PSKS').toUpperCase();
    const memberName = deletedRecord?.nama || 'Anggota';
    const memberWilayah = deletedRecord?.wilayah || session.wilayah || 'Jawa Barat';

    // 1. Add to deletedIds list and persist to localStorage
    const nextDeleted = [...deletedIds, recordId];
    setDeletedIds(nextDeleted);
    try {
      localStorage.setItem('psks_deleted_ids', JSON.stringify(nextDeleted));
    } catch (e) {
      console.error('Failed to save deleted ID', e);
    }

    // 2. Remove immediately from allPillarData state
    setAllPillarData((prev) => {
      const updated: Record<string, PSKSDataRecord[]> = {};
      for (const [k, records] of Object.entries(prev)) {
        updated[k] = records.filter((r) => r.id !== recordId);
      }
      try {
        localStorage.setItem('psks_all_pillar_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Record audit activity log (bypassed for developer)
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;
    recordSystemActivity({
      session,
      category: 'PSKS',
      actionType: 'DELETE',
      targetCollection: 'psks_records',
      targetId: recordId,
      targetName: memberName,
      targetPillar: pilarName,
      targetWilayah: memberWilayah,
      details: `${actorLabel} telah MENGHAPUS anggota Pilar ${pilarName} atas nama [${memberName}] (Wilayah: ${memberWilayah})`,
    });

    // 3. Remove from Firestore psks_records
    if (quotaExceededRef.current || isQuotaExceeded) {
      addToSyncQueue({ collection: 'psks_records', docId: recordId, type: 'DELETE' });
      return;
    }

    try {
      await deleteDoc(doc(db, 'psks_records', recordId));
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'psks_records', docId: recordId, type: 'DELETE' });
    }
  };

  const handleAddAdminAccount = async (newAdmin: Omit<AdminAccount, 'id'>) => {
    const adminId = `adm-${Date.now()}`;
    const fullAdmin: AdminAccount = {
      ...newAdmin,
      id: adminId,
      username: newAdmin.username || '',
      namaAdmin: newAdmin.namaAdmin || '',
      wilayahTugas: newAdmin.wilayahTugas || '',
      role: newAdmin.role || 'admin',
      registeredIp: newAdmin.registeredIp,
      deviceId: newAdmin.deviceId,
    };

    const newUname = (fullAdmin.username || '').toLowerCase().trim();

    // Clear this username and adminId from deletedAdminIds (if previously deleted)
    setDeletedAdminIds((prev) => {
      const next = prev.filter((item) => {
        const itemLower = (item || '').toLowerCase().trim();
        return itemLower !== adminId && itemLower !== newUname;
      });
      try {
        localStorage.setItem('psks_deleted_admin_ids', JSON.stringify(next));
      } catch {}
      return next;
    });

    setAdminAccounts((prev) => {
      const filtered = prev.filter((a) => (a.username || '').toLowerCase().trim() !== newUname);
      const next = [...filtered, fullAdmin];
      try {
        localStorage.setItem('psks_admin_accounts', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Record audit activity log (bypassed for developer)
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;
    recordSystemActivity({
      session,
      category: 'ADMIN_ACCOUNT',
      actionType: 'CREATE',
      targetCollection: 'admin_accounts',
      targetId: adminId,
      targetName: fullAdmin.namaAdmin || fullAdmin.username,
      targetWilayah: fullAdmin.wilayahTugas,
      details: `${actorLabel} telah MENAMBAHKAN akun admin baru [${fullAdmin.namaAdmin}] (${fullAdmin.username}) untuk wilayah [${fullAdmin.wilayahTugas}] dengan peran [${fullAdmin.role === 'superadmin' ? 'Superadmin' : 'Admin Wilayah'}]`,
    });

    if (quotaExceededRef.current || isQuotaExceeded) {
      addToSyncQueue({ collection: 'admin_accounts', docId: adminId, type: 'SET', data: cleanFirestoreData(fullAdmin) });
      return;
    }

    try {
      await setDoc(doc(db, 'admin_accounts', adminId), cleanFirestoreData(fullAdmin));
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'admin_accounts', docId: adminId, type: 'SET', data: cleanFirestoreData(fullAdmin) });
    }
  };

  const handleUpdateAdminAccount = async (
    updatedAdmin: AdminAccount,
    securitySignal?: string
  ) => {
    const sanitizedAdmin: AdminAccount = {
      ...updatedAdmin,
      username: updatedAdmin.username || '',
      namaAdmin: updatedAdmin.namaAdmin || '',
      wilayahTugas: updatedAdmin.wilayahTugas || '',
      role: updatedAdmin.role || 'admin',
      isFrozen: updatedAdmin.isFrozen,
      statusAkun: updatedAdmin.statusAkun,
      lastUpdatedTimestamp: updatedAdmin.lastUpdatedTimestamp || Date.now(),
    };

    setAdminAccounts((prev) => {
      const next = prev.map((a) => (a.id === sanitizedAdmin.id ? sanitizedAdmin : a));
      try {
        localStorage.setItem('psks_admin_accounts', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Send instant remote security signal to victim client in real-time
    let derivedSignal = 'UPDATE';
    if (securitySignal === 'PASSWORD_CHANGED' || securitySignal === 'PASSWORD') {
      derivedSignal = 'PASSWORD';
    } else if (securitySignal === 'FROZEN' || securitySignal === 'FREEZE' || sanitizedAdmin.isFrozen || sanitizedAdmin.statusAkun === 'DIBEKUKAN') {
      derivedSignal = 'FREEZE';
    } else if (securitySignal === 'UNFROZEN' || securitySignal === 'UNFREEZE') {
      derivedSignal = 'UNFREEZE';
    } else if (securitySignal) {
      derivedSignal = securitySignal;
    }

    if (derivedSignal) {
      try {
        setDoc(doc(db, 'security_signals', 'live'), {
          action: derivedSignal,
          targetUsername: sanitizedAdmin.username,
          targetId: sanitizedAdmin.id,
          targetWilayah: sanitizedAdmin.wilayahTugas,
          timestamp: Date.now(),
          by: session.nama,
        }).catch(() => {});
      } catch {}
    }

    // Record audit activity log (bypassed for developer)
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;
    recordSystemActivity({
      session,
      category: 'ADMIN_ACCOUNT',
      actionType: 'UPDATE',
      targetCollection: 'admin_accounts',
      targetId: sanitizedAdmin.id,
      targetName: sanitizedAdmin.namaAdmin || sanitizedAdmin.username,
      targetWilayah: sanitizedAdmin.wilayahTugas,
      details: `${actorLabel} telah MENGUBAH data/status akun admin [${sanitizedAdmin.namaAdmin}] (${sanitizedAdmin.username}) - Wilayah: [${sanitizedAdmin.wilayahTugas}]`,
    });

    if (quotaExceededRef.current || isQuotaExceeded) {
      addToSyncQueue({ collection: 'admin_accounts', docId: sanitizedAdmin.id, type: 'SET', data: cleanFirestoreData(sanitizedAdmin) });
      return;
    }

    try {
      await setDoc(doc(db, 'admin_accounts', sanitizedAdmin.id), cleanFirestoreData(sanitizedAdmin));
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'admin_accounts', docId: sanitizedAdmin.id, type: 'SET', data: cleanFirestoreData(sanitizedAdmin) });
    }
  };

  const handleDeleteAdminAccount = async (id: string, targetUsername?: string) => {
    const currentList = adminAccountsRef.current.length > 0 ? adminAccountsRef.current : adminAccounts;
    const target = currentList.find(
      (a) =>
        a.id === id ||
        (a.id || '').toLowerCase().trim() === id.toLowerCase().trim() ||
        (a.username || '').toLowerCase().trim() === id.toLowerCase().trim()
    );

    const targetId = target?.id || id;
    const targetUname = (targetUsername || target?.username || id).toLowerCase().trim();

    // Broadcast remote deletion signal so victim client gets booted instantly with alert
    try {
      setDoc(doc(db, 'security_signals', 'live'), {
        action: 'DELETE',
        targetUsername: targetUname,
        targetId: targetId,
        timestamp: Date.now(),
        by: session.nama,
      }).catch(() => {});
    } catch {}

    const newItems = [id, targetId, targetUname]
      .map((s) => String(s || '').toLowerCase().trim())
      .filter((s) => Boolean(s) && !s.startsWith('kab.') && !s.startsWith('kota ') && !s.includes('provinsi'));

    const prevDeletedLower = deletedAdminIds.map((s) => String(s || '').toLowerCase().trim());
    const nextDeleted = Array.from(new Set([...prevDeletedLower, ...newItems]));

    setDeletedAdminIds(nextDeleted);
    try {
      localStorage.setItem('psks_deleted_admin_ids', JSON.stringify(nextDeleted));
    } catch {}

    setAdminAccounts((prev) => {
      const next = prev.filter((a) => {
        const aId = (a.id || '').toLowerCase().trim();
        const aUname = (a.username || '').toLowerCase().trim();
        return !nextDeleted.includes(aId) && !nextDeleted.includes(aUname);
      });
      try {
        localStorage.setItem('psks_admin_accounts', JSON.stringify(next));

        // Auto-decrement device registration limit for deleted accounts
        const rawDevice = localStorage.getItem('simpsks_device_registered_accounts');
        if (rawDevice) {
          const parsedDevice = JSON.parse(rawDevice);
          if (Array.isArray(parsedDevice)) {
            const updatedDevice = parsedDevice.filter((uname) => {
              const u = String(uname || '').toLowerCase().trim();
              return !newItems.includes(u) && !nextDeleted.includes(u);
            });
            localStorage.setItem('simpsks_device_registered_accounts', JSON.stringify(updatedDevice));
            window.dispatchEvent(new Event('simpsks_device_accounts_changed'));
          }
        }

        // Clean up quota in Firestore
        removeAccountFromQuota(targetUname, target?.registeredIp, target?.deviceId);
      } catch {}
      return next;
    });

    // Record audit activity log (bypassed for developer)
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;
    const targetName = target?.namaAdmin || targetUname;
    const targetWil = target?.wilayahTugas || 'Jawa Barat';
    recordSystemActivity({
      session,
      category: 'ADMIN_ACCOUNT',
      actionType: 'DELETE',
      targetCollection: 'admin_accounts',
      targetId,
      targetName,
      targetWilayah: targetWil,
      details: `${actorLabel} telah MENGHAPUS akun admin [${targetName}] (${targetUname}) - Wilayah: [${targetWil}]`,
    });

    if (quotaExceededRef.current || isQuotaExceeded) {
      addToSyncQueue({ collection: 'admin_accounts', docId: targetId, type: 'DELETE' });
      if (id !== targetId) {
        addToSyncQueue({ collection: 'admin_accounts', docId: id, type: 'DELETE' });
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'admin_accounts', targetId));
      if (id !== targetId) {
        await deleteDoc(doc(db, 'admin_accounts', id)).catch(() => {});
      }
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'admin_accounts', docId: targetId, type: 'DELETE' });
    }
  };

  const handleScrollToGrid = () => {
    const gridEl = document.getElementById('judul-gerbang-psks');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Strict User Flow: When gateModalOpen is true (new visitor or logging in),
  // render ONLY SmartGateModal so zero main content, hero, navbar, or background flashes
  if (gateModalOpen) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-[#01140e] overflow-hidden z-[9999]">
        <SmartGateModal
          isOpen={true}
          onClose={() => setGateModalOpen(false)}
          targetPillarTitle={pendingPillarId ? PILLARS_CONFIG[pendingPillarId]?.title : 'Layanan PSKS'}
          onConfirmGuestRegion={handleConfirmGuestRegion}
          onPerformLogin={handleLogin}
          adminAccounts={adminAccounts}
          onRegisterAccount={handleAddAdminAccount}
          logoUrl={appSettings?.logoUrl}
        />
        {!!loginSuccessData && (
          <React.Suspense fallback={null}>
            <LoginSuccessModal
              isOpen={!!loginSuccessData}
              onClose={handleCloseLoginSuccess}
              role={loginSuccessData?.role || 'user'}
              nama={loginSuccessData?.nama || ''}
              wilayah={loginSuccessData?.wilayah || ''}
            />
          </React.Suspense>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-[#d4af37] selection:text-[#043e2e]">
      {/* Maintenance Global Blocking Overlay */}
      <MaintenanceOverlay
        session={session}
        appSettings={appSettings}
        onDeveloperLogin={(role, nama, wilayah) => handleLogin(role, nama, wilayah)}
      />

      {/* Quota Exceeded Cache Mode Banner (Visible only to authorized operators/admins who need offline queue info) */}
      {isQuotaExceeded && (session.statusActive === 'SAH_TERDAFTAR' || session.role === 'superadmin' || session.role === 'admin' || session.role === 'developer') && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 text-amber-200 text-xs py-2 px-4 text-center font-medium shadow-md flex flex-wrap items-center justify-center gap-2 z-50">
          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
            MODE CACHE LOKAL (OPERATOR)
          </span>
          <span>
            Batas kuota harian Firestore tercapai. Perubahan data tersimpan aman di Cache Lokal & Antrean Offline.
          </span>
          <span className="text-amber-300/80 text-[11px] font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/20">
            ⏰ Reset Harian Google: ~14:00 - 15:00 WIB (Midnight PST)
          </span>
          {pendingSyncCount > 0 && (
            <span className="bg-amber-900/80 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
              {pendingSyncCount} Perubahan Tersimpan Offline
            </span>
          )}
          <button
            type="button"
            onClick={processSyncQueue}
            disabled={isSyncing}
            className="ml-1 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] hover:from-amber-400 hover:to-amber-200 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow active:scale-95 flex items-center gap-1 disabled:opacity-60"
          >
            <span>{isSyncing ? '🔄 Menguji Server...' : '🔄 Sinkronkan Ke Server'}</span>
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setActivePillar(null);
        }}
        onPrefetch={handlePrefetchTab}
        session={session}
        onLogout={handleLogout}
        onOpenGateModal={() => setGateModalOpen(true)}
        onOpenDeveloperPanel={() => {
          if (session.role === 'developer') {
            setIsDeveloperPanelOpen(true);
          }
        }}
        onOpenInbox={() => setIsInboxOpen(true)}
        unreadCount={unreadMessagesCount}
        logoUrl={appSettings?.logoUrl}
      />

      {/* Main View Router */}
      <main className="flex-1">
        <div className={currentTab === 'beranda' ? 'block' : 'hidden'}>
          <HeroSection
            onScrollToGrid={handleScrollToGrid}
            appSettings={appSettings}
            isTabActive={currentTab === 'beranda'}
          />
          <AboutSection />
            <React.Suspense
              fallback={
                <div className="max-w-7xl mx-auto px-4 my-8">
                  <div className="h-64 rounded-3xl bg-gradient-to-br from-[#022319]/80 via-[#033022]/60 to-[#011a12]/80 border border-emerald-700/30 flex flex-col items-center justify-center gap-3 p-6 text-emerald-200 animate-pulse shadow-inner">
                    <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">Memuat Visual Analitik PSKS Jawa Barat...</span>
                  </div>
                </div>
              }
            >
              <HomePSKSAnalytics
                allPillarData={allPillarData}
                session={session}
                onSelectPillar={handleSelectPillar}
                onScrollToGrid={handleScrollToGrid}
              />
            </React.Suspense>
            <BannerBadge session={session} />
            <PillarsGrid onSelectPillar={handleSelectPillar} allPillarData={allPillarData} />

            {/* Button Panjang Elegan "RIWAYAT PENGAJUAN" Khusus Tamu Publik & User (Bukan Superadmin / Developer / Admin) Di Atas Peta Sebaran Interaktif */}
            {(session.role === 'user' || session.statusActive === 'GUEST') && session.role !== 'superadmin' && session.role !== 'developer' && session.role !== 'admin' && (
              <section id="section-riwayat-pendaftaran-user" className="max-w-7xl mx-auto px-3 sm:px-6 my-6 sm:my-8 scroll-mt-24">
                <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-3xl p-5 sm:p-7 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-2 text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-400/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
                      <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                      <span>PORTAL MONITORING STATUS PENGAJUAN MANDIRI</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      Riwayat Pengajuan 10 Pilar PSKS
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl">
                      Pantau status verifikasi dan pengesahan berkas pendaftaran Anda ke 10 Pilar PSKS secara realtime, transparan, dan akurat (Menunggu Persetujuan, Diterima/Acc, atau Ditolak).
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-riwayat-pendaftaran-user"
                    onClick={() => {
                      setCurrentTab('user_reg_history');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative z-10 w-full md:w-auto bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8901c] hover:scale-105 active:scale-95 text-[#043e2e] font-black text-xs sm:text-sm px-6 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-amber-200 uppercase tracking-wider group shrink-0"
                  >
                    <ClipboardList className="w-5 h-5 text-[#043e2e]" />
                    <span>RIWAYAT PENGAJUAN</span>
                    <ArrowRight className="w-4 h-4 text-[#043e2e] transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>
            )}

            {/* Khusus Admin Wilayah: 1 Tombol Eksklusif Untuk Beralih ke Halaman Terima Pendaftaran 10 Pilar PSKS (Di Atas Peta Sebaran) */}
            {session.role === 'admin' && (
              <section id="section-terima-pendaftaran" className="max-w-7xl mx-auto px-3 sm:px-6 my-6 sm:my-8 scroll-mt-24">
                <div className="bg-gradient-to-r from-[#032e22] via-[#043e2e] to-[#011a13] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-2 text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-400/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
                      <span>OTORITAS ADMIN WILAYAH • {(session.wilayah || 'Jawa Barat').toUpperCase()}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">
                      Terima Pendaftaran 10 Pilar PSKS
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl">
                      Akses modul verifikasi berkas dan pengesahan anggota baru dari 10 Pilar Potensi dan Sumber Kesejahteraan Sosial khusus untuk wilayah <strong className="text-amber-300">{session.wilayah || 'Jawa Barat'}</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab('terima_pendaftaran');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative z-10 shrink-0 w-full md:w-auto bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8901c] hover:scale-105 active:scale-95 text-[#043e2e] font-black text-xs sm:text-sm px-6 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-amber-200 uppercase tracking-wider group"
                  >
                    <Inbox className="w-5 h-5 text-[#043e2e]" />
                    <span>Buka Terima Pendaftaran 10 Pilar</span>
                    <ArrowRight className="w-4 h-4 text-[#043e2e] transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>
            )}

            <React.Suspense
              fallback={
                <div className="w-full max-w-7xl mx-auto my-8 h-80 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">Memuat Peta Sebaran Wilayah Jawa Barat...</span>
                </div>
              }
            >
              <JabarRegionalMap allPillarData={allPillarData} />
            </React.Suspense>

            <React.Suspense fallback={null}>
              <Section11Admin
                session={session}
                onOpenAccountConsole={handleOpenAccountConsole}
                onOpenMonitoringConsole={handleOpenMonitoringConsole}
                onOpenActivityLogConsole={handleOpenActivityLogConsole}
                onOpenMaintenanceConsole={handleOpenMaintenanceConsole}
                onOpenUserAccountConsole={handleOpenUserAccountConsole}
                onOpenTaskManagerConsole={handleOpenTaskManagerConsole}
                onOpenAnnouncementConsole={handleOpenAnnouncementConsole}
                onOpenFloatingWaConsole={handleOpenFloatingWaConsole}
              />
            </React.Suspense>
        </div>

        <React.Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 py-16 min-h-[50vh] flex flex-col items-center justify-center">
              <div className="w-full max-w-xl bg-slate-900/40 border border-emerald-800/30 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center gap-4 text-center animate-pulse">
                <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">Dinas Sosial Provinsi Jawa Barat</span>
                  <span className="text-xs font-semibold text-slate-400 block">Menyiapkan Navigasi Halaman...</span>
                </div>
              </div>
            </div>
          }
        >
          {currentTab === 'terima_pendaftaran' && (
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <BackToHomeButton onClick={handleBackToHome} id="btn-back-top-terima-pendaftaran" />
              <div className="text-xs font-bold text-slate-500 bg-white/80 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
                <span>Manajemen Verifikasi Pendaftaran Pilar PSKS</span>
              </div>
            </div>
            <AdminRegistrationManager
              session={session}
              submissions={submissions}
              onApproveSubmission={handleApproveSubmission}
              onRejectSubmission={handleRejectSubmission}
            />
            <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <BackToHomeButton onClick={handleBackToHome} id="btn-back-bottom-terima-pendaftaran" />
              <div className="text-xs text-slate-500 font-semibold">
                <span>Dinas Sosial Provinsi Jawa Barat</span>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'user_manage' && (
          <UserManagementPage
            session={session}
            adminAccounts={adminAccounts}
            onUpdateUserAccount={handleUpdateAdminAccount}
            onDeleteUserAccount={handleDeleteAdminAccount}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'task_manage' && (
          <TaskManagerPage
            session={session}
            submissions={submissions}
            adminAccounts={adminAccounts}
            onBackToHome={handleBackToHome}
            onApproveSubmission={handleApproveSubmission}
            onRejectSubmission={handleRejectSubmission}
            onBatchApproveSubmissions={handleBatchApproveSubmissions}
          />
        )}

        {currentTab === 'pillar_detail' && activePillar && (
          <PillarDetailView
            pillarId={activePillar}
            session={session}
            dataRecords={allPillarData[activePillar] || []}
            onBackToDashboard={handleBackToDashboard}
            onAddRecord={handleAddRecord}
            onDeleteRecord={handleDeleteRecord}
            onAddSubmission={handleAddSubmission}
            onOpenGateModal={() => setGateModalOpen(true)}
          />
        )}

        {currentTab === 'profil' && <ProfilePage appSettings={appSettings} onBackToHome={handleBackToHome} />}

        {currentTab === 'contact' && <ContactPage appSettings={appSettings} onBackToHome={handleBackToHome} />}

        {currentTab === 'akun' && (
          <AccountPage
            session={session}
            adminAccounts={adminAccounts}
            onLogin={(role, nama, wilayah) => {
              handleLogin(role, nama, wilayah);
              setOpenLoginModalOnAkun(false);
            }}
            onLogout={handleLogout}
            onAddAdminAccount={handleAddAdminAccount}
            onUpdateAdminAccount={handleUpdateAdminAccount}
            onDeleteAdminAccount={handleDeleteAdminAccount}
            openLoginOnMount={openLoginModalOnAkun}
            onBackToHome={handleBackToHome}
            onOpenGateModal={() => setGateModalOpen(true)}
            onOpenDeveloperPanel={() => setIsDeveloperPanelOpen(true)}
            onNavigateToManagement={handleOpenAccountConsole}
            onNavigateToMonitoring={handleOpenMonitoringConsole}
          />
        )}

        {currentTab === 'admin_manage' && (
          <AdminManagementPage
            session={session}
            adminAccounts={adminAccounts}
            onAddAdminAccount={handleAddAdminAccount}
            onUpdateAdminAccount={handleUpdateAdminAccount}
            onDeleteAdminAccount={handleDeleteAdminAccount}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'admin_monitor' && (
          <AdminMonitoringPage
            session={session}
            adminAccounts={adminAccounts}
            onBackToHome={handleBackToHome}
            onOpenInbox={() => setIsInboxOpen(true)}
            onSendMessage={handleSendMessage}
          />
        )}

        {currentTab === 'admin_maintenance' && (
          <MaintenanceManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'superadmin_settings' && (
          <SuperadminSettingsPage
            session={session}
            onBackToHome={handleBackToHome}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            allPillarData={allPillarData}
            adminAccounts={adminAccounts}
            adminMessages={adminMessages}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'activity_logs' && (
          <ActivityLogPage
            session={session}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'announcement_manage' && (
          <AnnouncementManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
            onOpenAnnouncementDetail={handleOpenAnnouncementDetail}
          />
        )}

        {currentTab === 'announcement_detail' && (
          <AnnouncementDetailPage
            announcement={activeAnnouncementDetail || appSettings.announcement || DEFAULT_ANNOUNCEMENT_CONFIG}
            session={session}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'floating_wa_manage' && (
          <FloatingWaManagerPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'user_reg_history' && (
          <UserRegistrationHistoryPage
            session={session}
            submissions={submissions}
            onBackToHome={handleBackToHome}
            onNavigateToPillar={(pillarId) => {
              handleSelectPillar(pillarId);
            }}
          />
        )}
        </React.Suspense>
      </main>

      {/* Floating Announcement Modal - 15s Timer Realtime on Entry */}
      <FloatingAnnouncementModal
        isOpen={isFloatingAnnouncementOpen}
        announcement={appSettings.announcement || DEFAULT_ANNOUNCEMENT_CONFIG}
        onClose={() => setIsFloatingAnnouncementOpen(false)}
        onOpenDetail={() => handleOpenAnnouncementDetail(appSettings.announcement || DEFAULT_ANNOUNCEMENT_CONFIG)}
      />

      {/* Floating Elements & Modals */}
      <FloatingWhatsApp appSettings={appSettings} session={session} />
      
      <React.Suspense fallback={null}>
        <AIAssistantWidget
          session={session}
          currentTab={currentTab}
          activePillar={activePillar}
          allPillarData={allPillarData}
          appSettings={appSettings}
          onNavigateTab={(tab: string) => {
            if (tab === 'beranda') {
              handleBackToHome();
            } else {
              if (currentTab === 'beranda') {
                dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
              }
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onSelectPillar={(pillarId: PillarId) => {
            handleSelectPillar(pillarId);
          }}
        />

        <InboxModal
          isOpen={isInboxOpen}
          onClose={() => setIsInboxOpen(false)}
          session={session}
          messages={adminMessages}
          onSendMessage={handleSendMessage}
          onMarkAsRead={handleMarkMessageAsRead}
        />

        <DeveloperControlPanel
          isOpen={isDeveloperPanelOpen && session.role === 'developer'}
          onClose={() => setIsDeveloperPanelOpen(false)}
          appSettings={appSettings}
          onSaveSettings={handleSaveAppSettings}
          allPillarData={allPillarData}
          adminAccounts={adminAccounts}
          adminMessages={adminMessages}
          session={session}
        />
      </React.Suspense>

      {/* Login Success Popup Toast with Animated Checkmark */}
      <LoginSuccessModal
        isOpen={!!loginSuccessData}
        onClose={handleCloseLoginSuccess}
        role={loginSuccessData?.role || 'user'}
        nama={loginSuccessData?.nama || ''}
        wilayah={loginSuccessData?.wilayah || ''}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <React.Suspense fallback={null}>
          <LogoutConfirmModal
            isOpen={showLogoutConfirm}
            onConfirm={handleConfirmLogout}
            onCancel={() => setShowLogoutConfirm(false)}
          />
        </React.Suspense>
      )}

      {/* Logout Success Notification Modal */}
      {showLogoutSuccess && (
        <React.Suspense fallback={null}>
          <LogoutSuccessModal
            isOpen={showLogoutSuccess}
            onClose={handleCompleteLogout}
          />
        </React.Suspense>
      )}

      {/* Real-time Account Remote Action Modals (Deleted, Edited, Multiple Session Kick-out) */}
      {showAccountDeletedModal && (
        <React.Suspense fallback={null}>
          <AccountDeletedRemoteModal
            isOpen={showAccountDeletedModal}
            onClose={() => {
              setShowAccountDeletedModal(false);
              handleForceLogout('Akun telah dihapus oleh pengelola pusat');
            }}
          />
        </React.Suspense>
      )}

      {showAccountEditedModal && (
        <React.Suspense fallback={null}>
          <AccountEditedRemoteModal
            isOpen={showAccountEditedModal}
            onClose={() => {
              setShowAccountEditedModal(false);
              handleForceLogout('Akun telah diedit oleh pengelola pusat');
            }}
          />
        </React.Suspense>
      )}

      {showAccountFrozenModal && (
        <React.Suspense fallback={null}>
          <AccountFrozenRemoteModal
            isOpen={showAccountFrozenModal}
            onClose={() => {
              setShowAccountFrozenModal(false);
              handleForceLogout('Akses akun telah dibekukan sementara');
            }}
          />
        </React.Suspense>
      )}

      {showMultipleSessionModal && (
        <React.Suspense fallback={null}>
          <MultipleSessionWarningModal
            isOpen={showMultipleSessionModal}
            onClose={() => {
              setShowMultipleSessionModal(false);
              handleForceLogout('Diloginkan di perangkat lain');
            }}
          />
        </React.Suspense>
      )}

      {/* Footer */}
      <Footer logoUrl={appSettings?.logoUrl} />
    </div>
  );
}
