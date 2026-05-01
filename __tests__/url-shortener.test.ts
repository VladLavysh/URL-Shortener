import { createShortUrl, decodeUrl } from '../index';
import { encodeId, decodeShortUrl, buildShortUrl } from '../utils';

describe('URL Shortener', () => {
  describe('createShortUrl', () => {
    it('should create a short URL with default domain', async () => {
      const longUrl = 'https://example.com/very/long/path';
      const shortUrl = await createShortUrl(longUrl, 'short.url');
      
      expect(shortUrl).toContain('short.url/r/');
      expect(shortUrl.startsWith('short.url/r/')).toBeTruthy();
    });

    it('should create a short URL with custom domain', async () => {
      const longUrl = 'https://example.com/very/long/path';
      const domain = 'custom.domain';
      const shortUrl = await createShortUrl(longUrl, domain);
      
      expect(shortUrl).toContain(`${domain}/r/`);
      expect(shortUrl.startsWith(`${domain}/r/`)).toBeTruthy();
    });

    it('should create the same short URL for the same long URL', async () => {
      const longUrl = 'https://example.com/very/long/path';
      const domain = 'test.domain';
      
      const shortUrl1 = await createShortUrl(longUrl, domain);
      const shortUrl2 = await createShortUrl(longUrl, domain);
      
      // With collision detection, the same URL should produce the same hash
      // The collision detection only triggers when different URLs produce the same hash
      expect(shortUrl1).toEqual(shortUrl2);
    });

    it('should create different short URLs for different long URLs', async () => {
      const longUrl1 = 'https://example.com/path1';
      const longUrl2 = 'https://example.com/path2';
      const domain = 'test.domain';
      
      const shortUrl1 = await createShortUrl(longUrl1, domain);
      const shortUrl2 = await createShortUrl(longUrl2, domain);
      
      expect(shortUrl1).not.toEqual(shortUrl2);
    });
    
    it('should create a short URL with custom options', async () => {
      const longUrl = 'https://example.com/very/long/path';
      const domain = 'test.domain';
      const options = {
        includeProtocol: true,
        protocol: 'https',
        redirectPathSegment: 'goto'
      };
      
      const shortUrl = await createShortUrl(longUrl, domain, options);
      
      expect(shortUrl).toContain('https://');
      expect(shortUrl).toContain('/goto/');
    });

    it('should throw error for invalid URL', async () => {
      const invalidUrl = 'not-a-valid-url';
      
      await expect(createShortUrl(invalidUrl, 'test.domain')).rejects.toThrow('Invalid URL provided');
    });
  });

  describe('decodeUrl', () => {
    it('should decode a short URL back to its original URL', async () => {
      const longUrl = 'https://example.com/very/long/path';
      const shortUrl = await createShortUrl(longUrl, 'test.domain');
      const decodedUrl = await decodeUrl(shortUrl);
      
      expect(decodedUrl).toBe(longUrl);
    });

    it('should return undefined for unknown short URLs', async () => {
      // Use a valid format but a code that doesn't exist in our storage
      const unknownShortUrl = 'short.url/r/ABC123';
      const decodedUrl = await decodeUrl(unknownShortUrl);
      
      expect(decodedUrl).toBeUndefined();
    });
  });

  describe('encodeId', () => {
    it('should encode a numeric ID to a string', () => {
      const id = 12345;
      const encoded = encodeId(id);
      
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should encode 0 as the first character in the character set', () => {
      const id = 0;
      const encoded = encodeId(id);
      
      expect(encoded).toBe('A');
    });

    it('should encode different IDs to different strings', () => {
      const id1 = 12345;
      const id2 = 67890;
      
      const encoded1 = encodeId(id1);
      const encoded2 = encodeId(id2);
      
      expect(encoded1).not.toEqual(encoded2);
    });
  });

  describe('decodeShortUrl', () => {
    it('should decode an encoded string back to its numeric ID', () => {
      const id = 12345;
      const encoded = encodeId(id);
      const decoded = decodeShortUrl(encoded);
      
      expect(decoded).toEqual(id);
    });

    it('should throw an error for invalid characters', () => {
      const invalidCode = 'ABC$123';
      
      expect(() => decodeShortUrl(invalidCode)).toThrow();
    });
  });

  describe('buildShortUrl', () => {
    it('should build a complete short URL with default domain', () => {
      const id = 12345;
      const shortUrl = buildShortUrl(id, { domain: 'short.url' });
      
      expect(shortUrl.startsWith('short.url/r/')).toBeTruthy();
    });

    it('should build a complete short URL with custom domain', () => {
      const id = 12345;
      const domain = 'custom.domain';
      const shortUrl = buildShortUrl(id, { domain });
      
      expect(shortUrl.startsWith(`${domain}/r/`)).toBeTruthy();
    });
  });
});
