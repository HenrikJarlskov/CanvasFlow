/**
 * @file Header.tsx
 * @description Whiteboard application top header bar.
 * Provides board title inline renaming, collaboration presence badges,
 * background canvas pattern selector, export dropdown (PNG/SVG/PDF),
 * AI generation modal launcher, image import, and responsive mobile drawer navigation.
 */

import React, { useState, useRef } from 'react';
import {
  PenTool,
  Share2,
  FolderOpen,
  Plus,
  Trash2,
  FolderInput,
  Sun,
  Moon,
  Wand2,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { BackgroundType, RemoteUser } from '../types/whiteboard';
import { useTranslation } from 'react-i18next';
import { BoardTitleEditor } from './header/BoardTitleEditor';
import { ExportMenu } from './header/ExportMenu';
import { BackgroundMenu } from './header/BackgroundMenu';
import { LanguageMenu } from './header/LanguageMenu';
import { MobileHeaderDrawer } from './header/MobileHeaderDrawer';

/**
 * Props for the main application Header navigation bar.
 */
interface HeaderProps {
  /** Name of the active whiteboard */
  boardName: string;
  /** Callback fired when renaming the board */
  onRenameBoard: (newName: string) => void;
  /** Current canvas grid/dots/lines background theme */
  background: BackgroundType;
  /** Callback to change the canvas background pattern */
  onChangeBackground: (bg: BackgroundType) => void;
  /** Callback to create a new board */
  onNewBoard: () => void;
  /** Callback to open the workspace boards modal */
  onOpenBoardsModal: () => void;
  /** Callback to wipe all canvas elements */
  onClearBoard: () => void;
  /** Trigger raster PNG download */
  onExportPNG: () => void;
  /** Trigger PDF document generation */
  onExportPDF: () => void;
  /** Trigger vector SVG download */
  onExportSVG: () => void;
  /** Open room sharing link dialog */
  onOpenShareModal: () => void;
  /** Connected collaborator active users list */
  connectedUsers: RemoteUser[];
  /** Local client user identity (id, display name, color) */
  currentUser: { userId: string; userName: string; userColor: string };
  /** Real-time WebSocket connection state indicator */
  isSocketConnected: boolean;
  /** Current dark mode toggle state */
  isDarkMode?: boolean;
  /** Toggle dark mode theme callback */
  onToggleDarkMode?: () => void;
  /** Open AI prompt modal callback */
  onOpenAiDraw?: () => void;
  /** Open Draw.io/JSON diagram import dialog */
  onOpenImportModal?: () => void;
  /** Handle raw image file ingestion into canvas */
  onImportImageFile?: (file: File) => void;
  /** Open keyboard shortcuts and user guide modal */
  onOpenHelpModal?: () => void;
  /** Whether the active whiteboard contains any elements */
  hasElements?: boolean;
  /** Callback fired when user chooses to save the current board and proceed with a new one */
  onSaveBoardAndNew?: () => void;
  /** Callback fired when user chooses to discard changes and proceed with a new one */
  onDiscardAndNew?: () => void;
}

/**
 * Top navigation header bar displaying workspace brand, board actions, and collaborator presence.
 */
export const Header: React.FC<HeaderProps> = ({
  boardName,
  onRenameBoard,
  background,
  onChangeBackground,
  onNewBoard,
  onOpenBoardsModal,
  onClearBoard,
  onExportPNG,
  onExportPDF,
  onExportSVG,
  onOpenShareModal,
  connectedUsers = [],
  currentUser,
  isSocketConnected,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenAiDraw,
  onOpenImportModal,
  onImportImageFile,
  onOpenHelpModal,
  hasElements = false,
  onSaveBoardAndNew,
  onDiscardAndNew,
}) => {
  const { t } = useTranslation();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showNewBoardConfirm, setShowNewBoardConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewBoardClick = () => {
    if (hasElements) {
      setShowNewBoardConfirm(true);
    } else {
      onNewBoard();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportImageFile) {
      onImportImageFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleTriggerImport = () => {
    if (onOpenImportModal) {
      onOpenImportModal();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <header
        data-testid="app-header"
        role="banner"
        className="h-14 border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between relative z-40 select-none shadow-xs text-slate-800 dark:text-zinc-100 shrink-0"
      >
        {/* Hidden image input for header import button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          data-testid="header-image-file-input"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Left: Brand + Board Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-slate-200 dark:border-zinc-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
              <PenTool className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm tracking-tight leading-none hidden xs:flex items-center gap-1">
              {t('common.appName')}
              <span className="text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded-md">
                {t('common.vector')}
              </span>
            </span>
          </div>

          <BoardTitleEditor boardName={boardName} onRenameBoard={onRenameBoard} />
        </div>

        {/* Middle: Actions (Desktop & Tablet) */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            data-testid="btn-boards-modal"
            aria-label={t('header.boardsLibrary')}
            onClick={onOpenBoardsModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={t('header.boardsLibrary')}
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="hidden md:inline">{t('header.boards')}</span>
          </button>

          <button
            type="button"
            data-testid="btn-new-board"
            aria-label={t('header.newBoardTitle')}
            onClick={handleNewBoardClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title={t('header.newBoardTitle')}
          >
            <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span className="hidden md:inline">{t('header.newBoard')}</span>
          </button>

          {/* Clear with confirmation dialog */}
          <div className="relative">
            <button
              type="button"
              data-testid="btn-clear-board"
              aria-label={t('header.clearTitle')}
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
              title={t('header.clearTitle')}
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 hover:text-red-500" />
              <span className="hidden md:inline">{t('header.clear')}</span>
            </button>

            {showClearConfirm && (
              <div
                data-testid="clear-confirm-dialog"
                role="dialog"
                aria-modal="true"
                className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <p className="text-xs font-medium text-slate-800 dark:text-zinc-200 mb-2">{t('header.clearConfirmTitle')}</p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    data-testid="btn-cancel-clear"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    data-testid="btn-confirm-clear"
                    onClick={() => {
                      onClearBoard();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md cursor-pointer"
                  >
                    {t('common.yesClear')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <BackgroundMenu background={background} onChangeBackground={onChangeBackground} />
        </div>

        {/* Right: Tools + Export + Collab + Share Link */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Import content button (desktop/tablet) */}
          <button
            type="button"
            data-testid="btn-header-import"
            data-testid-alias="btn-header-import-image"
            aria-label={t('header.importTitle')}
            onClick={handleTriggerImport}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
            title={t('header.importTitle')}
          >
            <FolderInput className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
            <span className="hidden lg:inline">{t('header.import')}</span>
          </button>

          {/* AI Whiteboard Artist button */}
          {onOpenAiDraw && (
            <button
              type="button"
              data-testid="btn-header-ai-draw"
              aria-label={t('header.aiDrawTitle')}
              onClick={onOpenAiDraw}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-800 rounded-lg transition-colors cursor-pointer"
              title={t('header.aiDrawTitle')}
            >
              <Wand2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="hidden md:inline">{t('header.aiDraw')}</span>
            </button>
          )}

          {/* Dark Mode toggle */}
          {onToggleDarkMode && (
            <button
              type="button"
              data-testid="btn-toggle-dark-mode"
              aria-label={isDarkMode ? t('header.switchToLight') : t('header.switchToDark')}
              onClick={onToggleDarkMode}
              className="hidden sm:inline-flex p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title={isDarkMode ? t('header.switchToLight') : t('header.switchToDark')}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {/* Language Selector */}
          <div className="hidden sm:inline-flex">
            <LanguageMenu />
          </div>

          {/* Export dropdown */}
          <ExportMenu
            onExportPNG={onExportPNG}
            onExportPDF={onExportPDF}
            onExportSVG={onExportSVG}
          />

          {/* Live Collaborators avatar stack */}
          <button
            type="button"
            data-testid="btn-collaborators"
            aria-label={t('header.activeCollaborators', { count: (connectedUsers || []).length + 1 })}
            onClick={onOpenShareModal}
            className="flex items-center -space-x-1.5 hover:opacity-90 transition-opacity cursor-pointer px-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
            title={t('header.activeCollaborators', { count: (connectedUsers || []).length + 1 })}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-zinc-900 shadow-xs"
              style={{ backgroundColor: currentUser?.userColor || '#6366f1' }}
            >
              {(currentUser?.userName || 'U').charAt(0).toUpperCase()}
            </div>
            {(connectedUsers || []).slice(0, 2).map((user) => (
              <div
                key={user.userId}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-zinc-900 shadow-xs"
                style={{ backgroundColor: user.userColor }}
                title={user.userName}
              >
                {user.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {(connectedUsers || []).length > 2 && (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-zinc-900">
                +{(connectedUsers || []).length - 2}
              </div>
            )}
          </button>

          {/* Share Button */}
          <button
            type="button"
            data-testid="btn-share-modal"
            aria-label={t('header.shareTitle')}
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t('header.share')}</span>
            {isSocketConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Help & Shortcuts Button */}
          {onOpenHelpModal && (
            <button
              type="button"
              data-testid="btn-help-modal"
              aria-label={t('header.helpAndShortcuts')}
              onClick={onOpenHelpModal}
              className="hidden sm:inline-flex p-1.5 text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title={t('header.helpAndShortcuts')}
            >
              <HelpCircle className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
            </button>
          )}

          {/* Mobile Menu Hamburger button */}
          <button
            type="button"
            data-testid="btn-mobile-menu-toggle"
            aria-label="Open mobile navigation menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="sm:hidden p-1.5 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Actions Drawer */}
      <MobileHeaderDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenBoardsModal={onOpenBoardsModal}
        onNewBoard={handleNewBoardClick}
        onOpenClearConfirm={() => setShowClearConfirm(true)}
        onImportPictureClick={handleTriggerImport}
        onOpenAiDraw={onOpenAiDraw}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        onOpenShareModal={onOpenShareModal}
        onOpenHelpModal={onOpenHelpModal}
      />

      {/* New Board Confirmation Dialog when canvas is not empty */}
      {showNewBoardConfirm && (
        <div
          data-testid="new-board-confirm-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-board-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 sm:p-6 max-w-md w-full animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 id="new-board-confirm-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                  {t('header.newBoardConfirmTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1">
                  {t('header.newBoardConfirmMessage')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                data-testid="btn-cancel-new-board"
                onClick={() => setShowNewBoardConfirm(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-center"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                data-testid="btn-discard-new-board"
                onClick={() => {
                  setShowNewBoardConfirm(false);
                  if (onDiscardAndNew) {
                    onDiscardAndNew();
                  } else {
                    onNewBoard();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl transition-colors cursor-pointer text-center"
              >
                {t('common.discard')}
              </button>
              <button
                type="button"
                data-testid="btn-save-new-board"
                onClick={() => {
                  setShowNewBoardConfirm(false);
                  if (onSaveBoardAndNew) {
                    onSaveBoardAndNew();
                  } else {
                    onNewBoard();
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                {t('common.saveAndNew')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
