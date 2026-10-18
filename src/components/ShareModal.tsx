/**
 * @file ShareModal.tsx
 * @description Real-time collaboration invite and participant management dialog.
 * Generates room join links, lists online collaborators with their custom presence colors,
 * and allows users to update their local display nickname.
 */

import React, { useState } from 'react';
import { Copy, Check, Users, X, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RemoteUser } from '../types/whiteboard';

/**
 * Props for the ShareModal live collaboration dialog.
 */
interface ShareModalProps {
  /** Modal visibility state */
  isOpen: boolean;
  /** Callback fired to close the modal */
  onClose: () => void;
  /** Active collaboration session room code */
  roomId: string;
  /** Roster of other users currently in this room */
  connectedUsers: RemoteUser[];
  /** Local client user information */
  currentUser: { userId: string; userName: string; userColor: string };
  /** Callback to update and broadcast user nickname */
  onUpdateUserName: (name: string) => void;
}

/**
 * Collaboration modal displaying shareable URL, copy button, active user roster,
 * and user nickname preferences.
 */
export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  connectedUsers,
  currentUser,
  onUpdateUserName,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.userName);
  const [isEditingName, setIsEditingName] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?room=${encodeURIComponent(roomId)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUserName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div data-testid="share-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-md overflow-hidden text-slate-800 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 text-base">{t('shareModal.title')}</h3>
              <p className="text-xs text-slate-600 dark:text-zinc-300">{t('shareModal.subtitle')}</p>
            </div>
          </div>
          <button
            data-testid="btn-close-share-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Link box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-2">
              {t('shareModal.shareableLink')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                data-testid="input-share-url"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-zinc-100 select-all focus:outline-none"
              />
              <button
                type="button"
                data-testid="btn-copy-share-url"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5">
              {t('shareModal.linkNotice')}
            </p>
          </div>

          {/* User profile */}
          <div className="bg-slate-50 dark:bg-zinc-850 p-3.5 rounded-xl border border-slate-200/70 dark:border-zinc-750">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                  style={{ backgroundColor: currentUser.userColor }}
                >
                  {currentUser.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {t('shareModal.yourDisplayName')}{' '}
                    <span data-testid="current-user-name" className="font-semibold">
                      {currentUser.userName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {t('shareModal.visibleToCollaborators')}
                  </div>
                </div>
              </div>
              <button
                type="button"
                data-testid="btn-change-username"
                onClick={() => setIsEditingName(!isEditingName)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
              >
                {isEditingName ? t('common.cancel') : t('common.change')}
              </button>
            </div>

            {isEditingName && (
              <form onSubmit={handleSaveName} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  data-testid="input-username"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={t('shareModal.enterYourName')}
                  autoFocus
                />
                <button
                  type="submit"
                  data-testid="btn-save-username"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer"
                >
                  {t('common.save')}
                </button>
              </form>
            )}
          </div>

          {/* Connected users */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                <Users className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                <span>{t('shareModal.activeCollaborators', { count: connectedUsers.length + 1 })}</span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t('shareModal.liveSyncActive')}
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {/* Current user */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: currentUser.userColor }}
                  >
                    {currentUser.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {currentUser.userName} <span className="text-slate-500 dark:text-zinc-400 font-normal">{t('shareModal.you')}</span>
                  </span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                  {t('shareModal.host')}
                </span>
              </div>

              {/* Other users */}
              {connectedUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-750"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: user.userColor }}
                    >
                      {user.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-slate-800 dark:text-zinc-200">{user.userName}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{t('shareModal.online')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-zinc-800/60 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl transition-colors cursor-pointer"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
};
