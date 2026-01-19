/**
 * Cryptographic utility functions
 * Provides secure random ID generation using Web Crypto API
 */

/**
 * Generate a cryptographically secure random ID
 *
 * Uses crypto.randomUUID() when available (modern browsers),
 * falls back to crypto.getRandomValues() for broader compatibility.
 *
 * @param length - Length of the random portion (default: 9)
 * @returns A cryptographically secure random string
 *
 * @example
 * ```ts
 * generateSecureId() // "a1b2c3d4e"
 * generateSecureId(12) // "a1b2c3d4e5f6"
 * ```
 */
export function generateSecureId(length: number = 9): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, length);
  }
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map((b) => b.toString(36))
    .join('');
}
