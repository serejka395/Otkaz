'use client';
// Force deployment trigger

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CURRENCIES_ARRAY } from '@/lib/currencies';
import { useTranslation, Language } from '@/lib/i18n';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';

export default function HomePage() {
  const router = useRouter();
  const [tonConnectUI] = useTonConnectUI();
  const [referralCode, setReferralCode] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for referral code in URL (dev/web) or Telegram initData
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref') || params.get('start');

    // Check Telegram WebApp initData
    let telegramRef = '';
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param) {
      telegramRef = (window as any).Telegram.WebApp.initDataUnsafe.start_param;
    }

    if (urlRef) setReferralCode(urlRef);
    else if (telegramRef) setReferralCode(telegramRef);

    const user = localStorage.getItem('user');
    if (user) {
      router.push('/calendar');
    }
  }, [router]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (wallet && !isLoading) {
        handleTonAuth(wallet.account.address);
      }
    });
    return () => unsubscribe();
  }, [tonConnectUI, isLoading]);

  const { t } = useTranslation(language as any);

  const handleTonAuth = async (address: string) => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/ton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, referralCode, currency, language }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/calendar');
      } else {
        // Only alert if it's a real error, sometimes onStatusChange triggers twice
        if (data.error) alert(data.error);
      }
    } catch (error) {
      console.error('Auth error:', error);
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
            {t('heroTitle')}
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
            {t('heroTagline')}
          </motion.p>

          <motion.p
            className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {t('heroSubtext')}
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
            className="p-10 rounded-3xl text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 16px 64px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('welcomeWallet')}</h2>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              {t('walletAuthDescription')}
            </p>

            <div className="flex flex-col items-center gap-6">
              <div className="scale-125 hover:scale-130 transition-transform duration-300">
                <TonConnectButton />
              </div>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  {t('connecting')}
                </motion.div>
              )}

              <div className="w-full grid grid-cols-1 gap-3 mt-4">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
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
                  className="w-full px-4 py-3 text-sm bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="ru">🇷🇺 Русский</option>
                </select>
              </div>
            </div>
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
            { icon: '✋', text: t('sayEnough') },
            { icon: '💎', text: t('buildWealth') },
            { icon: '🎯', text: t('reachGoals') },
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
