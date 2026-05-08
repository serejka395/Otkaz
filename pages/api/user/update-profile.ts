import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { usernameSchema, passwordSchema, nameSchema, hashPassword, verifyPassword, profileRateLimiter } from '@/lib/security';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, currentPassword, updates } = req.body;
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    // Rate limiting
    if (!profileRateLimiter.isAllowed(clientIP as string)) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(profileRateLimiter.getRemainingTime(clientIP as string) / 1000)
      });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем текущий пароль для любых изменений (только если у пользователя есть пароль)
    if ((updates.password || updates.username || updates.name) && user.password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required for security' });
      }

      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const updateData: any = {};

    // Обновление имени
    if (updates.name) {
      try {
        const validatedName = nameSchema.parse(updates.name);
        updateData.name = validatedName;
      } catch (error: any) {
        return res.status(400).json({ error: error.errors[0].message });
      }
    }

    // Обновление никнейма
    if (updates.username) {
      try {
        const validatedUsername = usernameSchema.parse(updates.username);
        
        // Проверяем, что никнейм не занят
        const existingUser = await prisma.user.findUnique({
          where: { username: validatedUsername }
        });

        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ error: 'Username is already taken' });
        }

        updateData.username = validatedUsername;
      } catch (error: any) {
        return res.status(400).json({ error: error.errors[0].message });
      }
    }

    // Обновление пароля
    if (updates.password) {
      try {
        const validatedPassword = passwordSchema.parse(updates.password);
        updateData.password = await hashPassword(validatedPassword);
        updateData.lastPasswordChange = new Date();
      } catch (error: any) {
        return res.status(400).json({ error: error.errors[0].message });
      }
    }

    // Обновление валюты и языка (без проверки пароля)
    if (updates.currency) {
      updateData.currency = updates.currency;
    }
    if (updates.language) {
      updateData.language = updates.language;
    }

    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        walletAddress: true,
        currency: true,
        language: true,
        timezone: true,
        points: true,
        rank: true,
        referralCode: true,
        lastPasswordChange: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}