const CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const BASE = CHARACTERS.length;

/**
 * Storage interface for URL mappings
 */
export interface StorageInterface {
  get(id: number): Promise<string | undefined>;
  set(id: number, url: string, ttl?: number): Promise<void>;
  has(id: number): Promise<boolean>;
}

/**
 * In-memory storage implementation
 */
export class MemoryStorage implements StorageInterface {
  private storage: Map<number, string> = new Map();

  async get(id: number): Promise<string | undefined> {
    return this.storage.get(id);
  }

  async set(id: number, url: string, ttl?: number): Promise<void> {
    this.storage.set(id, url);
    if (ttl) {
      setTimeout(() => this.storage.delete(id), ttl);
    }
  }

  async has(id: number): Promise<boolean> {
    return this.storage.has(id);
  }
}

/**
 * Redis storage implementation (optional)
 */
export class RedisStorage implements StorageInterface {
  private client: any;

  constructor(client: any) {
    this.client = client;
  }

  async get(id: number): Promise<string | undefined> {
    const result = await this.client.get(`url:${id}`);
    return result || undefined;
  }

  async set(id: number, url: string, ttl?: number): Promise<void> {
    const key = `url:${id}`;
    if (ttl) {
      await this.client.setex(key, ttl, url);
    } else {
      await this.client.set(key, url);
    }
  }

  async has(id: number): Promise<boolean> {
    const exists = await this.client.exists(`url:${id}`);
    return exists === 1;
  }
}

/**
 * Validates if a string is a proper URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates a short URL code from a numeric ID using base62 encoding
 * @param id - The numeric ID to encode
 * @returns The base62 encoded string
 */
export function encodeId(id: number): string {
  let shortUrl = "";
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
 * Configuration options for building a short URL
 */
export interface ShortUrlOptions {
  domain: string;
  includeRedirectPath?: boolean;
  redirectPathSegment?: string;
  includeProtocol?: boolean;
  protocol?: string;
  pathSeparator?: string;
}

/**
 * Default options for building a short URL
 */
export const DEFAULT_SHORT_URL_OPTIONS: ShortUrlOptions = {
  domain: "short.url",
  includeRedirectPath: true,
  redirectPathSegment: "r",
  includeProtocol: false,
  protocol: "https",
  pathSeparator: "/",
};

/**
 * Default storage instance (in-memory)
 */
export const defaultStorage = new MemoryStorage();

/**
 * Stores a URL mapping using the specified storage
 * @param id - The numeric ID
 * @param originalUrl - The original URL
 * @param storage - Storage instance to use
 * @param ttl - Time to live in seconds (optional)
 */
export async function storeUrlMapping(
  id: number, 
  originalUrl: string, 
  storage: StorageInterface = defaultStorage,
  ttl?: number
): Promise<void> {
  await storage.set(id, originalUrl, ttl);
}

/**
 * Retrieves the original URL for a given ID
 * @param id - The numeric ID
 * @param storage - Storage instance to use
 * @returns The original URL if found, undefined otherwise
 */
export async function getOriginalUrl(
  id: number, 
  storage: StorageInterface = defaultStorage
): Promise<string | undefined> {
  return await storage.get(id);
}

/**
 * Checks if a URL mapping exists
 * @param id - The numeric ID
 * @param storage - Storage instance to use
 * @returns True if the mapping exists, false otherwise
 */
export async function hasUrlMapping(
  id: number, 
  storage: StorageInterface = defaultStorage
): Promise<boolean> {
  return await storage.has(id);
}

/**
 * Builds a complete short URL with domain and customizable options
 * @param id - The numeric ID to encode
 * @param options - Configuration options for the short URL
 * @returns The complete short URL
 */
export function buildShortUrl(
  id: number,
  options?: string | ShortUrlOptions
): string {
  const opts: ShortUrlOptions =
    typeof options === "string"
      ? { ...DEFAULT_SHORT_URL_OPTIONS, domain: options }
      : { ...DEFAULT_SHORT_URL_OPTIONS, ...options };

  const shortCode = encodeId(id);

  let url = "";

  if (opts.includeProtocol && opts.protocol) {
    url += `${opts.protocol}://`;
  }

  url += opts.domain;

  if (opts.includeRedirectPath && opts.redirectPathSegment) {
    url += `${opts.pathSeparator}${opts.redirectPathSegment}`;
  }

  url += `${opts.pathSeparator}${shortCode}`;

  return url;
}
