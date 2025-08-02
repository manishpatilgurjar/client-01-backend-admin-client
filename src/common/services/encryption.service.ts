import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptData(data: any): {
    encryptedData: string;
    encryptionKey: string;
    iv: string;
    tag: string;
  } {
    try {
      // Generate a random encryption key
      const key = crypto.randomBytes(this.keyLength);
      
      // Generate a random initialization vector
      const iv = crypto.randomBytes(this.ivLength);
      
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(Buffer.from('enquiry-export', 'utf8')); // Additional authenticated data
      
      // Encrypt the data
      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        encryptedData: encrypted,
        encryptionKey: key.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64')
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decryptData(
    encryptedData: string,
    encryptionKey: string,
    iv: string,
    tag: string
  ): any {
    try {
      // Convert base64 strings back to buffers
      const key = Buffer.from(encryptionKey, 'base64');
      const ivBuffer = Buffer.from(iv, 'base64');
      const tagBuffer = Buffer.from(tag, 'base64');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, ivBuffer);
      decipher.setAAD(Buffer.from('enquiry-export', 'utf8')); // Same AAD as encryption
      decipher.setAuthTag(tagBuffer);
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse the JSON data
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure random key for testing
   */
  generateTestKey(): string {
    return crypto.randomBytes(this.keyLength).toString('base64');
  }

  /**
   * Validate encryption parameters
   */
  validateEncryptionParams(
    encryptedData: string,
    encryptionKey: string,
    iv: string,
    tag: string
  ): boolean {
    try {
      // Check if all required parameters are present
      if (!encryptedData || !encryptionKey || !iv || !tag) {
        return false;
      }
      
      // Check if parameters are valid base64
      try {
        Buffer.from(encryptionKey, 'base64');
        Buffer.from(iv, 'base64');
        Buffer.from(tag, 'base64');
      } catch {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
} 