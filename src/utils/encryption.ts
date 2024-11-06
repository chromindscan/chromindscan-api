import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Make sure this key is in your .env file
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is required in environment variables');
}

const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  try {
    // Convert the encryption key to buffer
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    // Generate initialization vector
    const iv = randomBytes(16);
    
    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted text
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decrypt(encryptedData: string): string {
  try {
    // Split the encrypted data into components
    const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
    
    // Convert the encryption key to buffer
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    // Convert IV and auth tag back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}