'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency, convertCurrency } from '@/lib/currency-utils';
import { getUserFromStorage } from '@/lib/user-sync';
import { getUserPresets, WHY_TAGS, getWhyTagName } from '@/lib/user-presets';

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    allTime: 0,
  });
  const [topTags, setTopTags] = useState<Array<{ tagId: string; count: number }>>([]);

  const { t } = useTranslation(user?.language || 'en');

  useEffect(() => {
    const parsedUser = getUserFromStorage();
    if (!parsedUser) {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    setUserPoints(Number(parsedUser.points) || 0);
    loadStats(parsedUser.id);
    loadTopTags(parsedUser.id);

    // Reload stats when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && parsedUser) {
        console.log('Page visible, reloading wallet stats...');
        loadStats(parsedUser.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  const loadStats = async (userId: string) => {
    try {
      const [today, week, month, all] = await Promise.all([
        fetch(`/api/entries/list?userId=${userId}&period=today`).then(r => r.json()),
        fetch(`/api/entries/list?userId=${userId}&period=week`).then(r => r.json()),
        fetch(`/api/entries/list?userId=${userId}&period=month`).then(r => r.json()),
        fetch(`/api/entries/list?userId=${userId}`).then(r => r.json()),
      ]);

      const newStats = {
        today: today.totalUSD || 0,
        week: week.totalUSD || 0,
        month: month.totalUSD || 0,
        allTime: all.totalUSD || 0,
      };

      setStats(newStats);

      console.log(`Wallet stats loaded: Today ${newStats.today} USD, All time ${newStats.allTime} USD`);

      // Update points from user object, not from totalUSD
      const currentUser = getUserFromStorage();
      if (currentUser) {
        setUserPoints(Number(currentUser.points) || 0);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTopTags = (userId: string) => {
    try {
      const presets = getUserPresets(userId);
      const tagCounts: Record<string, number> = {};

      presets.forEach(preset => {
        if (preset.tags && preset.tags.length > 0) {
          preset.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const sorted = Object.entries(tagCounts)
        .map(([tagId, count]) => ({ tagId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopTags(sorted);
    } catch (error) {
      console.error('Failed to load top tags:', error);
    }
  };

  if (!user) return null;

  // Convert USD amounts to user's currency
  const convertedStats = {
    today: convertCurrency(stats.today, user.currency),
    week: convertCurrency(stats.week, user.currency),
    month: convertCurrency(stats.month, user.currency),
    allTime: convertCurrency(stats.allTime, user.currency),
  };

  const chartData = [
    { name: t('today'), amount: convertedStats.today },
    { name: t('thisWeek'), amount: convertedStats.week },
    { name: t('thisMonth'), amount: convertedStats.month },
    { name: t('periodAllTime'), amount: convertedStats.allTime },
  ];

  return (
    <div className="pb-24 px-4 py-6 max-w-screen-lg mx-auto">
      <div className="enough-panel mb-6">
        <h1 className="text-4xl font-bold mb-4">💰 {t('yourWallet')}</h1>

        <div className="bg-white border-0 p-6 mb-6 enough-shadow-lg">
          <div className="text-center">
            <p className="text-gray-900 text-lg mb-2">{t('totalSavings')}</p>
            <p className="text-6xl font-bold text-gray-900 mb-2">
              {formatCurrency(convertedStats.allTime, user.currency)}
            </p>
            <p className="text-gray-900 text-sm">
              {userPoints.toFixed(0)} {t('points')} • {user.rank}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border-0 p-4 text-center">
            <p className="text-xs text-gray-700 mb-1">{t('today')}</p>
            <p className="text-2xl font-bold">{formatCurrency(convertedStats.today, user.currency)}</p>
          </div>
          <div className="bg-white border-0 p-4 text-center">
            <p className="text-xs text-gray-700 mb-1">{t('thisWeek')}</p>
            <p className="text-2xl font-bold">{formatCurrency(convertedStats.week, user.currency)}</p>
          </div>
          <div className="bg-white border-0 p-4 text-center">
            <p className="text-xs text-gray-700 mb-1">{t('thisMonth')}</p>
            <p className="text-2xl font-bold">{formatCurrency(convertedStats.month, user.currency)}</p>
          </div>
        </div>
      </div>

      <div className="enough-panel mb-6">
        <h2 className="text-2xl font-bold mb-4">📊 {t('savingsChart')}</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#FFB74D" stroke="#000" strokeWidth={3} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {topTags.length > 0 && (
        <div className="enough-panel mb-6 bg-white from-purple-100 to-pink-100">
          <h2 className="text-2xl font-bold mb-4">🤔 {t('yourTopReasons')}</h2>
          <p className="text-sm text-gray-700 mb-3">
            {t('topReasonsDescription')}
          </p>
          <div className="flex flex-wrap gap-2">
            {topTags.map(({ tagId, count }, index) => {
              const tag = WHY_TAGS.find(t => t.id === tagId);
              if (!tag) return null;

              return (
                <div
                  key={tagId}
                  className={`px-4 py-2 border-0  font-semibold flex items-center gap-2 
                    ${tag.color} transition-all hover:scale-105 hover:rotate-2 hover:enough-shadow-lg
                    animate-[popIn_0.5s_ease-out]`}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <span className="text-2xl animate-[wiggle_2s_ease-in-out_infinite]" style={{ animationDelay: `${index * 0.3}s` }}>
                    {tag.icon}
                  </span>
                  <div>
                    <div className="text-sm">{getWhyTagName(tagId, user.language)}</div>
                    <div className="text-xs opacity-75">{count} {count === 1 ? t('category') : t('categories')}</div>
                  </div>
                  {index < 3 && (
                    <span className="ml-2 text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="speech-bubble mb-6">
        <p className="text-center text-lg">
          <strong>{t('keepItUp')}</strong><br />
          {t('everyRefusal')}
        </p>
      </div>

      <Navigation />
    </div>
  );
}