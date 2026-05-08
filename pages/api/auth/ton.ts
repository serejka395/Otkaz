import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address, referralCode, currency, language } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }

  try {
    // Try to find user by wallet address
    let user = await prisma.user.findUnique({
      where: { walletAddress: address },
    });

    if (!user) {
      // Create new user (Registration)
      const newReferralCode = nanoid(10);
      
      // Handle referral if provided
      let referrerId = null;
      if (referralCode) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode },
        });
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      user = await prisma.user.create({
        data: {
          walletAddress: address,
          referralCode: newReferralCode,
          referredBy: referrerId,
          currency: currency || 'USD',
          language: language || 'en',
          name: `User_${address.slice(-4)}`, // Default name from address
        },
      });

      // If referred, create Referral record and award points
      if (referrerId) {
        await prisma.referral.create({
          data: {
            referrerId,
            referredId: user.id,
          },
        });
        
        await prisma.user.update({
          where: { id: referrerId },
          data: { points: { increment: 50 } },
        });
      }
    }

    // Return user data (Login)
    // Don't send sensitive info if there was any
    const { password, ...userWithoutPassword } = user as any;
    
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('TON Auth Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
