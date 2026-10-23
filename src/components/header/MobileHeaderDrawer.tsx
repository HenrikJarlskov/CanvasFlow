/**
 * @file MobileHeaderDrawer.tsx
 * @description Responsive mobile bottom-sheet action drawer.
 * Provides touch-friendly access on compact viewports to boards management,
 * dark theme toggling, room sharing, image imports, the AI artist dialog,
 * and Google Login / User Profile management.
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
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageMenu } from './LanguageMenu';
import { useAuth } from '../../context/AuthContext';

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
  const { user, signInWithGoogle, signOut } = useAuth();

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
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account / Google Login Card */}
        {user ? (
          <div
            data-testid="mobile-user-profile-card"
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/90 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                  {user.displayName || 'User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-300 truncate">{user.email}</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Private Cloud Storage</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              data-testid="mobile-btn-signout"
              onClick={() => {
                signOut();
                onClose();
              }}
              className="p-2 text-slate-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            data-testid="mobile-btn-google-login"
            onClick={() => {
              signInWithGoogle();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 text-xs font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        )}

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
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold cursor-pointer"
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
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold cursor-pointer"
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
            className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold cursor-pointer"
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
              className="flex items-center gap-2.5 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold cursor-pointer"
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
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold cursor-pointer"
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
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold cursor-pointer"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-500 dark:text-zinc-300" />
              )}
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
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/90 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-100 text-xs font-semibold cursor-pointer"
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
            className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('mobile.clearCanvas')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
