import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Curated accessible standard color palette options */
export const COLOR_PALETTE = [
  { name: 'Dark', hex: '#18181b' },
  { name: 'Slate', hex: '#64748b' },
  { name: 'Gray', hex: '#94a3b8' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Cyan', hex: '#0284c7' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#4f46e5' },
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
 * Standard color picker button showing the current color and opening a full palette popover.
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
      {/* Single compact button showing the current color */}
      <button
        type="button"
        data-testid="color-picker-btn"
        aria-label={t('toolbar.colorPickerAria', { color })}
        aria-expanded={showColorPicker}
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-0.5 cursor-pointer transition-colors min-w-8 min-h-8 sm:min-w-9 sm:min-h-9"
        title={t('toolbar.colorPicker')}
      >
        <div
          data-testid="current-color-dot"
          className="w-5 h-5 rounded-full border-2 border-white dark:border-zinc-800 shadow-xs ring-1 ring-slate-300 dark:ring-zinc-600"
          style={{ backgroundColor: color }}
        />
        <ChevronDown className="w-2.5 h-2.5 opacity-70 text-slate-500 dark:text-zinc-400" />
      </button>

      {/* Standard Color Picker Dropdown Popover */}
      {showColorPicker && (
        <div
          data-testid="color-picker-popover"
          role="dialog"
          aria-label={t('toolbar.colorPalette')}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-3 z-50 min-w-56 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
            {t('toolbar.colorPalette')}
          </div>
          <div className="grid grid-cols-8 gap-1.5 mb-3">
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
                className={`w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800 shadow-xs flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                  color.toLowerCase() === c.hex.toLowerCase()
                    ? 'ring-2 ring-indigo-500 scale-110'
                    : 'ring-1 ring-slate-200 dark:ring-zinc-700'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>

          {/* Standard Native Color Picker & Hex Value Input */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium">{t('common.custom')}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                data-testid="custom-color-input"
                aria-label={t('toolbar.customColor')}
                value={color.startsWith('#') && color.length === 7 ? color : '#18181b'}
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
