/**
 * Government Security & Diskominfo/BSSN Compliance Helper for Vercel Serverless Endpoints.
 * Enforces:
 * 1. Strict Origin-Restricted CORS (Eliminates CWE-942 Wildcard '*' Vulnerability)
 * 2. Sliding-Window Rate Limiting & Anti-Brute-Force Lockout (Eliminates CWE-307 Brute-Force Vulnerability)
 * 3. Standard HTTP Security Headers (X-Content-Type-Options, Strict Referrer Policy)
 */

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lockUntil: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.firstAttempt + 15 * 60 * 1000 && now > record.lockUntil) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.run\.app$/,
  /^https:\/\/ai\.studio$/,
  /^https:\/\/.*\.jabarprov\.go\.id$/,
  /^https:\/\/.*\.dinsos\.jabarprov\.go\.id$/,
];

export function setDiskominfoCorsHeaders(req: any, res: any): boolean {
  const origin = req.headers?.origin || '';
  const referer = req.headers?.referer || '';

  let matchedOrigin = '';
  if (origin) {
    const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
    if (isAllowed) {
      matchedOrigin = origin;
    }
  } else if (referer) {
    try {
      const url = new URL(referer);
      const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(url.origin));
      if (isAllowed) {
        matchedOrigin = url.origin;
      }
    } catch {}
  }

  // If matched, reflect only the authorized origin (No wildcard '*')
  if (matchedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', matchedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Direct same-origin or server-to-server requests without Origin header
    res.setHeader('Access-Control-Allow-Origin', 'https://psks-jabar.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // handled
  }

  return false;
}

export function checkRateLimit(
  scope: string,
  ip: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000,
  lockoutMs: number = 5 * 60 * 1000
): { allowed: boolean; remaining: number; waitSeconds: number } {
  const key = `${scope}:${ip}`;
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { attempts: 0, firstAttempt: now, lockUntil: 0 };
    rateLimitStore.set(key, record);
  }

  // Check if currently locked out
  if (record.lockUntil > now) {
    const waitSeconds = Math.ceil((record.lockUntil - now) / 1000);
    return { allowed: false, remaining: 0, waitSeconds };
  }

  // Reset window if expired
  if (now > record.firstAttempt + windowMs) {
    record.attempts = 0;
    record.firstAttempt = now;
    record.lockUntil = 0;
  }

  const remaining = Math.max(0, maxAttempts - record.attempts);
  return { allowed: true, remaining, waitSeconds: 0 };
}

export function recordFailedRateLimitAttempt(
  scope: string,
  ip: string,
  maxAttempts: number = 5,
  lockoutMs: number = 5 * 60 * 1000
): { locked: boolean; waitSeconds: number; remaining: number } {
  const key = `${scope}:${ip}`;
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { attempts: 0, firstAttempt: now, lockUntil: 0 };
    rateLimitStore.set(key, record);
  }

  record.attempts += 1;

  if (record.attempts >= maxAttempts) {
    record.lockUntil = now + lockoutMs;
    const waitSeconds = Math.ceil(lockoutMs / 1000);
    return { locked: true, waitSeconds, remaining: 0 };
  }

  return {
    locked: false,
    waitSeconds: 0,
    remaining: Math.max(0, maxAttempts - record.attempts),
  };
}

export function clearRateLimit(scope: string, ip: string): void {
  const key = `${scope}:${ip}`;
  rateLimitStore.delete(key);
}
