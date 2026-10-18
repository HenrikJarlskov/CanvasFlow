/**
 * @file AiDrawModal.tsx
 * @description AI-powered diagram and vector drawing generation modal using Gemini.
 * Allows users to enter natural language prompts or select curated presets,
 * displaying simulated progress bars, retry logic for server busy (503) states,
 * and cancellation controls.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Wand2, Lightbulb, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the AiDrawModal component.
 */
interface AiDrawModalProps {
  /** Flag determining whether the modal is open and visible */
  isOpen: boolean;
  /** Callback invoked when the modal is closed */
  onClose: () => void;
  /** Asynchronous action that passes the user prompt to Gemini for vector synthesis */
  onGenerateDrawing: (prompt: string) => Promise<void>;
  /** Indicates whether an active AI generation request is running */
  isLoading: boolean;
  /** Optional cancellation handler aborting the active in-flight request */
  onCancel?: () => void;
}

/** Pre-populated prompt ideas for quick user selection */
const SUGGESTION_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'] as const;

/** Multi-stage visual feedback steps reflecting generation milestones */
const PROGRESS_STAGES = [
  { key: 'connecting', percent: 25 },
  { key: 'synthesizing', percent: 60 },
  { key: 'assembling', percent: 85 },
  { key: 'finalizing', percent: 95 },
] as const;

/**
 * Interactive dialog component for generating structured vector whiteboard diagrams via AI prompts.
 */
export const AiDrawModal: React.FC<AiDrawModalProps> = ({
  isOpen,
  onClose,
  onGenerateDrawing,
  isLoading,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOverloadedError, setIsOverloadedError] = useState(false);
  const [progressStageIdx, setProgressStageIdx] = useState(0);
  const [dynamicPercent, setDynamicPercent] = useState(25);

  const handleCancelOrClose = () => {
    if (isLoading && onCancel) {
      onCancel();
    }
    setError(null);
    onClose();
  };

  // Keyboard shortcut ESC to cancel/close
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelOrClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isLoading]);

  // Cycle progress stages while loading with dynamic progression so it never freezes
  useEffect(() => {
    if (!isLoading) {
      setProgressStageIdx(0);
      setDynamicPercent(25);
      return;
    }

    // Step through labeled stages
    const stageInterval = setInterval(() => {
      setProgressStageIdx((prev) => {
        const next = prev < PROGRESS_STAGES.length - 1 ? prev + 1 : prev;
        setDynamicPercent(PROGRESS_STAGES[next].percent);
        return next;
      });
    }, 1200);

    // Dynamic gradual increment after 85% so the bar never appears frozen
    const tickInterval = setInterval(() => {
      setDynamicPercent((curr) => {
        if (curr >= 85 && curr < 98) {
          return curr + 2;
        }
        return curr;
      });
    }, 800);

    return () => {
      clearInterval(stageInterval);
      clearInterval(tickInterval);
    };
  }, [isLoading]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setError(null);
    setIsOverloadedError(false);
    try {
      await onGenerateDrawing(prompt.trim());
      setPrompt('');
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Failed generating drawing. Please try again.';
      setError(msg);
      if (
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('high demand') ||
        msg.includes('temporarily unavailable')
      ) {
        setIsOverloadedError(true);
      }
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const currentStage = PROGRESS_STAGES[progressStageIdx] || PROGRESS_STAGES[0];
  const currentStageLabel = t(`aiDrawModal.${currentStage.key}`);

  return (
    <div
      data-testid="ai-draw-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-base flex items-center gap-1.5">
                {t('aiDrawModal.title')}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  Gemini 3.8
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300">
                {t('aiDrawModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            data-testid="btn-close-ai-draw"
            onClick={handleCancelOrClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-2">
              {t('aiDrawModal.promptLabel')}
            </label>
            <textarea
              data-testid="input-ai-draw-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('aiDrawModal.promptPlaceholder')}
              rows={3}
              maxLength={300}
              disabled={isLoading}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none shadow-xs"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
              <span>{t('aiDrawModal.hint')}</span>
              <span>{prompt.length}/300</span>
            </div>
          </div>

          {/* Active Generation Progress Indicator */}
          {isLoading && (
            <div
              data-testid="ai-draw-progress-card"
              className="p-4 rounded-xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 space-y-2.5 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600 dark:text-violet-400" />
                  <span>{currentStageLabel}</span>
                </div>
                <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                  {dynamicPercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-violet-200/60 dark:bg-violet-900/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${dynamicPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-zinc-300 italic">
                <span>{t('aiDrawModal.progressNote')}</span>
                <button
                  type="button"
                  onClick={handleCancelOrClose}
                  className="not-italic text-violet-600 dark:text-violet-400 hover:underline cursor-pointer font-medium ml-2"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Quick Suggestions (hidden while loading) */}
          {!isLoading && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('aiDrawModal.promptIdeas')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {SUGGESTION_KEYS.map((key) => {
                  const text = t(`aiDrawModal.suggestions.${key}`);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectSuggestion(text)}
                      disabled={isLoading}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-900/30 dark:hover:text-violet-300 rounded-lg transition-colors text-left cursor-pointer"
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Banner with 503 High Demand Handling */}
          {error && (
            <div
              data-testid="ai-draw-error-banner"
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isOverloadedError
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              }`}
            >
              <div className="flex items-start gap-2">
                {isOverloadedError ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="font-semibold">
                    {isOverloadedError ? t('aiDrawModal.errorHighDemandTitle') : t('aiDrawModal.errorGenericTitle')}
                  </div>
                  <div className="text-[11px] leading-relaxed opacity-90">{error}</div>
                </div>
              </div>

              {isOverloadedError && (
                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="button"
                    data-testid="btn-retry-ai-draw"
                    onClick={() => handleSubmit()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('aiDrawModal.retry')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              data-testid="btn-cancel-ai-draw"
              onClick={handleCancelOrClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              data-testid="btn-submit-ai-draw"
              disabled={isLoading || !prompt.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('aiDrawModal.drawingButton')}</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>{t('aiDrawModal.drawButton')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
