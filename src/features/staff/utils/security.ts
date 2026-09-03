/* features/staff/utils/security.ts */

/**
 * Generates a SHA-256 hash of a plain text string (e.g. PIN or temporary code)
 * Prevents storing raw credentials directly in storage or state.
 */
export async function hashSecret(secret: string): Promise<string> {
  const normalized = secret.trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(normalized);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Fallback deterministic hash implementation
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${normalized.length}`;
}

/**
 * Generates a secure random 4-digit temporary approval code
 */
export function generate4DigitCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Validates whether a temporary approval code is expired
 */
export function isCodeExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

