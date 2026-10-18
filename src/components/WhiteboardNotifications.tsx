import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface WhiteboardNotificationsProps {
  snapToast: string | null;
  aiDrawLoading: boolean;
}

/**
 * Renders floating toast feedback and AI drawing progress indicator on top of the whiteboard.
 * Extracted into a dedicated subcomponent to preserve single responsibility and clean architecture.
 */
export const WhiteboardNotifications: React.FC<WhiteboardNotificationsProps> = React.memo(
  ({ snapToast, aiDrawLoading }) => {
    const { t } = useTranslation();

    return (
      <>
        {snapToast && (
          <div
            data-testid="shape-snap-toast"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold shadow-xl border border-slate-700/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{snapToast}</span>
          </div>
        )}

        {aiDrawLoading && (
          <div
            data-testid="ai-draw-canvas-indicator"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-2xl px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2.5 animate-pulse border border-white/20 pointer-events-none"
          >
            <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
            <span>{t('canvas.aiDrawingProgress')}</span>
          </div>
        )}
      </>
    );
  }
);
WhiteboardNotifications.displayName = 'WhiteboardNotifications';
