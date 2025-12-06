'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import MathWallBackground from '@/components/MathWallBackground';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';
import { getUserFromStorage } from '@/lib/user-sync';
import { getUserPresets, saveUserPresets, UserPreset, WHY_TAGS, getWhyTagName } from '@/lib/user-presets';

export default function WhyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [presets, setPresets] = useState<UserPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<UserPreset | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);

  const { t } = useTranslation(user?.language || 'en');

  useEffect(() => {
    const parsedUser = getUserFromStorage();
    if (!parsedUser) {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    setPresets(getUserPresets(parsedUser.id));
  }, [router]);

  const toggleTag = async (presetId: string, tagId: string) => {
    const updatedPresets = presets.map(preset => {
      if (preset.id === presetId) {
        const currentTags = preset.tags || [];
        const hasTag = currentTags.includes(tagId);

        return {
          ...preset,
          tags: hasTag
            ? currentTags.filter(t => t !== tagId)
            : [...currentTags, tagId]
        };
      }
      return preset;
    });

    setPresets(updatedPresets);
    saveUserPresets(user.id, updatedPresets);

    if (selectedPreset && selectedPreset.id === presetId) {
      const updated = updatedPresets.find(p => p.id === presetId);
      if (updated) setSelectedPreset(updated);
    }

    try {
      const res = await fetch('/api/achievements/check-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (res.ok && data.newAchievements?.length > 0) {
        data.newAchievements.forEach((achievement: any) => {
          toast.success(`🏅 Achievement Unlocked: ${user.language === 'ru' ? achievement.nameRu : achievement.nameEn}!`, {
            duration: 5000,
            icon: achievement.icon,
          });
        });
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  };

  const openTagModal = (preset: UserPreset) => {
    setSelectedPreset(preset);
    setShowTagModal(true);
  };

  const getPresetTags = (preset: UserPreset) => {
    return preset.tags || [];
  };

  if (!user) return null;

  return (
    <div className="pb-24 px-4 py-6 max-w-screen-lg mx-auto relative min-h-screen">
      <MathWallBackground />

      <div className="enough-panel mb-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-2 flex items-center gap-3">
          🤔 {t('whyTitle')}
        </h1>
        <p className="font-bold text-gray-700">{t('whyDescription')}</p>
      </div>

      <div className="bg-white p-4 mb-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          💡 {t('tip')}
        </h3>
        <p className="text-sm font-bold text-gray-700">
          {t('whyTip')}
        </p>
      </div>

      <div className="space-y-3">
        {presets.map((preset) => {
          const tags = getPresetTags(preset);

          return (
            <div key={preset.id} className="enough-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{preset.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg tracking-tight">{preset.name}</h3>
                    <p className="text-sm font-bold text-gray-600">{t(preset.category)}</p>
                  </div>
                </div>
                <button
                  onClick={() => openTagModal(preset)}
                  className="enough-button-secondary px-4 py-2 text-sm elevation-2"
                >
                  {tags.length > 0 ? `✏️ ${t('edit')}` : `➕ ${t('addTags')}`}
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tagId) => {
                    const tag = WHY_TAGS.find(t => t.id === tagId);
                    if (!tag) return null;

                    return (
                      <div key={tagId} className="enough-tag px-3 py-1 flex items-center gap-2">
                        <span className="text-lg">{tag.icon}</span>
                        <span>{getWhyTagName(tagId, user.language)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {tags.length === 0 && (
                <div className="text-center py-2 text-gray-500 text-sm font-bold">
                  {t('noTagsYet')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tag Selection Modal */}
      {showTagModal && selectedPreset && (
        <div className="fixed inset-0 enough-modal-overlay flex items-center justify-center p-4 z-50">
          <motion.div
            className="enough-modal max-w-2xl w-full max-h-[80vh] overflow-y-auto elevation-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedPreset.icon}</span>
                <div>
                  <h2 className="text-2xl font-semibold ">{selectedPreset.name}</h2>
                  <p className="text-sm font-bold text-gray-700">{t('selectWhyTags')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTagModal(false);
                  setSelectedPreset(null);
                }}
                className="text-3xl hover:scale-110 transition-transform elevation-2"
              >
                ✖️
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WHY_TAGS.map((tag) => {
                const isSelected = (selectedPreset.tags || []).includes(tag.id);

                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(selectedPreset.id, tag.id)}
                    className={`p-4  font-semibold tracking-tight text-left transition-all
                      ${isSelected ? 'bg-white' : 'bg-white hover:bg-white'}`}
                    style={{
                      boxShadow: isSelected
                        ? '0 2px 6px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tag.icon}</span>
                      <div>
                        <div className="text-sm">{user.language === 'ru' ? tag.nameRu : tag.nameEn}</div>
                        {isSelected && <div className="text-xs opacity-75">✓ Selected</div>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                onClick={async () => {
                  setShowTagModal(false);
                  setSelectedPreset(null);
                  toast.success(t('tagsSaved') + ' ✅');

                  try {
                    const res = await fetch('/api/achievements/check-tags', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: user.id }),
                    });

                    const data = await res.json();
                    if (res.ok && data.newAchievements?.length > 0) {
                      setTimeout(() => {
                        data.newAchievements.forEach((achievement: any, index: number) => {
                          setTimeout(() => {
                            toast.success(`🏅 ${user.language === 'ru' ? achievement.nameRu : achievement.nameEn}!`, {
                              duration: 5000,
                              icon: achievement.icon,
                            });
                          }, index * 1000);
                        });
                      }, 500);
                    }
                  } catch (error) {
                    console.error('Failed to check achievements:', error);
                  }
                }}
                className="w-full enough-button-primary py-3 elevation-2"
              >
                💾 {t('done')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Navigation />
    </div>
  );
}
