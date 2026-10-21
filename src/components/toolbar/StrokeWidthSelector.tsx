import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
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

/** Helper computing stroke bar indicator thickness */
function getStrokeBarHeight(value: number): number {
  if (value <= 2) return 2;
  if (value <= 4) return 4;
  if (value <= 8) return 6;
  return 8;
}

/**
 * Single icon button showing current stroke thickness that opens a dropdown to pick options.
 */
export const StrokeWidthSelector: React.FC<StrokeWidthSelectorProps> = ({
  strokeWidth,
  onChangeStrokeWidth,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentLabel = STROKE_WIDTHS.find((sw) => sw.value === strokeWidth)?.label || 'Medium';
  const translatedCurrentLabel = t(`toolbar.${currentLabel.toLowerCase()}`);

  return (
    <div className="relative" ref={containerRef}>
      {/* Single icon button showing the current size */}
      <button
        type="button"
        data-testid="stroke-width-btn"
        data-testid-alias="stroke-width-trigger"
        aria-label={t('toolbar.strokeWidthAria', { label: translatedCurrentLabel, value: strokeWidth })}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center gap-1 cursor-pointer transition-colors min-w-8 min-h-8 sm:min-w-9 sm:min-h-9"
        title={t('toolbar.strokeWidthTitle', { label: translatedCurrentLabel, value: strokeWidth })}
      >
        <div
          className="rounded-full bg-slate-900 dark:bg-white transition-all"
          style={{
            width: '14px',
            height: `${getStrokeBarHeight(strokeWidth)}px`,
          }}
        />
        <ChevronDown className="w-2.5 h-2.5 opacity-70 text-slate-500 dark:text-zinc-400" />
      </button>

      {/* Popover showing size options */}
      {isOpen && (
        <div
          data-testid="stroke-width-popover"
          role="menu"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 min-w-36 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100"
        >
          {STROKE_WIDTHS.map((sw) => {
            const isSelected = strokeWidth === sw.value;
            const translatedLabel = t(`toolbar.${sw.label.toLowerCase()}`);
            return (
              <button
                key={sw.value}
                type="button"
                data-testid={`stroke-width-${sw.value}`}
                role="menuitem"
                aria-label={t('toolbar.strokeWidthAria', { label: translatedLabel, value: sw.value })}
                aria-pressed={isSelected}
                onClick={() => {
                  onChangeStrokeWidth(sw.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
                title={t('toolbar.strokeWidthTitle', { label: translatedLabel, value: sw.value })}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`rounded-full transition-colors ${
                      isSelected ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-700 dark:bg-zinc-300'
                    }`}
                    style={{
                      width: '16px',
                      height: `${getStrokeBarHeight(sw.value)}px`,
                    }}
                  />
                  <span>{translatedLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                  <span>{sw.value}px</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
