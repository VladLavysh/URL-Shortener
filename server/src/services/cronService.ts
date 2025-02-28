import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cleanup expired refresh tokens
 * This function deletes all refresh tokens that have expired
 */
export const cleanExpiredTokens = async (): Promise<void> => {
  try {
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: { expiredAt: { lt: new Date() } },
    });
    console.log(`[${new Date().toISOString()}] Cleaned up ${deletedTokens.count} expired refresh tokens`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error cleaning up expired tokens:`, error);
  }
};

/**
 * Cleanup guest account URLs
 * This function keeps only the most recent URL for guest accounts (null userId)
 * and deletes all other URLs created by guests
 */
export const cleanGuestUrls = async (): Promise<void> => {
  try {
    const guestAccount = await prisma.user.findUnique({
      where: { name: 'Guest' },
    });

    if (!guestAccount) {
      console.log(`[${new Date().toISOString()}] No Guest account found`);
      return;
    }

    const guestUrls = await prisma.url.findMany({
      where: { userId: guestAccount.id },
      orderBy: { createdAt: 'desc' },
    });

    if (guestUrls.length <= 1) {
      console.log(`[${new Date().toISOString()}] No Guest URLs to clean up`);
      return;
    }

    const urlsToDelete = guestUrls.slice(1).map((url) => url.id);

    const deleteResult = await prisma.url.deleteMany({
      where: {
        id: { in: urlsToDelete },
        userId: guestAccount.id,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Cleaned up ${deleteResult.count} Guest URLs, keeping the most recent one`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error cleaning up Guest URLs:`, error);
  }
};

/**
 * Initialize cron jobs
 * This function sets up all scheduled tasks
 */
export const initCronJobs = (): void => {
  cron.schedule('0 0 * * *', cleanExpiredTokens, {
    scheduled: true,
    timezone: 'UTC',
  });

  cron.schedule('0 0 * * *', cleanGuestUrls, {
    scheduled: true,
    timezone: 'UTC',
  });

  console.log('Cron jobs scheduled:');
  console.log('- Cleanup expired refresh tokens (daily at 00:00 UTC)');
  console.log('- Cleanup guest account URLs, keeping only the most recent one (daily at 00:00 UTC)');
};
