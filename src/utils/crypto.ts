/**
 * Cryptographic utility functions
 * Provides secure random ID generation using the Web Crypto API
 */

/**
 * Generates a cryptographically secure random ID
 * Uses crypto.randomUUID() when available, falls back to getRandomValues()
 * @param length - Length of the random part (default: 9)
 * @returns A secure random string
 */
export function generateSecureId(length: number = 9): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, length);
  }
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => b.toString(36))
    .join('');
}
