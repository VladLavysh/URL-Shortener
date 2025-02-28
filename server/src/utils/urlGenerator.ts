const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const BASE = CHARACTERS.length;

/**
 * Generates a short URL code from a numeric ID using base62 encoding
 * @param id - The numeric ID to encode
 * @returns The base62 encoded string
 */
export function encodeId(id: number): string {
  let shortUrl = '';
  let num = id;
  while (num > 0) {
    shortUrl = CHARACTERS[num % BASE] + shortUrl;
    num = Math.floor(num / BASE);
  }
  return shortUrl || CHARACTERS[0];
}

/**
 * Decodes a short URL code back to its numeric ID
 * @param shortCode - The base62 encoded string
 * @returns The decoded numeric ID
 */
export function decodeShortUrl(shortCode: string): number {
  let id = 0;

  for (let i = 0; i < shortCode.length; i++) {
    const char = shortCode[i];
    const charIndex = CHARACTERS.indexOf(char);
    if (charIndex === -1) {
      throw new Error(`Invalid character in short URL: ${char}`);
    }
    id = id * BASE + charIndex;
  }
  return id;
}

/**
 * Builds a complete short URL with domain
 * @param id - The numeric ID to encode
 * @param domain - The domain for the short URL (default: 'short.url')
 * @returns The complete short URL
 */
export function buildShortUrl(id: number, domain: string = 'short.url'): string {
  const shortCode = encodeId(id);
  return `${domain}/r/${shortCode}`;
}
