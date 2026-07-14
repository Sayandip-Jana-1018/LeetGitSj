import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const ENCODING = "hex" as const;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars)");
  }
  return buf;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a combined string: iv:authTag:ciphertext (all hex-encoded).
 * Each encryption uses a fresh random IV — never reuses nonces.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);

  const authTag = cipher.getAuthTag().toString(ENCODING);

  // Combined format: iv:tag:ciphertext
  return `${iv.toString(ENCODING)}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string encrypted by encrypt().
 * Verifies the auth tag — throws if data has been tampered with.
 */
export function decrypt(encryptedString: string): string {
  const key = getKey();
  const parts = encryptedString.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted string format — expected iv:tag:ciphertext");
  }

  const [ivHex, tagHex, ciphertextHex] = parts;

  const iv = Buffer.from(ivHex, ENCODING);
  const authTag = Buffer.from(tagHex, ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, ENCODING, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
