import {
  encodeId,
  decodeShortUrl,
  buildShortUrl,
  ShortUrlOptions,
  DEFAULT_SHORT_URL_OPTIONS,
  storeUrlMapping,
  getOriginalUrl,
  hasUrlMapping,
  isValidUrl,
  StorageInterface,
  defaultStorage,
} from "./utils";

/**
 * Options for creating a short URL
 * @property hashAlgorithm - Hash algorithm to use (default: 'djb2')
 * @property customHashFn - Custom hash function
 * @property storage - Storage instance to use (default: MemoryStorage)
 * @property ttl - Time to live in seconds
 * @property maxRetries - Maximum retries for collision handling (default: 10)
 */
export interface CreateShortUrlOptions extends ShortUrlOptions {
  hashAlgorithm?: "djb2" | "sdbm" | "custom";
  customHashFn?: (url: string) => number;
  storage?: StorageInterface;
  ttl?: number;
  maxRetries?: number;
}

/**
 * Default options for creating a short URL
 */
const DEFAULT_CREATE_OPTIONS: CreateShortUrlOptions = {
  ...DEFAULT_SHORT_URL_OPTIONS,
  hashAlgorithm: "djb2",
  maxRetries: 10,
};

/**
 * Creates a short URL from a long URL with customizable options
 * @param longUrl - The original long URL to shorten
 * @param domain - Domain name for the short URL
 * @param options - Optional configuration options
 * @returns The shortened URL
 */
export async function createShortUrl(
  longUrl: string,
  domain: string,
  options?: Partial<Omit<CreateShortUrlOptions, "domain">>
): Promise<string> {
  if (!isValidUrl(longUrl)) {
    throw new Error("Invalid URL provided");
  }

  const opts: CreateShortUrlOptions = {
    ...DEFAULT_CREATE_OPTIONS,
    domain,
    ...options,
  };

  const storage = opts.storage || defaultStorage;
  const maxRetries = opts.maxRetries || 10;

  let hash: number;
  let attempts = 0;
  let positiveHash: number;

  do {
    if (opts.hashAlgorithm === "custom" && opts.customHashFn) {
      hash = opts.customHashFn(longUrl + attempts);
    } else if (opts.hashAlgorithm === "sdbm") {
      hash = 0;
      const input = longUrl + attempts;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
      }
    } else {
      hash = 5381;
      const input = longUrl + attempts;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = (hash << 5) + hash + char;
      }
    }

    positiveHash = Math.abs(hash);
    attempts++;
  } while (await hasUrlMapping(positiveHash, storage) && attempts < maxRetries);

  if (attempts >= maxRetries) {
    throw new Error("Failed to generate unique short URL after maximum retries");
  }

  await storeUrlMapping(positiveHash, longUrl, storage, opts.ttl);

  return buildShortUrl(positiveHash, opts);
}

/**
 * Extracts the short code from a short URL
 * @param shortUrl - The short URL
 * @returns The extracted short code
 */
function extractShortCode(shortUrl: string): string {
  const urlWithoutProtocol = shortUrl.replace(/^https?:\/\//, "");
  const parts = urlWithoutProtocol.split("/");

  return parts[parts.length - 1];
}

/**
 * Decodes a short URL back to its original URL
 * @param shortUrl - The shortened URL to decode
 * @param storage - Storage instance to use (optional)
 * @returns The original URL if found, or undefined if not found
 */
export async function decodeUrl(
  shortUrl: string,
  storage?: StorageInterface
): Promise<string | undefined> {
  try {
    const shortCode = extractShortCode(shortUrl);
    const id = decodeShortUrl(shortCode);

    return await getOriginalUrl(id, storage || defaultStorage);
  } catch (error) {
    return undefined;
  }
}
