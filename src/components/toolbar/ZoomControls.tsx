/**
 * @file ZoomControls.tsx
 * @description Floating viewport magnification controls.
 * Displays zoom-in (+), zoom-out (-), and percentage indicator button
 * that resets the camera view back to default 100% scale.
 */

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the ZoomControls component.
 */
interface ZoomControlsProps {
  /** Current camera magnification scale (e.g. 1.0 = 100%) */
  zoom: number;
  /** Handler to increase viewport scale */
  onZoomIn: () => void;
  /** Handler to decrease viewport scale */
  onZoomOut: () => void;
  /** Handler to reset viewport scale to 1.0 */
  onResetZoom: () => void;
}

/**
 * Floating widget fixed in the bottom-right corner for interactive canvas zooming.
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const { t } = useTranslation();

  return (
    <div
      data-testid="zoom-controls"
      role="group"
      aria-label={t('zoom.controlsAria')}
      className="fixed bottom-4 right-4 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-lg p-1.5 flex items-center gap-1 select-none text-xs text-slate-700 dark:text-zinc-200"
    >
      <button
        type="button"
        data-testid="btn-zoom-out"
        aria-label={t('zoom.zoomOut')}
        onClick={onZoomOut}
        className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
        title={t('zoom.zoomOut')}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        data-testid="btn-zoom-reset"
        aria-label={t('zoom.resetZoomAria', { percent: Math.round(zoom * 100) })}
        onClick={onResetZoom}
        className="px-2 py-1 font-mono font-medium text-slate-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
        title={t('zoom.resetZoom')}
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        data-testid="btn-zoom-in"
        aria-label={t('zoom.zoomIn')}
        onClick={onZoomIn}
        className="p-1.5 rounded-lg text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
        title={t('zoom.zoomIn')}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
