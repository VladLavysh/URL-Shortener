import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';

const prisma = new PrismaClient();

type RequestPayload = {
  name: string;
  password: string;
};

type RequestWithUser = Request & {
  user?: {
    id: string;
    name: string;
  };
};

export const signInJWT = async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const signIn = async (req: Request, res: Response) => {
  const { name, password } = req.body as RequestPayload;

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) {
    return res.status(403).json({ message: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(403).json({ message: 'Invalid credentials' });
  }

  const accessToken = generateAccessToken(user.id, user.name);
  const refreshToken = generateRefreshToken(user.id, user.name);

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
    },
    accessToken,
    message: 'Signed in successfully',
  });
};

export const signUp = async (req: Request, res: Response) => {
  const { name, password } = req.body as RequestPayload;

  const existingUser = await prisma.user.findUnique({
    where: { name },
  });

  if (existingUser) {
    return res.status(400).json({
      message: 'Username already taken',
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      password: hashedPassword,
    },
  });

  const accessToken = generateAccessToken(user.id, user.name);
  const refreshToken = generateRefreshToken(user.id, user.name);

  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
    },
    accessToken,
    message: 'Signed up successfully',
  });
};

export const signOut = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken as string;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  res.status(200).json({ message: 'Signed out successfully' });
};

export const refreshJWTToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const verifiedToken = await verifyToken(refreshToken, 'refresh');
  if (!verifiedToken || 'decoded' in verifiedToken === false) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }

  const newAccessToken = generateAccessToken(verifiedToken.user.id, verifiedToken.user.name);
  res.json({ accessToken: newAccessToken });
};

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.body.userId as string;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId } }),
      prisma.url.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting account' });
  }
};
