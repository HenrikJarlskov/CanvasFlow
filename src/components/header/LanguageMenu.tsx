/**
 * @file LanguageMenu.tsx
 * @description Header dropdown menu selector for application language internationalization
 * (English, Français, Deutsch, Dansk).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../../i18n';

interface LanguageMenuProps {
  /** Optional custom styling variant for drawer usage */
  isMobileDrawer?: boolean;
}

/**
 * Dropdown trigger and menu allowing selection of interface language.
 */
export const LanguageMenu: React.FC<LanguageMenuProps> = ({ isMobileDrawer = false }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLangCode = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2);
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (lang: LanguageOption) => {
    i18n.changeLanguage(lang.code);
    setIsOpen(false);
  };

  if (isMobileDrawer) {
    return (
      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-zinc-200 mb-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span>{t('header.language')}</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-zinc-400">
            {currentLang.flag} {currentLang.label}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                data-testid={`mobile-language-select-${lang.code}`}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                    : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/60 dark:border-zinc-700/60'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.label}</span>
                </span>
                {isSelected && <Check className="w-3 h-3 text-white shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        data-testid="btn-language-menu"
        aria-label={t('header.selectLanguage')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        title={t('header.language')}
      >
        <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
        <span className="text-[11px] font-semibold tracking-wide uppercase">
          {currentLang.code}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div
          data-testid="language-options-menu"
          role="menu"
          className="absolute top-full right-0 mt-1.5 w-40 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = currentLang.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                data-testid={`language-option-${lang.code}`}
                role="menuitem"
                onClick={() => handleSelectLanguage(lang)}
                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer ${
                  isSelected
                    ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50'
                    : 'text-slate-700 dark:text-zinc-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
