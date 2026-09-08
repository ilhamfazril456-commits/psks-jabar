import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AdminAccount } from '../types';

export interface QuotaInfo {
  registeredAccounts: string[];
  count: number;
  isQuotaFull: boolean;
  ip: string;
  deviceId: string;
  isRealtimeSynced: boolean;
}

// Generate deterministic device fingerprint hash
function generateFingerprintHash(): string {
  try {
    const nav = typeof window !== 'undefined' ? window.navigator : null;
    const scr = typeof window !== 'undefined' ? window.screen : null;
    if (!nav || !scr) return 'dev_' + Date.now();

    const parts = [
      nav.userAgent || '',
      nav.language || '',
      scr.width || 0,
      scr.height || 0,
      scr.colorDepth || 0,
      nav.hardwareConcurrency || 0,
      nav.platform || '',
    ];
    const str = parts.join('###');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 'dev_fp_' + Math.abs(hash).toString(36);
  } catch {
    return 'dev_' + Date.now();
  }
}

// Resilient cookie helper
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 730) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Truly unique device identifier generated randomly per device/browser and permanently preserved
function generateUniqueRandomDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'dev_' + crypto.randomUUID().replace(/-/g, '');
  }
  return (
    'dev_' +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8)
  );
}

// Stable, permanent device identifier (stored across Cookie and LocalStorage)
export function getStableDeviceId(): string {
  if (typeof window === 'undefined') return 'dev_server';

  try {
    // 1. Check existing cookie
    const cookieId = getCookie('simpsks_device_uuid');
    if (cookieId && cookieId.trim().length > 3) {
      try {
        localStorage.setItem('simpsks_device_uuid', cookieId.trim());
      } catch {}
      return cookieId.trim();
    }

    // 2. Check localStorage
    const localId = localStorage.getItem('simpsks_device_uuid');
    if (localId && localId.trim().length > 3) {
      setCookie('simpsks_device_uuid', localId.trim());
      return localId.trim();
    }

    // 3. New device: generate a truly unique random device UUID so NO TWO DEVICES ever collide
    const newId = generateUniqueRandomDeviceId();
    try {
      localStorage.setItem('simpsks_device_uuid', newId);
    } catch {}
    setCookie('simpsks_device_uuid', newId);
    return newId;
  } catch {
    return 'dev_' + Date.now();
  }
}

// Check if IP is private/loopback
export function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip) return true;
  const trimmed = ip.trim().toLowerCase();
  return (
    trimmed === '' ||
    trimmed === '127.0.0.1' ||
    trimmed === '::1' ||
    trimmed === 'localhost' ||
    trimmed.startsWith('10.') ||
    trimmed.startsWith('192.168.') ||
    trimmed.startsWith('172.16.') ||
    trimmed.startsWith('172.17.') ||
    trimmed.startsWith('172.18.') ||
    trimmed.startsWith('172.19.') ||
    trimmed.startsWith('172.20.') ||
    trimmed.startsWith('172.21.') ||
    trimmed.startsWith('172.22.') ||
    trimmed.startsWith('172.23.') ||
    trimmed.startsWith('172.24.') ||
    trimmed.startsWith('172.25.') ||
    trimmed.startsWith('172.26.') ||
    trimmed.startsWith('172.27.') ||
    trimmed.startsWith('172.28.') ||
    trimmed.startsWith('172.29.') ||
    trimmed.startsWith('172.30.') ||
    trimmed.startsWith('172.31.') ||
    trimmed === 'unknown'
  );
}

// Detect client public IP with fallback chain
export async function detectClientIp(): Promise<string> {
  if (typeof window === 'undefined') return '';

  // 1. Check session storage cache
  const cached = sessionStorage.getItem('simpsks_client_ip');
  if (cached && !isPrivateOrLocalIp(cached)) {
    return cached;
  }

  let finalIp = '';

  // 2. Try server endpoint
  try {
    const res = await fetch('/api/client-ip');
    if (res.ok) {
      const data = await res.json();
      if (data.ip && !isPrivateOrLocalIp(data.ip)) {
        finalIp = data.ip.trim();
      } else if (data.ip) {
        finalIp = data.ip.trim(); // fallback if intranet
      }
    }
  } catch {}

  // 3. Try public ipify if server IP is private or empty
  if (!finalIp || isPrivateOrLocalIp(finalIp)) {
    try {
      const res2 = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.ip) {
          finalIp = data2.ip.trim();
        }
      }
    } catch {
      try {
        const res3 = await fetch('https://api64.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
        if (res3.ok) {
          const data3 = await res3.json();
          if (data3.ip) {
            finalIp = data3.ip.trim();
          }
        }
      } catch {}
    }
  }

  // Store in cache if valid public IP
  if (finalIp && !isPrivateOrLocalIp(finalIp)) {
    try {
      sessionStorage.setItem('simpsks_client_ip', finalIp);
      localStorage.setItem('simpsks_last_known_ip', finalIp);
    } catch {}
  } else {
    // If private or loopback, do not populate fallback to 127.0.0.1 to avoid pooling users together
    finalIp = '';
  }

  return finalIp;
}

// Helper to sanitize Firestore document ID
export function getSafeIpDocId(ip: string): string {
  const clean = (ip || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ip_${clean}`;
}

export function getSafeDeviceDocId(deviceId: string): string {
  const clean = (deviceId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `dev_${clean}`;
}

/**
 * Record a new account registration atomically in Firestore and local storage.
 * Strictly registers against this specific deviceId and this specific public IP.
 */
export async function recordAccountRegistration(
  username: string,
  ip: string,
  deviceId: string,
  adminId?: string
): Promise<void> {
  const uname = username.trim();
  if (!uname) return;

  const nowIso = new Date().toISOString();
  const hasValidPublicIp = Boolean(ip && !isPrivateOrLocalIp(ip));

  // 1. Update local storage device tracking
  try {
    const raw = localStorage.getItem('simpsks_device_registered_accounts');
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.some((u) => u.toLowerCase() === uname.toLowerCase())) {
      list.push(uname);
      localStorage.setItem('simpsks_device_registered_accounts', JSON.stringify(list));
    }
  } catch {}

  // 2. Persist to Firestore: Device document (dev_${cleanDeviceId})
  if (deviceId) {
    try {
      const devDocRef = doc(db, 'ip_registrations', getSafeDeviceDocId(deviceId));
      const devSnap = await getDoc(devDocRef);
      let existingList: string[] = [];
      if (devSnap.exists()) {
        existingList = devSnap.data().registeredAccounts || [];
      }
      if (!existingList.some((u) => u.toLowerCase() === uname.toLowerCase())) {
        existingList.push(uname);
      }
      await setDoc(
        devDocRef,
        {
          identifier: deviceId,
          type: 'device',
          registeredAccounts: existingList,
          count: existingList.length,
          lastRegisteredAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Device Registration] Error updating Device doc in Firestore:', err);
    }
  }

  // 3. Persist to Firestore: IP document ONLY IF this is a genuine public IP
  if (hasValidPublicIp) {
    try {
      const ipDocRef = doc(db, 'ip_registrations', getSafeIpDocId(ip));
      const ipSnap = await getDoc(ipDocRef);
      let existingList: string[] = [];
      if (ipSnap.exists()) {
        existingList = ipSnap.data().registeredAccounts || [];
      }
      if (!existingList.some((u) => u.toLowerCase() === uname.toLowerCase())) {
        existingList.push(uname);
      }
      await setDoc(
        ipDocRef,
        {
          identifier: ip,
          type: 'ip',
          registeredAccounts: existingList,
          count: existingList.length,
          lastRegisteredAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[IP Registration] Error updating IP doc in Firestore:', err);
    }
  }

  // 4. Ensure admin_accounts record has registeredIp and deviceId
  if (adminId) {
    try {
      const accRef = doc(db, 'admin_accounts', adminId);
      await setDoc(
        accRef,
        {
          registeredIp: hasValidPublicIp ? ip : undefined,
          deviceId: deviceId || undefined,
        },
        { merge: true }
      );
    } catch {}
  }

  // Trigger event for UI components to re-evaluate
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('simpsks_device_accounts_changed'));
  }
}

/**
 * Prune account when deleted by Admin so quota is refunded/decremented.
 */
export async function removeAccountFromQuota(
  username: string,
  ip?: string,
  deviceId?: string
): Promise<void> {
  const uname = username.trim().toLowerCase();
  if (!uname) return;

  const hasValidPublicIp = Boolean(ip && !isPrivateOrLocalIp(ip));

  // 1. Update localStorage
  try {
    const raw = localStorage.getItem('simpsks_device_registered_accounts');
    if (raw) {
      const list: string[] = JSON.parse(raw);
      const filtered = list.filter((u) => u.toLowerCase() !== uname);
      localStorage.setItem('simpsks_device_registered_accounts', JSON.stringify(filtered));
    }
  } catch {}

  // 2. Remove from Firestore Device doc
  if (deviceId) {
    try {
      const devDocRef = doc(db, 'ip_registrations', getSafeDeviceDocId(deviceId));
      const devSnap = await getDoc(devDocRef);
      if (devSnap.exists()) {
        const existing: string[] = devSnap.data().registeredAccounts || [];
        const filtered = existing.filter((u) => u.toLowerCase() !== uname);
        await setDoc(
          devDocRef,
          {
            registeredAccounts: filtered,
            count: filtered.length,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch {}
  }

  // 3. Remove from Firestore IP doc ONLY IF valid public IP
  if (hasValidPublicIp && ip) {
    try {
      const ipDocRef = doc(db, 'ip_registrations', getSafeIpDocId(ip));
      const ipSnap = await getDoc(ipDocRef);
      if (ipSnap.exists()) {
        const existing: string[] = ipSnap.data().registeredAccounts || [];
        const filtered = existing.filter((u) => u.toLowerCase() !== uname);
        await setDoc(
          ipDocRef,
          {
            registeredAccounts: filtered,
            count: filtered.length,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('simpsks_device_accounts_changed'));
  }
}

/**
 * Reconcile helper: kept as a safe no-op to ensure backward compatibility with any external callers.
 * No accounts are forcibly injected into any user's quota.
 */
export async function reconcileDeviceAndIpQuota(
  _detectedIp?: string,
  _deviceId?: string,
  _adminAccounts?: AdminAccount[]
): Promise<void> {
  // Deprecated: No-op. Quota is strictly calculated per-device and per-public-IP.
}

/**
 * Real-time Quota Subscription
 * Listens to Firestore ip_registrations documents for THIS client's current IP and Device ONLY.
 * Cross-references with active user accounts in adminAccounts.
 * Other users / devices NEVER share quota unless they are literally on the exact same device or public IP.
 */
export function subscribeToClientQuota(
  _ip: string,
  deviceId: string,
  adminAccounts: AdminAccount[],
  callback: (info: QuotaInfo) => void
): () => void {
  let deviceRegisteredAccounts: string[] = [];
  let isSubscribed = true;

  const evaluate = () => {
    if (!isSubscribed) return;

    // 1. Local device storage
    let localList: string[] = [];
    try {
      const raw = localStorage.getItem('simpsks_device_registered_accounts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localList = parsed;
        }
      }
    } catch {}

    // Map: normalized lowercase username -> canonical display username
    const normalizedMap = new Map<string, string>();
    const cleanLocalList: string[] = [];
    let localModified = false;

    // Filter local storage: purge accounts that belong to a different device or were deleted in DB
    if (adminAccounts && adminAccounts.length > 0) {
      localList.forEach((rawUname) => {
        const cleanLower = String(rawUname || '').toLowerCase().trim();
        if (!cleanLower) return;

        const match = adminAccounts.find(
          (a) => a.role === 'user' && (a.username || '').toLowerCase().trim() === cleanLower
        );

        if (match) {
          // If the account in DB explicitly belongs to a DIFFERENT deviceId, purge it from this device
          if (match.deviceId && deviceId && match.deviceId !== deviceId) {
            localModified = true;
            return;
          }
          cleanLocalList.push(match.username.trim());
          normalizedMap.set(cleanLower, match.username.trim());
        } else {
          // Account was deleted in DB
          localModified = true;
        }
      });

      if (localModified) {
        try {
          localStorage.setItem('simpsks_device_registered_accounts', JSON.stringify(cleanLocalList));
        } catch {}
      }
    } else {
      localList.forEach((rawUname) => {
        const cleanLower = String(rawUname || '').toLowerCase().trim();
        if (cleanLower) {
          normalizedMap.set(cleanLower, String(rawUname).trim());
        }
      });
    }

    // 2. Firestore device doc accounts for THIS specific device (dev_${deviceId})
    deviceRegisteredAccounts.forEach((rawUname) => {
      const cleanLower = String(rawUname || '').toLowerCase().trim();
      if (!cleanLower || normalizedMap.has(cleanLower)) return;

      if (adminAccounts && adminAccounts.length > 0) {
        const match = adminAccounts.find(
          (a) => a.role === 'user' && (a.username || '').toLowerCase().trim() === cleanLower
        );
        // STRICT: Only include if account still exists in DB and belongs to THIS device
        if (match) {
          if (match.deviceId && deviceId && match.deviceId !== deviceId) {
            return; // Belongs to another device
          }
          normalizedMap.set(cleanLower, match.username.trim());
        }
      } else {
        normalizedMap.set(cleanLower, String(rawUname).trim());
      }
    });

    // 3. Database accounts explicitly tagged with THIS deviceId
    if (deviceId && adminAccounts && adminAccounts.length > 0) {
      adminAccounts.forEach((acc) => {
        if (acc.role === 'user' && acc.deviceId && acc.deviceId === deviceId && acc.username) {
          const cleanLower = acc.username.toLowerCase().trim();
          if (cleanLower && !normalizedMap.has(cleanLower)) {
            normalizedMap.set(cleanLower, acc.username.trim());
          }
        }
      });
    }

    const validAccounts = Array.from(normalizedMap.values()).slice(0, 3);
    const count = validAccounts.length;

    callback({
      registeredAccounts: validAccounts,
      count,
      isQuotaFull: count >= 3,
      ip: '',
      deviceId,
      isRealtimeSynced: true,
    });
  };

  // Initial evaluation
  evaluate();

  // Subscribe to THIS Device document in Firestore
  let unsubDev: (() => void) | null = null;
  if (deviceId) {
    try {
      const devDocRef = doc(db, 'ip_registrations', getSafeDeviceDocId(deviceId));
      unsubDev = onSnapshot(
        devDocRef,
        (snap) => {
          if (snap.exists()) {
            deviceRegisteredAccounts = snap.data().registeredAccounts || [];
          } else {
            deviceRegisteredAccounts = [];
          }
          evaluate();
        },
        () => {
          evaluate();
        }
      );
    } catch {}
  }

  // Listen to local window events
  const handleLocalChange = () => {
    evaluate();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('simpsks_device_accounts_changed', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);
  }

  return () => {
    isSubscribed = false;
    if (unsubDev) unsubDev();
    if (typeof window !== 'undefined') {
      window.removeEventListener('simpsks_device_accounts_changed', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
    }
  };
}
