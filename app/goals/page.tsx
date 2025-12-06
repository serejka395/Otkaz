'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';
import MathWallBackground from '@/components/MathWallBackground';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency, convertCurrency } from '@/lib/currency-utils';
import { DEFAULT_GOALS } from '@/lib/default-goals';
import { getUserFromStorage } from '@/lib/user-sync';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  usdTarget: number;
  currency: string;
}

interface CryptoData {
  symbol: string;
  name: string;
  price5YearsAgo: number;
  currentPrice: number;
  multiplier: number;
  yourValue: number;
}

export default function GoalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [showCrypto, setShowCrypto] = useState(false);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loadingCrypto, setLoadingCrypto] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
  });

  const { t } = useTranslation(user?.language || 'en');

  const createDefaultGoals = useCallback(async (userId: string) => {
    try {
      const checkRes = await fetch(`/api/goals/check-exists?userId=${userId}`);
      const checkData = await checkRes.json();

      if (checkData.exists) {
        const res = await fetch(`/api/goals/list?userId=${userId}`);
        const data = await res.json();
        if (res.ok) {
          // When default goals already exist we deduplicate by name to avoid
          // showing multiple versions of the same goal.  Goals may have
          // different IDs if recreated on the backend but share names.
          const seenNames = new Set<string>();
          const uniqueGoals: Goal[] = [];
          for (const goal of data.goals) {
            const key = goal.name.trim().toLowerCase();
            if (!seenNames.has(key)) {
              seenNames.add(key);
              uniqueGoals.push(goal);
            }
          }
          setGoals(uniqueGoals);
          setTotalSavings(data.totalSavings);
        }
        return;
      }
    } catch (error) {
      console.error('Failed to check existing goals:', error);
      return;
    }

    const createdGoals = [];
    for (const goal of DEFAULT_GOALS) {
      try {
        const res = await fetch('/api/goals/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: `${goal.icon} ${goal.name}`,
            targetAmount: goal.targetUSD,
            currency: 'USD',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          createdGoals.push(data.goal);
        }
      } catch (error) {
        console.error('Failed to create default goal:', error);
      }
    }

    setGoals(createdGoals);
  }, []);

  const loadGoals = useCallback(async (userId: string) => {
    if (isLoadingGoals) return;

    setIsLoadingGoals(true);
    try {
      const res = await fetch(`/api/goals/list?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        // Filter out any duplicate goals by unique identifier.  Sometimes the
        // backend can return repeated records (for example if default goals are
        // inserted more than once).  By deduplicating here we avoid showing the
        // same goal multiple times in the UI.
        // Deduplicate goals by name rather than ID.  When default goals are
        // seeded multiple times or edited, they may have different IDs but the
        // same name.  Filtering by name ensures we only display one copy.
        const seenNames = new Set<string>();
        const uniqueGoals: Goal[] = [];
        for (const goal of data.goals) {
          const key = goal.name.trim().toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            uniqueGoals.push(goal);
          }
        }
        setGoals(uniqueGoals);
        setTotalSavings(data.totalSavings);

        if (data.goals.length === 0 && !localStorage.getItem(`defaultGoalsCreated_${userId}`)) {
          await createDefaultGoals(userId);
          localStorage.setItem(`defaultGoalsCreated_${userId}`, 'true');
        }
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoadingGoals(false);
    }
  }, [createDefaultGoals, isLoadingGoals]);

  useEffect(() => {
    const parsedUser = getUserFromStorage();
    if (!parsedUser) {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    loadGoals(parsedUser.id);
  }, [router, loadGoals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/goals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          targetAmount: parseFloat(formData.targetAmount),
          currency: user.currency,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t('createGoal') + '! 🎯');
        setShowForm(false);
        setFormData({ name: '', targetAmount: '' });
        loadGoals(user.id);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const loadCryptoROI = async () => {
    if (totalSavings <= 0) {
      toast.error('Add some refusals first to see Crypto ROI!');
      return;
    }

    setLoadingCrypto(true);

    try {
      const res = await fetch(`/api/crypto/roi?amount=${totalSavings}`);
      const data = await res.json();
      if (res.ok && data.data && data.data.length > 0) {
        setCryptoData(data.data);
        setShowCrypto(true);
        toast.success('Crypto ROI calculated! 🚀');
      } else {
        toast.error('Failed to calculate Crypto ROI');
      }
    } catch (error) {
      console.error('Crypto ROI error:', error);
      toast.error('Network error');
    } finally {
      setLoadingCrypto(false);
    }
  };

  if (!user) return null;

  return (
    <div className="pb-24 px-4 py-6 max-w-screen-lg mx-auto relative min-h-screen">
      <MathWallBackground />

      <motion.div
        className="enough-panel mb-6 elevation-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-semibold tracking-tight mb-2 flex items-center gap-3">
          🎯 {t('yourGoals')}
        </h1>
        <div className="bg-white p-4 mt-4 rounded-xl border border-gray-200">
          <p className="text-xs font-medium mb-1 text-gray-700">{t('totalSavings')}</p>
          <p className="text-3xl font-semibold text-gray-900">
            {formatCurrency(convertCurrency(totalSavings, user.currency), user.currency)}
          </p>
        </div>
      </motion.div>

      <div className="enough-panel mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold ">{t('activeGoals')}</h2>
          <button
            onClick={() => setShowForm(true)}
            className="enough-button-primary px-4 py-2 text-sm elevation-2"
          >
            ➕ {t('new')}
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-bold">
            {t('noGoalsYet')}
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = Math.min((totalSavings / goal.usdTarget) * 100, 100);
              const convertedSavings = convertCurrency(totalSavings, user.currency);
              const convertedTarget = convertCurrency(goal.usdTarget, user.currency);

              return (
                <div
                  key={goal.id}
                  className="bg-white p-4 transition-all hover:shadow-[0_0_20px_rgba(245,198,26,0.6),0_4px_0px_#000] elevation-2"

                >
                  {progress >= 100 && (
                    <div className="bg-green-200 border-2 border-green-600 p-2 mb-3 text-center">
                      <span className="font-semibold text-green-800">🎉 GOAL ACHIEVED! 🎉</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg tracking-tight">{goal.name}</h3>
                      <p className="text-sm font-bold text-gray-700">
                        {t('target')}: {formatCurrency(convertedTarget, user.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold">
                        {progress.toFixed(0)}%
                        {progress >= 100 && <span className="ml-2">✅</span>}
                      </p>
                    </div>
                  </div>
                  <div className="enough-progress">
                    <div className="enough-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs font-bold text-gray-600 mt-2 text-center">
                    {formatCurrency(convertedSavings, user.currency)} / {formatCurrency(convertedTarget, user.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalSavings > 0 && (
        <div className="enough-panel mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            🚀 {t('cryptoROICalculator')}
          </h2>
          <div className="bg-white p-4 mb-4">
            <p className="text-sm font-bold text-gray-700 mb-2">
              {t('yourSavings')}: <span className="font-semibold">{formatCurrency(convertCurrency(totalSavings, user.currency), user.currency)}</span>
            </p>
            <p className="text-xs font-bold text-gray-600">
              {t('seeCryptoROI')}
            </p>
          </div>

          {!showCrypto ? (
            <button
              onClick={loadCryptoROI}
              disabled={loadingCrypto}
              className="enough-button w-full py-4 text-lg elevation-2"
            >
              {loadingCrypto ? '⏳ ' + t('calculating') : '🚀 ' + t('calculateCryptoROI')}
            </button>
          ) : (
            <div className="space-y-3">
              {cryptoData.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className="enough-card bg-white cursor-pointer hover:shadow-[0_0_25px_rgba(245,198,26,0.7),0_6px_0px_#000] elevation-2"
                  onClick={() => {
                    const convertedYourValue = convertCurrency(crypto.yourValue, user.currency);
                    const convertedOriginal = convertCurrency(totalSavings, user.currency);
                    const profit = convertedYourValue - convertedOriginal;
                    const roiPercent = ((crypto.multiplier - 1) * 100).toFixed(0);

                    alert(`🔥 ${crypto.name} (${crypto.symbol})

📊 Performance:
• 5 years ago: $${crypto.price5YearsAgo.toFixed(2)}
• Today: $${crypto.currentPrice.toFixed(2)}
• Growth: ${crypto.multiplier.toFixed(1)}x

💰 Your Investment:
• Original: ${formatCurrency(convertedOriginal, user.currency)}
• Would be: ${formatCurrency(convertedYourValue, user.currency)}
• Profit: ${formatCurrency(profit, user.currency)}

🎯 Return on Investment: +${roiPercent}%`);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-xl ">{crypto.symbol}</div>
                        <div className="enough-tag text-xs">
                          {crypto.multiplier.toFixed(1)}x
                        </div>
                      </div>
                      <div className="text-sm font-bold">{crypto.name}</div>
                      <div className="text-xs font-bold text-gray-500 mt-1">
                        ${crypto.price5YearsAgo.toFixed(2)} → ${crypto.currentPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold">
                        {formatCurrency(convertCurrency(crypto.yourValue, user.currency), user.currency)}
                      </div>
                      <div className="text-xs font-bold text-gray-600 mt-1">
                        +{formatCurrency(convertCurrency(crypto.yourValue - totalSavings, user.currency), user.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-white p-4 mt-4 transition-all hover:shadow-[0_0_20px_rgba(245,198,26,0.6)]">
                <div className="text-sm font-bold text-center text-gray-900">
                  💎 {t('bestPerformer')}: <span className="font-semibold">{cryptoData[0]?.symbol}</span> ({cryptoData[0]?.multiplier.toFixed(1)}x)
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 enough-modal-overlay flex items-center justify-center p-4 z-50 elevation-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="enough-modal max-w-md w-full elevation-2"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-2xl font-semibold mb-4">{t('createGoal')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder={t('goalName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 elevation-2"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('targetAmount')}
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                  className="w-full px-4 py-3 elevation-2"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 enough-button-primary elevation-2"
                  >
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 enough-button-secondary elevation-2"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />
    </div>
  );
}
