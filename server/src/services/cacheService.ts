import NodeCache from 'node-cache';

// TTL of 10 minutes, Check period of 120 seconds
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export const cacheService = {
  get: <T>(key: string): T | undefined => {
    return cache.get<T>(key);
  },

  set: <T>(key: string, value: T, ttl = 0): boolean => {
    return cache.set(key, value, ttl);
  },

  del: (key: string | string[]): number => {
    return cache.del(key);
  },

  has: (key: string): boolean => {
    return cache.has(key);
  },

  flush: (): void => {
    cache.flushAll();
  },
  
  keys: (): string[] => {
    return cache.keys();
  },
};

export const createUrlCacheKey = (shortCode: string | number): string => {
  return `url:${shortCode}`;
};

export const createUserUrlsCacheKey = (userId: string, page: number, limit: number): string => {
  return `user:${userId}:urls:${page}:${limit}`;
};
