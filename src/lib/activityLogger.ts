import { writeBatch, doc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, isQuotaError } from './firebase';
import { supabase } from './supabase';
import { SystemLog, UserSession } from '../types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'psks_system_logs';
const INIT_KEY = 'psks_system_logs_initialized';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format timestamp in Indonesian locale with Day, Date, Month, Year & Time:
 * Contoh: "Senin, 17 Agustus 2026 • 14:25:30 WIB"
 */
export function formatLogTimestamp(date: Date = new Date()): string {
  const dayName = DAYS[date.getDay()];
  const d = date.getDate().toString().padStart(2, '0');
  const m = MONTHS[date.getMonth()];
  const y = date.getFullYear();
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${dayName}, ${d} ${m} ${y} • ${hh}:${mm}:${ss} WIB`;
}

/**
 * Relative time calculation (e.g. "Baru saja", "5 menit yang lalu", "2 jam yang lalu")
 */
export function formatRelativeTime(timestampMs: number): string {
  const diff = Date.now() - timestampMs;
  if (diff < 10000) return 'Baru saja';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds} dtk lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Kemarin';
  if (days < 30) return `${days} hari lalu`;
  return `${Math.floor(days / 30)} bln lalu`;
}

/**
 * Save log locally in localStorage for fast UI rendering & offline fallback
 */
export function saveLocalLog(log: SystemLog): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: SystemLog[] = raw ? JSON.parse(raw) : [];
    // Prepend new log
    const updated = [log, ...list.filter((l) => l.id !== log.id)].slice(0, 500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save local log:', e);
  }
}

/**
 * Check if the user is a valid authenticated Admin or Superadmin.
 * MUST NOT be guest/Tamu Publik, role 'user', or developer.
 */
export function isEligibleAdminActor(session: UserSession | null | undefined): boolean {
  if (!session) return false;
  const role = (session.role || '').toLowerCase();
  const name = (session.nama || '').toLowerCase().trim();

  // Exclude developer & guests strictly
  if (
    role === 'developer' ||
    role === 'user' ||
    session.isDeveloper === true ||
    session.statusActive !== 'SAH_TERDAFTAR' ||
    name === 'tamu publik' ||
    name === 'tamu' ||
    name.includes('developer') ||
    name.includes('ilham') ||
    name === ''
  ) {
    return false;
  }

  return role === 'admin' || role === 'superadmin';
}

export function isDeveloperActor(session: UserSession | null | undefined): boolean {
  if (!session) return false;
  const role = (session.role || '').toLowerCase();
  const name = (session.nama || '').toLowerCase();
  return (
    role === 'developer' ||
    session.isDeveloper === true ||
    name.includes('ilham') ||
    name.includes('developer')
  );
}

export const INITIAL_SAMPLE_LOGS: SystemLog[] = [];

/**
 * Filter out corrupt, tamu publik, or developer logs
 */
export function sanitizeLogEntries(rawLogs: SystemLog[]): SystemLog[] {
  return rawLogs.filter((l) => {
    if (!l) return false;
    const actorRole = (l.actorRole || '').toLowerCase();
    const actorName = (l.actorName || '').toLowerCase().trim();
    const details = (l.details || '').toLowerCase();

    // Strictly ban 'tamu publik', 'tamu', 'user' role, and developer
    if (
      actorRole === 'user' ||
      actorRole === 'developer' ||
      actorName === 'tamu publik' ||
      actorName === 'tamu' ||
      actorName.includes('tamu publik') ||
      actorName.includes('developer') ||
      actorName.includes('ilham') ||
      details.includes('tamu publik')
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Get local logs (cleaned of invalid entries)
 */
export function getLocalLogs(): SystemLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sanitized = sanitizeLogEntries(parsed);
      return sanitized;
    }
    return [];
  } catch (e) {
    console.error('Failed to parse local logs:', e);
    return [];
  }
}

/**
 * Delete a single log entry by ID from both LocalStorage and Firestore.
 */
export async function deleteLogById(logId: string): Promise<boolean> {
  if (!logId) return false;

  // 1. Remove from LocalStorage
  try {
    const current = getLocalLogs();
    const updated = current.filter((l) => l.id !== logId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(INIT_KEY, 'true');
  } catch (e) {
    console.error('Failed to delete local log by ID:', e);
  }

  // 2. Remove from Firestore
  try {
    const logRef = doc(db, 'system_logs', logId);
    const batch = writeBatch(db);
    batch.delete(logRef);
    await batch.commit();
    return true;
  } catch (err) {
    console.warn('[Activity Log] Firestore delete log by ID note:', err);
    return true;
  }
}

/**
 * Helper to determine which of the 4 categories a log belongs to.
 */
export function isLogInCategory(
  log: SystemLog,
  category: 'VERIFIKASI' | 'PSKS' | 'ADMIN_ACCOUNT' | 'SYSTEM'
): boolean {
  const details = (log.details || '').toLowerCase();
  const act = (log.actionType || '').toUpperCase();
  const cat = (log.category || '').toUpperCase();
  const targetCol = log.targetCollection || '';

  const isVerif =
    cat === 'VERIFIKASI' ||
    act === 'APPROVE' ||
    act === 'REJECT' ||
    targetCol === 'registration_submissions' ||
    details.includes('menerima') ||
    details.includes('menolak');

  if (category === 'VERIFIKASI') return isVerif;

  const isPsks =
    (cat === 'PSKS' || targetCol === 'psks_records') && !isVerif;

  if (category === 'PSKS') return isPsks;

  const isAdmin =
    cat === 'ADMIN_ACCOUNT' ||
    targetCol === 'admin_accounts' ||
    details.includes('akun admin');

  if (category === 'ADMIN_ACCOUNT') return isAdmin;

  const isSys =
    cat === 'SYSTEM' ||
    act === 'CLEAR' ||
    targetCol === 'system_logs' ||
    targetCol === 'app_settings';

  if (category === 'SYSTEM') return isSys;

  return false;
}

/**
 * Delete logs by category from both LocalStorage and Firestore.
 * ONLY deletes logs for the specified category, leaving other categories intact.
 */
export async function deleteLogsByCategory(
  category: 'VERIFIKASI' | 'PSKS' | 'ADMIN_ACCOUNT' | 'SYSTEM' | string,
  explicitIds?: string[]
): Promise<number> {
  let deletedCount = 0;
  const targetCat = category as 'VERIFIKASI' | 'PSKS' | 'ADMIN_ACCOUNT' | 'SYSTEM';

  // 1. Remove ONLY matching category logs from LocalStorage
  try {
    const current = getLocalLogs();
    const updated = current.filter((l) => {
      if (explicitIds && explicitIds.length > 0) {
        return !explicitIds.includes(l.id);
      }
      return !isLogInCategory(l, targetCat);
    });
    deletedCount = current.length - updated.length;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(INIT_KEY, 'true');
  } catch (e) {
    console.error('Failed to delete local logs by category:', e);
  }

  // 2. Remove matching from Firestore
  try {
    const logsRef = collection(db, 'system_logs');
    
    // If explicit IDs are provided, delete them directly
    if (explicitIds && explicitIds.length > 0) {
      for (let i = 0; i < explicitIds.length; i += 400) {
        const chunk = explicitIds.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          if (id) {
            batch.delete(doc(db, 'system_logs', id));
          }
        });
        await batch.commit();
      }
    } else {
      // Query firestore logs and delete only matching category
      const snap = await getDocs(query(logsRef, limit(400)));
      if (!snap.empty) {
        const batch = writeBatch(db);
        let count = 0;
        snap.forEach((docSnap) => {
          const data = docSnap.data() as SystemLog;
          const logWithId: SystemLog = { ...data, id: docSnap.id };
          if (isLogInCategory(logWithId, targetCat)) {
            batch.delete(docSnap.ref);
            count++;
          }
        });
        if (count > 0) {
          await batch.commit();
        }
      }
    }
  } catch (err) {
    console.warn('[Activity Log] Firestore delete logs by category note:', err);
  }

  return deletedCount;
}

/**
 * Record a system activity log with batch-write capability.
 * ONLY records if actor is a valid authenticated Admin or Superadmin.
 */
export async function recordSystemActivity(params: {
  session: UserSession | null | undefined;
  category: 'PSKS' | 'ADMIN_ACCOUNT' | 'SYSTEM' | string;
  actionType: 'SET' | 'DELETE' | 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'CLEAR' | string;
  targetCollection: 'psks_records' | 'admin_accounts' | 'app_settings' | 'admin_messages' | 'registration_submissions' | string;
  targetId: string;
  targetName?: string;
  targetPillar?: string;
  targetWilayah?: string;
  details: string;
}): Promise<SystemLog | null> {
  const {
    session,
    category,
    actionType,
    targetCollection,
    targetId,
    targetName,
    targetPillar,
    targetWilayah,
    details,
  } = params;

  // STRICT GUARD: Must be authenticated Admin or Superadmin
  if (!isEligibleAdminActor(session)) {
    return null;
  }

  const currentSession = session!;
  const actorRole = currentSession.role === 'superadmin' ? 'superadmin' : 'admin';
  const now = Date.now();
  const logId = `log-${now}-${Math.random().toString(36).substring(2, 7)}`;
  const logData: SystemLog = {
    id: logId,
    timestamp: formatLogTimestamp(new Date(now)),
    createdAt: now,
    actorName: currentSession.nama || (actorRole === 'superadmin' ? 'Superadmin Pusat' : 'Admin Wilayah'),
    actorRole,
    actorWilayah: currentSession.wilayah || 'Jawa Barat',
    category,
    actionType,
    targetCollection,
    targetId,
    targetName,
    targetPillar,
    targetWilayah,
    details,
  };

  // 1. Immediately save to LocalStorage for instant UI feedback
  saveLocalLog(logData);

  // 2. Clean undefined values for database compatibility
  const cleanLogData: Record<string, any> = {};
  Object.keys(logData).forEach((k) => {
    const val = (logData as Record<string, any>)[k];
    if (val !== undefined) {
      cleanLogData[k] = val;
    }
  });

  // 3. Commit to Supabase system_logs
  try {
    await supabase.from('system_logs').upsert({
      id: logId,
      actorName: logData.actorName || '',
      actorRole: logData.actorRole || '',
      actorWilayah: logData.actorWilayah || '',
      actionType: logData.actionType || '',
      category: logData.category || '',
      timestamp: logData.timestamp || '',
      createdAt: new Date(now).toISOString(),
      details: typeof logData.details === 'string' ? logData.details : JSON.stringify(logData.details || {}),
      data: cleanLogData,
    });
  } catch (sbErr) {
    console.warn('[Activity Log] Supabase log write notice:', sbErr);
  }

  // 4. Passive silent commit to Firestore
  try {
    const batch = writeBatch(db);
    const logRef = doc(db, 'system_logs', logId);
    batch.set(logRef, cleanLogData);
    await batch.commit();
  } catch (err) {
    // Non-blocking cold backup
  }

  return logData;
}

/**
 * Instantly wipe all activity logs from LocalStorage, Supabase, and Firestore.
 */
export async function clearAllSystemLogs(): Promise<number> {
  let totalDeleted = 0;

  // 1. Clear LocalStorage immediately and mark as initialized
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(INIT_KEY, 'true');
  } catch (e) {
    console.error('Failed to wipe local logs:', e);
  }

  // 2. Wipe Supabase system_logs
  try {
    const { count } = await supabase.from('system_logs').delete().neq('id', '__keep_none__');
    totalDeleted = count || 0;
  } catch (err) {
    console.warn('[Clear All Logs] Supabase wipe notice:', err);
  }

  // 3. Wipe Firestore collection system_logs in batches of 400
  try {
    const logsRef = collection(db, 'system_logs');
    let hasMore = true;
    while (hasMore) {
      const q = query(logsRef, limit(400));
      const snap = await getDocs(q);
      if (snap.empty) {
        hasMore = false;
        break;
      }
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        totalDeleted++;
      });
      await batch.commit();
      if (snap.size < 400) {
        hasMore = false;
      }
    }
  } catch (err) {
    console.warn('[Clear All Logs] Firestore batch delete note:', err);
  }

  return totalDeleted;
}

/**
 * Auto-purge mechanism: deletes logs older than 30 days in Firestore & LocalStorage
 */
export async function autoPurgeOldLogs(): Promise<number> {
  const cutoffTime = Date.now() - THIRTY_DAYS_MS;
  let purgedCount = 0;

  // 1. Purge from LocalStorage
  try {
    const localLogs = getLocalLogs();
    const freshLogs = localLogs.filter((log) => (log.createdAt || 0) >= cutoffTime);
    if (freshLogs.length !== localLogs.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshLogs));
    }
  } catch (e) {
    console.error('Failed to purge local logs:', e);
  }

  // 2. Purge from Firestore using batch delete (limit 100 per run to minimize quota)
  try {
    const logsRef = collection(db, 'system_logs');
    const oldLogsQuery = query(
      logsRef,
      where('createdAt', '<', cutoffTime),
      limit(100)
    );

    const snapshot = await getDocs(oldLogsQuery);
    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        purgedCount++;
      });
      await batch.commit();
      console.log(`[Auto-Purge] Successfully purged ${purgedCount} expired system logs (>30 days old).`);
    }
  } catch (err) {
    // Quota or network error, fail quietly
    console.warn('[Auto-Purge] Skipped Firestore purge:', err);
  }

  return purgedCount;
}
