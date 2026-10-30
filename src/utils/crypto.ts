import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

const SALT_ROUNDS = 10;

// Internal master encryption secret for PII fields (NIK & No WhatsApp)
// Prevents plaintext exposure in Firestore Console, Supabase Table Editor, or database dumps
const PII_SECRET_KEY =
  (typeof process !== 'undefined' && (process.env?.PII_SECRET_KEY || process.env?.SESSION_SECRET)) ||
  'PSKS_JABAR_AES256_PII_SECRET_KEY_998822';

/**
 * Encrypt / Hash a plain text password using bcrypt algorithm.
 */
export function hashPassword(plainText: string): string {
  if (!plainText) return '';
  return bcrypt.hashSync(plainText, SALT_ROUNDS);
}

/**
 * Compare a plain text password attempt with a stored bcrypt hash (or fallback plain text).
 */
export function comparePassword(plainText: string, storedHashOrPlain?: string): boolean {
  if (!plainText || !storedHashOrPlain) return false;

  // Check if stored string is a valid bcrypt hash format ($2a$, $2b$, or $2y$)
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedHashOrPlain);

  if (isBcryptHash) {
    try {
      return bcrypt.compareSync(plainText, storedHashOrPlain);
    } catch {
      return false;
    }
  }

  // Legacy fallback if hash is missing
  return plainText === storedHashOrPlain;
}

/**
 * Encrypt sensitive Personal Identifiable Information (PII) using AES-256.
 * Result is stored with prefix "ENC::" to designate ciphertext.
 */
export function encryptSensitiveData(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const trimmed = plainText.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('ENC::')) return trimmed; // Already encrypted

  try {
    const encrypted = CryptoJS.AES.encrypt(trimmed, PII_SECRET_KEY).toString();
    return `ENC::${encrypted}`;
  } catch (err) {
    console.error('[Crypto] Encryption error:', err);
    return trimmed;
  }
}

/**
 * Decrypt sensitive Personal Identifiable Information (PII) encrypted with AES-256.
 */
export function decryptSensitiveData(cipherOrPlain: string): string {
  if (!cipherOrPlain || typeof cipherOrPlain !== 'string') return '';
  const trimmed = cipherOrPlain.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('ENC::')) return trimmed; // Not encrypted

  try {
    const cipherBody = trimmed.slice(5);
    const bytes = CryptoJS.AES.decrypt(cipherBody, PII_SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || trimmed;
  } catch (err) {
    console.warn('[Crypto] Decryption error:', err);
    return trimmed;
  }
}

/**
 * Deterministic cryptographic hash for search & duplicate prevention.
 * Enables duplicate NIK verification without storing or decrypting the raw NIK in plaintext queries.
 */
export function hashSearchableField(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  const raw = decryptSensitiveData(plainText).trim();
  if (!raw) return '';
  return CryptoJS.SHA256(`psks_field_${raw}`).toString(CryptoJS.enc.Hex);
}

/**
 * Mask citizen NIK for secure, compliant frontend display (UU PDP & ISO 27001 Compliance).
 * Example: "3201123456789012" -> "3201************"
 */
export function maskNik(nikOrEncrypted: string): string {
  if (!nikOrEncrypted) return '-';
  const clean = decryptSensitiveData(nikOrEncrypted).trim();
  if (!clean) return '-';
  if (clean.length <= 4) return '****';
  const prefix = clean.slice(0, 4);
  const asterisks = '*'.repeat(Math.max(4, clean.length - 4));
  return `${prefix}${asterisks}`;
}

/**
 * Mask citizen / admin WhatsApp phone number for secure display.
 * Example: "089602421065" -> "0896******65"
 */
export function maskPhone(phoneOrEncrypted: string): string {
  if (!phoneOrEncrypted) return '-';
  const clean = decryptSensitiveData(phoneOrEncrypted).trim().replace(/[\s-]/g, '');
  if (!clean) return '-';
  if (clean.length <= 6) return clean.slice(0, 2) + '****';
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-2);
  const maskedCount = Math.max(3, clean.length - 6);
  return `${prefix}${'*'.repeat(maskedCount)}${suffix}`;
}
