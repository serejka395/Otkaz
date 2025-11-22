'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import MathWallBackground from '@/components/MathWallBackground';
import { useTranslation } from '@/lib/i18n';
import { getUserFromStorage } from '@/lib/user-sync';

interface LeaderboardEntry {
  id: string;
  user: {
    id: string;
    name: string;
    username?: string;
    points: number;
    rank: string;
  };
  totalPoints: number;
  rank: number;
  period: string;
}

interface DailyTask {
  id: string;
  code: string;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  points: number;
  type: string;
  target?: number;
  category?: string;
  isCompleted: boolean;
  progress: number;
  maxProgress: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { t } = useTranslation(user?.language || 'en');

  useEffect(() => {
    const parsedUser = getUserFromStorage();
    if (!parsedUser) {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    loadLeaderboard(parsedUser.id);
    loadDailyTasks(parsedUser.id);
  }, [router, selectedPeriod, loadLeaderboard, loadDailyTasks]);

  const loadLeaderboard = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/leaderboard?period=${selectedPeriod}`);
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  }, [selectedPeriod]);

  const loadDailyTasks = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/daily-tasks?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setDailyTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to load daily tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/daily-tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, taskId })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Обновляем задачи
        setDailyTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, isCompleted: true, progress: task.maxProgress }
            : task
        ));
        
        // Обновляем очки пользователя
        const updatedUser = { ...user, points: user.points + data.pointsEarned };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Перезагружаем лидерборд
        loadLeaderboard(user.id);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  if (!user) return null;

  const completedTasks = dailyTasks.filter(task => task.isCompleted).length;
  const totalTasks = dailyTasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="pb-24 px-4 py-6 max-w-screen-lg mx-auto relative">
      <MathWallBackground />
      <motion.div 
        className="enough-panel mb-6 relative overflow-hidden elevation-2"
        initial={{ scale: 0.9, opacity: 0, y: -30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 bg-white border-0 opacity-5 elevation-2"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <motion.h1 
          className="text-4xl font-bold mb-2 flex items-center gap-3 relative z-10 elevation-2"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.span 
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🏆
          </motion.span>
          {t('leaderboard')}
        </motion.h1>
        <p className="text-gray-700 font-bold relative z-10">Compete with other savers and complete daily tasks! 💪</p>
      </motion.div>

      {/* Daily Tasks Section */}
      <motion.div 
        className="enough-panel mb-6 elevation-2"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <div className="flex justify-between items-center mb-4">
          <motion.h2 
            className="text-2xl font-bold flex items-center gap-2 elevation-2"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
              📋
            </motion.span>
            Daily Tasks
          </motion.h2>
          <div className="text-sm font-bold bg-white px-3 py-1 border-0 ">
            {completedTasks}/{totalTasks}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <p className="text-xs text-center font-bold text-gray-700 mt-2">
            {progressPercentage.toFixed(0)}% complete • <span className="text-gray-900">{dailyTasks.filter(t => !t.isCompleted).reduce((sum, t) => sum + t.points, 0)}</span> points remaining
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin border-0 h-8 w-8 border-b-2 border-gray-200 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dailyTasks.map((task, index) => (
              <motion.div
                key={task.id}
                className={`border-0  p-4 relative overflow-hidden ${
                  task.isCompleted 
                    ? 'bg-white from-green-300 to-emerald-400' 
                    : 'bg-white'
                }`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05, type: 'spring' }}
                whileHover={{ scale: 1.02, y: -3, boxShadow: '8px 8px 0px #000' }}
              >
                {task.isCompleted && (
                  <div className="absolute inset-0 bg-white from-transparent via-white/30 to-transparent animate-[shine_3s_ease-in-out_infinite]" />
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {user.language === 'ru' ? task.nameRu : task.nameEn}
                    </h3>
                    <p className="text-sm text-gray-700">
                      {user.language === 'ru' ? task.descriptionRu : task.descriptionEn}
                    </p>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 border-0 h-2">
                          <div 
                            className="bg-white h-2 border-0 transition-all elevation-2"
                            style={{ width: `${(task.progress / task.maxProgress) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {task.progress}/{task.maxProgress}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 relative z-10">
                    <motion.div 
                      className="text-2xl font-semibold text-gray-900 elevation-2"
                      style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
                    >
                      +{task.points}
                    </motion.div>
                    {task.isCompleted ? (
                      <motion.div 
                        className="text-gray-900 text-sm font-semibold elevation-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}
                      >
                        ✓ DONE
                      </motion.div>
                    ) : task.progress >= task.maxProgress ? (
                      <motion.button
                        onClick={() => completeTask(task.id)}
                        className="px-4 py-2 border-0 font-semibold text-sm 
                          bg-white from-enough-yellow to-enough-yellow enough-shadow
                          hover:enough-shadow-lg hover:scale-110"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        CLAIM! 🎁
                      </motion.button>
                    ) : (
                      <div className="text-gray-600 text-sm font-bold">In Progress...</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Leaderboard Section */}
      <motion.div 
        className="enough-panel mb-6 elevation-2"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, type: 'spring' }}
      >
        <div className="flex justify-between items-center mb-4">
          <motion.h2 
            className="text-2xl font-bold flex items-center gap-2 elevation-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span animate={{ rotate: [0, -15, 15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              🏆
            </motion.span>
            Leaderboard
          </motion.h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border-0 font-semibold bg-white enough-shadow
              hover:enough-shadow-lg transition-all"
          >
            <option value="daily">📅 Today</option>
            <option value="weekly">📆 This Week</option>
            <option value="monthly">📊 This Month</option>
            <option value="alltime">⭐ All Time</option>
          </select>
        </div>

        {userRank && (
          <motion.div 
            className="bg-white from-enough-yellow border-0 p-6 mb-4 relative overflow-hidden elevation-2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            whileHover={{ scale: 1.02, y: -3 }}
          >
            <div className="absolute inset-0 bg-white from-transparent via-white/30 to-transparent animate-[shine_3s_ease-in-out_infinite]" />
            <div className="text-center relative z-10">
              <p className="text-sm font-semibold text-gray-900 mb-1" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                YOUR RANK
              </p>
              <motion.p 
                className="text-5xl font-semibold text-gray-900 mb-2 elevation-2"
                style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                #{userRank}
              </motion.p>
              <p className="text-xl font-semibold text-gray-900" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
                {user.points.toFixed(0)} POINTS
              </p>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const colors = [
              'bg-white from-yellow-400 via-yellow-500 to-amber-500',
              'bg-white from-gray-300 via-gray-400 to-gray-500',
              'bg-white from-orange-400 via-orange-500 to-red-500',
              'bg-white'
            ];
            const borderColors = index < 3 ? 'border-gray-200' : 'border-gray-400';
            
            return (
              <motion.div
                key={entry.id}
                className={`flex items-center justify-between p-4 border-0 border-2 ${borderColors} ${
                  index < 3 ? colors[index] : colors[3]
                } ${index < 3 ? 'enough-shadow-lg' : 'enough-shadow'} relative overflow-hidden`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05, type: 'spring' }}
                whileHover={{ scale: 1.02, x: 5, boxShadow: index < 3 ? '10px 10px 0px #000' : '6px 6px 0px #000' }}
              >
                {index < 3 && (
                  <div className="absolute inset-0 bg-white from-transparent via-white/30 to-transparent animate-[shine_4s_ease-in-out_infinite]" />
                )}
                
              <div className="flex items-center gap-3 relative z-10">
                <motion.div 
                  className={`text-4xl font-semibold ${index < 3 ? 'text-gray-900' : 'text-gray-700'}`}
                  style={index < 3 ? { 
                    filter: 'drop-shadow(3px 3px 0px rgba(0,0,0,0.5))',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.3)' 
                  } : {}}
                  animate={{ scale: index === 0 ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </motion.div>
                <div>
                  <div className={`font-semibold text-lg ${index < 3 ? 'text-gray-900' : 'text-gray-900'}`}
                    style={index < 3 ? { textShadow: '2px 2px 0px rgba(0,0,0,0.3)' } : {}}>
                    {entry.user.username ? `@${entry.user.username}` : entry.user.name}
                  </div>
                  <div className={`text-sm font-bold ${index < 3 ? 'text-gray-900/80' : 'text-gray-600'}`}>
                    {entry.user.rank}
                  </div>
                </div>
              </div>
              <div className="text-right relative z-10">
                <motion.div 
                  className={`font-semibold text-2xl ${index < 3 ? 'text-gray-900' : 'text-gray-900'}`}
                  style={index < 3 ? { textShadow: '2px 2px 0px rgba(0,0,0,0.5)' } : {}}
                >
                  {entry.totalPoints.toFixed(0)}
                </motion.div>
                <div className={`text-xs font-bold  ${index < 3 ? 'text-gray-900/80' : 'text-gray-600'}`}>
                  points
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>
      </motion.div>

      <Navigation />
    </div>
  );
}
