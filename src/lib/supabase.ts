import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export const SUPABASE_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  'https://zwjbjmafxixudhlvaxef.supabase.co';

export const SUPABASE_ANON_KEY: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_PUBLISHABLE_KEY) ||
  'sb_publishable_-Q49NtwnUsY9oF3jpRXEmw_J82UN4Uy';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Safely subscribe to a Supabase Realtime channel.
 * Guarantees that if WebSockets are blocked or unavailable (e.g. by CSP, VPN, proxy, or firewall),
 * the app NEVER crashes or throws "WebSocket not available", and gracefully continues
 * operating via standard high-speed HTTP REST.
 */
export function safeSubscribeRealtime(channel: RealtimeChannel): () => void {
  try {
    channel.subscribe((status, err) => {
      if (err) {
        console.warn('[Realtime status warning]:', status, err?.message || err);
      }
    });
    return () => {
      try {
        channel.unsubscribe();
      } catch {}
    };
  } catch (err) {
    console.warn('[Realtime WebSocket safely bypassed]:', err);
    return () => {};
  }
}

export default supabase;
