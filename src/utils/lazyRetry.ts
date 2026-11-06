import React from 'react';

/**
 * Resilient Dynamic Import with Stale Chunk Auto-Recovery
 * Mencegah kegagalan navigasi modul setelah deployment baru di Vercel.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const msg = (err?.message || String(err || '')).toLowerCase();
      const isChunkError =
        msg.includes('dynamically imported module') ||
        msg.includes('failed to fetch dynamically imported module') ||
        msg.includes('loading chunk') ||
        msg.includes('error loading');

      if (isChunkError && typeof window !== 'undefined') {
        const reloadKey = 'psks_lazy_reload_lock';
        const last = sessionStorage.getItem(reloadKey);
        const now = Date.now();
        if (!last || now - parseInt(last, 10) > 10000) {
          sessionStorage.setItem(reloadKey, String(now));
          window.location.reload();
          // Kembalikan promise kosong yang tidak pernah resolve agar tidak melempar crash saat reload berjalan
          return new Promise(() => {});
        }
      }
      throw err;
    }
  });
}
