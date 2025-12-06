'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { getUserFromStorage } from '@/lib/user-sync';
import { useState, useEffect } from 'react';

/**
 * Navigation bar configuration.
 *
 * We aim for a more refined, business‑oriented look.  The previous implementation
 * relied heavily on playful emojis like diamonds and stop hands, which didn’t fit
 * the requested “premium business” aesthetic.  To address this we have updated
 * the icons to resemble common business symbols.  These values can be adjusted
 * in one place without touching the rendering logic below.
 */
const navItems = [
  {
    href: '/calendar',
    icon: '📆',
    labelKey: 'navCalendar',
  },
  {
    href: '/goals',
    icon: '🎯',
    labelKey: 'navGoals',
  },
  {
    href: '/dashboard',
    icon: '💼',
    labelKey: 'navDashboard',
  },
  {
    href: '/leaderboard',
    icon: '🥇',
    labelKey: 'navLeaders',
  },
  {
    href: '/why',
    icon: '💡',
    labelKey: 'navWhy',
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const [lang, setLang] = useState<'en' | 'ru'>('en');

  useEffect(() => {
    const user = getUserFromStorage();
    if (user?.language) {
      setLang(user.language as 'en' | 'ru');
    }
  }, []);

  const { t } = useTranslation(lang);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.04), 0 -8px 24px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div className="flex justify-around items-center px-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center py-2 px-3 sm:px-4 transition-all min-w-[60px] sm:min-w-[70px] group"
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 198, 26, 0.12) 0%, rgba(255, 217, 61, 0.08) 100%)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10">
                <motion.div
                  className="text-2xl sm:text-3xl mb-0.5 sm:mb-1"
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                >
                  {item.icon}
                </motion.div>

                {/* Glow effect on active */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 -m-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      background: 'radial-gradient(circle, rgba(245, 198, 26, 0.4) 0%, transparent 70%)',
                      filter: 'blur(8px)',
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] sm:text-xs font-medium tracking-tight relative z-10 transition-all duration-200
                  ${isActive
                    ? 'text-gray-900'
                    : 'text-gray-500 group-hover:text-gray-700'
                  }`}
              >
                {t(item.labelKey)}
              </span>

              {/* Hover effect for inactive items */}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: 'rgba(0, 0, 0, 0.02)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
