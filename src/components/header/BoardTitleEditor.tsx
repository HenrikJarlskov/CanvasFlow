/**
 * @file BoardTitleEditor.tsx
 * @description Inline editable title label for the active whiteboard canvas.
 * Switches between interactive read-only display and an autofocus input field.
 */

import React, { useState, useEffect } from 'react';
import { Edit2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the BoardTitleEditor component.
 */
interface BoardTitleEditorProps {
  /** Name of the current board */
  boardName: string;
  /** Callback fired with new title on submit */
  onRenameBoard: (newName: string) => void;
}

/**
 * Inline title editor component allowing quick renaming directly in the header.
 */
export const BoardTitleEditor: React.FC<BoardTitleEditorProps> = ({
  boardName,
  onRenameBoard,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(boardName);

  useEffect(() => {
    setTitleInput(boardName);
  }, [boardName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onRenameBoard(titleInput.trim());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-1">
        <input
          type="text"
          data-testid="header-title-input"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={handleSubmit}
          autoFocus
          aria-label={t('header.boardTitleInput')}
          className="text-sm font-semibold text-slate-800 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500/30 max-w-44 sm:max-w-56"
        />
        <button
          type="submit"
          data-testid="header-title-save"
          aria-label={t('header.saveBoardTitle')}
          className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      data-testid="header-board-title"
      onClick={() => setIsEditing(true)}
      aria-label={t('header.renameBoard', { name: boardName })}
      className="group flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer max-w-[140px] sm:max-w-xs truncate"
      title={t('header.clickToRename')}
    >
      <span className="truncate">{boardName}</span>
      <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 transition-opacity shrink-0" />
    </button>
  );
};
