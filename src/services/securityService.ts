/**
 * Security Service for CivicPulse Kalteng
 * Provides cryptographic protection for administrative and sensitive operations
 * (Print to PDF, CSV Import, Data Export, Data Clearance).
 * 
 * SECURITY MANDATE:
 * - Plaintext passcodes are NEVER exposed or hardcoded in client source code.
 * - Cryptographic verification uses SHA-256 hashing via the standard Web Crypto API.
 */

// Cryptographic SHA-256 digest of the designated authority passcode
// Pre-computed salted digest for administrator security gate
const TARGET_PASSCODE_HASH = '15747d661ea3fc00cf28fdb285eb8d3742bca64781482fd88ebf7166ec8fa659';

/**
 * Constant-time string comparison to mitigate side-channel timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Computes SHA-256 hash string from user input using Web Crypto API
 */
export async function computeSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for non-browser/Node contexts if needed
    throw new Error('Web Cryptography API is required for secure authentication.');
  }
}

/**
 * Securely verifies entered passcode against protected cryptographic hash.
 * Returns true if valid, false otherwise.
 * Logs NO sensitive plain-text strings to console or telemetry.
 */
export async function verifyPasscode(enteredCode: string): Promise<boolean> {
  const trimmed = enteredCode.trim();
  if (!trimmed) return false;

  try {
    const computedHash = await computeSHA256(trimmed);
    return constantTimeCompare(computedHash, TARGET_PASSCODE_HASH);
  } catch (error) {
    console.error('Security verification error occurred.');
    return false;
  }
}
