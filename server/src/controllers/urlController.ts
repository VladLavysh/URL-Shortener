import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { buildShortUrl, decodeShortUrl } from '../utils/urlGenerator';

const prisma = new PrismaClient();

/**
 * Helper function to get paginated URLs for a user
 */
const getPaginatedUrls = async (userId: string, page: number = 1, limit: number = 5) => {
  const pageNum = Math.max(1, page);
  const limitNum = Math.max(1, limit);
  const skip = (pageNum - 1) * limitNum;

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

  return {
    urls: urlsWithShortUrls,
    pagination: {
      total: totalCount,
      page: adjustedPage,
      limit: limitNum,
      hasMore: adjustedSkip + urls.length < totalCount,
    },
  };
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

    let paginationData = {};
    if (userId) {
      paginationData = await getPaginatedUrls(userId as string);
    }

    res.status(201).json({
      data: {
        id: url.id,
        originalUrl: url.originalUrl,
        shortUrl,
        createdAt: url.createdAt.toISOString().replace('T', ' ').split('.')[0],
        clicks: url.clicks,
      },
      ...paginationData,
      message: 'URL created successfully',
    });
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
    const id = decodeShortUrl(shortCode);

    const url = await prisma.url.findUnique({
      where: { id },
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    await prisma.url.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });

    res.redirect(url.originalUrl);
  } catch (error) {
    console.error('Error redirecting:', error);
    res.status(500).json({ message: 'Error redirecting to original URL' });
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
 * Gets click statistics for a URL
 */
export const getUrlStats = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const url = await prisma.url.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        originalUrl: true,
        clicks: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    const urlWithShortUrl = {
      ...url,
      shortUrl: buildShortUrl(url.id, process.env.HOST),
    };

    res.json(urlWithShortUrl);
  } catch (error) {
    console.error('Error fetching URL stats:', error);
    res.status(500).json({ message: 'Error fetching URL statistics' });
  }
};

/**
 * Gets click statistics for all URLs of a user
 */
export const getUserUrlStats = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const totalClicks = await prisma.url.aggregate({
      where: { userId: userId as string },
      _sum: { clicks: true },
    });

    const topUrls = await prisma.url.findMany({
      where: { userId: userId as string },
      orderBy: { clicks: 'desc' },
      take: 5,
    });

    const topUrlsWithShortUrls = topUrls.map((url) => ({
      ...url,
      shortUrl: buildShortUrl(url.id, process.env.HOST),
    }));

    res.json({
      totalClicks: totalClicks._sum.clicks || 0,
      topUrls: topUrlsWithShortUrls,
    });
  } catch (error) {
    console.error('Error fetching user URL stats:', error);
    res.status(500).json({ message: 'Error fetching user URL statistics' });
  }
};

/**
 * Deletes a URL by ID
 */
export const deleteUrlById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, page = 1, limit = 5 } = req.query;

  try {
    const url = await prisma.url.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true },
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    await prisma.url.delete({
      where: { id: parseInt(id) },
    });

    if (userId) {
      const paginationData = await getPaginatedUrls(
        userId as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(200).json({
        ...paginationData,
        message: 'URL deleted successfully',
      });
    }

    res.status(200).json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ message: 'Error deleting URL' });
  }
};

/**
 * Deletes all URLs for a user
 */
export const deleteAllUserUrls = async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    await prisma.url.deleteMany({
      where: { userId },
    });

    res.status(200).json({
      urls: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 5,
        hasMore: false,
      },
      message: 'All URLs deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting URLs:', error);
    res.status(500).json({ message: 'Error deleting URLs' });
  }
};
