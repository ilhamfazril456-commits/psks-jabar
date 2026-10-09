import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Global uncaught error listener to forward issues to server for diagnostics
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
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

  window.addEventListener('unhandledrejection', (event) => {
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
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Aplikasi PSKS Jawa Barat">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
