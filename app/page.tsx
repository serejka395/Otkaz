'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CURRENCIES_ARRAY } from '@/lib/currencies';
import { translations, Language } from '@/lib/translations';

export default function HomePage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/calendar');
    }
  }, [router]);

  // Handle browser language detection on first load (optional, keeping it simple for now)
  // useEffect(() => {
  //   const browserLang = navigator.language.split('-')[0];
  //   if (browserLang === 'ru') setLanguage('ru');
  // }, []);

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin
      ? { email, password }
      : { email, password, name, referralCode, currency, language };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/calendar');
      } else {
        alert(data.error || 'Error occurred');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F5F5F7' }}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(245, 198, 26, 0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255, 217, 61, 0.3) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12 max-w-4xl"
        >
          {/* Logo */}
          <motion.h1
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-6"
            style={{
              background: 'linear-gradient(135deg, #1D1D1F 0%, #48484A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.03em',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.hero.title}
            <span className="text-gradient-enough">.</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-4"
            style={{
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {t.hero.tagline}
          </motion.p>

          <motion.p
            className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {t.hero.subtext}
          </motion.p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          <div
            className="p-8 rounded-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 16px 64px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-8 p-1 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.04)' }}>
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {t.auth.signInTab}
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${!isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {t.auth.signUpTab}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <input
                      type="text"
                      placeholder={t.auth.namePlaceholder}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 text-base"
                      required={!isLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="email"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base"
                required
              />

              <input
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base"
                required
              />

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      placeholder={t.auth.referralPlaceholder}
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full px-4 py-3 text-base"
                    />

                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 text-base"
                    >
                      {CURRENCIES_ARRAY.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.code} - {curr.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="w-full px-4 py-3 text-base"
                    >
                      <option value="en">🇬🇧 English</option>
                      <option value="ru">🇷🇺 Русский</option>
                    </select>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Language selector for Login view as well, so users can switch lang before logging in if they want */}
              {isLogin && (
                <div className="mt-4">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full px-4 py-3 text-base bg-white/50 border-none"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="ru">🇷🇺 Русский</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="enough-button-primary w-full py-4 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? t.auth.loading : isLogin ? t.auth.signInButton : t.auth.createAccountButton}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-3 gap-4 mt-12 max-w-2xl"
        >
          {[
            { icon: '✋', text: t.features.sayEnough },
            { icon: '💎', text: t.features.buildWealth },
            { icon: '🎯', text: t.features.reachGoals },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="text-center p-4 rounded-xl transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <p className="text-xs font-medium text-gray-700">{item.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
