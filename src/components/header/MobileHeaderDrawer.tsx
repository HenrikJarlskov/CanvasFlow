/**
 * @file MobileHeaderDrawer.tsx
 * @description Responsive mobile bottom-sheet action drawer.
 * Provides touch-friendly access on compact viewports to boards management,
 * dark theme toggling, room sharing, image imports, and the AI artist dialog.
 */

import React from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  FolderInput,
  Wand2,
  Sun,
  Moon,
  HelpCircle,
  X,
  Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageMenu } from './LanguageMenu';

/**
 * Props for the MobileHeaderDrawer component.
 */
interface MobileHeaderDrawerProps {
  /** Controls drawer slide-up visibility */
  isOpen: boolean;
  /** Drawer close trigger callback */
  onClose: () => void;
  /** Trigger to open boards workspace manager */
  onOpenBoardsModal: () => void;
  /** Trigger to create new board */
  onNewBoard: () => void;
  /** Trigger canvas reset confirmation */
  onOpenClearConfirm: () => void;
  /** Trigger file picker for pictures */
  onImportPictureClick: () => void;
  /** Trigger AI drawing modal */
  onOpenAiDraw?: () => void;
  /** Active dark mode state */
  isDarkMode?: boolean;
  /** Toggle dark mode theme callback */
  onToggleDarkMode?: () => void;
  /** Trigger live share modal */
  onOpenShareModal: () => void;
  /** Trigger keyboard shortcuts & help modal */
  onOpenHelpModal?: () => void;
}

/**
 * Touch-optimized bottom drawer housing secondary header actions for small screens.
 */
export const MobileHeaderDrawer: React.FC<MobileHeaderDrawerProps> = ({
  isOpen,
  onClose,
  onOpenBoardsModal,
  onNewBoard,
  onOpenClearConfirm,
  onImportPictureClick,
  onOpenAiDraw,
  isDarkMode,
  onToggleDarkMode,
  onOpenShareModal,
  onOpenHelpModal,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      data-testid="mobile-header-drawer"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:hidden animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="font-bold text-sm text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{t('mobile.actions')}</span>
          </div>
          <button
            type="button"
            data-testid="btn-close-mobile-drawer"
            aria-label={t('mobile.closeMenu')}
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Language Selector */}
        <LanguageMenu isMobileDrawer={true} />

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            data-testid="mobile-btn-boards"
            onClick={() => {
              onOpenBoardsModal();
              onClose();
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold"
          >
            <FolderOpen className="w-4 h-4 text-indigo-500" />
            <span>{t('mobile.boards')}</span>
          </button>

          <button
            type="button"
            data-testid="mobile-btn-new-board"
            onClick={() => {
              onNewBoard();
              onClose();
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 text-emerald-500" />
            <span>{t('mobile.newBoard')}</span>
          </button>

          <button
            type="button"
            data-testid="mobile-btn-share"
            onClick={() => {
              onOpenShareModal();
              onClose();
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
          >
            <Share2 className="w-4 h-4" />
            <span>{t('mobile.shareAndCollab')}</span>
          </button>

          {onOpenAiDraw && (
            <button
              type="button"
              data-testid="mobile-btn-ai-draw"
              onClick={() => {
                onOpenAiDraw();
                onClose();
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold"
            >
              <Wand2 className="w-4 h-4 text-violet-500" />
              <span>{t('mobile.aiDraw')}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="mobile-btn-import"
            data-testid-alias="mobile-btn-import-picture"
            aria-label={t('header.importTitle')}
            onClick={() => {
              onImportPictureClick();
              onClose();
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold"
          >
            <FolderInput className="w-4 h-4 text-sky-500" />
            <span>{t('mobile.import')}</span>
          </button>

          {onToggleDarkMode && (
            <button
              type="button"
              data-testid="mobile-btn-toggle-dark-mode"
              onClick={() => {
                onToggleDarkMode();
                onClose();
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500 dark:text-zinc-300" />}
              <span>{isDarkMode ? t('header.lightMode') : t('header.darkMode')}</span>
            </button>
          )}

          {onOpenHelpModal && (
            <button
              type="button"
              data-testid="mobile-btn-help"
              onClick={() => {
                onOpenHelpModal();
                onClose();
              }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold"
            >
              <HelpCircle className="w-4 h-4 text-teal-500" />
              <span>{t('mobile.helpAndShortcuts')}</span>
            </button>
          )}

          <button
            type="button"
            data-testid="mobile-btn-clear"
            onClick={() => {
              onOpenClearConfirm();
              onClose();
            }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('mobile.clearCanvas')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
