const crypto = require('crypto');

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Gets encryption key from environment
 * @returns {Buffer} 32-byte encryption key
 */
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables');
  }

  // Ensure key is exactly 32 bytes (256 bits)
  // If key is shorter, hash it; if longer, truncate the hash
  const hash = crypto.createHash('sha256').update(key).digest();
  return hash;
};

/**
 * Encrypt a string value using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted string in format: iv:authTag:encryptedData (all hex encoded)
 */
const encrypt = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input for encryption');
  }

  try {
    const key = getEncryptionKey();

    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt an encrypted string using AES-256-GCM
 * @param {string} encryptedText - Encrypted string in format: iv:authTag:encryptedData
 * @returns {string} - Decrypted plain text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Invalid input for decryption');
  }

  try {
    const key = getEncryptionKey();

    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Converts hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Decryption failed - data may be corrupted or tampered with');
  }
};

module.exports = { encrypt, decrypt };
