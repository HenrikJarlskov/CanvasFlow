/**
 * @file StrokeWidthSelector.tsx
 * @description Toolbar segmented control for choosing stroke stroke-weight thickness
 * (Fine 2px, Medium 4px, Thick 8px, Chunky 16px).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

/** Discrete stroke width presets and descriptive labels */
export const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Thick', value: 8 },
  { label: 'Chunky', value: 16 },
];

/**
 * Props for the StrokeWidthSelector component.
 */
interface StrokeWidthSelectorProps {
  /** The currently selected stroke width in pixels */
  strokeWidth: number;
  /** Callback fired when a new stroke thickness is chosen */
  onChangeStrokeWidth: (width: number) => void;
}

/**
 * Compact segmented button group displaying scaled dot indicators for stroke thickness.
 */
export const StrokeWidthSelector: React.FC<StrokeWidthSelectorProps> = ({
  strokeWidth,
  onChangeStrokeWidth,
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('toolbar.strokeWidth')}
      className="flex items-center gap-0.5 bg-slate-100/80 dark:bg-zinc-800/80 p-0.5 sm:p-1 rounded-xl shrink-0"
    >
      {STROKE_WIDTHS.map((sw) => {
        const translatedLabel = t(`toolbar.${sw.label.toLowerCase()}`);
        return (
          <button
            key={sw.value}
            type="button"
            data-testid={`stroke-width-${sw.value}`}
            aria-label={t('toolbar.strokeWidthAria', { label: translatedLabel, value: sw.value })}
            aria-pressed={strokeWidth === sw.value}
            onClick={() => onChangeStrokeWidth(sw.value)}
            className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              strokeWidth === sw.value
                ? 'bg-white dark:bg-zinc-700 shadow-xs text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
            title={t('toolbar.strokeWidthTitle', { label: translatedLabel, value: sw.value })}
          >
            <div
              className="rounded-full bg-current"
              style={{
                width: `${Math.min(12, sw.value + 1)}px`,
                height: `${Math.min(12, sw.value + 1)}px`,
              }}
            />
          </button>
        );
      })}
    </div>
  );
};
