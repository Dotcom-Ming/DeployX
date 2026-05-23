import { encrypt, decrypt } from './crypto';

describe('Crypto Utils', () => {
  const testKey = 'test-encryption-key-32-bytes-long!!';

  describe('encrypt', () => {
    it('should encrypt a string and return base64', () => {
      const plaintext = 'hello world';
      const encrypted = encrypt(plaintext, testKey);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      // Should be base64 encoded
      expect(Buffer.from(encrypted, 'base64')).toBeDefined();
    });

    it('should produce different ciphertext for same input (due to random IV)', () => {
      const plaintext = 'hello world';
      const encrypted1 = encrypt(plaintext, testKey);
      const encrypted2 = encrypt(plaintext, testKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('', testKey);
      expect(encrypted).toBeDefined();
    });

    it('should handle special characters', () => {
      const plaintext = 'hello!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const encrypted = encrypt(plaintext, testKey);
      expect(encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt back to original plaintext', () => {
      const plaintext = 'hello world';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty strings', () => {
      const encrypted = encrypt('', testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(decrypted).toBe('');
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界🌍';
      const encrypted = encrypt(plaintext, testKey);
      const decrypted = decrypt(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw with wrong key', () => {
      const plaintext = 'hello world';
      const encrypted = encrypt(plaintext, testKey);

      expect(() => decrypt(encrypted, 'wrong-key')).toThrow();
    });

    it('should throw with corrupted data', () => {
      expect(() => decrypt('invalid-base64!!!', testKey)).toThrow();
    });
  });
});
