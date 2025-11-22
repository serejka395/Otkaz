'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import BoomAnimation from '@/components/BoomAnimation';
import PresetsEditor from '@/components/PresetsEditor';
import TallyMarksBackground from '@/components/TallyMarksBackground';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency, getCurrencySymbol, convertCurrency } from '@/lib/currency-utils';
import { getUserFromStorage } from '@/lib/user-sync';
import { getUserPresets, UserPreset, WHY_TAGS, getWhyTagName } from '@/lib/user-presets';

interface Entry {
  id: string;
  name: string;
  pricePerUnit: number;
  quantity: number;
  category: string;
  currency: string;
  usdAmount: number;
  date: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [presets, setPresets] = useState<UserPreset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPresetsEditor, setShowPresetsEditor] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [showBoom, setShowBoom] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    pricePerUnit: '',
    quantity: '1',
    category: 'other',
    note: '',
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
    loadEntries(parsedUser.id);
  }, [router]);

  useEffect(() => {
    const handleStorageChange = () => {
      const parsedUser = getUserFromStorage();
      if (parsedUser) {
        setUser(parsedUser);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadEntries = async (userId: string) => {
    try {
      // Fetch all entries instead of just today.  The server groups entries by
      // server time zone, which can cause entries around midnight to fall
      // outside the expected day for the user.  We filter on the client to
      // include any entry whose date matches the user’s local day.
      const res = await fetch(`/api/entries/list?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        const allEntries: Entry[] = data.entries || [];
        const today = new Date();
        const filtered = allEntries.filter((entry) => {
          const d = new Date(entry.date);
          return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
          );
        });
        setEntries(filtered);
      }
    } catch (error) {
      console.error('[Calendar] Failed to load entries:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const todayTotalUSD = entries.reduce((sum, e) => sum + (e.usdAmount || 0), 0);
    const converted = convertCurrency(todayTotalUSD, user.currency || 'USD');
    setTodayTotal(converted);
  }, [entries, user]);

  const handlePreset = (preset: UserPreset) => {
    setFormData({
      name: preset.name,
      pricePerUnit: preset.price.toString(),
      quantity: '1',
      category: preset.category,
      note: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/entries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          pricePerUnit: parseFloat(formData.pricePerUnit),
          quantity: parseFloat(formData.quantity),
          currency: user.currency || 'USD',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowBoom(true);
        toast.success(`+${data.pointsEarned.toFixed(1)} ${t('pointsEarned')}`);
        
        const updatedUser = { ...user, points: (Number(user.points) || 0) + data.pointsEarned };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        await loadEntries(user.id);
        
        setShowForm(false);
        setFormData({ name: '', pricePerUnit: '', quantity: '1', category: 'other', note: '' });
      } else {
        toast.error(data.error || 'Failed to create entry');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  if (!user) return null;

  return (
    <div className="pb-24 px-4 py-6 max-w-screen-lg mx-auto relative min-h-screen">
      <TallyMarksBackground />
      <BoomAnimation 
        show={showBoom} 
        onComplete={() => setShowBoom(false)}
        text="Saved!"
        emoji="✓"
        type="success"
      />

      <motion.div 
        className="enough-panel mb-6 elevation-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-semibold mb-2 tracking-tight">
          📅 {t('todaysRefusals')}
        </h1>
        <p className="text-lg font-bold text-gray-700">{format(new Date(), 'MMMM d, yyyy')}</p>
        
        <div 
          className="mt-4 bg-white p-6 text-center rounded-2xl elevation-2"
        >
          <p className="text-sm font-semibold tracking-normal mb-1 text-gray-700">
            {t('savedToday')}
          </p>
          <p className="text-5xl font-semibold text-gray-900">
            {formatCurrency(todayTotal, user?.currency || 'USD')}
          </p>
        </div>
      </motion.div>

      <motion.div 
        className="enough-panel mb-6 elevation-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            ⚡ {t('quickAdd')}
          </h2>
          <button
            onClick={() => setShowPresetsEditor(true)}
            className="enough-button-secondary px-4 py-2 text-sm elevation-2"
          >
            ⚙️ {t('customize')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset, index) => {
            const presetTags = preset.tags || [];
            
            return (
              <button
                key={preset.id}
                onClick={() => handlePreset(preset)}
                className="p-5 bg-white font-semibold transition-all hover:shadow-[0_0_20px_rgba(245,198,26,0.6),0_6px_0px_#000] hover:bg-[rgba(245,198,26,0.08)] hover:-translate-y-1 elevation-2"
                
              >
                <div className="text-4xl mb-2">{preset.icon}</div>
                <div className="font-semibold text-base tracking-tight text-gray-900">{preset.name}</div>
                <div className="text-sm font-bold text-gray-700">
                  {getCurrencySymbol(user?.currency || 'USD')}{preset.price}
                </div>
                
                {presetTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {presetTags.slice(0, 2).map((tagId) => {
                      const tag = WHY_TAGS.find(t => t.id === tagId);
                      if (!tag) return null;
                      
                      return (
                        <div
                          key={tagId}
                          className="enough-tag text-[10px] elevation-2"
                          title={getWhyTagName(tagId, user?.language || 'en')}
                        >
                          {tag.icon}
                        </div>
                      );
                    })}
                    {presetTags.length > 2 && (
                      <div className="enough-tag text-[10px]">
                        +{presetTags.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="enough-button w-full mt-4 py-4 text-lg elevation-2"
        >
          {t('customEntry')}
        </button>
      </motion.div>

      {showPresetsEditor && (
        <PresetsEditor
          userId={user.id}
          presets={presets}
          currency={user.currency || 'USD'}
          onPresetsUpdated={(updatedPresets) => setPresets(updatedPresets)}
          onClose={() => setShowPresetsEditor(false)}
          t={t}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 enough-modal-overlay flex items-center justify-center p-4 z-50">
          <motion.div 
            className="enough-modal max-w-md w-full elevation-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h2 className="text-2xl font-semibold mb-4">{t('addRefusal')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={t('whatDidYouRefuse')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 elevation-2"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('price')}
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                  required
                  className="flex-1 px-4 py-3 elevation-2"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder={t('quantity')}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-20 px-4 py-3 elevation-2"
                />
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 elevation-2"
              >
                <option value="habits">{t('habits')}</option>
                <option value="food">{t('food')}</option>
                <option value="drinks">{t('drinks')}</option>
                <option value="entertainment">{t('entertainment')}</option>
                <option value="shopping">{t('shopping')}</option>
                <option value="other">{t('other')}</option>
              </select>
              <textarea
                placeholder={t('note')}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-4 py-3 elevation-2"
                rows={2}
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 enough-button-primary">
                  💾 {t('save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 enough-button-secondary elevation-2"
                >
                  ❌ {t('cancel')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <motion.div 
        className="enough-panel elevation-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-4">
          {t('todaysEntries')}
        </h2>
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💪</div>
            <p className="text-xl font-bold text-gray-600">
              {t('noRefusalsYet')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="bg-white p-4 flex justify-between items-center elevation-2"
                
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div>
                  <div className="font-semibold text-lg tracking-tight">
                    {entry.name}
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {entry.quantity}x @ {formatCurrency(entry.pricePerUnit, entry.currency)} • {entry.category}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-2xl">
                    {formatCurrency(entry.pricePerUnit * entry.quantity, entry.currency)}
                  </div>
                  <div className="text-xs font-bold text-gray-600">{format(new Date(entry.date), 'HH:mm')}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <Navigation />
    </div>
  );
}
