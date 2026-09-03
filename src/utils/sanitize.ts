/**
 * Sanitization and XSS Prevention Utilities
 * Compliant with OWASP Top 10 and Diskominfo Security Standards
 */

/**
 * Strips dangerous HTML tags and encodes special characters to mitigate Stored & Reflected XSS.
 */
export function sanitizeInputText(input?: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Strips script, iframe, and javascript: URIs completely from raw strings.
 */
export function stripDangerousTags(raw?: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onclick\s*=/gi, '');
}
