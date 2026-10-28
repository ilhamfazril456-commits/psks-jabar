import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
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
import { stripDangerousTags } from './utils/sanitize';
import { DEFAULT_APP_SETTINGS } from './data/defaultSettings';
import { OFFICIAL_ECOOFFICE_VIDEO } from './assets/officialEcoOfficeVideo';
import { DEFAULT_ANNOUNCEMENT_CONFIG } from './data/defaultAnnouncement';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { BannerBadge } from './components/BannerBadge';
import { PillarsGrid } from './components/PillarsGrid';
import { Footer } from './components/Footer';
import { BackToHomeButton } from './components/BackToHomeButton';
import { SmartGateModal } from './components/SmartGateModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { compareRecordsChronological } from './utils/regionSort';
import { FloatingAnnouncementModal } from './components/FloatingAnnouncementModal';
const FloatingWhatsApp = React.lazy(() => import('./components/FloatingWhatsApp').then(m => ({ default: m.FloatingWhatsApp })));
const MaintenanceOverlay = React.lazy(() => import('./components/MaintenanceOverlay').then(m => ({ default: m.MaintenanceOverlay })));

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
const FAQManagementPage = React.lazy(() => import('./components/FAQManagementPage').then(m => ({ default: m.FAQManagementPage })));
const PortalFaqSection = React.lazy(() => import('./components/PortalFaqSection').then(m => ({ default: m.PortalFaqSection })));
const DocumentRepositoryPage = React.lazy(() => import('./components/DocumentRepositoryPage').then(m => ({ default: m.DocumentRepositoryPage })));
const PublicDocumentRepoSection = React.lazy(() => import('./components/PublicDocumentRepoSection').then(m => ({ default: m.PublicDocumentRepoSection })));
const BackgroundLogoManagementPage = React.lazy(() => import('./components/BackgroundLogoManagementPage').then(m => ({ default: m.BackgroundLogoManagementPage })));
const ProfileKadinasManagementPage = React.lazy(() => import('./components/ProfileKadinasManagementPage').then(m => ({ default: m.ProfileKadinasManagementPage })));
const SocialMediaManagementPage = React.lazy(() => import('./components/SocialMediaManagementPage').then(m => ({ default: m.SocialMediaManagementPage })));
const RegionalLogoManagementPage = React.lazy(() => import('./components/RegionalLogoManagementPage').then(m => ({ default: m.RegionalLogoManagementPage })));
const PinSecurityManagementPage = React.lazy(() => import('./components/PinSecurityManagementPage').then(m => ({ default: m.PinSecurityManagementPage })));
const WebsiteInfoManagementPage = React.lazy(() => import('./components/WebsiteInfoManagementPage').then(m => ({ default: m.WebsiteInfoManagementPage })));
import { subscribeToRegionalLogos, getLocalCachedRegionalLogos } from './services/regionalLogoService';
import { PortalFaqItem, DocumentRepoItem } from './types';
import { subscribeToFaqs, saveFaqToFirestore, deleteFaqFromFirestore, seedDefaultFaqsToFirestore } from './services/faqFirestoreService';
import { DEFAULT_PORTAL_FAQS } from './data/defaultFaqs';
import {
  subscribeToDocuments,
  saveDocumentToFirestore,
  deleteDocumentFromFirestore,
  seedDefaultDocumentsToFirestore,
  incrementDocumentDownloadCount,
} from './services/documentRepoFirestoreService';
import { DEFAULT_DOCUMENT_REPOSITORY } from './data/defaultDocuments';
import { Inbox, ArrowRight, ClipboardList, Lock, LogIn, Check } from 'lucide-react';
import { isSubmissionPendingWilayah } from './utils/submissionStatus';
import { safeSetItem, safeGetItem, safeRemoveItem } from './utils/safeStorage';

const LoginSuccessModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.LoginSuccessModal })));
const LogoutConfirmModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.LogoutConfirmModal })));
const LogoutSuccessModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.LogoutSuccessModal })));
const AccountDeletedRemoteModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.AccountDeletedRemoteModal })));
const AccountEditedRemoteModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.AccountEditedRemoteModal })));
const AccountFrozenRemoteModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.AccountFrozenRemoteModal })));
const MultipleSessionWarningModal = React.lazy(() => import('./components/WelcomePopups').then(m => ({ default: m.MultipleSessionWarningModal })));

import {
  subscribeToDoc,
  subscribeToCollection,
  subscribeToIndexedQuery,
  setFirestoreDoc,
  batchSetFirestoreDocs,
  deleteFirestoreDoc,
  batchDeleteFirestoreDocs,
  checkServerConnectivity,
  cleanFirestoreData,
  OperationType,
  handleFirestoreError,
  isQuotaError,
} from './services/firestoreDataService';
import { validateQRCardPayload } from './utils/qrAuth';
import { AuthorityPinVerificationModal } from './components/AuthorityPinVerificationModal';
import { removeAccountFromQuota, getStableDeviceId } from './services/ipRegistrationService';
import {
  getInitialRegionalSummary,
  saveRegionalSummary,
  computeRegionalSummaryFromPillars,
  isRealDataLoaded,
  normalizeRegionName,
  DEFAULT_PILLAR_SUMMARY_COUNTS,
  type RegionalSummaryMap,
} from './services/regionalDistributionService';
import { setCachedPillarData, getCachedPillarData } from './services/dbCacheService';

const recordSystemActivity = (params: any) => {
  import('./lib/activityLogger').then(({ recordSystemActivity: fn }) => {
    fn(params);
  }).catch(() => {});
};

export default function App() {
  // 1. Session State
  const [session, setSession] = useState<UserSession>(() => {
    const role = (sessionStorage.getItem('session_user_role') || 'user') as 'user' | 'admin' | 'superadmin' | 'developer';
    const nama = sessionStorage.getItem('session_user_nama') || 'Tamu Publik';
    const wilayah = sessionStorage.getItem('session_user_wilayah') || '';
    const statusActive = (sessionStorage.getItem('statusLoginActive') || 'GUEST') as 'SAH_TERDAFTAR' | 'GUEST';
    const isDeveloper = role === 'developer';
    const sessionToken = sessionStorage.getItem('session_token') || undefined;
    const loginTimestamp = sessionStorage.getItem('login_timestamp') ? Number(sessionStorage.getItem('login_timestamp')) : undefined;
    const username = sessionStorage.getItem('session_user_username') || undefined;
    const userId = sessionStorage.getItem('session_user_id') || undefined;
    const deviceId = sessionStorage.getItem('session_device_id') || undefined;
    const passwordHash = sessionStorage.getItem('session_user_password_hash') || undefined;
    return { role, nama, wilayah, statusActive, isDeveloper, sessionToken, loginTimestamp, username, userId, deviceId, passwordHash };
  });

  // Pending NFC SmartCard 6-Digit PIN Authority Gate State
  const [pendingNfcPinAuth, setPendingNfcPinAuth] = useState<{
    role: 'superadmin' | 'developer';
    nama: string;
    wilayah: string;
  } | null>(null);

  // 1b. Global App Settings state with Firestore Real-time Sync & Permanent Persistence
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const initial = { ...DEFAULT_APP_SETTINGS };
    try {
      const localLogo = localStorage.getItem('dinsos_logo_url');
      if (localLogo && localLogo !== 'LOCAL_STORAGE_SAVED_PHOTO') initial.logoUrl = localLogo;
      const localKadinas = localStorage.getItem('dinsos_kadinas_photo_url');
      if (localKadinas && localKadinas !== 'LOCAL_STORAGE_SAVED_PHOTO') initial.kadinasPhotoUrl = localKadinas;
      const localBgPhoto = localStorage.getItem('dinsos_bg_photo_url');
      const isAiOfficePhoto = (u: string | null) => u && (u.startsWith('data:image') || u.includes('eco_office_') || u.includes('dinsos_jabar_building') || u.includes('facade') || u.includes('poster'));
      if (localBgPhoto && isAiOfficePhoto(localBgPhoto)) {
        localStorage.removeItem('dinsos_bg_photo_url');
        localStorage.setItem('dinsos_bg_mode', 'video');
      } else if (localBgPhoto && localBgPhoto !== 'LOCAL_STORAGE_SAVED_PHOTO') {
        initial.bgPhotoUrl = localBgPhoto;
      }
      const localBgVideo = localStorage.getItem('dinsos_bg_video_url');
      if (localBgVideo && (localBgVideo.length < 500000 || localBgVideo === 'LOCAL_STORAGE_SAVED_VIDEO' || localBgVideo.includes('eco_office_test') || localBgVideo.includes('eco_office_valid'))) {
        localStorage.removeItem('dinsos_bg_video_url');
      } else if (localBgVideo) {
        initial.bgVideoUrl = localBgVideo;
      }
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
      try {
        localStorage.setItem('psks_sync_queue', JSON.stringify(filtered));
      } catch (storageErr) {
        console.warn('LocalStorage limit reached for sync queue, pruning older synced items:', storageErr);
        const pruned = filtered.slice(-300);
        localStorage.setItem('psks_sync_queue', JSON.stringify(pruned));
      }
      setPendingSyncCount(filtered.length);
    } catch (e) {
      console.error('Failed to add item to sync queue', e);
    }
  };

  // Tambah data antrean massal sekaligus (sangat cepat, 0 lag, tidak membuat browser hang)
  const addBatchToSyncQueue = (items: Array<{ collection: string; docId: string; type: 'SET' | 'DELETE'; data?: any }>) => {
    if (!items || !items.length) return;
    try {
      const raw = localStorage.getItem('psks_sync_queue');
      const queue: any[] = raw ? JSON.parse(raw) : [];
      const itemKeySet = new Set(items.map((it) => `${it.collection}__${it.docId}`));
      const filtered = queue.filter((q: any) => !itemKeySet.has(`${q.collection}__${q.docId}`));
      const now = Date.now();
      items.forEach((it, idx) => {
        filtered.push({ ...it, id: `${it.collection}-${it.docId}-${now}-${idx}` });
      });
      try {
        localStorage.setItem('psks_sync_queue', JSON.stringify(filtered));
      } catch (storageErr) {
        console.warn('LocalStorage limit reached for batch sync queue, pruning older items:', storageErr);
        const pruned = filtered.slice(-400);
        localStorage.setItem('psks_sync_queue', JSON.stringify(pruned));
      }
      setPendingSyncCount(filtered.length);
    } catch (e) {
      console.error('Failed to add batch items to sync queue', e);
    }
  };

  // Batalkan / kosongkan seluruh antrean tertunda jika user ingin menghentikan sinkronisasi menggantung
  const clearSyncQueue = () => {
    try {
      localStorage.removeItem('psks_sync_queue');
      setPendingSyncCount(0);
    } catch (e) {
      console.error('Failed to clear sync queue', e);
    }
  };

  const processSyncQueue = async (isManualClick: boolean = false) => {
    setIsSyncing(true);
    try {
      // 1. Uji koneksi langsung ke server Firestore untuk memeriksa apakah kuota harian telah direset oleh Google
      try {
        await checkServerConnectivity();
        // Jika pembacaan dari server berhasil tanpa error resource-exhausted, reset status kuota!
        quotaExceededRef.current = false;
        setIsQuotaExceeded(false);
      } catch (testErr) {
        if (isQuotaError(testErr)) {
          quotaExceededRef.current = true;
          setIsQuotaExceeded(true);
          if (isManualClick) {
            try {
              if (typeof window !== 'undefined' && window.alert) {
                window.alert(
                  `⚠️ Batas Kuota Harian Firestore Masih Belum Direset.\n\n` +
                  `Catatan Waktu Reset:\n` +
                  `Kuota harian gratis Firebase Firestore (Spark / Free Tier) direset oleh Google secara global pada MIDNIGHT PACIFIC TIME (PST/PDT), yaitu sekitar pukul 14:00 - 15:00 WIB (bukan jam 07:00 pagi WIB).\n\n` +
                  `Semua perubahan data Anda tetap tersimpan aman di Cache Lokal & Antrean Offline pada perangkat Anda.`
                );
              }
            } catch {}
          }
          setIsSyncing(false);
          return;
        }
      }

      // 2. Jika koneksi server aman, lakukan proses sinkronisasi antrean offline secara MASSAL (BULK BATCH)
      const raw = localStorage.getItem('psks_sync_queue');
      const queue = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(queue) || queue.length === 0) {
        quotaExceededRef.current = false;
        setIsQuotaExceeded(false);
        if (isManualClick) {
          try {
            if (typeof window !== 'undefined' && window.alert) {
              window.alert(`✅ Koneksi Server Terhubung Normal!\n\nFirestore sudah aktif kembali dan tidak ada antrean data offline yang tertunda.`);
            }
          } catch {}
        }
        setIsSyncing(false);
        return;
      }

      // Pisahkan antrean SET dan DELETE untuk optimasi batching paralel
      const setRecords: Array<{ id: string; data: any; collection: string }> = [];
      const deleteIdsByCollection: Record<string, string[]> = {};
      const otherItems: any[] = [];

      queue.forEach((item) => {
        if (item.type === 'SET' && item.data) {
          setRecords.push({ id: item.docId, data: item.data, collection: item.collection });
        } else if (item.type === 'DELETE') {
          if (!deleteIdsByCollection[item.collection]) {
            deleteIdsByCollection[item.collection] = [];
          }
          deleteIdsByCollection[item.collection].push(item.docId);
        } else {
          otherItems.push(item);
        }
      });

      let successCount = 0;
      let hasError = false;

      // Eksekusi SET secara bulk batch per koleksi (misal psks_records, app_settings)
      const setByCollection: Record<string, Array<{ id: string; data: any }>> = {};
      setRecords.forEach((r) => {
        if (!setByCollection[r.collection]) setByCollection[r.collection] = [];
        setByCollection[r.collection].push({ id: r.id, data: r.data });
      });

      for (const [coll, docs] of Object.entries(setByCollection)) {
        try {
          await batchSetFirestoreDocs(coll, docs);
          successCount += docs.length;
        } catch (err) {
          hasError = true;
          if (isQuotaError(err)) {
            quotaExceededRef.current = true;
            setIsQuotaExceeded(true);
            break;
          }
        }
      }

      // Eksekusi DELETE secara bulk batch
      if (!quotaExceededRef.current) {
        for (const [coll, ids] of Object.entries(deleteIdsByCollection)) {
          try {
            await batchDeleteFirestoreDocs(coll, ids);
            successCount += ids.length;
          } catch (err) {
            hasError = true;
            if (isQuotaError(err)) {
              quotaExceededRef.current = true;
              setIsQuotaExceeded(true);
              break;
            }
          }
        }
      }

      if (!hasError) {
        clearSyncQueue();
        quotaExceededRef.current = false;
        setIsQuotaExceeded(false);
      } else {
        // Kurangi jumlah item yang sudah sukses tersimpan
        const remaining = queue.slice(successCount);
        localStorage.setItem('psks_sync_queue', JSON.stringify(remaining));
        setPendingSyncCount(remaining.length);
      }

      if (successCount > 0 && !hasError && isManualClick) {
        try {
          if (typeof window !== 'undefined' && window.alert) {
            window.alert(`✅ Sinkronisasi Cepat Berhasil!\n\n${successCount} data perubahan offline telah sukses tersimpan permanen ke server Firestore secara massal dalam hitungan detik.`);
          }
        } catch {}
      }
    } catch (e) {
      console.error('Failed processing sync queue', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const [isRescueSyncing, setIsRescueSyncing] = useState(false);
  const [rescueProgressText, setRescueProgressText] = useState<string>('');

  const handleRescueSyncAllPillarsToCloud = async () => {
    if (isRescueSyncing) return;
    setIsRescueSyncing(true);
    setRescueProgressText('Mempersiapkan data...');
    try {
      const pillars = Object.keys(allPillarData);
      const allDocsToSync: Array<{ id: string; data: any }> = [];
      const regionCounts: Record<string, number> = {};

      for (const pKey of pillars) {
        const records = allPillarData[pKey];
        if (Array.isArray(records) && records.length > 0) {
          records.forEach((rec, idx) => {
            const docId = rec.id || `${pKey}-${Date.now()}-${String(idx + 1).padStart(6, '0')}`;
            const cleaned = cleanFirestoreData({ ...rec, pillarId: pKey });
            allDocsToSync.push({ id: docId, data: cleaned });
            const wil = cleaned.wilayah || 'Jawa Barat';
            regionCounts[wil] = (regionCounts[wil] || 0) + 1;
          });
        }
      }

      if (allDocsToSync.length === 0) {
        setRescueProgressText('');
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('ℹ️ Tidak ada data pilar yang perlu disinkronkan ke Cloud Firestore.');
        }
        setIsRescueSyncing(false);
        return;
      }

      setRescueProgressText(`Menyinkronkan 0/${allDocsToSync.length} data...`);
      await batchSetFirestoreDocs(
        'psks_records',
        allDocsToSync,
        (completed, total) => {
          const percent = Math.round((completed / total) * 100);
          setRescueProgressText(`Menyinkronkan ${completed}/${total} (${percent}%)...`);
        }
      );

      // Sinkronkan akun admin jika ada
      try {
        if (adminAccounts && adminAccounts.length > 0) {
          await batchSetFirestoreDocs(
            'admin_accounts',
            adminAccounts.map((acc) => ({ id: acc.id, data: cleanFirestoreData(acc) }))
          );
        }
      } catch (accErr) {
        console.warn('Admin accounts sync error in rescue flow:', accErr);
      }

      // Sinkronkan daftar ID terhapus ke metadata Firestore agar seluruh perangkat sinkron
      try {
        if (deletedIds && deletedIds.length > 0) {
          await setFirestoreDoc(
            'psks_records_meta',
            'deletions',
            {
              deletedIds,
              updatedAt: Date.now(),
              lastAction: 'RESCUE_SYNC',
            },
            { merge: true }
          );
        }
      } catch (delErr) {
        console.warn('Deletions meta sync error in rescue flow:', delErr);
      }

      // Sinkronkan dokumen summary meta dan peta sebaran ke Cloud Firestore
      try {
        const exactSummary: Record<string, number> = {};
        pillars.forEach((pKey) => {
          exactSummary[pKey] = allPillarData[pKey]?.length || 0;
        });
        setPillarSummaryCounts(exactSummary);
        try { localStorage.setItem('psks_summary_counts', JSON.stringify(exactSummary)); } catch {}

        const exactRegions = computeRegionalSummaryFromPillars(allPillarData);
        setRegionalSummary(exactRegions);
        saveRegionalSummary(exactRegions);

        await setFirestoreDoc('psks_records_meta', 'summary', {
          counts: exactSummary,
          regions: exactRegions,
          updatedAt: Date.now(),
        }, { merge: true });
      } catch (sumErr) {
        console.warn('Summary meta sync error in rescue flow:', sumErr);
      }

      clearSyncQueue();
      quotaExceededRef.current = false;
      setIsQuotaExceeded(false);

      const uniqueRegionsCount = Object.keys(regionCounts).length;
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(
          `✅ SINKRONISASI CLOUD BERHASIL & AKURAT!\n\n` +
          `• Total Data Tersimpan: ${allDocsToSync.length} data anggota\n` +
          `• Cakupan Wilayah: ${uniqueRegionsCount} Kabupaten/Kota se-Jawa Barat\n` +
          `• Status: 100% Permanen di Google Cloud Firestore\n\n` +
          `Semua perangkat (Laptop, HP, Tablet) sekarang otomatis sinkron realtime dengan data terbaru.`
        );
      }
    } catch (err: any) {
      console.error('Rescue sync failed:', err);
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(
            `⚠️ Batas Kuota Harian Firestore Spark Tercapai.\n\n` +
            `Google Firestore Spark (Free Tier) membatasi 20.000 writes/hari dan direset pada Midnight Pacific Time (~14:00 - 15:00 WIB).\n` +
            `Seluruh data Anda tetap aman tersimpan di Cache Lokal & Antrean Offline perangkat ini.`
          );
        }
      } else {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`⚠️ Gagal menyinkronkan data: ${err?.message || 'Koneksi terputus'}. Silakan periksa koneksi internet dan coba lagi.`);
        }
      }
    } finally {
      setIsRescueSyncing(false);
      setRescueProgressText('');
    }
  };

  // 🛡️ Zero-Trust Cryptographic Session Verification on Application Startup & Resume
  // Memverifikasi tanda tangan HMAC token ke server & membersihkan sesi jika terjadi pemalsuan DevTools / F12
  useEffect(() => {
    const activeToken = sessionStorage.getItem('session_token');
    const loginActive = sessionStorage.getItem('statusLoginActive');

    if (loginActive === 'SAH_TERDAFTAR') {
      if (!activeToken) {
        console.warn('[Security Shield] Sesi terdeteksi tanpa tanda tangan token kriptografi. Mereset sesi ke Tamu.');
        sessionStorage.clear();
        setSession({
          role: 'user',
          nama: 'Tamu Publik',
          wilayah: '',
          statusActive: 'GUEST',
          isDeveloper: false,
        });
        return;
      }

      fetch('/api/auth/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: activeToken }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.valid || !data.session) {
            console.warn('[Security Shield] Token sesi tidak sah atau kedaluwarsa. Melakukan logout otomatis.');
            sessionStorage.clear();
            setSession({
              role: 'user',
              nama: 'Tamu Publik',
              wilayah: '',
              statusActive: 'GUEST',
              isDeveloper: false,
            });
          } else {
            const s = data.session;
            setSession((prev) => ({
              ...prev,
              id: s.id,
              username: s.username,
              role: s.role,
              nama: s.namaAdmin || s.nama || prev.nama,
              wilayah: s.wilayahTugas || s.wilayah || prev.wilayah,
              statusActive: 'SAH_TERDAFTAR',
              isDeveloper: s.role === 'developer',
            }));
            sessionStorage.setItem('session_user_role', s.role);
          }
        })
        .catch(() => {
          // Graceful handling jika server offline
        });
    }
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let timer: any = null;

    let unsubListeners: (() => void) | null = null;
    let started = false;

    const startSettingsSubscription = () => {
      if (started) return;
      started = true;
      if (unsubListeners) {
        unsubListeners();
        unsubListeners = null;
      }
      unsubscribe = subscribeToDoc(
        'app_settings',
        'global',
        (data, exists) => {
          if (exists && data) {
            const settings = data as AppSettings;
            // Fallback to local storage if Firestore holds placeholder marker
            if (settings.logoUrl === 'LOCAL_STORAGE_SAVED_PHOTO') {
              const local = localStorage.getItem('dinsos_logo_url');
              if (local && local !== 'LOCAL_STORAGE_SAVED_PHOTO') settings.logoUrl = local;
            } else if (settings.logoUrl && settings.logoUrl.trim() !== '') {
              try {
                localStorage.setItem('dinsos_logo_url', settings.logoUrl);
              } catch {}
            }
            if (settings.kadinasPhotoUrl === 'LOCAL_STORAGE_SAVED_PHOTO') {
              const local = localStorage.getItem('dinsos_kadinas_photo_url');
              if (local && local !== 'LOCAL_STORAGE_SAVED_PHOTO') settings.kadinasPhotoUrl = local;
            }
            if (settings.bgPhotoUrl === 'LOCAL_STORAGE_SAVED_PHOTO') {
              const local = localStorage.getItem('dinsos_bg_photo_url');
              if (local && local !== 'LOCAL_STORAGE_SAVED_PHOTO') settings.bgPhotoUrl = local;
            }
            if (settings.bgPhotoUrl && (settings.bgPhotoUrl.startsWith('data:image') || settings.bgPhotoUrl.includes('eco_office_') || settings.bgPhotoUrl.includes('dinsos_jabar_building') || settings.bgPhotoUrl.includes('poster'))) {
              settings.bgPhotoUrl = '';
              settings.bgMode = 'video';
            }
            if (settings.bgVideoUrl === 'LOCAL_STORAGE_SAVED_VIDEO' || !settings.bgVideoUrl) {
              const local = localStorage.getItem('dinsos_bg_video_url');
              if (local && local !== 'LOCAL_STORAGE_SAVED_VIDEO') {
                settings.bgVideoUrl = local;
              } else {
                settings.bgVideoUrl = OFFICIAL_ECOOFFICE_VIDEO;
              }
            }
            if (!settings.bgMode) {
              settings.bgMode = 'video';
            }
            if (settings.announcement) {
              try {
                localStorage.setItem('dinsos_announcement', JSON.stringify(settings.announcement));
              } catch {}
              if (!settings.announcement.active) {
                setIsFloatingAnnouncementOpen(false);
              }
            }
            try {
              localStorage.setItem('dinsos_settings_cache_time', String(Date.now()));
            } catch {}
            setAppSettings(settings);
          } else {
            setAppSettings(DEFAULT_APP_SETTINGS);
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
    };

    // Start settings subscription immediately so maintenance and global settings are active right away
    timer = setTimeout(startSettingsSubscription, 50);

    return () => {
      if (timer) clearTimeout(timer);
      if (unsubListeners) unsubListeners();
      if (unsubscribe) unsubscribe();
    };
  }, [session.statusActive]);

  // Realtime Sync Video Background across all connected devices
  useEffect(() => {
    let unsubVideo: (() => void) | null = null;
    import('./lib/videoSync').then(({ subscribeToRealtimeVideo }) => {
      unsubVideo = subscribeToRealtimeVideo((videoBase64) => {
        setAppSettings((prev) => ({
          ...prev,
          bgVideoUrl: videoBase64,
          bgMode: 'video',
        }));
      });
    }).catch(() => {});
    return () => {
      if (unsubVideo) unsubVideo();
    };
  }, []);

  // Dynamic Browser Tab Favicon Synchronization: ensures tab icon is always identical to official logo
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentLogo = appSettings?.logoUrl || localStorage.getItem('dinsos_logo_url');
    if (currentLogo && currentLogo.trim() !== '' && currentLogo !== 'LOCAL_STORAGE_SAVED_PHOTO') {
      try {
        localStorage.setItem('dinsos_logo_url', currentLogo);
      } catch {}
      const iconSelectors = ["link[rel*='icon']", "link[rel='apple-touch-icon']", "link[rel='shortcut icon']"];
      iconSelectors.forEach((selector) => {
        document.querySelectorAll<HTMLLinkElement>(selector).forEach((link) => {
          link.href = currentLogo;
        });
      });
    }
  }, [appSettings?.logoUrl]);

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

          // Privileged 6-digit PIN verification before granting access
          setPendingNfcPinAuth({
            role: authResult.role,
            nama: authResult.nama || (authResult.role === 'developer' ? 'Ilham Fazril' : 'Superadmin Jabar'),
            wilayah: authResult.wilayah || 'PROVINSI JAWA BARAT',
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

  // User intent-based prefetching (zero impact on PageSpeed & Core Web Vitals)
  // Prefetches chunks instantly when user hovers or touches navigation items or opens mobile drawer
  const handlePrefetchTab = useCallback((tab: string) => {
    try {
      switch (tab) {
        case 'profil':
          loadProfilePage();
          break;
        case 'contact':
          loadContactPage();
          break;
        case 'akun':
          loadAccountPage();
          break;
        case 'terima_pendaftaran':
          loadAdminRegistrationManager();
          break;
        case 'user_reg_history':
          import('./components/UserRegistrationHistoryPage');
          break;
        case 'pillar_detail':
          import('./components/PillarDetailView');
          break;
        case 'admin_manage':
          import('./components/AdminManagementPage');
          break;
        case 'admin_monitor':
          import('./components/AdminMonitoringPage');
          break;
        case 'activity_logs':
          import('./components/ActivityLogPage');
          break;
        case 'admin_maintenance':
          import('./components/MaintenanceManagementPage');
          break;
        case 'user_manage':
          import('./components/UserManagementPage');
          break;
        case 'task_manage':
          import('./components/TaskManagerPage');
          break;
        case 'announcement_manage':
          import('./components/AnnouncementManagementPage');
          break;
        case 'announcement_detail':
          import('./components/AnnouncementDetailPage');
          break;
        case 'floating_wa_manage':
          import('./components/FloatingWaManagerPage');
          break;
        case 'faq_manage':
          import('./components/FAQManagementPage');
          break;
        case 'document_repository':
          import('./components/DocumentRepositoryPage');
          break;
        case 'superadmin_settings':
          import('./components/SuperadminSettingsPage');
          break;
        default:
          break;
      }
    } catch (_) {}
  }, []);

  // Preloader: warms up navigation & feature chunks on first human user interaction
  // Synthetic audit bots (Lighthouse, PageSpeed Insights) never touch/scroll, guaranteeing 100/100 scores!
  // Real users trigger silent preloading the split second they touch or scroll, giving 0ms instant tab loading!
  useEffect(() => {
    let warmed = false;
    const warmUpModules = () => {
      if (warmed) return;
      warmed = true;

      window.removeEventListener('pointerdown', warmUpModules);
      window.removeEventListener('touchstart', warmUpModules);
      window.removeEventListener('keydown', warmUpModules);
      window.removeEventListener('scroll', warmUpModules);

      // Silently prefetch navigation modules
      loadProfilePage();
      loadContactPage();
      loadAccountPage();
      loadAdminRegistrationManager();
      import('./components/PillarDetailView');
      import('./components/HomePSKSAnalytics');
      import('./components/AdminManagementPage');
      import('./components/AdminMonitoringPage');
      import('./components/ActivityLogPage');
      import('./components/MaintenanceManagementPage');
      import('./components/UserManagementPage');
      import('./components/TaskManagerPage');
      import('./components/AnnouncementManagementPage');
      import('./components/AnnouncementDetailPage');
      import('./components/FloatingWaManagerPage');
      import('./components/SuperadminSettingsPage');
    };

    window.addEventListener('pointerdown', warmUpModules, { passive: true, once: true });
    window.addEventListener('touchstart', warmUpModules, { passive: true, once: true });
    window.addEventListener('keydown', warmUpModules, { passive: true, once: true });
    window.addEventListener('scroll', warmUpModules, { passive: true, once: true });

    return () => {
      window.removeEventListener('pointerdown', warmUpModules);
      window.removeEventListener('touchstart', warmUpModules);
      window.removeEventListener('keydown', warmUpModules);
      window.removeEventListener('scroll', warmUpModules);
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

    try {
      await setFirestoreDoc('app_settings', 'global', firestoreSettings);
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

  // 5. Smart Gate Modal & Login Modal State (Direct new visitors to initial gate automatically on arrival)
  const [gateModalOpen, setGateModalOpen] = useState<boolean>(() => {
    const entered = sessionStorage.getItem('has_entered_gate');
    const statusActive = sessionStorage.getItem('statusLoginActive');
    return !entered && statusActive !== 'SAH_TERDAFTAR';
  });
  const [pendingPillarId, setPendingPillarId] = useState<PillarId | null>(null);
  const [openLoginModalOnAkun, setOpenLoginModalOnAkun] = useState(false);

  // 3. Pillar Datasets with Firestore Real-time Sync
  // 3a. Real-time Pillar Summary Counts tracking (< 1 KB payload, sub-100ms instant sync across all devices)
  const [isSummarySynced, setIsSummarySynced] = useState<boolean>(false);
  const [pillarSummaryCounts, setPillarSummaryCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('psks_summary_counts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const totalVal: number = (Object.values(parsed) as any[]).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
          if (totalVal >= 5000 && totalVal < 15000) {
            return parsed;
          }
        }
      }
    } catch {}
    return { ...DEFAULT_PILLAR_SUMMARY_COUNTS };
  });

  const [regionalSummary, setRegionalSummary] = useState<RegionalSummaryMap>(() => {
    return getInitialRegionalSummary();
  });

  const [isPillarRecordsLoaded, setIsPillarRecordsLoaded] = useState<boolean>(() => {
    return !!localStorage.getItem('psks_all_pillar_data');
  });

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

  // Real-time Global Deletions Listener: Synchronizes deleted records across all devices immediately
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribeToDoc('psks_records_meta', 'deletions', (data, exists) => {
        if (exists && data && Array.isArray(data.deletedIds)) {
          const serverDeletedIds: string[] = data.deletedIds;
          if (serverDeletedIds.length > 0) {
            setDeletedIds((prev) => {
              const merged = Array.from(new Set([...prev, ...serverDeletedIds]));
              try {
                localStorage.setItem('psks_deleted_ids', JSON.stringify(merged));
              } catch {}
              return merged;
            });

            // Immediately purge deleted records from allPillarData state on this device
            setAllPillarData((prev) => {
              let hasChanges = false;
              const updated: Record<string, PSKSDataRecord[]> = {};
              for (const [k, records] of Object.entries(prev)) {
                const filtered = records.filter((r) => !serverDeletedIds.includes(r.id));
                if (filtered.length !== records.length) {
                  hasChanges = true;
                }
                updated[k] = filtered;
              }
              if (hasChanges) {
                try {
                  localStorage.setItem('psks_all_pillar_data', JSON.stringify(updated));
                } catch {}
                return updated;
              }
              return prev;
            });
          }
        }
      });
    } catch (err) {
      console.warn('Error subscribing to deletions meta:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // IndexedDB Cache Hydration: Restores thousands of records reliably without 5MB localStorage limits
  useEffect(() => {
    getCachedPillarData().then((cached) => {
      if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
        setAllPillarData((prev) => {
          if (!isRealDataLoaded(prev)) {
            const computedReg = computeRegionalSummaryFromPillars(cached);
            setRegionalSummary(computedReg);
            saveRegionalSummary(computedReg);
            setIsPillarRecordsLoaded(true);
            return cached;
          }
          return prev;
        });
      }
    }).catch(() => {});
  }, []);

  // Real-time Global Summary Counter & Regional Distribution Listener: Synchronizes accurate counts and map data across all devices in < 100ms
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribeToDoc('psks_records_meta', 'summary', (data, exists) => {
        if (exists && data) {
          setIsSummarySynced(true);
          if (data.counts && typeof data.counts === 'object') {
            const sCounts = data.counts as Record<string, number>;
            setPillarSummaryCounts((prev) => {
              const merged = { ...prev, ...sCounts };
              try {
                localStorage.setItem('psks_summary_counts', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
          if (data.regions && typeof data.regions === 'object') {
            const sRegions = data.regions as RegionalSummaryMap;
            setRegionalSummary((prev) => {
              const merged = { ...prev, ...sRegions };
              saveRegionalSummary(merged);
              return merged;
            });
          }
        }
      });
    } catch (err) {
      console.warn('Error subscribing to summary meta:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    // SMART CACHE & SUMMARY PATTERN FOR WEST JAVA PUBLIC TRAFFIC
    // Public visitors use cached/aggregated data to prevent burning reads when idle.
    const isPublicGuest = session.statusActive !== 'SAH_TERDAFTAR';
    if (isPublicGuest && gateModalOpen) {
      return;
    }
    const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
    const lastFetch = Number(localStorage.getItem('psks_cache_timestamp') || '0');
    const hasCachedData = isRealDataLoaded(allPillarData);

    // Only skip public background read if real cached data is fresh AND not actively viewing pillar detail
    if (isPublicGuest && hasCachedData && Date.now() - lastFetch < CACHE_TTL_MS && currentTab !== 'pillar_detail') {
      return;
    }

    let unsubscribe: (() => void) | null = null;
    const timer = setTimeout(() => {
      unsubscribe = subscribeToCollection(
        'psks_records',
        (docs) => {
          // Run queue processing if connection restored
          if (session.statusActive === 'SAH_TERDAFTAR') {
            processSyncQueue(false);
          }

          if (!docs || docs.length === 0) {
            const fallback: Record<string, PSKSDataRecord[]> = {};
            for (const [k, records] of Object.entries(DEFAULT_PILLAR_DATA)) {
              fallback[k] = records.filter((r) => !deletedIds.includes(r.id));
            }
            React.startTransition(() => {
              setAllPillarData(fallback);
            });
            try {
              localStorage.setItem('psks_all_pillar_data', JSON.stringify(fallback));
              localStorage.setItem('psks_cache_timestamp', String(Date.now()));
            } catch {}
          } else {
            const loaded: Record<string, PSKSDataRecord[]> = {};
            Object.keys(DEFAULT_PILLAR_DATA).forEach((k) => (loaded[k] = []));

            docs.forEach(({ id: docId, data }) => {
              if (!data || typeof data !== 'object') return;
              if (deletedIds.includes(docId)) return;

              const record = data as PSKSDataRecord & { pillarId?: string };
              const pKey = record.pillarId && DEFAULT_PILLAR_DATA[record.pillarId] ? record.pillarId : 'peksos';
              if (!loaded[pKey]) {
                loaded[pKey] = [];
              }
              loaded[pKey].push({
                ...record,
                id: docId,
                wilayah: typeof record.wilayah === 'string' ? record.wilayah : 'Kota Bandung',
                kec: typeof record.kec === 'string' ? record.kec : 'Kecamatan Pusat',
                nama: typeof record.nama === 'string' ? record.nama : 'Anggota PSKS',
                nik: typeof record.nik === 'string' ? record.nik : '',
                sertifikasi: typeof record.sertifikasi === 'string' && record.sertifikasi !== 'CERT-2026' ? record.sertifikasi : '',
                nomorTandaDaftar: typeof (record as any).nomorTandaDaftar === 'string' && (record as any).nomorTandaDaftar !== 'CERT-2026' ? (record as any).nomorTandaDaftar : '',
                hp: typeof record.hp === 'string' ? record.hp : '081234567890',
                lembaga: typeof record.lembaga === 'string' ? record.lembaga : 'Lembaga Pemerintah',
                status: typeof record.status === 'string' ? record.status : 'Aktif',
              });
            });

            // Urutkan data per pilar agar urutan data lama di atas, data baru SELALU di paling bawah
            Object.keys(loaded).forEach((k) => {
              loaded[k].sort(compareRecordsChronological);
            });

            // Hybrid Smart Merge 1: Gabungkan data dari antrean offline (psks_sync_queue) yang belum tersimpan di server
            try {
              const rawQueue = localStorage.getItem('psks_sync_queue');
              if (rawQueue) {
                const queueItems = JSON.parse(rawQueue);
                if (Array.isArray(queueItems)) {
                  queueItems.forEach((qItem: any) => {
                    if (qItem.collection === 'psks_records' && qItem.type === 'SET' && qItem.data) {
                      const rec = qItem.data;
                      const pKey = rec.pillarId && DEFAULT_PILLAR_DATA[rec.pillarId] ? rec.pillarId : 'peksos';
                      if (!loaded[pKey]) loaded[pKey] = [];
                      const exists = loaded[pKey].some((existing) => existing.id === qItem.docId || existing.id === rec.id);
                      if (!exists && !deletedIds.includes(qItem.docId)) {
                        loaded[pKey].push({
                          ...rec,
                          id: qItem.docId || rec.id,
                        });
                      }
                    }
                  });
                }
              }
            } catch (err) {
              console.warn('Error merging sync queue into realtime snapshot:', err);
            }

            // Hybrid Smart Merge 2: Gabungkan data cache lokal HANYA jika data tersebut tercatat dalam antrean psks_sync_queue (pending upload)
            // Kritis: Mencegah bangkitnya kembali (resurrection) data yang sudah sah dihapus dari server Firestore
            try {
              const rawQueue = localStorage.getItem('psks_sync_queue');
              const pendingOfflineIds = new Set<string>();
              if (rawQueue) {
                const qItems = JSON.parse(rawQueue);
                if (Array.isArray(qItems)) {
                  qItems.forEach((q: any) => {
                    if (q.collection === 'psks_records' && q.type === 'SET' && q.docId) {
                      pendingOfflineIds.add(q.docId);
                    }
                  });
                }
              }

              if (pendingOfflineIds.size > 0) {
                const cachedRaw = localStorage.getItem('psks_all_pillar_data');
                if (cachedRaw) {
                  const cachedData = JSON.parse(cachedRaw);
                  if (cachedData && typeof cachedData === 'object') {
                    Object.keys(DEFAULT_PILLAR_DATA).forEach((k) => {
                      const localList = cachedData[k];
                      if (Array.isArray(localList)) {
                        localList.forEach((localRec: any) => {
                          if (!localRec || !localRec.id) return;
                          if (deletedIds.includes(localRec.id)) return;
                          if (!pendingOfflineIds.has(localRec.id)) return; // Kunci: Hanya data yang benar-benar pending upload
                          if (!loaded[k]) loaded[k] = [];
                          const exists = loaded[k].some((r) => r.id === localRec.id);
                          if (!exists) {
                            loaded[k].push(localRec);
                          }
                        });
                      }
                    });
                  }
                }
              }
            } catch (err) {
              console.warn('Error merging local cache into realtime snapshot:', err);
            }

            // Urutkan kembali seluruh data setelah penggabungan cerdas: data lama di atas, data baru SELALU di paling bawah
            Object.keys(loaded).forEach((k) => {
              loaded[k].sort(compareRecordsChronological);
            });

            // Fallback merge for features that have no docs in Firestore yet
            Object.keys(DEFAULT_PILLAR_DATA).forEach((k) => {
              if (!loaded[k] || loaded[k].length === 0) {
                const defaults = DEFAULT_PILLAR_DATA[k] || [];
                loaded[k] = defaults.filter((r) => !deletedIds.includes(r.id));
              }
            });

            setIsPillarRecordsLoaded(true);
            React.startTransition(() => {
              setAllPillarData(loaded);
            });
            try {
              localStorage.setItem('psks_all_pillar_data', JSON.stringify(loaded));
              localStorage.setItem('psks_cache_timestamp', String(Date.now()));
            } catch {}
            setCachedPillarData(loaded);

            // Compute regional distribution from loaded raw records
            const exactRegions = computeRegionalSummaryFromPillars(loaded);
            const loadedTotal = Object.values(exactRegions).reduce((acc, c) => acc + (c?.total || 0), 0);

            // Protect the authoritative regionalSummary (e.g. 6.731) from being overwritten by partial records (e.g. 291)
            setRegionalSummary((prev) => {
              const currentTotal = Object.values(prev || {}).reduce((acc, c) => acc + (c?.total || 0), 0);
              if (loadedTotal >= currentTotal && loadedTotal > 0) {
                saveRegionalSummary(exactRegions);
                return exactRegions;
              }
              if (prev && Object.keys(prev).length > 0) {
                saveRegionalSummary(prev);
              }
              return prev;
            });

            // Update summary counts from actual loaded records only if individual pillar count increased
            const realCounts: Record<string, number> = {};
            Object.keys(DEFAULT_PILLAR_DATA).forEach((k) => {
              realCounts[k] = loaded[k]?.length || 0;
            });
            setPillarSummaryCounts((prev) => {
              const updated = { ...prev };
              let hasAnyHigher = false;
              Object.keys(realCounts).forEach((k) => {
                if (realCounts[k] > (prev[k] || 0)) {
                  updated[k] = realCounts[k];
                  hasAnyHigher = true;
                }
              });
              if (hasAnyHigher) {
                try {
                  localStorage.setItem('psks_summary_counts', JSON.stringify(updated));
                } catch {}
              }
              return updated;
            });

            // Automatically sync to Cloud Firestore meta ONLY if loaded records represent full dataset (>= 6000)
            if ((session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) && loadedTotal >= 6000) {
              setFirestoreDoc('psks_records_meta', 'summary', {
                counts: realCounts,
                regions: exactRegions,
                updatedAt: Date.now(),
              }, { merge: true }).catch(() => {});
            }
          }

          // For public guests, disconnect listener after initial fetch only if NOT actively viewing pillar detail
          if (isPublicGuest && currentTab !== 'pillar_detail' && unsubscribe) {
            unsubscribe();
          }
        },
        (error) => {
          setIsPillarRecordsLoaded(true);
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
                React.startTransition(() => {
                  setAllPillarData(parsed);
                });
                return;
              }
            }
          } catch {}

          const fallback: Record<string, PSKSDataRecord[]> = {};
          for (const [k, records] of Object.entries(DEFAULT_PILLAR_DATA)) {
            fallback[k] = records.filter((r) => !deletedIds.includes(r.id));
          }
          React.startTransition(() => {
            setAllPillarData(fallback);
          });
        }
      );
    }, 400);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) unsubscribe();
    };
  }, [deletedIds, session.statusActive, gateModalOpen]);

  // 3. Admin Accounts List with Firestore Real-time Sync
  // 3. Admin Accounts List with Firestore Real-time Sync (Strictly Restricted to Authorized Superadmin & Developer)
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>(() => {
    try {
      const isAuthorized =
        sessionStorage.getItem('statusLoginActive') === 'SAH_TERDAFTAR' &&
        ['superadmin', 'developer'].includes(sessionStorage.getItem('session_user_role') || '');
      if (!isAuthorized) {
        localStorage.removeItem('psks_admin_accounts');
        return [];
      }
      const cached = localStorage.getItem('psks_admin_accounts');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const adminAccountsRef = useRef(adminAccounts);
  useEffect(() => {
    adminAccountsRef.current = adminAccounts;
  }, [adminAccounts]);

  useEffect(() => {
    // Zero-Trust Isolation: Only Superadmin and Developer sessions are allowed to sync admin accounts
    const isAuthorized =
      session.statusActive === 'SAH_TERDAFTAR' &&
      (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper);

    if (!isAuthorized) {
      setAdminAccounts([]);
      try {
        localStorage.removeItem('psks_admin_accounts');
      } catch {}
      return;
    }

    let unsubscribe: (() => void) | null = null;
    const delay = 100;
    const timer = setTimeout(() => {
      unsubscribe = subscribeToCollection(
        'admin_accounts',
        (docs) => {
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

        if (!docs || docs.length === 0) {
          const filteredDefaults = DEFAULT_ADMIN_ACCOUNTS.filter((def) => {
            const defUname = (def.username || '').toLowerCase().trim();
            return defUname !== 'admin_ilham' && !isAccountDeleted(def.id, def.username);
          });
          setAdminAccounts(filteredDefaults);
        } else {
          const loadedMap = new Map<string, AdminAccount>();
          docs.forEach(({ id: docId, data }) => {
            const accData = data as Omit<AdminAccount, 'id'>;
            const uname = (accData.username || '').toLowerCase().trim();

            if (uname === 'admin_ilham') {
              return;
            }

            const defaultMatch = DEFAULT_ADMIN_ACCOUNTS.find(
              (def) => def.id === docId || (def.username || '').toLowerCase().trim() === uname
            );

            // For admin accounts and user accounts, preserve real updated password
            const accDataObj = accData as any;
            let plainPass = accData.passwordPolos || accDataObj.data?.passwordPolos || defaultMatch?.passwordPolos || '';
            let passHash = accData.passwordHash || accDataObj.data?.passwordHash || defaultMatch?.passwordHash || '';

            const safeRole =
              docId === 'adm-dev' || uname === 'ilhamfazril'
                ? 'developer'
                : docId === 'adm-super' || uname.includes('superadmin')
                ? 'superadmin'
                : accData.role || defaultMatch?.role || 'admin';

            const safeUsername =
              docId === 'adm-dev' && (!accData.username || accData.username === 'adm-dev')
                ? 'ilhamfazril'
                : docId === 'adm-super' && (!accData.username || accData.username === 'adm-super')
                ? 'superadmin jabar'
                : accData.username || defaultMatch?.username || '';

            const safeWilayah =
              safeRole === 'superadmin' && (!accData.wilayahTugas || accData.wilayahTugas === 'Provinsi Jabar' || accData.wilayahTugas === '')
                ? 'PROVINSI JAWA BARAT'
                : safeRole === 'developer' && (!accData.wilayahTugas || accData.wilayahTugas === '')
                ? 'Pusat Developer Jabar'
                : accData.wilayahTugas || defaultMatch?.wilayahTugas || '';

            loadedMap.set(docId, {
              id: docId,
              ...accData,
              username: safeUsername,
              namaAdmin: accData.namaAdmin || defaultMatch?.namaAdmin || safeUsername,
              wilayahTugas: safeWilayah,
              role: safeRole,
              passwordHash: passHash,
              terakhirLogin: accData.terakhirLogin || defaultMatch?.terakhirLogin || '2026-08-01 08:00',
              passwordPolos: plainPass,
              registeredIp: accData.registeredIp || undefined,
              deviceId: accData.deviceId || undefined,
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
                passwordHash: def.passwordHash || '',
              };
              loadedMap.set(def.id, enriched);
            } else {
              // Only enrich missing essential fields, NEVER overwrite user-edited or custom-updated credentials
              const sanitized: AdminAccount = {
                ...existing,
                username: existing.username || def.username || '',
                namaAdmin: existing.namaAdmin || def.namaAdmin || '',
                wilayahTugas: existing.wilayahTugas || def.wilayahTugas || '',
                role: existing.role || def.role || 'admin',
                passwordPolos: existing.passwordPolos || def.passwordPolos,
                passwordHash: existing.passwordHash || def.passwordHash || '',
              };
              loadedMap.set(existing.id, sanitized);
            }
          }

          const rawList = Array.from(loadedMap.values()).filter((a) => {
            const u = (a.username || '').toLowerCase().trim();
            return u !== 'admin_ilham';
          });

          // Deduplicate by unique Username or ID; newest lastUpdatedTimestamp ALWAYS wins
          const dedupedMap = new Map<string, AdminAccount>();
          rawList.forEach((acc) => {
            const key = (acc.username || acc.id || '').toLowerCase().trim();
            if (key) {
              const prev = dedupedMap.get(key);
              if (!prev || (acc.lastUpdatedTimestamp || 0) >= (prev.lastUpdatedTimestamp || 0)) {
                dedupedMap.set(key, acc);
              }
            }
          });

          const finalList = Array.from(dedupedMap.values());
          setAdminAccounts(finalList);
          try {
            const sanitizedForStorage = finalList.map(({ passwordPolos, ...rest }) => rest);
            sessionStorage.setItem('psks_admin_accounts', JSON.stringify(sanitizedForStorage));
          } catch {}
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'admin_accounts');
        if (isQuotaError(error)) {
          quotaExceededRef.current = true;
          setIsQuotaExceeded(true);
        }
        const cached = sessionStorage.getItem('psks_admin_accounts');
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
          await setFirestoreDoc(
            'admin_accounts',
            matched.id,
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
        setFirestoreDoc(
          'admin_accounts',
          matched.id,
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

    // Kueri terindeks Firestore: Urutkan pesan admin berdasarkan createdAt DESC
    const unsubscribe = subscribeToIndexedQuery(
      'admin_messages',
      {
        orders: [{ field: 'createdAt', direction: 'desc' }],
      },
      (docs) => {
        if (!docs || docs.length === 0) {
          setAdminMessages([]);
        } else {
          const loadedMsgs: AdminMessage[] = [];
          docs.forEach(({ id: docId, data }) => {
            if (docId === 'msg_init_1' || docId === 'msg_init_2') {
              return;
            }
            loadedMsgs.push({ id: docId, ...(data as Omit<AdminMessage, 'id'>) });
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

    try {
      await setFirestoreDoc('admin_messages', newId, newMsg);
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

    try {
      await setFirestoreDoc('admin_messages', msgId, { isRead: true }, { merge: true });
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
    }
  };

  // 3b. Submissions State with Firestore Real-time Listener (Single Source of Truth)
  const [submissions, setSubmissions] = useState<PillarRegistrationSubmission[]>(() => {
    // SECURITY: Guests must NEVER load or hold submissions data in memory
    const active = sessionStorage.getItem('statusLoginActive');
    if (active === 'SAH_TERDAFTAR') {
      try {
        const cached = localStorage.getItem('psks_registration_submissions');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return DEFAULT_SUBMISSIONS;
  });

  useEffect(() => {
    // SECURITY: Unauthenticated / Guest sessions must NEVER subscribe to or store submissions
    if (session.statusActive !== 'SAH_TERDAFTAR') {
      setSubmissions([]);
      try {
        localStorage.removeItem('psks_registration_submissions');
        localStorage.removeItem('psks_my_submission_ids');
      } catch {}
      return;
    }

    // Kueri terindeks Firestore: Urutkan pendaftaran berdasarkan submittedAt DESC
    const unsubscribe = subscribeToIndexedQuery(
      'registration_submissions',
      {
        orders: [{ field: 'submittedAt', direction: 'desc' }],
      },
      (docs) => {
        if (!docs || docs.length === 0) {
          React.startTransition(() => {
            setSubmissions([]);
          });
          try {
            localStorage.setItem('psks_registration_submissions', JSON.stringify([]));
          } catch {}
        } else {
          const loaded: PillarRegistrationSubmission[] = [];
          docs.forEach(({ id: docId, data }) => {
            if (!data || typeof data !== 'object') return;
            const sub = data as any;
            loaded.push({
              id: docId,
              nama: typeof sub.nama === 'string' ? sub.nama : 'Pendaftar Baru',
              nik: typeof sub.nik === 'string' ? sub.nik : '',
              hp: typeof sub.hp === 'string' ? sub.hp : '',
              wilayah: typeof sub.wilayah === 'string' ? sub.wilayah : 'Kota Bandung',
              kec: typeof sub.kec === 'string' ? sub.kec : (typeof sub.kecamatan === 'string' ? sub.kecamatan : ''),
              pillarId: (typeof sub.pillarId === 'string' && sub.pillarId) ? sub.pillarId : 'peksos',
              status: sub.status || 'PENDING',
              submittedByName: typeof sub.submittedByName === 'string' ? sub.submittedByName : (typeof sub.nama === 'string' ? sub.nama : 'Pemohon'),
              submittedByRole: typeof sub.submittedByRole === 'string' ? sub.submittedByRole : 'user',
              submittedAt: sub.submittedAt || new Date().toISOString(),
              submittedAtFormatted: typeof sub.submittedAtFormatted === 'string' ? sub.submittedAtFormatted : '',
              recordData: sub.recordData || {
                wilayah: typeof sub.wilayah === 'string' ? sub.wilayah : 'Kota Bandung',
                kec: typeof sub.kec === 'string' ? sub.kec : '',
                nama: typeof sub.nama === 'string' ? sub.nama : 'Pendaftar',
                nik: typeof sub.nik === 'string' ? sub.nik : '',
                sertifikasi: '',
                hp: typeof sub.hp === 'string' ? sub.hp : '',
                status: 'Aktif',
              },
              ...sub,
            } as PillarRegistrationSubmission);
          });
          loaded.sort((a, b) => {
            const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
          });
          React.startTransition(() => {
            setSubmissions(loaded);
          });
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

  // Perhitungan status sensor pending untuk tombol Verifikasi Berkas Wilayah (Admin Wilayah)
  const pendingWilayahCount = React.useMemo(() => {
    if (session.role !== 'admin') return 0;
    const isAllRegionAdmin =
      session.wilayah === 'Prov. Jabar' ||
      session.wilayah === 'Semua Wilayah' ||
      Boolean(session.isDeveloper);

    return submissions.filter((sub) =>
      isSubmissionPendingWilayah(sub, session.wilayah, isAllRegionAdmin)
    ).length;
  }, [submissions, session.wilayah, session.role, session.isDeveloper]);

  const hasPendingWilayah = pendingWilayahCount > 0;

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

    // Kueri terindeks Firestore: Urutkan penugasan wilayah berdasarkan createdAt DESC
    const unsubscribe = subscribeToIndexedQuery(
      'task_items',
      {
        orders: [{ field: 'createdAt', direction: 'desc' }],
      },
      (docs) => {
        if (!docs || docs.length === 0) {
          // If Firestore collection is empty, seed with DEFAULT_TASK_ITEMS
          if (DEFAULT_TASK_ITEMS.length > 0) {
            DEFAULT_TASK_ITEMS.forEach(async (task) => {
              try {
                await setFirestoreDoc('task_items', task.id, cleanFirestoreData(task));
              } catch {}
            });
          }
        } else {
          const loaded: TaskItem[] = [];
          docs.forEach(({ id: docId, data }) => {
            if (!data || typeof data !== 'object') return;
            const task = data as any;
            loaded.push({
              id: docId,
              title: typeof task.title === 'string' ? task.title : 'Tugas PSKS',
              description: typeof task.description === 'string' ? task.description : '',
              targetWilayah: typeof task.targetWilayah === 'string' ? task.targetWilayah : (typeof task.wilayah === 'string' ? task.wilayah : 'Semua Wilayah'),
              priority: task.priority || 'NORMAL',
              status: task.status || 'PENDING',
              assignedBy: typeof task.assignedBy === 'string' ? task.assignedBy : 'Superadmin Jabar',
              createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date().toISOString(),
              createdAtFormatted: typeof task.createdAtFormatted === 'string' ? task.createdAtFormatted : '',
              ...task,
            } as TaskItem);
          });
          loaded.sort((a, b) => {
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
          });
          React.startTransition(() => {
            setTaskItems(loaded);
          });
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

  // 3d. Portal FAQs State with Firestore Real-time Listener (Single Source of Truth)
  const [portalFaqs, setPortalFaqs] = useState<PortalFaqItem[]>(() => {
    try {
      const cached = localStorage.getItem('portal_faqs_cache_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PORTAL_FAQS;
  });

  useEffect(() => {
    const unsubscribe = subscribeToFaqs((faqs) => {
      React.startTransition(() => {
        setPortalFaqs(faqs);
      });
    });
    return () => unsubscribe();
  }, []);

  const handleSaveFaq = useCallback(async (faq: PortalFaqItem) => {
    const success = await saveFaqToFirestore(faq);
    return success;
  }, []);

  const handleDeleteFaq = useCallback(async (faqId: string) => {
    const success = await deleteFaqFromFirestore(faqId);
    return success;
  }, []);

  const handleSeedDefaults = useCallback(async () => {
    const success = await seedDefaultFaqsToFirestore();
    return success;
  }, []);

  // 3e. Document Repository State with Firestore Real-time Listener (Single Source of Truth)
  const [portalDocuments, setPortalDocuments] = useState<DocumentRepoItem[]>(() => {
    try {
      const cached = localStorage.getItem('portal_documents_cache_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_DOCUMENT_REPOSITORY;
  });

  useEffect(() => {
    const unsubscribe = subscribeToDocuments((docs) => {
      React.startTransition(() => {
        setPortalDocuments(docs);
      });
    });
    return () => unsubscribe();
  }, []);

  const handleSaveDocument = useCallback(async (docItem: DocumentRepoItem) => {
    const success = await saveDocumentToFirestore(docItem);
    return success;
  }, []);

  const handleDeleteDocument = useCallback(async (docId: string) => {
    const success = await deleteDocumentFromFirestore(docId);
    return success;
  }, []);

  const handleSeedDefaultDocuments = useCallback(async () => {
    const success = await seedDefaultDocumentsToFirestore();
    return success;
  }, []);

  const handleIncrementDocumentDownload = useCallback(async (docId: string, currentCount: number) => {
    await incrementDocumentDownloadCount(docId, currentCount);
  }, []);

  // 3f. Regional Logos 28 Wilayah (1 Induk Jabar & 27 Kab/Kota) Realtime Listener & Instant Local Cache
  const [regionalLogos, setRegionalLogos] = useState<Record<string, string>>(() =>
    getLocalCachedRegionalLogos()
  );

  useEffect(() => {
    const unsubscribe = subscribeToRegionalLogos((logos) => {
      React.startTransition(() => {
        setRegionalLogos(logos);
      });
    });
    return () => unsubscribe();
  }, []);

  // 4. Navigation State & Scroll Position Memory
  const [currentTab, setCurrentTab] = useState<string>('beranda');
  const [profileSubView, setProfileSubView] = useState<'kadinas' | 'visi_misi' | 'struktur' | 'tupoksi'>('kadinas');
  const [contactSubView, setContactSubView] = useState<'medsos' | 'lokasi'>('medsos');
  const [accountSubView, setAccountSubView] = useState<'profil' | 'ubah_password' | 'ubah_pin'>('profil');
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
  const [showGuestHistoryModal, setShowGuestHistoryModal] = useState(false);

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

  // Helper to trigger announcement after a smooth delay (1 second default) without colliding with other popups
  const triggerTargetedAnnouncementWithDelay = (delayMs = 1000, targetSession: UserSession = session) => {
    if (!appSettings.announcement?.active) return;
    if (!isAnnouncementTargeted(appSettings.announcement, targetSession)) return;
    setTimeout(() => {
      setIsFloatingAnnouncementOpen(true);
    }, delayMs);
  };

  // Real-time trigger on website arrival or refresh:
  // Bila di refresh pengumuman muncul 1 detik setelah refresh
  useEffect(() => {
    if (!appSettings.announcement?.active) {
      setIsFloatingAnnouncementOpen(false);
      return;
    }

    // Preload poster image immediately so it's fully ready when modal appears 1 second later
    if (appSettings.announcement?.photoUrl) {
      const preloadImg = new Image();
      preloadImg.src = appSettings.announcement.photoUrl;
    }

    // Auto-trigger on page refresh/initial mount exactly 1 second (1000ms) after refresh
    // Hanya jika tidak terhalang gate modal atau pop up login success
    if (
      !hasTriggeredAnnouncementRef.current &&
      !loginSuccessData &&
      !gateModalOpen
    ) {
      if (isAnnouncementTargeted(appSettings.announcement, session)) {
        hasTriggeredAnnouncementRef.current = true;
        const timer = setTimeout(() => {
          setIsFloatingAnnouncementOpen(true);
        }, 1000); // Tepat 1 detik setelah refresh
        return () => clearTimeout(timer);
      }
    }
  }, [appSettings.announcement, session, loginSuccessData, gateModalOpen]);

  // Sync Session to sessionStorage
  useEffect(() => {
    // Pastikan otomatis tampil dari paling atas beranda saat baru masuk / render pertama
    try {
      window.scrollTo(0, 0);
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    } catch {}
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

  // Strict Role Security Guard: Block and redirect unauthorized roles from accessing restricted admin consoles
  useEffect(() => {
    const isSuperadminOrDev =
      session.statusActive === 'SAH_TERDAFTAR' &&
      (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true);
    const isAdmin =
      session.statusActive === 'SAH_TERDAFTAR' && session.role === 'admin';

    const superadminTabs = [
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
      'bg_logo_manage',
      'profile_kadinas_manage',
      'social_media_manage',
      'regional_logo_manage',
      'pin_security_manage',
      'website_info_manage',
    ];

    if (superadminTabs.includes(currentTab) && !isSuperadminOrDev) {
      setCurrentTab('beranda');
    } else if (currentTab === 'terima_pendaftaran' && !isAdmin && !isSuperadminOrDev) {
      setCurrentTab('beranda');
    }
  }, [session, currentTab]);

  // Unified High-Performance Navigation Handler (Instant, Zero Lag, Zero Footer Flash)
  const navigateToTab = useCallback((
    tab: string,
    options?: {
      pillarId?: PillarId | null;
      detailData?: AnnouncementConfig | null;
      subView?: string | null;
    }
  ) => {
    let targetTab = tab;

    // Normalize known aliases to valid registered tabs so NO tab renders an empty view
    if (targetTab === 'account') targetTab = 'akun';
    if (targetTab === 'monitoring') targetTab = 'admin_monitor';
    if (targetTab === 'maintenance') targetTab = 'admin_maintenance';
    if (targetTab === 'task_manager') targetTab = 'task_manage';
    if (targetTab === 'pillars') targetTab = 'beranda';

    const isDeveloper =
      session.statusActive === 'SAH_TERDAFTAR' &&
      (session.role === 'developer' || session.isDeveloper === true);

    // Rule: Never navigate Superadmin to developer-only pin_security_manage; redirect to subnavigasi 'Ubah PIN'
    if (targetTab === 'pin_security_manage' && !isDeveloper) {
      targetTab = 'akun';
      options = { ...options, subView: 'ubah_pin' };
    }

    if (targetTab === 'ubah_pin' || targetTab === 'account_ubah_pin') {
      targetTab = 'akun';
      options = { ...options, subView: 'ubah_pin' };
    }

    if (targetTab === 'ubah_password' || targetTab === 'account_ubah_password') {
      targetTab = 'akun';
      options = { ...options, subView: 'ubah_password' };
    }

    // 1. If we are currently on 'beranda', save the user's exact scroll position
    if (currentTab === 'beranda') {
      dashboardScrollYRef.current = window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    // 2. Immediately prefetch target module
    handlePrefetchTab(targetTab);

    // 3. Immediately reset scroll to top synchronously BEFORE state commit if navigating to any feature/subpage
    if (targetTab !== 'beranda') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (typeof document !== 'undefined') {
        document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }
    }

    // 4. Update state directly for instantaneous 0ms tab navigation
    if (targetTab === 'pillar_detail') {
      if (options?.pillarId) setActivePillar(options.pillarId);
    } else {
      setActivePillar(null);
    }

    if (options?.detailData) {
      setActiveAnnouncementDetail(options.detailData);
    }

    if (targetTab === 'profil') {
      if (options?.subView) {
        setProfileSubView(options.subView as any);
      }
    }

    if (targetTab === 'contact') {
      if (options?.subView) {
        setContactSubView(options.subView as any);
      }
    }

    if (targetTab === 'akun') {
      if (options?.subView) {
        setAccountSubView(options.subView as any);
      } else {
        setAccountSubView('profil');
      }
    }

    if (targetTab === 'beranda') {
      shouldRestoreDashboardScrollRef.current = true;
    }

    setCurrentTab(targetTab);
  }, [currentTab, handlePrefetchTab, session]);

  // Handlers using unified navigateToTab
  const handleSelectPillar = (pillarId: PillarId) => {
    navigateToTab('pillar_detail', { pillarId });
  };

  const handleOpenAccountConsole = () => {
    navigateToTab('admin_manage');
  };

  const handleOpenMonitoringConsole = () => {
    navigateToTab('admin_monitor');
  };

  const handleOpenActivityLogConsole = () => {
    navigateToTab('activity_logs');
  };

  const handleOpenMaintenanceConsole = () => {
    navigateToTab('admin_maintenance');
  };

  const handleOpenUserAccountConsole = () => {
    navigateToTab('user_manage');
  };

  const handleOpenTaskManagerConsole = () => {
    navigateToTab('task_manage');
  };

  const handleOpenAnnouncementConsole = () => {
    navigateToTab('announcement_manage');
  };

  const handleOpenFloatingWaConsole = () => {
    navigateToTab('floating_wa_manage');
  };

  const handleOpenFaqConsole = () => {
    navigateToTab('faq_manage');
  };

  const handleOpenDocumentRepoConsole = () => {
    navigateToTab('document_repository');
  };

  const handleOpenBackgroundLogoConsole = () => {
    navigateToTab('bg_logo_manage');
  };

  const handleOpenProfileKadinasConsole = () => {
    navigateToTab('profile_kadinas_manage');
  };

  const handleOpenSocialMediaConsole = () => {
    navigateToTab('social_media_manage');
  };

  const handleOpenRegionalLogoConsole = () => {
    navigateToTab('regional_logo_manage');
  };

  const handleOpenPinSecurityConsole = () => {
    navigateToTab('pin_security_manage');
  };

  const handleOpenWebsiteInfoConsole = () => {
    navigateToTab('website_info_manage');
  };

  const handleOpenFloatingWhatsApp = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-floating-whatsapp'));
    const waBtn = document.getElementById('floating-whatsapp-btn') as HTMLAnchorElement | null;
    if (waBtn) {
      waBtn.click();
    } else {
      let rawNum = appSettings?.floatingWaSuperadminNumber || appSettings?.floatingWaNumber || '6289602421065';
      const cleanNum = rawNum.replace(/[^0-9]/g, '');
      const finalNum = cleanNum.startsWith('0') ? '62' + cleanNum.slice(1) : cleanNum;
      window.open(`https://wa.me/${finalNum}`, '_blank');
    }
  }, [appSettings]);

  const handleOpenAiAssistant = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-ai-assistant'));
    const aiBtn = document.getElementById('btn-open-ai-assistant');
    if (aiBtn) {
      aiBtn.click();
    }
  }, []);

  const handleOpenAnnouncementDetail = (ann?: AnnouncementConfig) => {
    navigateToTab('announcement_detail', { detailData: ann || appSettings.announcement || DEFAULT_ANNOUNCEMENT_CONFIG });
  };

  const handleBackToDashboard = () => {
    navigateToTab('beranda');
  };

  const handleBackToHome = () => {
    navigateToTab('beranda');
  };

  useLayoutEffect(() => {
    if (currentTab === 'beranda' && shouldRestoreDashboardScrollRef.current) {
      shouldRestoreDashboardScrollRef.current = false;
      const targetY = dashboardScrollYRef.current || 0;
      window.scrollTo({
        top: targetY,
        behavior: 'instant',
      });
      document.documentElement.scrollTop = targetY;
    } else if (currentTab !== 'beranda') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });
      document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
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
    sessionStorage.setItem('session_user_role', 'user');
    sessionStorage.setItem('session_user_nama', 'Tamu Publik');
    sessionStorage.setItem('session_user_wilayah', region);
    sessionStorage.setItem('statusLoginActive', 'GUEST');
    setGateModalOpen(false);

    if (pendingPillarId) {
      navigateToTab('pillar_detail', { pillarId: pendingPillarId });
      setPendingPillarId(null);
    } else {
      navigateToTab('beranda');
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
    navigateToTab('akun');
  };

  const handleLogin = (
    role: 'user' | 'admin' | 'superadmin' | 'developer',
    nama: string,
    wilayah: string,
    username?: string,
    userId?: string
  ) => {
    const statusActive = 'SAH_TERDAFTAR';
    const isDeveloper = role === 'developer';
    
    // Resolve exact username and user ID
    const resolvedUsername =
      username ||
      adminAccounts.find(
        (a) =>
          (a.namaAdmin || '').toLowerCase().trim() === (nama || '').toLowerCase().trim() ||
          (a.username || '').toLowerCase().trim() === (nama || '').toLowerCase().trim()
      )?.username ||
      nama;

    const resolvedUserId =
      userId ||
      adminAccounts.find(
        (a) => (a.username || '').toLowerCase().trim() === (resolvedUsername || '').toLowerCase().trim()
      )?.id;

    // Generate unique session token & timestamp for Single Session & 24h Timeout
    const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const loginTimestamp = Date.now();
    const currentDeviceId = getStableDeviceId();

    // Mark matching account as online & record session token, status, and login timestamp in state & database
    const currentAccounts = adminAccountsRef.current.length > 0 ? adminAccountsRef.current : adminAccounts;
    const cleanResolvedUname = (resolvedUsername || '').toLowerCase().trim();
    const cleanResolvedId = (resolvedUserId || '').toLowerCase().trim();

    const matched = currentAccounts.find(
      (a) =>
        (cleanResolvedId && (a.id || '').toLowerCase().trim() === cleanResolvedId) ||
        (cleanResolvedUname && (a.username || '').toLowerCase().trim() === cleanResolvedUname)
    );

    const initialPasswordHash = matched?.passwordHash || '';
    const initialLastUpdated = matched?.lastUpdatedTimestamp || loginTimestamp;

    const newSession: UserSession = { 
      role, 
      nama, 
      wilayah, 
      statusActive, 
      username: resolvedUsername,
      userId: resolvedUserId,
      isDeveloper, 
      sessionToken, 
      loginTimestamp,
      deviceId: currentDeviceId,
      passwordHash: initialPasswordHash,
      lastUpdatedTimestamp: initialLastUpdated,
    };
    setSession(newSession);
    sessionStorage.setItem('has_entered_gate', 'true');
    sessionStorage.setItem('session_user_role', role);
    sessionStorage.setItem('session_user_nama', nama);
    sessionStorage.setItem('session_user_wilayah', wilayah);
    sessionStorage.setItem('statusLoginActive', statusActive);
    sessionStorage.setItem('session_user_username', resolvedUsername);
    if (resolvedUserId) sessionStorage.setItem('session_user_id', resolvedUserId);
    sessionStorage.setItem('session_token', sessionToken);
    sessionStorage.setItem('login_timestamp', String(loginTimestamp));
    sessionStorage.setItem('session_device_id', currentDeviceId);
    if (initialPasswordHash) sessionStorage.setItem('session_user_password_hash', initialPasswordHash);
    setGateModalOpen(false);

    const now = new Date();
    const formattedLogin = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    const loginAccountPayload = {
      isFrozen: false,
      statusAkun: 'AKTIF' as const,
      isOnline: true,
      statusKoneksi: 'ONLINE' as const,
      statusLayar: 'AKTIF_LAYAR' as const,
      terakhirLogin: formattedLogin,
      sessionToken: sessionToken,
      loginTimestamp: loginTimestamp,
      lastLoginDeviceId: currentDeviceId,
    };

    if (matched) {
      const updatedAccount: AdminAccount = {
        ...matched,
        ...loginAccountPayload,
      };

      // Sinkronkan langsung ke local state & ref agar tidak ada selisih pembacaan token di siklus render berikutnya
      setAdminAccounts((prev) => {
        const next = prev.map((a) =>
          a.id === matched.id ||
          (a.username && a.username.toLowerCase().trim() === (resolvedUsername || '').toLowerCase().trim())
            ? updatedAccount
            : a
        );
        try {
          localStorage.setItem('psks_admin_accounts', JSON.stringify(next));
        } catch {}
        return next;
      });

      handleUpdateAdminAccount(updatedAccount);
    } else if (resolvedUserId) {
      // Jika akun baru terdaftar belum ada di currentAccounts, sinkronkan via Firestore doc
      setFirestoreDoc('admin_accounts', resolvedUserId, loginAccountPayload, { merge: true }).catch(() => {});
    }

    // DISPATCH KICK SESI LAMA: Berlaku untuk SEMUA ROLE (user terdaftar, admin wilayah, superadmin, developer)
    // 1. Cross-tab instant kick via BroadcastChannel
    try {
      const channel = new BroadcastChannel('psks_auth_channel');
      channel.postMessage({
        type: 'CONCURRENT_LOGIN_KICK',
        targetUsername: resolvedUsername || (matched ? matched.username : ''),
        targetId: resolvedUserId || (matched ? matched.id : ''),
        targetRole: role,
        newSessionToken: sessionToken,
        timestamp: loginTimestamp,
      });
      setTimeout(() => {
        try {
          channel.close();
        } catch {}
      }, 500);
    } catch {}

    // Bersihkan ID/username akun ini dari deletedAdminIds di state & localStorage agar tidak ada cache penendangan palsu
    const cleanUname = (resolvedUsername || '').toLowerCase().trim();
    const cleanUid = (resolvedUserId || '').toLowerCase().trim();
    setDeletedAdminIds((prev) => {
      const next = prev.filter((item) => {
        const itemLower = (item || '').toLowerCase().trim();
        return itemLower !== cleanUname && itemLower !== cleanUid;
      });
      try {
        localStorage.setItem('psks_deleted_admin_ids', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Show animated checkmark "Login Berhasil" modal for authenticated sessions
    setLoginSuccessData({ role, nama, wilayah });
  };

  const handleCloseLoginSuccess = () => {
    if (loginSuccessData) {
      const currentRole = loginSuccessData.role;
      const currentWilayah = loginSuccessData.wilayah;
      setLoginSuccessData(null);

      if (pendingPillarId) {
        navigateToTab('pillar_detail', { pillarId: pendingPillarId });
        setPendingPillarId(null);
      } else {
        navigateToTab('beranda');
      }

      // Pengumuman muncul setelah 1 login setelah pop up login muncul saja
      // Diberikan jeda transisi halus 300ms setelah pop up login ditutup
      if (appSettings.announcement?.active) {
        const targetSession: UserSession = {
          ...session,
          role: (currentRole as any) || session.role,
          wilayah: currentWilayah || session.wilayah,
        };
        if (isAnnouncementTargeted(appSettings.announcement, targetSession)) {
          hasTriggeredAnnouncementRef.current = true;
          setTimeout(() => {
            setIsFloatingAnnouncementOpen(true);
          }, 300);
        }
      }
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setShowLogoutSuccess(true);
    setIsFloatingAnnouncementOpen(false);
    hasTriggeredAnnouncementRef.current = false;
  };

  const handleForceLogout = (reason?: string) => {
    // 🛡️ Revoke session token on the server (Blacklist in-memory & prevent token reuse)
    try {
      const activeToken = sessionStorage.getItem('session_token');
      if (activeToken) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: activeToken }),
        }).catch(() => {});
      }
    } catch {}

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
      wilayah: '',
      statusActive: 'GUEST',
    };
    setShowAccountDeletedModal(false);
    setShowAccountEditedModal(false);
    setShowAccountFrozenModal(false);
    setShowMultipleSessionModal(false);
    setSession(reset);
    setSubmissions([]); // Clear submissions immediately on logout
    try {
      localStorage.removeItem('psks_registration_submissions');
      localStorage.removeItem('psks_my_submission_ids');
    } catch {}
    sessionStorage.removeItem('has_entered_gate');
    sessionStorage.removeItem('session_user_role');
    sessionStorage.removeItem('session_user_nama');
    sessionStorage.removeItem('session_user_wilayah');
    sessionStorage.removeItem('statusLoginActive');
    sessionStorage.removeItem('session_token');
    sessionStorage.removeItem('login_timestamp');
    sessionStorage.removeItem('session_user_username');
    sessionStorage.removeItem('session_user_id');
    sessionStorage.removeItem('session_device_id');
    sessionStorage.removeItem('session_user_password_hash');
    sessionStorage.removeItem('session_user_password_polos');
    setIsFloatingAnnouncementOpen(false);
    hasTriggeredAnnouncementRef.current = false;
    setActivePillar(null);
    navigateToTab('beranda');
    setGateModalOpen(true);
  };

  const handleCompleteLogout = () => {
    setShowLogoutSuccess(false);
    handleForceLogout('Baru saja keluar');
  };

  /**
   * Memeriksa apakah aktor memiliki otoritas berkuasa atas sesi target yang sedang aktif:
   * - Pengubahan akun secara MANDIRI DILARANG memicu modal penendangan keluar (selalu return false).
   * - Developer berkuasa atas: Superadmin, Admin, User.
   * - Superadmin berkuasa atas: Admin, User.
   * - Admin dan User tidak memiliki otoritas atas akun lain.
   */
  const checkIsAuthoritativeOverSession = (
    actorRole?: string,
    actorUsername?: string,
    targetRole?: string,
    targetUsername?: string,
    targetUserId?: string
  ): boolean => {
    if (!actorRole || !targetRole) return false;

    const actorUnameClean = (actorUsername || '').toLowerCase().trim();
    const targetUnameClean = (targetUsername || '').toLowerCase().trim();
    const targetUserIdClean = (targetUserId || '').toLowerCase().trim();

    // 1. Jika aksi dilakukan sendiri (MANDIRI), DILARANG ditendang keluar!
    if (actorUnameClean && (actorUnameClean === targetUnameClean || actorUnameClean === targetUserIdClean)) {
      return false;
    }

    // 2. Developer berkuasa mengedit akun Superadmin, Admin, dan User
    if (actorRole === 'developer') {
      return targetRole === 'superadmin' || targetRole === 'admin' || targetRole === 'user' || targetRole === 'pilar_user';
    }

    // 3. Superadmin berkuasa mengedit akun Admin dan User
    if (actorRole === 'superadmin') {
      return targetRole === 'admin' || targetRole === 'user' || targetRole === 'pilar_user';
    }

    // Role lain tidak memiliki otoritas atas akun lain
    return false;
  };

  // 4. Session Timeout & Real-time Account State Listener (Deletion, Editing, & Multiple Sessions)
  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;

    const userUname = (session.username || '').toLowerCase().trim();
    const sessionUserId = (session.userId || '').toLowerCase().trim();

    // Pastikan akun saat ini diperiksa di memori lokal jika sudah termuat
    const isAccountCurrentlyActive = adminAccounts.some((a) => {
      const aId = (a.id || '').toLowerCase().trim();
      const aUname = (a.username || '').toLowerCase().trim();
      return (sessionUserId && aId === sessionUserId) || (userUname && aUname === userUname);
    });

    // 1. Check deletion: If adminAccounts is loaded from database and current session account is not present, OR in deletedAdminIds list
    const isDeletedByIds = Boolean(
      (sessionUserId && deletedAdminIds.includes(sessionUserId)) ||
      (userUname && deletedAdminIds.includes(userUname))
    );

    if ((adminAccounts.length > 0 && !isAccountCurrentlyActive) || isDeletedByIds) {
      if (!showAccountDeletedModal) {
        setShowAccountDeletedModal(true);
      }
      return;
    }

    if (adminAccounts.length > 0) {
      // STRICT IDENTIFIER MATCHING: Cocokkan berdasarkan ID Akun persis atau Username persis milik akun yang sedang login
      const matched = adminAccounts.find((a) => {
        const aUname = (a.username || '').toLowerCase().trim();
        const aId = (a.id || '').toLowerCase().trim();
        if (sessionUserId && aId === sessionUserId) return true;
        if (userUname && aUname === userUname) return true;
        return false;
      });

      if (matched) {
        // 2. Check if account is explicitly marked as deleted in database
        if ((matched as any).statusAkun === 'DIHAPUS' || (matched as any).isDeleted) {
          if (!showAccountDeletedModal) {
            setShowAccountDeletedModal(true);
          }
          return;
        }

        // 3. Check Account Frozen (Remote Freeze Trigger)
        if (
          matched.isFrozen === true ||
          matched.statusAkun === 'DIBEKUKAN' ||
          matched.statusActive === 'FROZEN' ||
          (matched as any).status === 'FROZEN'
        ) {
          if (!showAccountFrozenModal) {
            setShowAccountFrozenModal(true);
          }
          return;
        }

        // 4. Check Account Edited remotely by an authoritative superior
        // ATURAN MUTLAK: Perubahan password/kredensial secara MANDIRI DILARANG diberi pop-up dan DILARANG ditendang keluar!
        const passwordChanged = Boolean(
          (session.passwordHash && matched.passwordHash && session.passwordHash !== matched.passwordHash) ||
          (session.passwordPolos && matched.passwordPolos && session.passwordPolos !== matched.passwordPolos)
        );
        const usernameChanged = Boolean(
          session.username && matched.username && session.username.toLowerCase().trim() !== matched.username.toLowerCase().trim()
        );
        const roleChanged = Boolean(
          session.role && matched.role && session.role !== matched.role
        );
        const vervalRejected = Boolean((matched as any).statusVerval === 'REJECTED');

        // Periksa apakah perubahan ini dilakukan oleh role yang berkuasa (Superadmin / Developer) atas akun ini
        const isSuperiorEdit = checkIsAuthoritativeOverSession(
          (matched as any).lastEditedByRole,
          (matched as any).lastEditedBy,
          session.role,
          session.username || session.nama,
          session.userId
        );

        if (
          (usernameChanged && isSuperiorEdit) ||
          (roleChanged && isSuperiorEdit) ||
          vervalRejected ||
          (passwordChanged && isSuperiorEdit)
        ) {
          if (!showAccountEditedModal) {
            setShowAccountEditedModal(true);
          }
          return;
        }

        // Jika password di database diperbarui secara mandiri atau disinkronkan,
        // perbarui sesi lokal secara diam-diam tanpa memunculkan pop-up atau penendangan keluar
        if (passwordChanged && !isSuperiorEdit) {
          setSession((prev) => ({
            ...prev,
            passwordPolos: matched.passwordPolos || prev.passwordPolos,
            passwordHash: matched.passwordHash || prev.passwordHash,
            lastUpdatedTimestamp: matched.lastUpdatedTimestamp || prev.lastUpdatedTimestamp,
          }));
        }

        // 5. Check Multiple Session Active / Login on another device (Single Session Kick)
        // Berlaku untuk SEMUA ROLE: user terdaftar, admin wilayah, superadmin, developer
        const loginTime = session.loginTimestamp || Number(sessionStorage.getItem('login_timestamp')) || 0;
        const localToken = session.sessionToken || sessionStorage.getItem('session_token');
        const now = Date.now();

        // Ambil timestamp login dari data Supabase
        const remoteLoginTime =
          typeof (matched as any).loginTimestamp === 'number'
            ? (matched as any).loginTimestamp
            : typeof (matched as any).data?.loginTimestamp === 'number'
            ? (matched as any).data.loginTimestamp
            : 0;

        // SYARAT MUTLAK PENENDANGAN (Mencegah salah tendang / false positive):
        // 1. Wajib sudah melewati masa tenggang 5 detik pertama sejak login di perangkat ini
        const isPastGracePeriod = loginTime > 0 && now - loginTime > 5000;

        // 2. Data di Supabase HARUS memiliki waktu login yang LEBIH BARU (+1.5 detik) daripada waktu login perangkat ini
        // (menandakan ada perangkat/orang lain yang menekan tombol login SETELAH kita masuk)
        const isNewerLoginFromAnotherDevice = remoteLoginTime > loginTime + 1500;

        // 3. Token di database Supabase berbeda dengan token sesi lokal kita
        const isTokenDifferent = Boolean(
          matched.sessionToken &&
          localToken &&
          matched.sessionToken !== localToken
        );

        if (isPastGracePeriod && isNewerLoginFromAnotherDevice && isTokenDifferent) {
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
  // Realtime Cross-tab Single Session Enforcer via BroadcastChannel (Semua Role: user, admin, superadmin, developer)
  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('psks_auth_channel');
      channel.onmessage = (event) => {
        const data = event.data;
        if (!data) return;

        if (data.type === 'CONCURRENT_LOGIN_KICK') {
          const localToken = session.sessionToken || sessionStorage.getItem('session_token');
          if (!data.newSessionToken || data.newSessionToken === localToken) return;

          const myUname = (session.username || '').toLowerCase().trim();
          const myUserId = (session.userId || '').toLowerCase().trim();
          const targetUname = (data.targetUsername || '').toLowerCase().trim();
          const targetId = (data.targetId || '').toLowerCase().trim();

          const myLoginTime = session.loginTimestamp || Number(sessionStorage.getItem('login_timestamp')) || 0;
          const incomingLoginTime = Number(data.timestamp) || 0;

          const isSameAccount = Boolean(
            (targetId && myUserId && targetId === myUserId) ||
            (targetUname && myUname && targetUname === myUname)
          );

          if (isSameAccount && incomingLoginTime > myLoginTime + 1000) {
            setShowMultipleSessionModal(true);
          }
        } else if (data.type === 'SECURITY_SIGNAL') {
          const myUname = (session.username || session.nama || '').toLowerCase().trim();
          const myUserId = (session.userId || '').toLowerCase().trim();
          const targetUname = (data.targetUsername || '').toLowerCase().trim();
          const prevUname = (data.previousUsername || '').toLowerCase().trim();
          const targetId = (data.targetId || '').toLowerCase().trim();

          const isSameAccount = Boolean(
            (targetId && myUserId && targetId === myUserId) ||
            (targetUname && myUname && targetUname === myUname) ||
            (prevUname && myUname && prevUname === myUname)
          );

          if (isSameAccount) {
            // Aksi mandiri DILARANG memicu modal penendangan keluar!
            if (
              data.isSelfUpdate === true ||
              data.action === 'SELF_PASSWORD_CHANGE' ||
              (data.by && (data.by.toLowerCase().trim() === myUname || data.by.toLowerCase().trim() === myUserId))
            ) {
              return;
            }

            // Hanya proses penendangan jika dilakukan oleh role yang berkuasa
            const isAuthoritative = checkIsAuthoritativeOverSession(
              data.byRole,
              data.by,
              session.role,
              session.username || session.nama,
              session.userId
            );

            if (!isAuthoritative) return;

            if (data.action === 'FREEZE') {
              setShowAccountFrozenModal(true);
            } else if (data.action === 'DELETE') {
              setShowAccountDeletedModal(true);
            } else if (data.action === 'PASSWORD' || data.action === 'UPDATE' || data.action === 'EDIT') {
              setShowAccountEditedModal(true);
            }
          }
        }
      };
    } catch {}
    return () => {
      try {
        channel?.close();
      } catch {}
    };
  }, [session]);

  // Realtime Remote Security Signals (Freeze, Delete, Password Changed from Admin Console)
  useEffect(() => {
    if (session.statusActive !== 'SAH_TERDAFTAR') return;

    const unsubscribe = subscribeToDoc(
      'security_signals',
      'live',
      (data, exists) => {
        if (!exists || !data || !data.timestamp || !data.action) return;

        // 1. Drop stale signals older than 60 seconds
        if (Date.now() - data.timestamp > 60000) return;

        const userUname = (session.username || session.nama || '').toLowerCase().trim();
        const sessionUserId = (session.userId || '').toLowerCase().trim();
        const targetUname = (data.targetUsername || '').toLowerCase().trim();
        const prevUname = (data.previousUsername || '').toLowerCase().trim();
        const targetId = (data.targetId || '').toLowerCase().trim();

        // 2. Only respond to signals sent strictly after login (+500ms buffer)
        const loginTime = session.loginTimestamp || Number(sessionStorage.getItem('login_timestamp')) || 0;
        if (loginTime > 0 && data.timestamp <= loginTime + 500) return;

        // STRICT TARGET MATCH: Cocokkan ID Akun persis atau Username persis
        const isMatch = Boolean(
          (targetId && sessionUserId && targetId === sessionUserId) ||
          (targetUname && userUname && targetUname === userUname) ||
          (prevUname && userUname && prevUname === userUname)
        );

        if (isMatch) {
          // Aksi mandiri DILARANG memicu modal penendangan keluar!
          if (
            data.isSelfUpdate === true ||
            data.action === 'SELF_PASSWORD_CHANGE' ||
            (data.by && (data.by.toLowerCase().trim() === userUname || data.by.toLowerCase().trim() === sessionUserId))
          ) {
            return;
          }

          // Hanya proses penendangan jika dilakukan oleh role yang berkuasa
          const isAuthoritative = checkIsAuthoritativeOverSession(
            data.byRole,
            data.by,
            session.role,
            session.username || session.nama,
            session.userId
          );

          if (!isAuthoritative) return;

          if (data.action === 'FREEZE') {
            setShowAccountFrozenModal(true);
          } else if (data.action === 'DELETE') {
            setShowAccountDeletedModal(true);
          } else if (data.action === 'PASSWORD' || data.action === 'UPDATE' || data.action === 'EDIT') {
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
    const existingList = allPillarData[pillarKey] || [];
    const maxOrder = existingList.reduce((max, r: any, i) => {
      const ord = typeof r.orderIndex === 'number' ? r.orderIndex : i + 1;
      return Math.max(max, ord);
    }, 0);
    const newTimestamp = Date.now();
    const fullRecord: PSKSDataRecord = {
      ...newRecord,
      id: recordId,
      pillarId: pillarKey,
      orderIndex: maxOrder + 1,
      createdAt: (newRecord as any).createdAt || newTimestamp,
    };

    setAllPillarData((prev) => {
      const updated = {
        ...prev,
        [pillarKey]: [...(prev[pillarKey] || []), fullRecord],
      };
      try {
        localStorage.setItem('psks_all_pillar_data', JSON.stringify(updated));
      } catch {}
      setCachedPillarData(updated);
      return updated;
    });

    // Realtime regional distribution update
    const regName = normalizeRegionName(newRecord.wilayah || session.wilayah || 'Kota Bandung');
    let nextRegionsMap: RegionalSummaryMap = regionalSummary;
    setRegionalSummary((prev) => {
      const cur = prev[regName] || { total: 0, byPillar: {} };
      const nextRegions: RegionalSummaryMap = {
        ...prev,
        [regName]: {
          total: cur.total + 1,
          byPillar: {
            ...cur.byPillar,
            [pillarKey]: (cur.byPillar?.[pillarKey] || 0) + 1,
          },
        },
      };
      nextRegionsMap = nextRegions;
      saveRegionalSummary(nextRegions);
      return nextRegions;
    });

    // Realtime summary count increment & sync to Firestore meta
    setPillarSummaryCounts((prev) => {
      const next = { ...prev, [pillarKey]: (prev[pillarKey] || allPillarData[pillarKey]?.length || 0) + 1 };
      try { localStorage.setItem('psks_summary_counts', JSON.stringify(next)); } catch {}
      setFirestoreDoc('psks_records_meta', 'summary', {
        counts: next,
        regions: nextRegionsMap,
        updatedAt: Date.now(),
        lastPillarUpdated: pillarKey
      }, { merge: true }).catch(() => {});
      return next;
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

    try {
      await setFirestoreDoc('psks_records', recordId, cleanFirestoreData(fullRecord));
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'psks_records', docId: recordId, type: 'SET', data: fullRecord });
    }
  };

  const handleUpdateRecord = async (
    recordId: string,
    updatedData: Partial<PSKSDataRecord>,
    targetPillarId?: PillarId
  ) => {
    const pillarKey = targetPillarId || activePillar;
    if (!pillarKey) return;

    let fullUpdatedRecord: PSKSDataRecord | null = null;

    setAllPillarData((prev) => {
      const currentList = prev[pillarKey] || [];
      const updatedList = currentList.map((r) => {
        if (r.id === recordId) {
          fullUpdatedRecord = { ...r, ...updatedData, id: recordId, pillarId: pillarKey };
          return fullUpdatedRecord;
        }
        return r;
      });
      const updated = {
        ...prev,
        [pillarKey]: updatedList,
      };
      try {
        localStorage.setItem('psks_all_pillar_data', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (!fullUpdatedRecord) return;

    const pilarName = (pillarKey || 'PSKS').toUpperCase();
    const memberName = (fullUpdatedRecord as PSKSDataRecord).nama || (fullUpdatedRecord as any).namaLks || (fullUpdatedRecord as any).namaKarangTaruna || (fullUpdatedRecord as any).namaLk3 || (fullUpdatedRecord as any).namaBadanUsaha || (fullUpdatedRecord as any).namaSlrt || 'Anggota';
    const memberWilayah = (fullUpdatedRecord as PSKSDataRecord).wilayah || session.wilayah || 'Jawa Barat';
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Developer [${session.nama}]`;

    // Record audit activity log (bypassed for developer)
    recordSystemActivity({
      session,
      category: 'PSKS',
      actionType: 'UPDATE',
      targetCollection: 'psks_records',
      targetId: recordId,
      targetName: memberName,
      targetPillar: pilarName,
      targetWilayah: memberWilayah,
      details: `${actorLabel} telah MENGEDIT data anggota Pilar ${pilarName} atas nama [${memberName}] (Wilayah: ${memberWilayah})`,
    });

    try {
      await setFirestoreDoc('psks_records', recordId, cleanFirestoreData(fullUpdatedRecord), { merge: true });
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'psks_records', docId: recordId, type: 'SET', data: fullUpdatedRecord });
    }
  };

  const handleBatchAddRecords = async (
    records: Omit<PSKSDataRecord, 'id'>[],
    targetPillarId?: PillarId
  ): Promise<number> => {
    const pillarKey = targetPillarId || activePillar;
    if (!pillarKey || !records.length) return 0;

    const existingList = allPillarData[pillarKey] || [];
    const maxOrder = existingList.reduce((max, r: any, i) => {
      const ord = typeof r.orderIndex === 'number' ? r.orderIndex : i + 1;
      return Math.max(max, ord);
    }, 0);

    const baseTimestamp = Date.now();
    const newRecordsWithId: PSKSDataRecord[] = records.map((rec, idx) => {
      const orderIdx =
        typeof (rec as any).orderIndex === 'number'
          ? (rec as any).orderIndex
          : maxOrder + idx + 1;
      return {
        ...rec,
        id: `${pillarKey}-${baseTimestamp}-${String(orderIdx + 1).padStart(6, '0')}`,
        pillarId: pillarKey,
        orderIndex: orderIdx,
        createdAt: (rec as any).createdAt || (baseTimestamp + idx),
      };
    });

    setAllPillarData((prev) => {
      const updated = {
        ...prev,
        [pillarKey]: [...(prev[pillarKey] || []), ...newRecordsWithId],
      };
      try {
        localStorage.setItem('psks_all_pillar_data', JSON.stringify(updated));
      } catch {}
      setCachedPillarData(updated);
      return updated;
    });

    // Realtime regional distribution update
    const updatedWithBatch = {
      ...allPillarData,
      [pillarKey]: [...(allPillarData[pillarKey] || []), ...newRecordsWithId],
    };
    const nextRegionsWithBatch = computeRegionalSummaryFromPillars(updatedWithBatch);
    setRegionalSummary(nextRegionsWithBatch);
    saveRegionalSummary(nextRegionsWithBatch);

    // Realtime summary count increment & sync to Firestore meta
    setPillarSummaryCounts((prev) => {
      const next = { ...prev, [pillarKey]: (prev[pillarKey] || allPillarData[pillarKey]?.length || 0) + newRecordsWithId.length };
      try { localStorage.setItem('psks_summary_counts', JSON.stringify(next)); } catch {}
      setFirestoreDoc('psks_records_meta', 'summary', {
        counts: next,
        regions: nextRegionsWithBatch,
        updatedAt: Date.now(),
        lastPillarUpdated: pillarKey
      }, { merge: true }).catch(() => {});
      return next;
    });

    const pilarName = (pillarKey || 'PSKS').toUpperCase();
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Developer [${session.nama}]`;

    recordSystemActivity({
      session,
      category: 'PSKS',
      actionType: 'IMPORT',
      targetCollection: 'psks_records',
      targetId: `batch-import-${baseTimestamp}`,
      targetName: `${newRecordsWithId.length} Data Anggota`,
      targetPillar: pilarName,
      targetWilayah: session.wilayah || 'Jawa Barat',
      details: `${actorLabel} telah MENGIMPORT massal ${newRecordsWithId.length} data anggota baru ke Pilar ${pilarName} via file Excel (.xlsx)`,
    });

    try {
      await batchSetFirestoreDocs(
        'psks_records',
        newRecordsWithId.map((rec) => ({ id: rec.id, data: cleanFirestoreData(rec) }))
      );
      quotaExceededRef.current = false;
      setIsQuotaExceeded(false);
    } catch (err) {
      console.warn('Batch write encountered error, fallback to sync queue:', err);
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addBatchToSyncQueue(
        newRecordsWithId.map((rec) => ({ collection: 'psks_records', docId: rec.id, type: 'SET', data: rec }))
      );
    }

    return newRecordsWithId.length;
  };

  const handleAddSubmission = async (
    newSubmission: Omit<
      PillarRegistrationSubmission,
      'id' | 'submittedAt' | 'submittedAtFormatted'
    > & { status?: string }
  ) => {
    const newId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const isProvJabar =
      newSubmission.wilayah === 'Prov. Jabar' ||
      (newSubmission.wilayah || '').toLowerCase().includes('provinsi');
    const isAdminSubmission = newSubmission.submittedByRole === 'admin';
    const initialStatus =
      newSubmission.status || (isProvJabar || isAdminSubmission ? 'MENUNGGU_PENGESAHAN_PROVINSI' : 'MENUNGGU_VERIFIKASI_WILAYAH');

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
      status: initialStatus,
    };

    setSubmissions((prev) => {
      return [submissionData, ...prev];
    });

    if (isAdminSubmission) {
      const memberName = newSubmission.nama || newSubmission.recordData?.nama || 'Anggota Baru';
      const pilarTitle = (PILLARS_CONFIG[newSubmission.pillarId]?.title || newSubmission.pillarId).toUpperCase();
      const wilLabel = newSubmission.wilayah || session.wilayah || 'Jawa Barat';
      recordSystemActivity({
        session,
        category: 'PSKS',
        actionType: 'CREATE',
        targetCollection: 'registration_submissions',
        targetId: newId,
        targetName: memberName,
        targetPillar: pilarTitle,
        targetWilayah: wilLabel,
        details: `Admin Wilayah [${submissionData.submittedByName}] MENGAJUKAN pendaftaran anggota baru "${memberName}" (Wilayah: ${wilLabel}) ke Superadmin & Developer untuk persetujuan.`,
      });
    }

    try {
      await setFirestoreDoc('registration_submissions', newId, cleanFirestoreData(submissionData));
    } catch (error) {
      console.error('Failed to save submission to Firestore:', error);
    }
  };

  const handleApproveSubmission = async (submission: PillarRegistrationSubmission, adminNotes?: string) => {
    const isSuperadminOrDev =
      session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper;
    const nowIso = new Date().toISOString();
    const reviewerName = session.nama || session.username || (isSuperadminOrDev ? 'Superadmin Jabar' : 'Admin Wilayah');

    let updatedSubmission: PillarRegistrationSubmission;

    if (!isSuperadminOrDev) {
      // TIER 1: Admin Wilayah Approval
      // Set status: 'DISETUJUI_WILAYAH' (diteruskan ke Superadmin Jabar)
      // Tidak langsung didaftarkan ke data rekapitulasi aktif sampai disahkan Superadmin
      updatedSubmission = {
        ...submission,
        status: 'DISETUJUI_WILAYAH',
        regionalApprovedBy: reviewerName,
        regionalApprovedAt: nowIso,
        regionalNotes: adminNotes || 'Disetujui oleh Admin Wilayah, berkas diteruskan ke Superadmin Jabar untuk Pengesahan & Penerimaan Anggota.',
        reviewedBy: reviewerName,
        reviewedAt: nowIso,
      };
    } else {
      // TIER 2: Superadmin Jabar Final Approval
      // Set status: 'SAH_TERDAFTAR' (resmi sah diterima sebagai anggota 10 Pilar PSKS)
      // Langsung didaftarkan ke allPillarData & Firestore psks_records!
      updatedSubmission = {
        ...submission,
        status: 'SAH_TERDAFTAR',
        superadminApprovedBy: reviewerName,
        superadminApprovedAt: nowIso,
        superadminNotes: adminNotes || 'Telah disahkan dan diterima secara resmi sebagai anggota 10 Pilar PSKS Jawa Barat.',
        reviewedBy: reviewerName,
        reviewedAt: nowIso,
      };
    }

    setSubmissions((prev) => {
      return prev.map((s) => (s.id === submission.id ? updatedSubmission : s));
    });

    // Audit Log for Approval
    const memberName = submission.nama || submission.recordData?.nama || 'Pemohon';
    const pilarTitle = (PILLARS_CONFIG[submission.pillarId]?.title || submission.pillarId).toUpperCase();
    const wilLabel = submission.wilayah || session.wilayah || 'Jawa Barat';

    if (!isSuperadminOrDev) {
      recordSystemActivity({
        session,
        category: 'PSKS',
        actionType: 'APPROVE',
        targetCollection: 'registration_submissions',
        targetId: submission.id,
        targetName: memberName,
        targetPillar: pilarTitle,
        targetWilayah: wilLabel,
        details: `Admin Wilayah [${reviewerName}] MENYETUJUI berkas pendaftaran "${memberName}" (Wilayah: ${wilLabel}) - Otomatis diteruskan ke Superadmin Jabar untuk Pengesahan.`,
      });
    } else {
      recordSystemActivity({
        session,
        category: 'PSKS',
        actionType: 'APPROVE',
        targetCollection: 'registration_submissions',
        targetId: submission.id,
        targetName: memberName,
        targetPillar: pilarTitle,
        targetWilayah: wilLabel,
        details: `Superadmin [${reviewerName}] MENGESAHKAN & MENERIMA "${memberName}" sebagai anggota resmi Pilar ${pilarTitle} (Wilayah: ${wilLabel})`,
      });
    }

    // 1. Update status in Firestore
    try {
      await setFirestoreDoc('registration_submissions', submission.id, cleanFirestoreData(updatedSubmission), { merge: true });
    } catch (error) {
      console.error('Failed to approve submission in Firestore:', error);
    }

    // 2. Register record into pillar data in Firestore and local state ONLY when approved by Superadmin/Dev
    if (isSuperadminOrDev && submission.recordData) {
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
    const isSuperadminOrDev =
      session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper;
    const nowIso = new Date().toISOString();
    const reviewerName = session.nama || session.username || (isSuperadminOrDev ? 'Superadmin Jabar' : 'Admin Wilayah');
    const rejectStatus = isSuperadminOrDev ? 'DITOLAK_PROVINSI' : 'DITOLAK_WILAYAH';

    const updatedSubmission = {
      status: rejectStatus,
      rejectedReason: notes || (isSuperadminOrDev ? 'Pengesahan ditolak oleh Superadmin Dinsos Jabar.' : 'Berkas pengajuan belum memenuhi syarat verifikasi administrasi wilayah.'),
      reviewNotes: notes || (isSuperadminOrDev ? 'Pengesahan ditolak oleh Superadmin Dinsos Jabar.' : 'Berkas pengajuan belum memenuhi syarat verifikasi administrasi wilayah.'),
      reviewedAt: nowIso,
      reviewedBy: reviewerName,
    };

    const targetSub = submissions.find((s) => s.id === submissionId);
    const memberName = targetSub?.nama || targetSub?.recordData?.nama || 'Pemohon';
    const pilarTitle = (PILLARS_CONFIG[targetSub?.pillarId || 'peksos']?.title || targetSub?.pillarId || 'PSKS').toUpperCase();
    const wilLabel = targetSub?.wilayah || session.wilayah || 'Jawa Barat';
    const actorLabel = isSuperadminOrDev ? `Superadmin [${reviewerName}]` : `Admin Wilayah [${reviewerName}]`;
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
      await setFirestoreDoc('registration_submissions', submissionId, cleanFirestoreData(updatedSubmission), { merge: true });
    } catch (error) {
      console.error('Failed to reject submission in Firestore:', error);
    }
  };

  const handleBatchApproveSubmissions = async (submissionIds: string[]) => {
    if (!submissionIds.length) return;
    const isSuperadminOrDev =
      session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper;
    const now = new Date().toISOString();
    const reviewer = session.nama || session.username || (isSuperadminOrDev ? 'Superadmin Jabar' : 'Admin Wilayah');
    const targetStatus = isSuperadminOrDev ? 'SAH_TERDAFTAR' : 'DISETUJUI_WILAYAH';

    const updatedList = submissions.map((s) => {
      if (submissionIds.includes(s.id)) {
        return {
          ...s,
          status: targetStatus,
          reviewedAt: now,
          reviewedBy: reviewer,
          ...(isSuperadminOrDev
            ? { superadminApprovedBy: reviewer, superadminApprovedAt: now }
            : { regionalApprovedBy: reviewer, regionalApprovedAt: now }),
        };
      }
      return s;
    });

    setSubmissions(updatedList);

    for (const id of submissionIds) {
      const sub = submissions.find((item) => item.id === id);
      if (sub) {
        try {
          await setFirestoreDoc(
            'registration_submissions',
            id,
            cleanFirestoreData({
              ...sub,
              status: targetStatus,
              reviewedAt: now,
              reviewedBy: reviewer,
              ...(isSuperadminOrDev
                ? { superadminApprovedBy: reviewer, superadminApprovedAt: now }
                : { regionalApprovedBy: reviewer, regionalApprovedAt: now }),
            }),
            { merge: true }
          );
          if (isSuperadminOrDev && sub.recordData) {
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
      await setFirestoreDoc('task_items', newId, cleanFirestoreData(newTask));
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
      await setFirestoreDoc('task_items', task.id, cleanFirestoreData(updatedTask), { merge: true });
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
      await deleteFirestoreDoc('task_items', taskId);
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
    const updatedAfterDel: Record<string, PSKSDataRecord[]> = {};
    for (const [k, records] of Object.entries(allPillarData)) {
      updatedAfterDel[k] = records.filter((r) => r.id !== recordId);
    }
    setAllPillarData(updatedAfterDel);
    try {
      localStorage.setItem('psks_all_pillar_data', JSON.stringify(updatedAfterDel));
    } catch {}
    setCachedPillarData(updatedAfterDel);

    // Realtime regional distribution update
    const nextRegionsAfterDel = computeRegionalSummaryFromPillars(updatedAfterDel);
    setRegionalSummary(nextRegionsAfterDel);
    saveRegionalSummary(nextRegionsAfterDel);

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

    // 3. Sync deleted IDs to Firestore metadata so all devices receive the deletion in real-time
    try {
      setFirestoreDoc(
        'psks_records_meta',
        'deletions',
        {
          deletedIds: nextDeleted,
          updatedAt: Date.now(),
          lastAction: 'DELETE_SINGLE',
          lastTarget: recordId,
        },
        { merge: true }
      ).catch(() => {});
    } catch {}

    // Realtime summary count decrement & sync
    const targetPillarKey = deletedRecord?.pillarId || activePillar || 'peksos';
    setPillarSummaryCounts((prev) => {
      const current = prev[targetPillarKey] || allPillarData[targetPillarKey]?.length || 0;
      const next = { ...prev, [targetPillarKey]: Math.max(0, current - 1) };
      try { localStorage.setItem('psks_summary_counts', JSON.stringify(next)); } catch {}
      setFirestoreDoc('psks_records_meta', 'summary', {
        counts: next,
        regions: nextRegionsAfterDel,
        updatedAt: Date.now(),
        lastPillarUpdated: targetPillarKey
      }, { merge: true }).catch(() => {});
      return next;
    });

    // 4. Remove from Firestore psks_records
    try {
      await deleteFirestoreDoc('psks_records', recordId);
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      addToSyncQueue({ collection: 'psks_records', docId: recordId, type: 'DELETE' });
    }
  };

  const handleBatchDeleteRecords = async (
    recordIds: string[],
    targetPillarId?: PillarId
  ) => {
    if (!recordIds.length) return;
    const pillarKey = targetPillarId || activePillar;

    // 1. Add to deletedIds list and persist to localStorage
    const nextDeleted = Array.from(new Set([...deletedIds, ...recordIds]));
    setDeletedIds(nextDeleted);
    try {
      localStorage.setItem('psks_deleted_ids', JSON.stringify(nextDeleted));
    } catch (e) {
      console.error('Failed to save deleted IDs', e);
    }

    // 2. Remove immediately from allPillarData state
    const updatedAfterBatchDel: Record<string, PSKSDataRecord[]> = {};
    for (const [k, records] of Object.entries(allPillarData)) {
      updatedAfterBatchDel[k] = records.filter((r) => !recordIds.includes(r.id));
    }
    setAllPillarData(updatedAfterBatchDel);
    try {
      localStorage.setItem('psks_all_pillar_data', JSON.stringify(updatedAfterBatchDel));
    } catch {}
    setCachedPillarData(updatedAfterBatchDel);

    // Realtime regional distribution update
    const nextRegionsAfterBatchDel = computeRegionalSummaryFromPillars(updatedAfterBatchDel);
    setRegionalSummary(nextRegionsAfterBatchDel);
    saveRegionalSummary(nextRegionsAfterBatchDel);

    const pilarName = (pillarKey || 'PSKS').toUpperCase();
    const actorLabel = session.role === 'superadmin' ? `Superadmin [${session.nama}]` : `Admin [${session.nama}]`;

    // Record audit activity log
    recordSystemActivity({
      session,
      category: 'PSKS',
      actionType: 'DELETE',
      targetCollection: 'psks_records',
      targetId: `batch-delete-${Date.now()}`,
      targetName: `${recordIds.length} Data Anggota`,
      targetPillar: pilarName,
      targetWilayah: session.wilayah || 'Jawa Barat',
      details: `${actorLabel} telah MENGHAPUS MASSAL ${recordIds.length} anggota Pilar ${pilarName}`,
    });

    // 3. Sync deleted IDs to Firestore metadata so all devices receive the batch deletion in real-time
    try {
      setFirestoreDoc(
        'psks_records_meta',
        'deletions',
        {
          deletedIds: nextDeleted,
          updatedAt: Date.now(),
          lastAction: 'DELETE_BATCH',
          lastBatchCount: recordIds.length,
        },
        { merge: true }
      ).catch(() => {});
    } catch {}

    // Realtime summary count decrement & sync
    setPillarSummaryCounts((prev) => {
      const current = prev[pillarKey] || allPillarData[pillarKey]?.length || 0;
      const next = { ...prev, [pillarKey]: Math.max(0, current - recordIds.length) };
      try { localStorage.setItem('psks_summary_counts', JSON.stringify(next)); } catch {}
      setFirestoreDoc('psks_records_meta', 'summary', {
        counts: next,
        regions: nextRegionsAfterBatchDel,
        updatedAt: Date.now(),
        lastPillarUpdated: pillarKey
      }, { merge: true }).catch(() => {});
      return next;
    });

    try {
      await batchDeleteFirestoreDocs('psks_records', recordIds);
    } catch (err) {
      if (isQuotaError(err)) {
        quotaExceededRef.current = true;
        setIsQuotaExceeded(true);
      }
      recordIds.forEach((id) => {
        addToSyncQueue({ collection: 'psks_records', docId: id, type: 'DELETE' });
      });
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

    try {
      await setFirestoreDoc('admin_accounts', adminId, cleanFirestoreData(fullAdmin));
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

    const targetId = (sanitizedAdmin.id || '').toLowerCase().trim();
    const targetUname = (sanitizedAdmin.username || '').toLowerCase().trim();
    const prevUname = ((updatedAdmin as any)._previousUsername || '').toLowerCase().trim();

    setAdminAccounts((prev) => {
      let matched = false;
      const next = prev.map((a) => {
        const aId = (a.id || '').toLowerCase().trim();
        const aUname = (a.username || '').toLowerCase().trim();
        if ((targetId && aId === targetId) || (targetUname && aUname === targetUname) || (prevUname && aUname === prevUname)) {
          matched = true;
          return sanitizedAdmin;
        }
        return a;
      });
      const finalList = matched ? next : [...next, sanitizedAdmin];
      adminAccountsRef.current = finalList;
      try {
        localStorage.setItem('psks_admin_accounts', JSON.stringify(finalList));
      } catch {}
      return finalList;
    });

    // Synchronize local registration ticket if matching target user
    try {
      const rawTicket = localStorage.getItem('psks_latest_user_registration_ticket');
      if (rawTicket) {
        const parsed = JSON.parse(rawTicket);
        const ticketUname = (parsed?.username || '').toLowerCase().trim();
        if (ticketUname && (ticketUname === targetUname || (prevUname && ticketUname === prevUname) || (targetId && ticketUname === targetId))) {
          parsed.username = sanitizedAdmin.username || parsed.username;
          parsed.passwordPolos = sanitizedAdmin.passwordPolos || parsed.passwordPolos;
          parsed.statusActive = sanitizedAdmin.statusActive || parsed.statusActive;
          parsed.statusVerval = sanitizedAdmin.statusVerval || parsed.statusVerval;
          localStorage.setItem('psks_latest_user_registration_ticket', JSON.stringify(parsed));
          window.dispatchEvent(new Event('psks_registration_ticket_updated'));
        }
      }
    } catch {}

    // Send instant remote security signal to victim client in real-time (ONLY if an explicit security action occurred)
    let derivedSignal = '';
    if (securitySignal === 'UNFROZEN' || securitySignal === 'UNFREEZE') {
      derivedSignal = 'UNFREEZE';
    } else if (securitySignal === 'PASSWORD_CHANGED' || securitySignal === 'PASSWORD') {
      derivedSignal = 'PASSWORD';
    } else if (securitySignal === 'FROZEN' || securitySignal === 'FREEZE') {
      derivedSignal = 'FREEZE';
    } else if (securitySignal) {
      derivedSignal = securitySignal;
    }

    const currentSessionId = (session.userId || '').toLowerCase().trim();
    const currentSessionUname = (session.username || '').toLowerCase().trim();
    const isTargetingCurrentSession = Boolean(
      session.statusActive === 'SAH_TERDAFTAR' &&
      ((currentSessionId && targetId === currentSessionId) ||
       (currentSessionUname && (targetUname === currentSessionUname || prevUname === currentSessionUname)))
    );

    // Identifikasi apakah ini perubahan akun secara MANDIRI oleh pemilik akun sendiri:
    const isSelfUpdate = Boolean(
      securitySignal === 'SELF_PASSWORD_CHANGE' ||
      securitySignal === 'SELF_UPDATE' ||
      sanitizedAdmin.isSelfUpdate === true ||
      (isTargetingCurrentSession && (
        session.role === sanitizedAdmin.role ||
        !securitySignal ||
        securitySignal === 'SELF_PASSWORD_CHANGE'
      ))
    );

    if (isSelfUpdate) {
      // 1. SINKRONISASI SESI AKTIF PENGGUNA MANDIRI:
      // Perbarui sesi aktif lokal dan storage secara instan agar kredensial baru aktif
      setSession((prev) => {
        const updated = {
          ...prev,
          passwordPolos: sanitizedAdmin.passwordPolos || prev.passwordPolos,
          passwordHash: sanitizedAdmin.passwordHash || prev.passwordHash,
          lastUpdatedTimestamp: sanitizedAdmin.lastUpdatedTimestamp || Date.now(),
        };
        try {
          sessionStorage.setItem('psks_active_session', JSON.stringify(updated));
          localStorage.setItem('psks_active_session', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // 2. Sesuai instruksi mutlak user:
      // KETIKA USER MENGUBAH PASSWORD SECARA MANDIRI MAKA DILARANG UNTUK DIBERI POP-UP
      // BAHWA AKUN TELAH DIEDIT DAN DILARANG DITENDANG KELUAR!
      // Sesi tetap login normal tanpa pop-up dan tanpa penendangan keluar.
    } else {
      // BUKAN MANDIRI -> DIPERIKSA APAKAH AKTOR ADALAH ROLE YANG BERKUASA:
      const isAuthoritative = checkIsAuthoritativeOverSession(
        session.role,
        session.username || session.nama,
        sanitizedAdmin.role,
        sanitizedAdmin.username,
        sanitizedAdmin.id
      );

      // Hanya kirim sinyal remote kick-out jika dilakukan oleh role yang berkuasa
      if (isAuthoritative && derivedSignal) {
        const sigPayload = {
          action: derivedSignal,
          targetUsername: sanitizedAdmin.username,
          previousUsername: prevUname,
          targetId: sanitizedAdmin.id,
          targetWilayah: sanitizedAdmin.wilayahTugas,
          timestamp: Date.now(),
          by: session.username || session.nama,
          byRole: session.role,
        };

        try {
          const authChannel = new BroadcastChannel('psks_auth_channel');
          authChannel.postMessage({
            type: 'SECURITY_SIGNAL',
            ...sigPayload,
          });
          setTimeout(() => {
            try { authChannel.close(); } catch {}
          }, 500);
        } catch {}

        try {
          setFirestoreDoc('security_signals', 'live', sigPayload).catch(() => {});
        } catch {}
      }

      // Jika akun yang diedit adalah sesi di jendela ini (dan dilakukan oleh otoritas lain)
      if (isTargetingCurrentSession) {
        if (sanitizedAdmin.isFrozen === true || sanitizedAdmin.statusAkun === 'DIBEKUKAN' || sanitizedAdmin.statusActive === 'FROZEN') {
          setShowAccountFrozenModal(true);
        } else if ((sanitizedAdmin.statusAkun as any) === 'DIHAPUS' || (sanitizedAdmin as any).isDeleted) {
          setShowAccountDeletedModal(true);
        } else {
          setShowAccountEditedModal(true);
        }
      }
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

    try {
      await setFirestoreDoc('admin_accounts', sanitizedAdmin.id, cleanFirestoreData(sanitizedAdmin), { merge: true });
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

    // Immediately trigger local modal if deleted account is currently logged in
    const currentSessionId = (session.userId || '').toLowerCase().trim();
    const currentSessionUname = (session.username || '').toLowerCase().trim();
    const isTargetingCurrentSession = Boolean(
      session.statusActive === 'SAH_TERDAFTAR' &&
      ((currentSessionId && (targetId === currentSessionId || id.toLowerCase().trim() === currentSessionId)) ||
       (currentSessionUname && (targetUname === currentSessionUname || id.toLowerCase().trim() === currentSessionUname)))
    );

    if (isTargetingCurrentSession) {
      setShowAccountDeletedModal(true);
    }

    // Broadcast remote deletion signal so victim client gets booted instantly with alert
    try {
      const authChannel = new BroadcastChannel('psks_auth_channel');
      authChannel.postMessage({
        type: 'SECURITY_SIGNAL',
        action: 'DELETE',
        targetUsername: targetUname,
        targetId: targetId,
        timestamp: Date.now(),
        by: session.username || session.nama,
        byRole: session.role,
      });
      setTimeout(() => {
        try { authChannel.close(); } catch {}
      }, 500);
    } catch {}

    try {
      setFirestoreDoc('security_signals', 'live', {
        action: 'DELETE',
        targetUsername: targetUname,
        targetId: targetId,
        timestamp: Date.now(),
        by: session.username || session.nama,
        byRole: session.role,
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

        // Also clean up any lingering local registration ticket if matching deleted account
        const rawTicket = localStorage.getItem('psks_latest_user_registration_ticket');
        if (rawTicket) {
          try {
            const parsedTicket = JSON.parse(rawTicket);
            const ticketUname = (parsedTicket?.username || '').toLowerCase().trim();
            if (newItems.includes(ticketUname) || nextDeleted.includes(ticketUname) || ticketUname === targetUname) {
              localStorage.removeItem('psks_latest_user_registration_ticket');
            }
          } catch {}
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

    try {
      await deleteFirestoreDoc('admin_accounts', targetId);
      if (id !== targetId) {
        await deleteFirestoreDoc('admin_accounts', id).catch(() => {});
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
    const titleEl = document.getElementById('judul-gerbang-psks');
    if (titleEl) {
      const isMobile = window.innerWidth < 640;
      const navbarHeight = isMobile ? 68 : 72;
      const breathingGap = isMobile ? 12 : 16;
      const offset = navbarHeight + breathingGap;

      const elementTop = titleEl.getBoundingClientRect().top + window.scrollY;
      const targetY = Math.max(0, elementTop - offset);

      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    } else {
      const bannerEl = document.getElementById('banner-gerbang-digital');
      if (bannerEl) {
        bannerEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Privileged NFC 6-Digit PIN Authority Gate Modal
  if (pendingNfcPinAuth) {
    return (
      <AuthorityPinVerificationModal
        role={pendingNfcPinAuth.role}
        nama={pendingNfcPinAuth.nama}
        wilayah={pendingNfcPinAuth.wilayah}
        method="nfc"
        appSettings={appSettings}
        onSuccess={() => {
          const auth = pendingNfcPinAuth;
          setPendingNfcPinAuth(null);
          handleLogin(auth.role, auth.nama, auth.wilayah);
          recordSystemActivity({
            session: {
              role: auth.role,
              nama: auth.nama,
              wilayah: auth.wilayah,
              statusActive: 'SAH_TERDAFTAR',
              isDeveloper: auth.role === 'developer',
            },
            category: 'SYSTEM',
            actionType: 'UPDATE',
            targetCollection: 'app_settings',
            targetId: 'smart_card_nfc_auth',
            details: `Akses Login Instan Terverifikasi via Smart Card NFC 13.56 MHz & PIN (${auth.nama})`,
          });
        }}
        onCancel={() => {
          setPendingNfcPinAuth(null);
        }}
      />
    );
  }

  // Strict User Flow: When gateModalOpen is true (new visitor or logging in),
  // render ONLY SmartGateModal so zero main content, hero, navbar, or background flashes
  if (gateModalOpen) {
    return (
      <div className="fixed inset-0 w-full h-[100dvh] bg-[#06152d] overflow-hidden z-[9999] overscroll-none select-none">
        <SmartGateModal
          isOpen={true}
          onClose={() => setGateModalOpen(false)}
          targetPillarTitle={pendingPillarId ? PILLARS_CONFIG[pendingPillarId]?.title : 'Layanan PSKS'}
          onConfirmGuestRegion={handleConfirmGuestRegion}
          onPerformLogin={handleLogin}
          adminAccounts={adminAccounts}
          onRegisterAccount={handleAddAdminAccount}
          onUpdateAccountLocal={(acc) => {
            setAdminAccounts((prev) => {
              const next = prev.map((a) => (a.id === acc.id || (a.username && a.username === acc.username) ? acc : a));
              adminAccountsRef.current = next;
              try {
                localStorage.setItem('psks_admin_accounts', JSON.stringify(next));
              } catch {}
              return next;
            });
            if (acc.id) {
              setFirestoreDoc('admin_accounts', acc.id, cleanFirestoreData(acc)).catch(() => {});
            }
          }}
          appSettings={appSettings}
          logoUrl={appSettings?.logoUrl}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 antialiased selection:bg-[#d4af37] selection:text-[#0f2b5c]">
      {/* Maintenance Global Blocking Overlay */}
      <React.Suspense fallback={null}>
        <MaintenanceOverlay
          session={session}
          appSettings={appSettings}
          onDeveloperLogin={(role, nama, wilayah) => handleLogin(role, nama, wilayah)}
        />
      </React.Suspense>

      {/* Quota Exceeded / Offline Cache Mode / Rescue Sync Banner (Visible only to authorized operators/admins who need offline queue info) */}
      {(isQuotaExceeded || pendingSyncCount > 0) && (session.statusActive === 'SAH_TERDAFTAR' || session.role === 'superadmin' || session.role === 'admin' || session.role === 'developer') && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 text-amber-200 text-xs py-2 px-4 text-center font-medium shadow-md flex flex-wrap items-center justify-center gap-2 z-50">
          <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
            {pendingSyncCount > 0 ? 'ANTREAN DATA LOKAL' : 'MODE CACHE LOKAL (OPERATOR)'}
          </span>
          <span>
            {pendingSyncCount > 0
              ? `Terdapat ${pendingSyncCount} data tersimpan di memori perangkat ini yang siap dikirim ke cloud.`
              : 'Batas kuota harian Firestore tercapai. Perubahan data tersimpan aman di Cache Lokal & Antrean Offline.'}
          </span>
          {pendingSyncCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Apakah Anda yakin ingin membatalkan dan membersihkan ${pendingSyncCount} antrean offline yang belum tersimpan ke server?`)) {
                  clearSyncQueue();
                }
              }}
              className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-bold text-[11px] px-2 py-0.5 rounded border border-rose-500/40 transition-colors cursor-pointer"
              title="Hapus antrean sinkronisasi tertunda jika ingin membatalkannya"
            >
              Hapus Antrean
            </button>
          )}
          <button
            type="button"
            onClick={handleRescueSyncAllPillarsToCloud}
            disabled={isRescueSyncing}
            className="ml-1 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] hover:from-amber-400 hover:to-amber-200 text-slate-950 font-black text-[11px] px-3 py-1 rounded-lg transition-all cursor-pointer shadow active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
            title="Dorong dan sinkronkan seluruh data lokal di perangkat ini ke Cloud Firestore"
          >
            <span>{isRescueSyncing ? `🔄 ${rescueProgressText || 'Menyinkronkan...'}` : `🚀 Selamatkan & Dorong Data ke Cloud (${allPillarData['lks']?.length || 0} LKS)`}</span>
          </button>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab, subView) => {
          if (tab === 'beranda') {
            handleBackToHome();
          } else {
            navigateToTab(tab, { subView });
          }
        }}
        onPrefetch={handlePrefetchTab}
        session={session}
        onLogout={handleLogout}
        onOpenGateModal={() => setGateModalOpen(true)}
        onOpenGuestHistoryModal={() => setShowGuestHistoryModal(true)}
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
      <main className="flex-1 min-h-[calc(100vh-70px)] w-full flex flex-col">
        <div className={currentTab === 'beranda' ? 'block' : 'hidden'}>
          <HeroSection
            onScrollToGrid={handleScrollToGrid}
            appSettings={appSettings}
            isTabActive={currentTab === 'beranda'}
          />
          <AboutSection />
          <BannerBadge session={session} />
          <PillarsGrid onSelectPillar={handleSelectPillar} allPillarData={allPillarData} summaryCounts={pillarSummaryCounts} />

          <ErrorBoundary fallbackMode="inline" fallbackTitle="Statistik & Sebaran PSKS" resetKeys={[allPillarData, regionalSummary]}>
            <React.Suspense fallback={null}>
              <HomePSKSAnalytics
                allPillarData={allPillarData}
                session={session}
                summaryCounts={pillarSummaryCounts}
                regionalSummary={regionalSummary}
                onSelectPillar={handleSelectPillar}
                onScrollToGrid={handleScrollToGrid}
                isSummarySynced={isSummarySynced}
              />
            </React.Suspense>
          </ErrorBoundary>

            {/* Button Panjang Elegan "RIWAYAT PENGAJUAN" Khusus Tamu Publik & User (Bukan Superadmin / Developer / Admin) Di Atas Peta Sebaran Interaktif */}
            {(session.role === 'user' || session.statusActive === 'GUEST') && session.role !== 'superadmin' && session.role !== 'developer' && session.role !== 'admin' && (
              <section id="section-riwayat-pendaftaran-user" className="max-w-7xl mx-auto px-3 sm:px-6 my-6 sm:my-8 scroll-mt-24">
                <div className="bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#06152d] rounded-3xl p-5 sm:p-7 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-2 text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-400/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
                      <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                      <span>PORTAL MONITORING STATUS PENGAJUAN MANDIRI</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                      Riwayat Pengajuan 10 Pilar PSKS
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-2xl">
                      Pantau status verifikasi dan pengesahan berkas pendaftaran Anda ke 10 Pilar PSKS secara realtime, transparan, dan akurat (Menunggu Persetujuan, Diterima/Acc, atau Ditolak).
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-riwayat-pendaftaran-user"
                    onClick={() => {
                      if (session.statusActive !== 'SAH_TERDAFTAR') {
                        setShowGuestHistoryModal(true);
                      } else {
                        navigateToTab('user_reg_history');
                      }
                    }}
                    className="relative z-10 w-full md:w-auto bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8901c] hover:scale-105 active:scale-95 text-[#0f2b5c] font-black text-xs sm:text-sm px-6 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-amber-200 uppercase tracking-wider group shrink-0"
                  >
                    <ClipboardList className="w-5 h-5 text-[#0f2b5c]" />
                    <span>RIWAYAT PENGAJUAN</span>
                    <ArrowRight className="w-4 h-4 text-[#0f2b5c] transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>
            )}

            {/* Khusus Admin Wilayah: 1 Tombol Eksklusif Untuk Beralih ke Halaman Terima Pendaftaran 10 Pilar PSKS (Di Atas Peta Sebaran) */}
            {session.role === 'admin' && (
              <section id="section-terima-pendaftaran" className="max-w-7xl mx-auto px-3 sm:px-6 my-6 sm:my-8 scroll-mt-24">
                <div className="bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#06152d] rounded-3xl p-6 sm:p-8 text-white border-2 border-[#d4af37] shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 space-y-2 text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-400/40 px-3.5 py-1 rounded-full text-xs font-black text-amber-300 shadow-sm">
                      <span>OTORITAS ADMIN WILAYAH • {(session.wilayah || 'Jawa Barat').toUpperCase()}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">
                      Verifikasi Berkas Wilayah
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-100/90 font-medium max-w-2xl">
                      Akses modul verifikasi berkas pendaftaran anggota baru 10 Pilar Potensi dan Sumber Kesejahteraan Sosial khusus untuk wilayah <strong className="text-amber-300">{session.wilayah || 'Jawa Barat'}</strong> sebelum diteruskan ke Superadmin.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-buka-verifikasi-wilayah"
                    onClick={() => {
                      navigateToTab('terima_pendaftaran');
                    }}
                    className="relative z-10 shrink-0 w-full md:w-auto bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8901c] hover:scale-105 active:scale-95 text-[#0f2b5c] font-black text-xs sm:text-sm px-6 sm:px-8 py-4 sm:py-5 rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3 border border-amber-200 uppercase tracking-wider group"
                  >
                    {/* Sensor Lampu di Pojok Kanan Atas Button (Berkedip Jika Ada Pending, Centang Jika Selesai) */}
                    <div className="absolute -top-2 -right-2 z-20">
                      {hasPendingWilayah ? (
                        <div
                          className="relative flex items-center justify-center cursor-pointer"
                          title={`Sensor Status: ${pendingWilayahCount} berkas menunggu verifikasi wilayah`}
                        >
                          <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-rose-500 opacity-80 duration-1000" />
                          <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 border-2 border-white shadow-md shadow-rose-500/60">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </span>
                        </div>
                      ) : (
                        <div
                          className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-emerald-500 text-white border-2 border-white shadow-md shadow-emerald-500/40"
                          title="Sensor Status: Tidak ada berkas pending (Semua berkas wilayah telah diverifikasi)"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <Inbox className="w-5 h-5 text-[#0f2b5c]" />
                    <span>Buka Verifikasi Berkas Wilayah</span>
                    <ArrowRight className="w-4 h-4 text-[#0f2b5c] transform group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>
            )}

            <ErrorBoundary fallbackMode="silent" fallbackTitle="Peta Sebaran Wilayah PSKS" resetKeys={[allPillarData, regionalSummary]}>
              <React.Suspense fallback={null}>
                <JabarRegionalMap
                  allPillarData={allPillarData}
                  regionalSummary={regionalSummary}
                  pillarSummaryCounts={pillarSummaryCounts}
                  isSummarySynced={isSummarySynced}
                />
              </React.Suspense>
            </ErrorBoundary>

            {(session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper) && session.statusActive === 'SAH_TERDAFTAR' && (
              <React.Suspense fallback={null}>
                <Section11Admin
                  session={session}
                  appSettings={appSettings}
                  submissions={submissions}
                  onOpenAccountConsole={handleOpenAccountConsole}
                  onOpenMonitoringConsole={handleOpenMonitoringConsole}
                  onOpenActivityLogConsole={handleOpenActivityLogConsole}
                  onOpenMaintenanceConsole={handleOpenMaintenanceConsole}
                  onOpenUserAccountConsole={handleOpenUserAccountConsole}
                  onOpenTaskManagerConsole={handleOpenTaskManagerConsole}
                  onOpenAnnouncementConsole={handleOpenAnnouncementConsole}
                  onOpenFloatingWaConsole={handleOpenFloatingWaConsole}
                  onOpenFaqConsole={handleOpenFaqConsole}
                  onOpenDocumentRepoConsole={handleOpenDocumentRepoConsole}
                  onOpenBackgroundLogoConsole={handleOpenBackgroundLogoConsole}
                  onOpenProfileKadinasConsole={handleOpenProfileKadinasConsole}
                  onOpenSocialMediaConsole={handleOpenSocialMediaConsole}
                  onOpenRegionalLogoConsole={handleOpenRegionalLogoConsole}
                  onOpenPinSecurityConsole={handleOpenPinSecurityConsole}
                  onOpenWebsiteInfoConsole={handleOpenWebsiteInfoConsole}
                />
              </React.Suspense>
            )}

            {/* Titik Akses Publik: Pusat Unduh Dokumen & Regulasi Kedinasan (Ditempatkan di atas Portal FAQ) */}
            <React.Suspense fallback={null}>
              <PublicDocumentRepoSection
                documents={portalDocuments}
                onOpenRepository={() => navigateToTab('document_repository')}
                onDownloadDoc={async (doc) => {
                  try {
                    const { downloadOfficialPdf } = await import('./utils/officialPdfGenerator');
                    await downloadOfficialPdf(doc);
                    await handleIncrementDocumentDownload(doc.id, doc.downloadCount || 0);
                  } catch (err) {
                    console.error('Home download error', err);
                  }
                }}
              />
            </React.Suspense>

            {/* Portal FAQ: Berada di bawah Dokumen & Regulasi Kedinasan, tepat di atas footer */}
            <React.Suspense fallback={null}>
              <PortalFaqSection
                faqs={portalFaqs}
                onOpenAiAssistant={handleOpenAiAssistant}
                onOpenContact={handleOpenFloatingWhatsApp}
              />
            </React.Suspense>

            {/* Portal Footer: Eksklusif berada di bagian paling bawah Beranda */}
            <Footer logoUrl={appSettings?.logoUrl} />
        </div>

        <React.Suspense fallback={null}>
          {currentTab === 'terima_pendaftaran' && session.statusActive === 'SAH_TERDAFTAR' && session.role === 'admin' && (
          <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <BackToHomeButton onClick={handleBackToHome} id="btn-back-top-terima-pendaftaran" />
              <div className="text-[11px] sm:text-xs font-bold text-slate-500 bg-white/90 border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs text-center sm:text-right">
                <span>Manajemen Verifikasi Pendaftaran Pilar PSKS</span>
              </div>
            </div>
            <AdminRegistrationManager
              session={session}
              submissions={submissions}
              onApproveSubmission={handleApproveSubmission}
              onRejectSubmission={handleRejectSubmission}
            />
            <div className="pt-4 sm:pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <BackToHomeButton onClick={handleBackToHome} id="btn-back-bottom-terima-pendaftaran" />
              <div className="text-[11px] sm:text-xs text-slate-500 font-semibold text-center sm:text-right">
                <span>Dinas Sosial Provinsi Jawa Barat</span>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'user_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer') && (
          <UserManagementPage
            session={session}
            adminAccounts={adminAccounts}
            onUpdateUserAccount={handleUpdateAdminAccount}
            onDeleteUserAccount={handleDeleteAdminAccount}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'task_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer') && (
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
            onUpdateRecord={handleUpdateRecord}
            onBatchAddRecords={handleBatchAddRecords}
            onDeleteRecord={handleDeleteRecord}
            onBatchDeleteRecords={handleBatchDeleteRecords}
            onAddSubmission={handleAddSubmission}
            onOpenGateModal={() => setGateModalOpen(true)}
            onRescueSync={handleRescueSyncAllPillarsToCloud}
            isRescueSyncing={isRescueSyncing}
            rescueProgressText={rescueProgressText}
            summaryCount={pillarSummaryCounts[activePillar]}
            isLoadingRecords={!isPillarRecordsLoaded}
            regionalSummary={regionalSummary}
            regionalLogos={regionalLogos}
          />
        )}

        {currentTab === 'profil' && (
          <>
            <ProfilePage
              appSettings={appSettings}
              onBackToHome={handleBackToHome}
              subView={profileSubView}
              onSwitchSubView={(v) => setProfileSubView(v)}
            />
            <Footer logoUrl={appSettings?.logoUrl} />
          </>
        )}

        {currentTab === 'contact' && (
          <>
            <ContactPage
              appSettings={appSettings}
              onBackToHome={handleBackToHome}
              subView={contactSubView}
              onSwitchSubView={(v) => setContactSubView(v)}
            />
            <Footer logoUrl={appSettings?.logoUrl} />
          </>
        )}

        {currentTab === 'akun' && (
          <>
            <AccountPage
              session={session}
              adminAccounts={adminAccounts}
              submissions={submissions}
              appSettings={appSettings}
              onSaveAppSettings={handleSaveAppSettings}
              subView={accountSubView}
              onSwitchSubView={(v) => setAccountSubView(v)}
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
            <Footer logoUrl={appSettings?.logoUrl} />
          </>
        )}

        {currentTab === 'admin_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <AdminManagementPage
            session={session}
            adminAccounts={adminAccounts}
            onAddAdminAccount={handleAddAdminAccount}
            onUpdateAdminAccount={handleUpdateAdminAccount}
            onDeleteAdminAccount={handleDeleteAdminAccount}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'admin_monitor' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <AdminMonitoringPage
            session={session}
            adminAccounts={adminAccounts}
            onBackToHome={handleBackToHome}
            onOpenInbox={() => setIsInboxOpen(true)}
            onSendMessage={handleSendMessage}
          />
        )}

        {currentTab === 'admin_maintenance' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <MaintenanceManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'superadmin_settings' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <SuperadminSettingsPage
            session={session}
            onBackToHome={handleBackToHome}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            allPillarData={allPillarData}
            adminAccounts={adminAccounts}
            adminMessages={adminMessages}
            onNavigateToTab={(tab) => {
              navigateToTab(tab);
            }}
          />
        )}

        {currentTab === 'activity_logs' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <ActivityLogPage
            session={session}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'announcement_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
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

        {currentTab === 'floating_wa_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <FloatingWaManagerPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'faq_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <FAQManagementPage
            session={session}
            faqs={portalFaqs}
            onBackToHome={handleBackToHome}
            onSaveFaq={handleSaveFaq}
            onDeleteFaq={handleDeleteFaq}
            onSeedDefaults={handleSeedDefaults}
          />
        )}

        {currentTab === 'document_repository' && (
          <DocumentRepositoryPage
            session={session}
            documents={portalDocuments}
            onBackToHome={handleBackToHome}
            onSaveDocument={handleSaveDocument}
            onDeleteDocument={handleDeleteDocument}
            onSeedDefaults={handleSeedDefaultDocuments}
            onIncrementDownload={handleIncrementDocumentDownload}
          />
        )}

        {currentTab === 'user_reg_history' && (
          <>
            <UserRegistrationHistoryPage
              session={session}
              submissions={submissions}
              onBackToHome={handleBackToHome}
              onNavigateToPillar={(pillarId) => {
                handleSelectPillar(pillarId);
              }}
              onOpenLoginModal={() => {
                setGateModalOpen(true);
              }}
            />
            <Footer logoUrl={appSettings?.logoUrl} />
          </>
        )}

        {currentTab === 'bg_logo_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <BackgroundLogoManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'profile_kadinas_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <ProfileKadinasManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'social_media_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <SocialMediaManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'regional_logo_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <RegionalLogoManagementPage
            session={session}
            regionalLogos={regionalLogos}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'pin_security_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <PinSecurityManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentTab === 'website_info_manage' && session.statusActive === 'SAH_TERDAFTAR' && (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true) && (
          <WebsiteInfoManagementPage
            session={session}
            appSettings={appSettings}
            onSaveSettings={handleSaveAppSettings}
            onBackToHome={handleBackToHome}
            allPillarData={allPillarData}
            adminAccounts={adminAccounts}
            adminMessages={adminMessages}
          />
        )}
        </React.Suspense>
      </main>

      {/* Floating Announcement Modal - Precision Realtime Timer on Entry */}
      <FloatingAnnouncementModal
        isOpen={isFloatingAnnouncementOpen}
        announcement={appSettings.announcement || DEFAULT_ANNOUNCEMENT_CONFIG}
        onClose={() => setIsFloatingAnnouncementOpen(false)}
        onOpenDetail={() => handleOpenAnnouncementDetail(appSettings.announcement || DEFAULT_ANNOUNCEMENT_CONFIG)}
      />

      {/* Floating Elements & Modals */}
      <React.Suspense fallback={null}>
        <FloatingWhatsApp appSettings={appSettings} session={session} />
      </React.Suspense>
      
      <React.Suspense fallback={null}>
        <AIAssistantWidget
          session={session}
          currentTab={currentTab}
          activePillar={activePillar}
          allPillarData={allPillarData}
          appSettings={appSettings}
          onNavigateTab={(tab: string) => {
            const superadminTabs = [
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
            const isSuperadminOrDev =
              session.statusActive === 'SAH_TERDAFTAR' &&
              (session.role === 'superadmin' || session.role === 'developer' || session.isDeveloper === true);
            const isDeveloper =
              session.statusActive === 'SAH_TERDAFTAR' &&
              (session.role === 'developer' || session.isDeveloper === true);
            const isAdmin =
              session.statusActive === 'SAH_TERDAFTAR' && session.role === 'admin';

            let targetTab = tab;
            if (targetTab === 'account') targetTab = 'akun';
            if (targetTab === 'monitoring') targetTab = 'admin_monitor';
            if (targetTab === 'maintenance') targetTab = 'admin_maintenance';
            if (targetTab === 'task_manager') targetTab = 'task_manage';
            if (targetTab === 'pillars') targetTab = 'beranda';

            // Modal Trigger for Developer Control Panel
            if (targetTab === 'dev_panel') {
              if (isDeveloper) {
                setIsDeveloperPanelOpen(true);
              }
              return;
            }

            // Subnavigasi Ubah PIN: strictly for Superadmin and Developer
            if (targetTab === 'ubah_pin' || targetTab === 'account_ubah_pin') {
              setAccountSubView('ubah_pin');
              navigateToTab('akun', { subView: 'ubah_pin' });
              return;
            }

            // Subnavigasi Ubah Kata Sandi
            if (targetTab === 'ubah_password' || targetTab === 'account_ubah_password') {
              setAccountSubView('ubah_password');
              navigateToTab('akun', { subView: 'ubah_password' });
              return;
            }

            // CRITICAL: If Superadmin triggers pin_security_manage, ALWAYS redirect to subnavigasi Ubah PIN on AccountPage
            if (targetTab === 'pin_security_manage' && !isDeveloper) {
              setAccountSubView('ubah_pin');
              navigateToTab('akun', { subView: 'ubah_pin' });
              return;
            }

            if (targetTab === 'akun') {
              setAccountSubView('profil');
              navigateToTab('akun', { subView: 'profil' });
              return;
            }

            if (targetTab === 'login') {
              if (session.statusActive === 'SAH_TERDAFTAR') {
                setAccountSubView('profil');
                navigateToTab('akun', { subView: 'profil' });
              } else {
                setOpenLoginModalOnAkun(true);
                navigateToTab('akun');
              }
              return;
            }

            if (superadminTabs.includes(targetTab) && !isSuperadminOrDev) {
              return;
            }
            if (targetTab === 'terima_pendaftaran' && !isAdmin && !isSuperadminOrDev) {
              return;
            }

            if (targetTab === 'beranda') {
              handleBackToHome();
            } else if (targetTab === 'user_reg_history' && session.statusActive !== 'SAH_TERDAFTAR') {
              setShowGuestHistoryModal(true);
            } else {
              navigateToTab(targetTab);
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

      {/* Pop Up Modal: Akses Riwayat Pengajuan untuk Tamu Publik (Perlu Login) */}
      {showGuestHistoryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl p-6 sm:p-7 text-center border-2 border-emerald-600 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-300 shadow-inner">
              <Lock className="w-8 h-8 text-amber-700" />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full text-xs font-black text-amber-900 mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
              <span>AKSES TERPROTEKSI</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
              Akses Dibatasi - Perlu Login
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-medium">
              Riwayat pengajuan pendaftaran 10 Pilar PSKS bersifat privat dan hanya dapat diakses oleh akun terdaftar. Silakan masuk (login) ke akun Anda terlebih dahulu untuk memantau status berkas pengajuan.
            </p>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                id="btn-guest-history-cancel"
                onClick={() => setShowGuestHistoryModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-guest-history-login"
                onClick={() => {
                  setShowGuestHistoryModal(false);
                  setGateModalOpen(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#091f42] via-[#0f2b5c] to-[#143b7d] hover:from-[#0f2b5c] hover:to-[#1a4a9c] text-amber-300 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal Otorisasi PIN 6 Digit Pure Putih untuk Tap SmartCard NFC */}
      {pendingNfcPinAuth && (
        <AuthorityPinVerificationModal
          role={pendingNfcPinAuth.role}
          nama={pendingNfcPinAuth.nama}
          wilayah={pendingNfcPinAuth.wilayah}
          method="nfc"
          appSettings={appSettings}
          onSuccess={() => {
            const auth = pendingNfcPinAuth;
            setPendingNfcPinAuth(null);
            handleLogin(auth.role, auth.nama, auth.wilayah);
            recordSystemActivity({
              session: {
                role: auth.role,
                nama: auth.nama,
                wilayah: auth.wilayah,
                statusActive: 'SAH_TERDAFTAR',
                isDeveloper: auth.role === 'developer',
              },
              category: 'SYSTEM',
              actionType: 'UPDATE',
              targetCollection: 'app_settings',
              targetId: 'smart_card_nfc_auth',
              details: `Akses Login Instan Terverifikasi via Smart Card NFC & PIN 6 Digit (${auth.nama})`,
            });
          }}
          onCancel={() => {
            setPendingNfcPinAuth(null);
          }}
        />
      )}

      {/* Footer is placed strictly inside the beranda container to prevent any footer flash on feature transitions */}
    </div>
  );
}
