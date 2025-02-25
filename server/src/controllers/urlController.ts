import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createShortUrl = async (req: Request, res: Response) => {
  res.json({ id: 1, originalUrl: 'https://example.com', shortUrl: 'short.com/1' });
  // const { originalUrl, userId } = req.body;
  // try {
  //   const shortUrl = generateShortUrl(); // Implement this function
  //   const url = await prisma.url.create({
  //     data: { originalUrl, shortUrl, userId },
  //   });
  //   res.status(201).json(url);
  // } catch (error) {
  //   res.status(500).json({ message: 'Error creating URL' });
  // }
};

export const getAllUserUrls = async (req: Request, res: Response) => {
  res.json([
    { id: 1, originalUrl: 'https://example.com', shortUrl: 'short.com/1' },
    { id: 2, originalUrl: 'https://example.com', shortUrl: 'short.com/2' },
  ]);
  // const { userId } = req.query;
  // try {
  //   const urls = await prisma.url.findMany({ where: { userId: userId as string } });
  //   res.json(urls);
  // } catch (error) {
  //   res.status(500).json({ message: 'Error fetching URLs' });
  // }
};

export const deleteUrlById = async (req: Request, res: Response) => {
  res.status(204).json({ message: 'URL deleted successfully' });
  // const { id } = req.params;
  // try {
  //   await prisma.url.delete({ where: { id } });
  //   res.status(204).send();
  // } catch (error) {
  //   res.status(500).json({ message: 'Error deleting URL' });
  // }
};

export const deleteAllUserUrls = async (req: Request, res: Response) => {
  res.status(204).json({ message: 'All URLs deleted successfully' });
  // const { userId } = req.body;
  // try {
  //   await prisma.url.deleteMany({ where: { userId } });
  //   res.status(204).send();
  // } catch (error) {
  //   res.status(500).json({ message: 'Error deleting URLs' });
  // }
};
