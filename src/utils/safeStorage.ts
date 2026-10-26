/**
 * Safe LocalStorage Utility with 5MB Quota Guard & Auto-Pruning
 * Melindungi aplikasi dari QuotaExceededError dan crash memori browser.
 */

const MAX_SAFE_ITEM_BYTES = 500 * 1024; // 500 KB per item limit

// Daftar cache yang aman untuk dibersihkan secara otomatis jika kuota browser hampir penuh
const PRUNABLE_CACHE_KEYS = [
  'portal_documents_cache_v1',
  'portal_faqs_cache_v1',
  'dinsos_settings_cache_time',
  'psks_deleted_admin_ids',
];

/**
 * Menyimpan data ke LocalStorage dengan proteksi kuota ketat dan penanganan exception yang aman
 */
export function safeSetItem(key: string, value: string, maxBytes = MAX_SAFE_ITEM_BYTES): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  // 1. Cegah string media raksasa (misal video base64 > 500KB) merusak kuota 5MB browser
  const estimatedSize = value.length * 2; // UTF-16 ~2 bytes per char
  if (estimatedSize > maxBytes) {
    console.warn(`[SafeStorage] Ukuran data untuk "${key}" (${Math.round(estimatedSize / 1024)} KB) melebihi batas aman (${Math.round(maxBytes / 1024)} KB). Penyimpanan dibatalkan demi stabilitas sistem.`);
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaExceeded =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;

    if (isQuotaExceeded) {
      console.warn('[SafeStorage] Kuota LocalStorage 5MB tercapai! Menjalankan pembersihan cache sementara...');
      // Bersihkan cache non-kritis
      try {
        for (const prunableKey of PRUNABLE_CACHE_KEYS) {
          if (prunableKey !== key) {
            localStorage.removeItem(prunableKey);
          }
        }
        // Coba simpan kembali setelah pembersihan cache
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.error('[SafeStorage] Gagal menyimpan data bahkan setelah pembersihan cache:', retryErr);
        return false;
      }
    }

    console.warn(`[SafeStorage] Gagal menulis ke LocalStorage [${key}]:`, err);
    return false;
  }
}

/**
 * Membaca data dari LocalStorage dengan perlindungan error
 */
export function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Gagal membaca LocalStorage [${key}]:`, err);
    return null;
  }
}

/**
 * Menghapus data dari LocalStorage secara aman
 */
export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Gagal menghapus LocalStorage [${key}]:`, err);
  }
}

/**
 * Menghitung perkiraan penggunaan LocalStorage saat ini
 */
export function getLocalStorageUsage(): { usedBytes: number; usedKb: number; percentage: number } {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { usedBytes: 0, usedKb: 0, percentage: 0 };
  }
  try {
    let totalChars = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        const v = localStorage.getItem(k) || '';
        totalChars += k.length + v.length;
      }
    }
    const usedBytes = totalChars * 2; // UTF-16
    const usedKb = Math.round(usedBytes / 1024);
    const quotaBytes = 5 * 1024 * 1024; // 5MB standard browser quota
    const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
    return { usedBytes, usedKb, percentage };
  } catch {
    return { usedBytes: 0, usedKb: 0, percentage: 0 };
  }
}
