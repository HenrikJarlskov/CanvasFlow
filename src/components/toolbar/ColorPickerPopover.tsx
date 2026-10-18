/**
 * @file ColorPickerPopover.tsx
 * @description Toolbar color swatch picker popover.
 * Provides curated quick-pick color presets and an HTML native color input
 * for picking arbitrary hex color values for strokes, shapes, and text.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Curated accessible color palette options */
export const COLOR_PALETTE = [
  { name: 'Dark', hex: '#18181b' },
  { name: 'Slate', hex: '#64748b' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Rose', hex: '#e11d48' },
];

/**
 * Props for the ColorPickerPopover component.
 */
interface ColorPickerPopoverProps {
  /** Currently selected hex color string */
  color: string;
  /** Callback fired when a new color is chosen */
  onChangeColor: (color: string) => void;
}

/**
 * Color picker dropdown button with color preview dot and interactive swatch grid.
 */
export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChangeColor,
}) => {
  const { t } = useTranslation();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="relative" ref={colorPickerRef}>
      <button
        type="button"
        data-testid="color-picker-btn"
        aria-label={t('toolbar.colorPickerAria', { color })}
        aria-expanded={showColorPicker}
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-1 cursor-pointer transition-colors"
        title={t('toolbar.colorPicker')}
      >
        <div
          data-testid="current-color-dot"
          className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-800 shadow-xs ring-1 ring-slate-300 dark:ring-zinc-700"
          style={{ backgroundColor: color }}
        />
      </button>

      {showColorPicker && (
        <div
          data-testid="color-picker-popover"
          role="dialog"
          aria-label={t('toolbar.colorPalette')}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-3 z-50 min-w-48 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
            {t('toolbar.colorPalette')}
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.hex}
                type="button"
                data-testid={`color-swatch-${c.hex}`}
                aria-label={t('toolbar.selectColor', { name: c.name })}
                onClick={() => {
                  onChangeColor(c.hex);
                  setShowColorPicker(false);
                }}
                className={`w-7 h-7 rounded-full border-2 border-white dark:border-zinc-800 shadow-xs flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                  color === c.hex ? 'ring-2 ring-indigo-500 scale-105' : 'ring-1 ring-slate-200 dark:ring-zinc-700'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">{t('common.custom')}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                data-testid="custom-color-input"
                aria-label={t('toolbar.customColor')}
                value={color}
                onChange={(e) => onChangeColor(e.target.value)}
                className="w-7 h-7 rounded-lg border border-slate-200 dark:border-zinc-700 cursor-pointer p-0 bg-transparent"
              />
              <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">{color.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
