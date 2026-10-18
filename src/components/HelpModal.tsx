/**
 * @file HelpModal.tsx
 * @description Comprehensive application documentation, keyboard shortcuts reference & customization,
 * architectural guides, and interactive OKF documentation viewer modal.
 */

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  X,
  Keyboard,
  BookOpen,
  Sparkles,
  Layers,
  Wand2,
  PenTool,
  Users,
  Download,
  Database,
  RotateCcw,
  Check,
  Search,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ShortcutItem,
  saveShortcuts,
  resetShortcuts,
} from '../utils/shortcuts';
import { OkfViewer } from './okf/OkfViewer';

/**
 * Props for the HelpModal reference dialog.
 */
interface HelpModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Modal close trigger */
  onClose: () => void;
  /** Active user keyboard shortcut keybindings */
  shortcuts: ShortcutItem[];
  /** Callback fired when user customizes hotkeys */
  onUpdateShortcuts: (shortcuts: ShortcutItem[]) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
  onUpdateShortcuts,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'features' | 'shortcuts' | 'okf'>('features');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Close on Escape when not recording shortcut
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingShortcutId) {
          setEditingShortcutId(null);
          setConflictWarning(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, editingShortcutId, onClose]);

  // Key recording listener
  useEffect(() => {
    if (!editingShortcutId) return;

    const handleRecordKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel with Escape
      if (e.key === 'Escape') {
        setEditingShortcutId(null);
        setConflictWarning(null);
        return;
      }

      // Ignore bare modifier presses
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      let newKey = e.key;

      // Handle modifiers combos
      if (e.ctrlKey || e.metaKey) {
        newKey = `Ctrl+${e.key.toUpperCase()}`;
      } else if (e.key.length === 1) {
        newKey = e.key.toLowerCase();
      }

      // Check conflict
      const existing = shortcuts.find(
        (s) => s.id !== editingShortcutId && s.currentKey.toLowerCase() === newKey.toLowerCase()
      );

      const target = shortcuts.find((s) => s.id === editingShortcutId);
      if (!target) return;

      const updated = shortcuts.map((s) => {
        if (s.id === editingShortcutId) {
          return { ...s, currentKey: newKey };
        }
        // If conflict with existing, swap or alert
        if (existing && s.id === existing.id) {
          return { ...s, currentKey: target.currentKey };
        }
        return s;
      });

      onUpdateShortcuts(updated);
      saveShortcuts(updated);
      setEditingShortcutId(null);
      setConflictWarning(null);

      const targetName = t(`shortcuts.${target.id}.name`, { defaultValue: target.name });
      const existingName = existing ? t(`shortcuts.${existing.id}.name`, { defaultValue: existing.name }) : '';

      const toastMsg = existing
        ? t('helpModal.reboundSuccess', { name: targetName, key: newKey, existing: existingName })
        : t('helpModal.boundSuccess', { name: targetName, key: newKey });
      setSuccessToast(toastMsg);
      setTimeout(() => setSuccessToast(null), 3000);
    };

    window.addEventListener('keydown', handleRecordKey, { capture: true });
    return () => window.removeEventListener('keydown', handleRecordKey, { capture: true });
  }, [editingShortcutId, shortcuts, onUpdateShortcuts, t]);

  if (!isOpen) return null;

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'All': return t('helpModal.categories.all');
      case 'Tools': return t('helpModal.categories.tools');
      case 'Canvas & View': return t('helpModal.categories.canvasAndView');
      case 'Edit & History': return t('helpModal.categories.editAndHistory');
      case 'AI & Features': return t('helpModal.categories.aiAndFeatures');
      default: return cat;
    }
  };

  const categories = ['All', 'Tools', 'Canvas & View', 'Edit & History', 'AI & Features'];

  const filteredShortcuts = shortcuts.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const localizedName = t(`shortcuts.${s.id}.name`, { defaultValue: s.name });
    const localizedDesc = t(`shortcuts.${s.id}.description`, { defaultValue: s.description });
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      localizedName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      localizedDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.currentKey.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleResetDefaults = () => {
    const def = resetShortcuts();
    onUpdateShortcuts(def);
    setEditingShortcutId(null);
    setConflictWarning(null);
    setSuccessToast(t('helpModal.resetSuccess'));
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const appFeatures = [
    {
      icon: Layers,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
      title: t('helpModal.features.f1Title'),
      description: t('helpModal.features.f1Desc'),
    },
    {
      icon: PenTool,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400',
      title: t('helpModal.features.f2Title'),
      description: t('helpModal.features.f2Desc'),
    },
    {
      icon: Wand2,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
      title: t('helpModal.features.f3Title'),
      description: t('helpModal.features.f3Desc'),
    },
    {
      icon: Sparkles,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
      title: t('helpModal.features.f4Title'),
      description: t('helpModal.features.f4Desc'),
    },
    {
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
      title: t('helpModal.features.f5Title'),
      description: t('helpModal.features.f5Desc'),
    },
    {
      icon: Database,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400',
      title: t('helpModal.features.f6Title'),
      description: t('helpModal.features.f6Desc'),
    },
    {
      icon: Download,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
      title: t('helpModal.features.f7Title'),
      description: t('helpModal.features.f7Desc'),
    },
  ];

  return (
    <div
      data-testid="help-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-[96vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-base flex items-center gap-2">
                {t('helpModal.title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300">
                {t('helpModal.subtitle')}
              </p>
            </div>
          </div>

          <button
            data-testid="btn-close-help-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button
            type="button"
            data-testid="tab-features"
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'features'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('helpModal.tabFeatures')}</span>
          </button>

          <button
            type="button"
            data-testid="tab-shortcuts"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>{t('helpModal.tabShortcuts')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700/60">
              {t('helpModal.customizable')}
            </span>
          </button>

          <button
            type="button"
            data-testid="tab-okf"
            onClick={() => setActiveTab('okf')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'okf'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('helpModal.tabOkf')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              v2.5.0
            </span>
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Content Area */}
        <div className={`overflow-y-auto flex-1 ${activeTab === 'okf' ? 'p-0' : 'p-6 space-y-4'}`}>
          {activeTab === 'okf' ? (
            <OkfViewer />
          ) : activeTab === 'features' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 bg-slate-50/70 dark:bg-zinc-850/70 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-2xs space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${feature.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-zinc-100">
                        {feature.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-200 leading-relaxed font-normal">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Filter & Search */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center flex-wrap gap-1.5 pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer shrink-0 border ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200/60 dark:border-zinc-700/60 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={t('helpModal.searchShortcuts')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-400 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    data-testid="btn-reset-shortcuts"
                    onClick={handleResetDefaults}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer shrink-0"
                    title={t('helpModal.resetToDefaults')}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('common.reset')}</span>
                  </button>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-700/80 text-indigo-900 dark:text-indigo-100 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-indigo-600 dark:text-indigo-300 shrink-0" />
                  <span>
                    {t('helpModal.rebindInstructions')}
                  </span>
                </div>
              </div>

              {conflictWarning && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{conflictWarning}</span>
                </div>
              )}

              {/* Shortcuts Table */}
              <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-750">
                {filteredShortcuts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-zinc-300">
                    {t('helpModal.noShortcutsFound')}
                  </div>
                ) : (
                  filteredShortcuts.map((item) => {
                    const isRecording = editingShortcutId === item.id;
                    const localizedName = t(`shortcuts.${item.id}.name`, { defaultValue: item.name });
                    const localizedDesc = t(`shortcuts.${item.id}.description`, { defaultValue: item.description });
                    const localizedCategory = getCategoryLabel(item.category);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between gap-4 transition-colors ${
                          isRecording
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500 rounded-lg'
                            : 'hover:bg-slate-50/70 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100">
                              {localizedName}
                            </span>
                            <span className="text-[10px] text-slate-600 dark:text-zinc-300 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60">
                              {localizedCategory}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-200 leading-normal">
                            {localizedDesc}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isRecording ? (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold animate-pulse shadow-xs"
                            >
                              {t('helpModal.pressAnyKey')}
                            </button>
                          ) : (
                            <button
                              type="button"
                              data-testid={`btn-shortcut-${item.id}`}
                              onClick={() => {
                                setEditingShortcutId(item.id);
                                setConflictWarning(null);
                              }}
                              className="group px-2.5 py-1 min-w-16 rounded-lg border border-slate-300 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-900 dark:text-zinc-100 font-mono text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              title={t('helpModal.clickToChange')}
                            >
                              <span>{item.currentKey.toUpperCase()}</span>
                              <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 opacity-60 group-hover:opacity-100">
                                ✎
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-300">
          <span>{t('helpModal.footerBrand')}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
