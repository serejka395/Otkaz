import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateReferralCode } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getParsedBody, requireDatabase } from '@/lib/utils';

const RegisterSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  name: z.string().trim().min(1).max(100),
  referralCode: z.string().trim().optional(),
  currency: z.string().trim().min(2).max(6).optional().default('USD'),
  language: z.enum(['en', 'ru']).optional().default('en'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireDatabase(res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const parsed = RegisterSchema.safeParse(getParsedBody(req));
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
    }
    const { email, password, name, referralCode, currency, language } = parsed.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Find referrer if referral code is provided
    const referrer = referralCode
      ? await prisma.user.findFirst({ where: { referralCode } })
      : null;

    // Hash password
    const hashedPassword = await hashPassword(password);
    const userReferralCode = generateReferralCode();

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        currency,
        language,
        referralCode: userReferralCode,
        referredBy: referrer ? referrer.id : null,
      },
    });

    // If referred, create referral relationship and award points
    if (referrer) {
      await prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: user.id,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: 20 } }, // New user gets 20 points
      });

      await prisma.user.update({
        where: { id: referrer.id },
        data: { points: { increment: 50 } }, // Referrer gets 50 points
      });
    }

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        currency: user.currency,
        language: user.language,
        points: user.points,
        rank: user.rank,
        referralCode: user.referralCode,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'User already exists' });
      }
      return res.status(400).json({ error: 'Database validation error', code: error.code });
    }
    if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
      return res.status(503).json({ error: 'Database unavailable', code: 'DB_UNAVAILABLE' });
    }
    return res.status(500).json({ error: 'Unexpected server error' });
  }
}
