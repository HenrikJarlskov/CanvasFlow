/**
 * @file OcrModal.tsx
 * @description Optical Character Recognition (OCR) review and text conversion dialog.
 * Enables transcribing handwriting, sticky notes, and image annotations into editable
 * whiteboard text elements using dual engines:
 * 1. Hybrid Client Tesseract.js WASM engine (offline/private)
 * 2. Gemini Multimodal Vision API (high precision handwriting)
 */

import React, { useState } from 'react';
import { Check, Copy, Sparkles, X, Loader2, ArrowRight, Brain, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OcrResult } from '../utils/ocr';

/**
 * Props for the OcrModal component.
 */
interface OcrModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Modal close trigger */
  onClose: () => void;
  /** Recognized text and confidence output from OCR engine */
  ocrResult: OcrResult | null;
  /** Indicates active OCR processing */
  isLoading: boolean;
  /** Numerical percent progress (0 to 100) */
  progress: number;
  /** Current pipeline stage status message */
  statusText: string;
  /** Action replacing selected drawing element directly with recognized text element */
  onReplaceWithText: (text: string) => void;
  /** Action placing recognized text beside original drawings */
  onInsertBesideText: (text: string) => void;
  /** Switcher/retry trigger for Gemini AI Vision OCR */
  onRunAiOcr?: () => void;
  /** Switcher/retry trigger for offline Tesseract OCR */
  onRunTesseractOcr?: () => void;
}

/**
 * Modal dialogue allowing review, direct editing, clipboard copying,
 * and element conversion of OCR transcription results.
 */
export const OcrModal: React.FC<OcrModalProps> = ({
  isOpen,
  onClose,
  ocrResult,
  isLoading,
  progress,
  statusText,
  onReplaceWithText,
  onInsertBesideText,
  onRunAiOcr,
  onRunTesseractOcr,
}) => {
  const { t } = useTranslation();
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync editedText whenever ocrResult updates
  React.useEffect(() => {
    if (ocrResult) {
      setEditedText(ocrResult.text || '');
    }
  }, [ocrResult]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid="ocr-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-base">
                {t('ocrModal.title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('ocrModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            data-testid="btn-close-ocr-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine switcher bar */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-zinc-800/40 border-b border-slate-200/60 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-zinc-300">{t('ocrModal.engine')}</span>
          <div className="flex items-center gap-2">
            {onRunTesseractOcr && (
              <button
                type="button"
                data-testid="btn-switch-tesseract"
                onClick={onRunTesseractOcr}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50"
              >
                <Cpu className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>{t('ocrModal.tesseract')}</span>
              </button>
            )}
            {onRunAiOcr && (
              <button
                type="button"
                data-testid="btn-switch-ai-ocr"
                onClick={onRunAiOcr}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 cursor-pointer disabled:opacity-50"
              >
                <Brain className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>{t('ocrModal.gemini')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          {isLoading ? (
            <div data-testid="ocr-loading-indicator" className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
              <p className="font-medium text-slate-700 dark:text-zinc-300 text-sm">
                {statusText || t('ocrModal.analyzing')}
              </p>
              <div className="w-64 bg-slate-100 dark:bg-zinc-800 rounded-full h-2 mt-4 overflow-hidden">
                <div
                  className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, Math.round(progress * 100)))}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 dark:text-zinc-400 mt-2 font-mono">
                {t('ocrModal.percentComplete', { percent: Math.round(progress * 100) })}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                  {t('ocrModal.recognizedContent')}
                </span>
                {ocrResult?.confidence !== undefined && (
                  <span
                    data-testid="ocr-confidence-badge"
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      ocrResult.confidence > 70
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : ocrResult.confidence > 40
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {t('ocrModal.confidence', { percent: Math.round(ocrResult.confidence) })}
                  </span>
                )}
              </div>

              <textarea
                data-testid="ocr-text-textarea"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder={editedText ? '' : t('ocrModal.noTextRecognized')}
                rows={4}
                className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans text-sm leading-relaxed resize-none shadow-xs"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  data-testid="btn-copy-ocr-text"
                  onClick={handleCopy}
                  disabled={!editedText.trim()}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('ocrModal.copyToClipboard')}
                </button>
                <span className="text-xs text-slate-600 dark:text-zinc-300">
                  {t('ocrModal.editTip')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            data-testid="btn-cancel-ocr"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            data-testid="btn-insert-ocr-beside"
            disabled={isLoading || !editedText.trim()}
            onClick={() => onInsertBesideText(editedText)}
            className="px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
          >
            {t('ocrModal.insertBeside')}
          </button>
          <button
            type="button"
            data-testid="btn-replace-ocr-strokes"
            disabled={isLoading || !editedText.trim()}
            onClick={() => onReplaceWithText(editedText)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>{t('ocrModal.replaceStrokes')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
