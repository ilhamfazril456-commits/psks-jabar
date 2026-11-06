import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Resilient Stale-Chunk & Deployment Handler (Standard Enterprise SPA Pattern)
if (typeof window !== 'undefined') {
  const trySmoothReload = () => {
    const reloadKey = 'psks_chunk_reload_lock';
    const last = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!last || now - parseInt(last, 10) > 10000) {
      sessionStorage.setItem(reloadKey, String(now));
      console.warn('[PSKS App] Pembaruan versi rilis baru terdeteksi. Memuat ulang halaman...');
      window.location.reload();
    }
  };

  // 1. Resmi dari Vite: Tangani preload error ketika deployment baru mengganti hash file .js
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    trySmoothReload();
  });

  // 2. Tangkap unhandled rejection yang disebabkan oleh dynamic import 404
  window.addEventListener('unhandledrejection', (event) => {
    const msg = (event.reason?.message || String(event.reason || '')).toLowerCase();
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('error loading')
    ) {
      event.preventDefault();
      trySmoothReload();
      return;
    }

    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.reason?.message || String(event.reason || 'Unhandled promise rejection'),
          stack: event.reason?.stack,
          url: window.location.href,
        }),
      }).catch(() => {});
    } catch {}
  });

  // 3. Global uncaught error listener
  window.addEventListener('error', (event) => {
    const msg = (event.message || '').toLowerCase();
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('error loading')
    ) {
      event.preventDefault();
      trySmoothReload();
      return;
    }

    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.message || 'Window error',
          stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
          url: window.location.href,
        }),
      }).catch(() => {});
    } catch {}
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Aplikasi PSKS Jawa Barat">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
