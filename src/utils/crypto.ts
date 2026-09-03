import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

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
