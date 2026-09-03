/**
 * Privacy & Security Utilities compliant with UU PDP (UU No. 27/2022)
 * Masks sensitive personal data (NIK, Phone Number, Email) for public viewing
 */

/**
 * Mask National Identification Number (NIK).
 * E.g., "3204281234560001" -> "320428******0001"
 */
export function maskNIK(nik?: string): string {
  if (!nik || typeof nik !== 'string') return '-';
  const clean = nik.trim();
  if (clean.length <= 6) return clean;
  if (clean.length === 16) {
    return `${clean.substring(0, 6)}******${clean.substring(12)}`;
  }
  const prefixLen = Math.min(4, Math.floor(clean.length / 3));
  const suffixLen = Math.min(4, Math.floor(clean.length / 3));
  const maskedMiddle = '*'.repeat(Math.max(4, clean.length - prefixLen - suffixLen));
  return `${clean.substring(0, prefixLen)}${maskedMiddle}${clean.substring(clean.length - suffixLen)}`;
}

/**
 * Mask Phone Number (HP).
 * E.g., "081234567890" -> "0812****7890"
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone || typeof phone !== 'string') return '-';
  const clean = phone.trim();
  if (clean.length <= 6) return clean;
  if (clean.length >= 10) {
    return `${clean.substring(0, 4)}****${clean.substring(clean.length - 4)}`;
  }
  return `${clean.substring(0, 2)}****${clean.substring(clean.length - 2)}`;
}

/**
 * Mask Email Address.
 * E.g., "dinsos_user@jabarprov.go.id" -> "di****r@jabarprov.go.id"
 */
export function maskEmail(email?: string): string {
  if (!email || typeof email !== 'string') return '-';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name}*@${domain}`;
  }
  return `${name.substring(0, 2)}****${name.substring(name.length - 1)}@${domain}`;
}
