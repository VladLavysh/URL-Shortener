# URL Shortener

A simple and lightweight URL shortening library for Node.js. This package provides functionality to create short URLs from long ones and decode them back, with support for custom storage backends (like Redis) and expiration (TTL).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Creating a Short URL](#creating-a-short-url)
  - [Customization Options](#customization-options)
  - [Using Different Hash Algorithms](#using-different-hash-algorithms)
  - [Decoding a Short URL](#decoding-a-short-url)
- [Advanced Usage](#advanced-usage)
  - [Storage and Persistence](#storage-and-persistence)
  - [TTL (Time to Live)](#ttl-time-to-live)
  - [Customizing URL Structure](#customizing-url-structure)
- [How It Works](#how-it-works)
- [API Reference](#api-reference)
- [License](#license)

## Installation

```bash
npm install @unitio-code/url-shortener
```

If you plan to use Redis storage, you should also install `ioredis`:

```bash
npm install ioredis
```

## Usage

### Creating a Short URL

The library is now fully asynchronous. You should use `await` or `.then()` when calling `createShortUrl`.

#### 1. Create a short URL with required domain parameter

```typescript
import { createShortUrl } from "@unitio-code/url-shortener";

async function example() {
  const shortUrl = await createShortUrl(
    "https://example.com/very/long/path/with/many/parameters?param1=value1&param2=value2",
    "short.url"
  );
  console.log(shortUrl); // Output: short.url/r/Ab3x7Z (example)
}
```

#### 2. Create a short URL with custom domain

```typescript
import { createShortUrl } from "@unitio-code/url-shortener";

const customShortUrl = await createShortUrl(
  "https://example.com/very/long/path",
  "myshort.link"
);
console.log(customShortUrl); // Output: myshort.link/r/Xy4p9Q (example)
```

#### 3. Create a short URL with customized options

```typescript
import { createShortUrl } from "@unitio-code/url-shortener";

const customizedUrl = await createShortUrl(
  "https://example.com/very/long/path",
  "myshort.link",
  {
    includeProtocol: true,
    protocol: "https",
    includeRedirectPath: false,
  }
);
console.log(customizedUrl); // Output: https://myshort.link/Xy4p9Q (example)
```

### Customization Options

The `createShortUrl` function accepts a wide range of options for customization:

```typescript
interface CreateShortUrlOptions {
  // Domain options
  includeProtocol?: boolean; // Whether to include protocol (default: false)
  protocol?: string; // Protocol to use (default: 'https')

  // Path options
  includeRedirectPath?: boolean; // Whether to include the redirect path segment (default: true)
  redirectPathSegment?: string; // Custom path segment (default: 'r')
  pathSeparator?: string; // Custom separator between path segments (default: '/')

  // Hash algorithm options
  hashAlgorithm?: "djb2" | "sdbm" | "custom"; // Hash algorithm to use (default: 'djb2')
  customHashFn?: (url: string) => number; // Custom hash function

  // Storage and Persistence
  storage?: StorageInterface; // Custom storage implementation (default: MemoryStorage)
  ttl?: number; // Time to live in seconds
  maxRetries?: number; // Maximum retries for collision handling (default: 10)
}
```

### Using Different Hash Algorithms

#### Using the SDBM hash algorithm

```typescript
const sdbmUrl = await createShortUrl("https://example.com/path", "short.url", {
  hashAlgorithm: "sdbm",
});
```

#### Using a custom hash function

```typescript
const customHashUrl = await createShortUrl("https://example.com/path", "short.url", {
  hashAlgorithm: "custom",
  customHashFn: (url) => {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = (hash * 31 + url.charCodeAt(i)) & 0xffffffff;
    }
    return hash;
  },
});
```

### Decoding a Short URL

#### Basic decoding example

```typescript
import { decodeUrl } from "@unitio-code/url-shortener";

// Decode a short URL to get the original URL
const originalUrl = await decodeUrl("short.url/r/Ab3x7Z");
console.log(originalUrl); // Output: https://example.com/very/long/path
```

## Advanced Usage

### Storage and Persistence

By default, the library uses in-memory storage (`MemoryStorage`). For production environments, it is recommended to use a persistent storage like Redis.

#### Using Redis Storage

```typescript
import { createShortUrl, RedisStorage } from "@unitio-code/url-shortener";
import Redis from "ioredis";

const redisClient = new Redis("redis://localhost:6379");
const storage = new RedisStorage(redisClient);

const shortUrl = await createShortUrl("https://example.com", "short.url", {
  storage: storage
});

// When decoding, you must also provide the same storage
const originalUrl = await decodeUrl(shortUrl, storage);
```

### TTL (Time to Live)

You can set an expiration time for your shortened URLs in seconds.

```typescript
const temporaryUrl = await createShortUrl("https://example.com", "short.url", {
  ttl: 3600 // Expires in 1 hour
});
```

### Customizing URL Structure

#### Without redirect path segment

```typescript
const noRedirectPath = await createShortUrl("https://example.com/path", "short.url", {
  includeRedirectPath: false,
});
// Output: short.url/Ab3x7Z
```

#### With custom redirect path segment

```typescript
const customPath = await createShortUrl("https://example.com/path", "short.url", {
  redirectPathSegment: "goto",
});
// Output: short.url/goto/Ab3x7Z
```

## How It Works

1. **Validation**: The library validates the input URL to ensure it's a properly formatted URL.
2. **Hash Generation**: A hash is generated from the input URL using the selected algorithm.
3. **Collision Detection**: If the hash already exists in storage for a different URL, the library automatically re-hashes with an offset until a unique hash is found (up to `maxRetries`).
4. **Encoding**: The numeric hash is encoded using base62 (A-Z, a-z, 0-9) to create a short code.
5. **Storage**: The mapping is stored in the provided storage backend (Memory or Redis) with an optional TTL.
6. **URL Building**: The final short URL is constructed using the specified domain and path options.

## API Reference

### `createShortUrl(longUrl: string, domain: string, options?: CreateShortUrlOptions): Promise<string>`

Creates a short URL from a long URL.

- `longUrl`: The original URL to shorten.
- `domain`: Domain name for the short URL.
- `options`: Optional configuration (see [Customization Options](#customization-options)).
- **Returns**: A Promise that resolves to the shortened URL string.

### `decodeUrl(shortUrl: string, storage?: StorageInterface): Promise<string | undefined>`

Decodes a short URL back to its original URL.

- `shortUrl`: The short URL to decode.
- `storage`: Optional storage instance to look up the mapping.
- **Returns**: A Promise that resolves to the original URL if found, or undefined.

### `encodeId(id: number): string`

Encodes a numeric ID to a base62 string.

- `id`: The numeric ID to encode.
- **Returns**: A base62 encoded string.

### `decodeShortUrl(shortCode: string): number`

Decodes a base62 encoded short code back to its numeric ID.

- `shortCode`: The base62 encoded string.
- **Returns**: The numeric ID.

### `buildShortUrl(id: number, options: ShortUrlOptions): string`

Builds a complete short URL from a numeric ID and options.

- `id`: The numeric ID to encode.
- `options`: Configuration options for the short URL (domain is required).
- **Returns**: The complete short URL string.

### `RedisStorage(client: any)`

Storage class for Redis integration. Expects a client compatible with `ioredis`.

### `MemoryStorage()`

The default in-memory storage implementation.

## License

ISC
