'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { CURRENCIES } from '@/lib/currencies';
import { RANKS, getRankForPoints } from '@/lib/ranks';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { getUserFromStorage } from '@/lib/user-sync';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string[] }>({ score: 0, feedback: [] });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { t } = useTranslation(user?.language || 'en');

  useEffect(() => {
    const parsedUser = getUserFromStorage();
    if (!parsedUser) {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    setCurrency(parsedUser.currency || 'USD');
    setLanguage(parsedUser.language || 'en');
    setUsername(parsedUser.username || '');
    setName(parsedUser.name || '');
  }, [router]);

  // Функция для проверки доступности никнейма
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === user?.username) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const res = await fetch('/api/user/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userId: user?.id })
      });
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Функция для проверки силы пароля
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: [] });
      return;
    }

    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) score += 1;
    else feedback.push(t('passwordTipMinChars'));

    if (password.length >= 12) score += 1;
    else feedback.push(t('passwordTipTwelveChars'));

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push(t('passwordTipLower'));

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push(t('passwordTipUpper'));

    if (/\d/.test(password)) score += 1;
    else feedback.push(t('passwordTipNumbers'));

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    else feedback.push(t('passwordTipSpecial'));

    if (password.length >= 16) score += 1;

    setPasswordStrength({ score, feedback });
  };

  const handleSave = async () => {
    try {
      // Подготавливаем обновления
      const updates: any = {
        currency,
        language
      };

      // Добавляем имя и никнейм, если они изменились
      if (name !== user.name) {
        updates.name = name;
      }
      if (username !== user.username) {
        updates.username = username;
      }

      // Добавляем пароль, если он указан
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error(t('passwordsNoMatch'));
          return;
        }
        if (passwordStrength.score < 3) {
          toast.error(t('passwordTooWeak'));
          return;
        }
        updates.password = newPassword;
      }

      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: currentPassword || undefined,
          updates
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditMode(false);
        setShowPasswordForm(false);

        // Очищаем формы
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordStrength({ score: 0, feedback: [] });

        toast.success('Profile updated successfully! ✅');

        // Trigger storage event to notify other components
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const copyReferralLink = () => {
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME;
    const link = botUsername
      ? `https://t.me/${botUsername}?start=${user.referralCode}`
      : `${window.location.origin}/?ref=${user.referralCode}`;

    navigator.clipboard.writeText(link);
    toast.success(t('referralLinkCopied') + ' 📋');
  };

  if (!user) return null;

  const currentRank = getRankForPoints(user.points);
  const nextRankIndex = RANKS.findIndex(r => r.name === currentRank.name) + 1;
  const nextRank = nextRankIndex < RANKS.length ? RANKS[nextRankIndex] : null;
  const progressToNext = nextRank
    ? ((user.points - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100
    : 100;

  return (
    <div className="pb-24 px-4 py-6 max-w-screen-lg mx-auto">
      <div className="enough-panel mb-6">
        <h1 className="text-4xl font-bold mb-2">👤 {t('profile')}</h1>
        <div className="bg-white border-0 p-6 mt-4 text-gray-900">
          <p className="text-2xl font-bold mb-1">{user.name || user.email}</p>
          {user.username && (
            <p className="text-lg font-bold mb-1">@{user.username}</p>
          )}
          <p className="text-sm opacity-90">{user.email}</p>
        </div>
      </div>

      <div className="enough-panel mb-6">
        <h2 className="text-2xl font-bold mb-4">{t('rankProgress')}</h2>
        <div className="bg-white border-0 p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-sm text-gray-700">{t('currentRank')}</p>
              <p className="text-2xl font-bold" style={{ color: currentRank.color }}>
                {language === 'ru' ? currentRank.nameRu : currentRank.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-700">{t('points')}</p>
              <p className="text-3xl font-bold">{user.points.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {nextRank && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-700">{t('nextRank')}</p>
              <p className="font-bold" style={{ color: nextRank.color }}>
                {language === 'ru' ? nextRank.nameRu : nextRank.name}
              </p>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressToNext}%` }} />
            </div>
            <p className="text-xs text-center text-gray-600 mt-2">
              {(nextRank.minPoints - user.points).toFixed(0)} {t('pointsToGo')}
            </p>
          </div>
        )}
      </div>

      <div className="enough-panel mb-6">
        <h2 className="text-2xl font-bold mb-4">{t('referralSystem')}</h2>
        <div className="bg-white border-0 p-4 mb-3">
          <p className="text-sm text-gray-700 mb-2">{t('yourReferralCode')}</p>
          <p className="text-3xl font-bold text-center mb-2">{user.referralCode}</p>
          <button onClick={copyReferralLink} className="w-full enough-button text-sm">
            {t('copyLink')}
          </button>
        </div>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• Invite friends and earn bonus points!</p>
          <p>• +50 pts when they make their first entry</p>
          <p>• +20 pts for them when they sign up</p>
          <p>• +25 pts for both when they stay active!</p>
        </div>
      </div>

      <div className="enough-panel mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{t('settings')}</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="enough-button-primary border-0 px-4 py-2 elevation-2"
            >
              ✏️ {t('edit')}
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">{t('displayName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editMode}
              placeholder="Enter your display name"
              className="w-full px-4 py-3 border-0 disabled:bg-gray-100 elevation-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{t('username')}</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  checkUsernameAvailability(e.target.value);
                }}
                disabled={!editMode}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border-0 disabled:bg-gray-100 pr-12 elevation-2"
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin border-0 h-4 w-4 border-b-2 border-gray-200"></div>
                </div>
              )}
              {!isCheckingUsername && username && username !== user?.username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {usernameAvailable === true && <span className="text-green-600 text-xl">✓</span>}
                  {usernameAvailable === false && <span className="text-red-600 text-xl">✗</span>}
                </div>
              )}
            </div>
            {username && username !== user?.username && usernameAvailable === false && (
              <p className="text-red-600 text-sm mt-1">{t('usernameTaken')}</p>
            )}
            {username && username !== user?.username && usernameAvailable === true && (
              <p className="text-green-600 text-sm mt-1">{t('usernameAvailable')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{t('currency')}</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!editMode}
              className="w-full px-4 py-3 border-0 disabled:bg-gray-100 elevation-2"
            >
              {Object.entries(CURRENCIES).map(([code, data]) => (
                <option key={code} value={code}>
                  {code} - {data.name} ({data.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">{t('language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!editMode}
              className="w-full px-4 py-3 border-0 disabled:bg-gray-100 elevation-2"
            >
              <option value="en">English 🇬🇧</option>
              <option value="ru">Русский 🇷🇺</option>
            </select>
          </div>

          {editMode && (
            <div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="enough-button-cyan w-full elevation-2"
              >
                🔒 {showPasswordForm ? t('hidePasswordChange') : t('changePassword')}
              </button>
            </div>
          )}

          {showPasswordForm && (
            <div className="space-y-4 p-4 bg-gray-100 border-0 ">
              <h3 className="text-lg font-bold">{t('changePassword')}</h3>

              <div>
                <label className="block text-sm font-bold mb-2">{t('currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 border-0 elevation-2"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">{t('newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    checkPasswordStrength(e.target.value);
                  }}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border-0 elevation-2"
                />
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold">{t('passwordStrength')}:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map((level) => (
                          <div
                            key={level}
                            className={`w-4 h-2 border-0 ${level <= passwordStrength.score
                              ? level <= 2
                                ? 'bg-red-500'
                                : level <= 4
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              : 'bg-gray-300'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-gray-600">
                        {passwordStrength.feedback.map((tip, index) => (
                          <li key={index}>• {tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 border-0 elevation-2"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{t('passwordsNoMatch')}</p>
                )}
              </div>
            </div>
          )}

          {editMode && (
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 enough-button-primary">
                💾 {t('save')}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 enough-button-secondary elevation-2"
              >
                ❌ {t('cancel')}
              </button>
            </div>
          )}
        </div>
      </div>

      <motion.button
        onClick={handleLogout}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 px-6 rounded-xl font-bold transition-all"
        style={{
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
        }}
      >
        🚪 {t('logout')}
      </motion.button>

      {/* Move the navigation inside the root container and remove the stray closing div
          that was leaving us with one more </div> than we had opened. */}
      <Navigation />
    </div>
  );
}
