import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { buildShortUrl, decodeShortUrl } from '../utils/urlGenerator';
import { cacheService, createUrlCacheKey, createUserUrlsCacheKey } from '../services/cacheService';

const prisma = new PrismaClient();
const cacheDuration = 86400; // 24 hours

// Define interfaces for our response objects
interface UrlWithShortUrl {
  id: number;
  originalUrl: string;
  shortUrl: string;
  createdAt: string;
  clicks: number;
  userId: string | null;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface UrlResponse {
  urls: UrlWithShortUrl[];
  pagination: PaginationData;
  message?: string;
}

/**
 * Helper function to get paginated URLs for a user
 */
const getPaginatedUrls = async (userId: string, page: number = 1, limit: number = 5) => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.max(1, limit);
  // const skip = (pageNum - 1) * limitNum;

  // Check cache first
  const cacheKey = createUserUrlsCacheKey(userId, pageNum, limitNum);
  const cachedData = cacheService.get(cacheKey) as { urls: UrlWithShortUrl[]; pagination: PaginationData };

  if (cachedData) {
    console.log(`Cache hit for ${cacheKey}`);
    console.log('Cache data type:', typeof cachedData);
    console.log('Cache data structure:', JSON.stringify(cachedData, null, 2));

    // Check if the cached data has the expected structure
    if (cachedData.urls && Array.isArray(cachedData.urls) && cachedData.pagination) {
      console.log('Cache data is valid, returning from cache');
      return cachedData;
    } else {
      console.log('Cache data is invalid, ignoring cache');
    }
  }

  console.log(`Cache miss for ${cacheKey}`);
  const totalCount = await prisma.url.count({
    where: { userId },
  });

  const totalPages = Math.ceil(totalCount / limitNum);

  const adjustedPage = totalPages > 0 ? Math.min(pageNum, totalPages) : 1;
  const adjustedSkip = (adjustedPage - 1) * limitNum;

  const urls = await prisma.url.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limitNum,
    skip: adjustedSkip,
  });

  const urlsWithShortUrls = urls.map((url) => ({
    ...url,
    createdAt: url.createdAt.toISOString().replace('T', ' ').split('.')[0],
    shortUrl: buildShortUrl(url.id, process.env.HOST),
  }));

  const result: UrlResponse = {
    urls: urlsWithShortUrls,
    pagination: {
      total: totalCount,
      page: adjustedPage,
      limit: limitNum,
      hasMore: adjustedSkip + urls.length < totalCount,
    },
  };

  // Cache the results for 5 minutes
  console.log(`Setting cache for ${cacheKey} with TTL: 300 seconds`);
  const cacheResult = cacheService.set(cacheKey, result, 300);
  console.log(`Cache set result: ${cacheResult}`);

  return result;
};

/**
 * Creates a short URL from a long URL
 */
export const createShortUrl = async (req: Request, res: Response) => {
  const { originalUrl } = req.body;
  const userId = req.body.userId || null;

  if (!originalUrl) {
    return res.status(400).json({ message: 'Original URL is required' });
  }

  try {
    if (userId) {
      const urlCount = await prisma.url.count({
        where: { userId: userId as string },
      });

      if (urlCount >= 20) {
        return res.status(403).json({
          message:
            'You have reached the maximum limit of 20 URLs. Please delete some URLs to create new ones.',
        });
      }
    }

    const url = await prisma.url.create({
      data: {
        originalUrl,
        userId,
      },
    });

    const shortUrl = buildShortUrl(url.id, process.env.HOST);

    const cacheKey = createUrlCacheKey(url.id);
    cacheService.set(cacheKey, url.originalUrl, cacheDuration);

    const newUrlObject: UrlWithShortUrl = {
      ...url,
      createdAt: url.createdAt.toISOString().replace('T', ' ').split('.')[0],
      shortUrl: shortUrl,
    };

    let response: UrlResponse = {
      message: 'URL created successfully',
      urls: [newUrlObject],
      pagination: { total: 1, page: 1, limit: 1, hasMore: false },
    };

    if (userId) {
      const userCachePattern = `user:${userId}:urls:`;
      const keys = cacheService.keys().filter((key) => key.startsWith(userCachePattern));
      console.log(`Found ${keys.length} cache keys to invalidate:`, keys);

      if (keys.length > 0) {
        const deletedCount = cacheService.del(keys);
        console.log(`Deleted ${deletedCount} cache keys`);
      }

      console.log('Getting updated paginated data for user:', userId);
      const paginationData = await getPaginatedUrls(userId as string);
      console.log('Updated pagination data:', JSON.stringify(paginationData, null, 2));

      if (paginationData.urls && Array.isArray(paginationData.urls)) {
        const urlExists = paginationData.urls.some((u) => u.id === url.id);

        if (!urlExists && paginationData.urls.length > 0) {
          console.log('Adding newly created URL to the response');
          paginationData.urls.unshift(newUrlObject);

          if (paginationData.pagination) {
            paginationData.pagination.total += 1;
          }
        }
      }

      response = { ...response, ...paginationData };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating URL:', error);
    res.status(500).json({ message: 'Error creating URL' });
  }
};

/**
 * Redirects from a short URL to the original URL
 */
export const redirectToOriginalUrl = async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  try {
    const cacheKey = createUrlCacheKey(shortCode);
    const cachedUrl = cacheService.get<string>(cacheKey);
    const decodedUrlId = decodeShortUrl(shortCode);

    if (cachedUrl) {
      prisma.url
        .update({
          where: { id: decodedUrlId },
          data: { clicks: { increment: 1 } },
        })
        .catch((err) => console.error('Error updating click count:', err));

      return res.redirect(cachedUrl);
    }

    const url = await prisma.url.findUnique({
      where: { id: decodedUrlId },
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    await prisma.url.update({
      where: { id: decodedUrlId },
      data: { clicks: { increment: 1 } },
    });

    cacheService.set(cacheKey, url.originalUrl, cacheDuration);

    res.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error redirecting to URL:', error);
    res.status(500).json({ message: 'Error redirecting to URL' });
  }
};

/**
 * Gets all URLs for a user
 */
export const getAllUserUrls = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
  const page = req.query.page ? parseInt(req.query.page as string) : 1;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const paginationData = await getPaginatedUrls(userId as string, page, limit);

    res.json(paginationData);
  } catch (error) {
    console.error('Error fetching URLs:', error);
    res.status(500).json({ message: 'Error fetching URLs' });
  }
};

/**
 * Gets click statistics for all URLs of a user
 */
export const getUserUrlStats = async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    const cacheKey = `user:${userId}:stats`;
    const cachedStats = cacheService.get(cacheKey);

    if (cachedStats) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.json(cachedStats);
    }

    console.log(`Cache miss for ${cacheKey}`);
    const urls = await prisma.url.findMany({
      where: { userId: userId as string },
      orderBy: { clicks: 'desc' },
    });

    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
    const totalUrls = urls.length;

    const topUrls = urls.slice(0, 5).map((url) => ({
      id: url.id,
      originalUrl: url.originalUrl,
      shortUrl: buildShortUrl(url.id, process.env.HOST),
      clicks: url.clicks,
      createdAt: url.createdAt.toISOString().replace('T', ' ').split('.')[0],
    }));

    const stats = {
      totalClicks,
      totalUrls,
      topUrls,
    };

    // Cache stats for 10 minutes
    cacheService.set(cacheKey, stats, 600);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user URL stats:', error);
    res.status(500).json({ message: 'Error fetching user URL stats' });
  }
};

/**
 * Deletes a URL by ID
 */
export const deleteUrlById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, page, limit } = req.query;

  try {
    const url = await prisma.url.findUnique({
      where: { id: +id },
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (userId && url.userId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to delete this URL' });
    }

    await prisma.url.delete({
      where: { id: +id },
    });

    const urlCacheKey = createUrlCacheKey(id);
    cacheService.del(urlCacheKey);

    if (url.userId) {
      const userStatsCacheKey = `user:${url.userId}:stats`;
      cacheService.del(userStatsCacheKey);

      const userCachePattern = `user:${url.userId}:urls:`;
      const keys = cacheService.keys().filter((key) => key.startsWith(userCachePattern));
      if (keys.length > 0) {
        cacheService.del(keys);
      }
    }

    let response: UrlResponse = {
      message: 'URL deleted successfully',
      urls: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 5,
        hasMore: false,
      },
    };

    if (userId) {
      const paginationData = await getPaginatedUrls(
        userId as string,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 5
      );
      response = { ...response, ...paginationData };
    }

    res.json(response);
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ message: 'Error deleting URL' });
  }
};

/**
 * Deletes all URLs for a user
 */
export const deleteAllUserUrls = async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    await prisma.url.deleteMany({
      where: { userId: userId as string },
    });

    const userStatsCacheKey = `user:${userId}:stats`;
    cacheService.del(userStatsCacheKey);

    const userCachePattern = `user:${userId}:urls:`;
    const keys = cacheService.keys().filter((key) => key.startsWith(userCachePattern));
    if (keys.length > 0) {
      cacheService.del(keys);
    }

    res.json({ message: 'All URLs deleted successfully' });
  } catch (error) {
    console.error('Error deleting all URLs:', error);
    res.status(500).json({ message: 'Error deleting all URLs' });
  }
};
