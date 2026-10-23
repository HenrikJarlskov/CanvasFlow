/**
 * @file BoardsModal.tsx
 * @description Workspace management modal for organizing, switching, creating,
 * deleting, and importing/exporting saved whiteboard documents.
 * Integrates Google Login and per-user privacy state indicator.
 */

import React, { useRef } from 'react';
import {
  Folder,
  Plus,
  Trash2,
  Download,
  Upload,
  Clock,
  Layers,
  X,
  FileText,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BoardElement, BoardMetadata } from '../types/whiteboard';
import { useAuth } from '../context/AuthContext';

/**
 * Props for the BoardsModal workspace manager dialog.
 */
interface BoardsModalProps {
  /** Modal open/visible visibility flag */
  isOpen: boolean;
  /** Modal close trigger callback */
  onClose: () => void;
  /** List of all saved boards and their metadata */
  boards: BoardMetadata[];
  /** Identifier of the currently active whiteboard */
  currentBoardId: string;
  /** Callback fired when switching to another board */
  onSelectBoard: (boardId: string) => void;
  /** Callback to initialize a new blank whiteboard */
  onCreateNewBoard: () => void;
  /** Callback to remove a board from storage */
  onDeleteBoard: (boardId: string) => void;
  /** Callback fired when an existing board JSON file is imported */
  onImportBoard: (data: { name: string; elements: BoardElement[] }) => void;
  /** Triggers downloading the active board as an offline JSON package */
  onExportCurrentJson: () => void;
}

/**
 * Workspace dialog displaying list of boards, storage timestamps, element counts,
 * and bulk import/export controls.
 */
export const BoardsModal: React.FC<BoardsModalProps> = ({
  isOpen,
  onClose,
  boards,
  currentBoardId,
  onSelectBoard,
  onCreateNewBoard,
  onDeleteBoard,
  onImportBoard,
  onExportCurrentJson,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signInWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.elements)) {
          onImportBoard({
            name: json.name || file.name.replace(/\.[^/.]+$/, ''),
            elements: json.elements,
          });
          onClose();
        } else {
          alert(t('boardsModal.invalidFormat'));
        }
      } catch (err) {
        alert(t('boardsModal.parseError', { error: String(err) }));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      data-testid="boards-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-base">
                {t('boardsModal.title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300">
                {user ? `${t('boardsModal.subtitle')} • Private Cloud` : t('boardsModal.subtitle')}
              </p>
            </div>
          </div>
          <button
            data-testid="btn-close-boards-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Privacy & Authentication Status Banner */}
        {user ? (
          <div
            data-testid="boards-user-private-banner"
            className="px-6 py-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Personal cloud storage active for <strong>{user.email}</strong>. Only you can access your boards.
              </span>
            </div>
          </div>
        ) : (
          <div
            data-testid="boards-guest-login-banner"
            className="px-6 py-3 bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-indigo-900 dark:text-indigo-200"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Sign in with Google to protect your boards. Only you can view your personal boards.</span>
            </div>
            <button
              type="button"
              data-testid="btn-modal-google-signin"
              onClick={signInWithGoogle}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}

        {/* Action bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            data-testid="btn-modal-new-board"
            onClick={() => {
              onCreateNewBoard();
              onClose();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('boardsModal.newWhiteboard')}</span>
          </button>

          <div className="flex items-center gap-2">
            <input
              type="file"
              data-testid="input-import-board-file"
              ref={fileInputRef}
              accept=".json,.aidboard"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              data-testid="btn-import-board"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
              title={t('boardsModal.importTitle')}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t('boardsModal.importJson')}</span>
            </button>
            <button
              type="button"
              data-testid="btn-export-board"
              onClick={onExportCurrentJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
              title={t('boardsModal.exportTitle')}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('boardsModal.exportJson')}</span>
            </button>
          </div>
        </div>

        {/* Boards List */}
        <div data-testid="boards-list" className="p-6 overflow-y-auto space-y-2.5 flex-1">
          {boards.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-400 text-sm">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t('boardsModal.noSavedBoards')}</p>
            </div>
          ) : (
            [...boards]
              .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
              .map((b) => {
                const isCurrent = b.id === currentBoardId;
                const dateStr = new Date(b.updatedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (!isCurrent) {
                        onSelectBoard(b.id);
                        onClose();
                      }
                    }}
                    className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/30'
                        : 'bg-white dark:bg-zinc-800/90 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-50/70 dark:hover:bg-zinc-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-zinc-700/80 text-slate-500 dark:text-zinc-300'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                            {b.name}
                          </h4>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                              <Check className="w-2.5 h-2.5" /> {t('common.current')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-300 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dateStr}
                          </span>
                          {b.elementCount !== undefined && (
                            <span>{t('boardsModal.elementsCount', { count: b.elementCount })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t('boardsModal.deleteConfirm', { name: b.name }))) {
                              onDeleteBoard(b.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title={t('boardsModal.deleteBoard')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-800/60 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
