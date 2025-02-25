import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

interface TokenPayload {
  id: string;
  name: string;
}

interface RefreshTokenResult {
  decoded: TokenPayload;
  user: User;
}

export const generateAccessToken = (id: string, name: string) => {
  return jwt.sign({ id, name }, process.env.ACCESS_SECRET!, { expiresIn: '15m' });
};

export const generateRefreshToken = (id: string, name: string) => {
  return jwt.sign({ id, name }, process.env.REFRESH_SECRET!, { expiresIn: '7d' });
};

export const verifyToken = async (
  token: string,
  type: 'access' | 'refresh'
): Promise<TokenPayload | RefreshTokenResult | null> => {
  try {
    const secret = type === 'access' ? process.env.ACCESS_SECRET! : process.env.REFRESH_SECRET!;

    if (type === 'access') {
      return jwt.verify(token, secret) as TokenPayload;
    }

    const decoded = jwt.verify(token, secret) as TokenPayload;

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || new Date() > storedToken.expiredAt) {
      return null;
    }

    return {
      decoded,
      user: storedToken.user,
    };
  } catch (error) {
    return null;
  }
};
