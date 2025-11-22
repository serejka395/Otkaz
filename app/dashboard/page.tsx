'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

import Navigation from '@/components/Navigation';
import MathWallBackground from '@/components/MathWallBackground';
import BoomAnimation from '@/components/BoomAnimation';

import { useTranslation } from '@/lib/i18n';
import { convertCurrency, getCurrencySymbol } from '@/lib/currency-utils';
import { getUserFromStorage } from '@/lib/user-sync';
import { getUserPresets, UserPreset, WHY_TAGS } from '@/lib/user-presets';
import { RANKS, getRankForPoints } from '@/lib/ranks';
import toast from 'react-hot-toast';

interface Achievement {
  id: string;
  code: string;
  nameEn: string;
  nameRu: string;
  icon: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [presets, setPresets] = useState<UserPreset[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<UserPreset | null>(null);
  const [showBoom, setShowBoom] = useState(false);

  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, allTime: 0 });
  const [topTags, setTopTags] = useState<Array<{ tagId: string; count: number }>>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [comparisonData, setComparisonData] = useState({
    weeklyBefore: 0,
    weeklyAfter: 0,
    weeklySavings: 0,
    savingsPercentage: 0,
  });

  const { t } = useTranslation(user?.language || 'en');

  useEffect(() => {
    const parsedUser = getUserFromStorage();
    if (!parsedUser) {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    setPresets(getUserPresets(parsedUser.id));
    loadStats(parsedUser.id, parsedUser.currency);
    loadTopTags(parsedUser.id);
    loadRecentAchievements(parsedUser.id);
    loadComparisonData(parsedUser.id);
  }, [router]);

  const loadStats = async (userId: string, currency: string) => {
    try {
      const [today, week, month, all] = await Promise.all([
        fetch(`/api/entries/list?userId=${userId}&period=today`).then((r) => r.json()),
        fetch(`/api/entries/list?userId=${userId}&period=week`).then((r) => r.json()),
        fetch(`/api/entries/list?userId=${userId}&period=month`).then((r) => r.json()),
        fetch(`/api/entries/list?userId=${userId}`).then((r) => r.json()),
      ]);

      setStats({
        today: convertCurrency(today.totalUSD || 0, currency),
        week: convertCurrency(week.totalUSD || 0, currency),
        month: convertCurrency(month.totalUSD || 0, currency),
        allTime: convertCurrency(all.totalUSD || 0, currency),
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadTopTags = async (userId: string) => {
    try {
      const response = await fetch(`/api/entries/list?userId=${userId}`);
      if (!response.ok) return;

      const data = await response.json();
      const tagCounts: Record<string, number> = {};

      data.entries?.forEach((entry: any) => {
        if (entry.tags && Array.isArray(entry.tags)) {
          entry.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const topTagsArray = Object.entries(tagCounts)
        .map(([tagId, count]) => ({ tagId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setTopTags(topTagsArray);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadRecentAchievements = async (userId: string) => {
    try {
      const response = await fetch(`/api/achievements/list?userId=${userId}`);
      if (!response.ok) return;

      const data = await response.json();
      const recent =
        data.unlocked
          ?.sort(
            (a: any, b: any) =>
              new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
          )
          .slice(0, 3)
          .map((ua: any) => ua.achievement) || [];
      setRecentAchievements(recent);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  const loadComparisonData = async (userId: string) => {
    try {
      const weeklyBefore = 500; // default estimate
      const response = await fetch(
        `/api/stats/comparison?userId=${userId}&weeklyBefore=${weeklyBefore}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setComparisonData({
        weeklyBefore: data.weeklyBefore || 0,
        weeklyAfter: data.weeklyAfter || 0,
        weeklySavings: data.weeklySavings || 0,
        savingsPercentage: data.savingsPercentage || 0,
      });
    } catch (error) {
      console.error('Failed to load comparison data:', error);
    }
  };

  const handlePresetClick = (preset: UserPreset) => {
    setSelectedPreset(preset);
    setShowTagModal(true);
  };

  const handleAddEntry = async (tags: string[]) => {
    if (!selectedPreset || !user) return;
    try {
      let note = '';
      if (tags && tags.length > 0) {
        note = tags.join(', ');
      }

      const response = await fetch('/api/entries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: selectedPreset.name,
          pricePerUnit: selectedPreset.price,
          quantity: 1,
          category: selectedPreset.category || 'other',
          note,
          currency: user.currency,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.pointsEarned) {
          const updatedUser = {
            ...user,
            points: (Number(user.points) || 0) + data.pointsEarned,
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        setShowBoom(true);
        // BoomAnimation will call onComplete to close.
        loadStats(user.id, user.currency);
        loadTopTags(user.id);
        loadComparisonData(user.id);
        toast.success(`✅ ${selectedPreset.name} saved!`);
      } else {
        toast.error(data.error || 'Failed to add entry');
      }
    } catch (error) {
      toast.error('Failed to add entry');
      console.error(error);
    } finally {
      setShowTagModal(false);
      setSelectedPreset(null);
    }
  };

  if (!user) return null;

  const currentRank = getRankForPoints(user.points || 0);
  const nextRank = RANKS.find((r) => r.minPoints > (user.points || 0));
  const pointsToNext = nextRank ? nextRank.minPoints - (user.points || 0) : 0;

  return (
    <div className="pb-24 px-4 py-6 max-w-screen-lg mx-auto relative min-h-screen">
      <MathWallBackground />
      <BoomAnimation show={showBoom} onComplete={() => setShowBoom(false)} />

      <div className="flex justify-end gap-3 mb-4">
        <Link
          href="/achievements"
          className="bg-white border border-gray-300 rounded-xl p-3 text-xl shadow-sm hover:shadow-md transition-shadow"
        >
          🏆
        </Link>
        <Link
          href="/profile"
          className="bg-white border border-gray-300 rounded-xl p-3 text-xl shadow-sm hover:shadow-md transition-shadow"
        >
          👤
        </Link>
        <Link
          href="/comparison"
          className="bg-white border border-gray-300 rounded-xl p-3 text-xl shadow-sm hover:shadow-md transition-shadow"
        >
          ➕
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="enough-panel mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 text-9xl opacity-5">🏆</div>
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                {user.name || 'User'}
              </h1>
              <p className="text-gray-600">
                @{user.username || user.email?.split('@')[0]}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl mb-2">🏆</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentRank.name}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Points</div>
              <div className="text-3xl font-bold text-gray-900">{user.points || 0}</div>
              {nextRank && (
                <div className="text-xs text-gray-500 mt-1">
                  {pointsToNext} to {nextRank.name}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Saved</div>
              <div
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #F5C61A 0%, #FFD93D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {getCurrencySymbol(user.currency)}
                {stats.allTime.toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="enough-panel mb-6"
      >
        <h2 className="text-2xl font-semibold tracking-tight mb-4 flex items-center gap-2">
          ⚡ Quick Add
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {presets.slice(0, 8).map((preset) => (
            <motion.button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white p-5 rounded-2xl text-center transition-all"
              style={{
                border: '2px solid rgba(245, 198, 26, 0.2)',
                boxShadow:
                  '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(245,198,26,0.1)',
              }}
            >
              <div className="text-5xl mb-3">{preset.icon}</div>
              <div className="text-sm font-bold text-gray-900 mb-2">
                {preset.name}
              </div>
              <div
                className="text-base font-bold"
                style={{
                  background: 'linear-gradient(135deg, #F5C61A 0, #FFD93D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {getCurrencySymbol(user.currency)}
                {preset.price}
              </div>
              {preset.tags && preset.tags.length > 0 && (
                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {preset.tags.slice(0, 2).map((tagId) => {
                    const tag = WHY_TAGS.find((t) => t.id === tagId);
                    return tag ? (
                      <span key={tagId} className="text-xs">
                        {tag.icon}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {showTagModal && selectedPreset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTagModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4 text-center">
                {selectedPreset.icon} {selectedPreset.name}
              </h3>

              <p className="text-center text-gray-600 mb-6">
                Why are you saying “Enough” to this?
              </p>

              <div className="space-y-3 mb-6">
                {WHY_TAGS.map((tag) => {
                  const isSelected = selectedPreset.tags?.includes(tag.id) || false;
                  return (
                    <motion.button
                      key={tag.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const currentTags = selectedPreset.tags || [];
                        const newTags = isSelected
                          ? currentTags.filter((t) => t !== tag.id)
                          : [...currentTags, tag.id];
                        setSelectedPreset({ ...selectedPreset, tags: newTags });
                      }}
                      className={`w-full p-5 rounded-xl font-bold transition-all text-base ${
                        isSelected
                          ? tag.color
                          : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-3">
                          <span className="text-2xl">{tag.icon}</span>
                          <span>{tag.nameEn}</span>
                        </span>
                        {isSelected && <span>✓</span>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTagModal(false)}
                  className="flex-1 bg-gray-200 text-gray-900 py-4 px-6 rounded-xl font-bold hover:bg-gray-300 transition-colors text-base"
                >
                  ❌ Cancel
                </button>
                <button
                  onClick={() => handleAddEntry(selectedPreset.tags || [])}
                  className="flex-1 py-4 px-6 rounded-xl font-bold text-base"
                  style={{
                    background: 'linear-gradient(135deg, #F5C61A 0%, #FFD93D 100%)',
                    color: '#1D1D1F',
                    boxShadow: '0 4px 12px rgba(245, 198, 26, 0.4)',
                  }}
                >
                  ✅ Add Entry
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
    </div>
  );
}

