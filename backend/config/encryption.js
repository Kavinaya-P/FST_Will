const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Get or derive encryption key
const getKey = () => {
  const keyStr = process.env.VAULT_ENCRYPTION_KEY;
  if (!keyStr) throw new Error('VAULT_ENCRYPTION_KEY not set in environment');
  // Ensure exactly 32 bytes using SHA-256
  return crypto.createHash('sha256').update(keyStr).digest();
};

/**
 * Encrypt plaintext string → returns base64 encoded string
 * Format: iv(16) + authTag(16) + ciphertext
 */
const encrypt = (plaintext) => {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine iv + authTag + encrypted into single buffer
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
};

/**
 * Decrypt base64 encoded string → returns plaintext
 */
const decrypt = (encryptedBase64) => {
  const key = getKey();
  const combined = Buffer.from(encryptedBase64, 'base64');

  const iv       = combined.slice(0, IV_LENGTH);
  const authTag  = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

module.exports = { encrypt, decrypt };
