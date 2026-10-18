/**
 * @file BoardsModal.tsx
 * @description Workspace management modal for organizing, switching, creating,
 * deleting, and importing/exporting saved whiteboard documents.
 */

import React, { useRef } from 'react';
import { Folder, Plus, Trash2, Download, Upload, Clock, Layers, X, FileText, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BoardElement, BoardMetadata } from '../types/whiteboard';

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
    <div data-testid="boards-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] text-slate-800 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-base">{t('boardsModal.title')}</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300">{t('boardsModal.subtitle')}</p>
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

        {/* Action bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-zinc-850 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
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
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-750 rounded-xl transition-colors cursor-pointer"
              title={t('boardsModal.importTitle')}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t('boardsModal.importJson')}</span>
            </button>
            <button
              type="button"
              data-testid="btn-export-board"
              onClick={onExportCurrentJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-750 rounded-xl transition-colors cursor-pointer"
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
            boards.map((b) => {
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
                      : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-750 hover:border-slate-300 dark:hover:border-zinc-650 hover:bg-slate-50/70 dark:hover:bg-zinc-800 shadow-2xs'
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
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{b.name}</h4>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                            <Check className="w-2.5 h-2.5" /> {t('common.current')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
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
