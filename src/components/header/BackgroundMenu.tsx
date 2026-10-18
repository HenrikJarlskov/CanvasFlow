/**
 * @file BackgroundMenu.tsx
 * @description Dropdown menu selector for whiteboard canvas background grid themes
 * (blank, dots, grid, blueprint, dark).
 */

import React, { useState, useRef, useEffect } from 'react';
import { Grid, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackgroundType } from '../../types/whiteboard';

/**
 * Props for the BackgroundMenu component.
 */
interface BackgroundMenuProps {
  /** Currently active canvas background style */
  background: BackgroundType;
  /** Callback fired when user selects a new background theme */
  onChangeBackground: (bg: BackgroundType) => void;
}

/** Available background design choices */
const BG_OPTIONS: BackgroundType[] = ['blank', 'dots', 'grid', 'blueprint', 'dark'];

/**
 * Dropdown trigger and menu allowing selection of whiteboard background textures.
 */
export const BackgroundMenu: React.FC<BackgroundMenuProps> = ({
  background,
  onChangeBackground,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        data-testid="btn-bg-menu"
        aria-label={t('header.canvasBgMenu')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
        title={t('header.canvasStyle')}
      >
        <Grid className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
        <span className="hidden md:inline capitalize">{t(`backgrounds.${background}`)}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div
          data-testid="bg-options-menu"
          role="menu"
          className="absolute top-full right-0 mt-1.5 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {BG_OPTIONS.map((bg) => (
            <button
              key={bg}
              type="button"
              data-testid={`bg-option-${bg}`}
              role="menuitem"
              onClick={() => {
                onChangeBackground(bg);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-zinc-800 capitalize cursor-pointer ${
                background === bg
                  ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50'
                  : 'text-slate-700 dark:text-zinc-300'
              }`}
            >
              <span>{t(`backgrounds.${bg}`)}</span>
              {background === bg && (
                <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
