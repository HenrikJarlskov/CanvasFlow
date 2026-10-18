/**
 * @file WhiteboardModals.tsx
 * @description Centralized modal orchestration container.
 * Hosts and conditionally mounts all application dialogs:
 * - OcrModal (Handwriting & diagram OCR review)
 * - AiDrawModal (Gemini AI diagram prompt generation)
 * - BoardsModal (Workspace boards management & JSON import/export)
 * - ShareModal (Live collaboration link & user roster)
 * - HelpModal (Keyboard shortcuts reference & OKF architecture viewer)
 * - ImportModal (SAP BTP cloud architecture icons, Draw.io XML parser, image uploads)
 */

import React from 'react';
import { BoardElement, BoardMetadata, RemoteUser } from '../types/whiteboard';
import { OcrResult } from '../utils/ocr';
import { ShortcutItem } from '../utils/shortcuts';
import { OcrModal } from './OcrModal';
import { AiDrawModal } from './AiDrawModal';
import { BoardsModal } from './BoardsModal';
import { ShareModal } from './ShareModal';
import { HelpModal } from './HelpModal';
import { ImportModal } from './ImportModal';

/**
 * Props for the unified WhiteboardModals wrapper component.
 */
interface WhiteboardModalsProps {
  // OCR Modal
  isOcrModalOpen: boolean;
  onCloseOcr: () => void;
  ocrResult: OcrResult | null;
  ocrLoading: boolean;
  ocrProgress: number;
  ocrStatusText: string;
  onReplaceWithText: (text: string) => void;
  onInsertBesideText: (text: string) => void;
  onRunAiOcr: () => void;
  onRunTesseractOcr: () => void;

  // AI Draw Modal
  isAiDrawOpen: boolean;
  onCloseAiDraw: () => void;
  onGenerateDrawing: (prompt: string) => Promise<void>;
  aiDrawLoading: boolean;
  onCancelAiDraw: () => void;

  // Boards Modal
  isBoardsModalOpen: boolean;
  onCloseBoards: () => void;
  boards: BoardMetadata[];
  currentBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateNewBoard: () => void;
  onDeleteBoard: (boardId: string) => void;
  onImportBoard: (data: { name: string; elements: BoardElement[] }) => void;
  onExportCurrentJson: () => void;

  // Share Modal
  isShareModalOpen: boolean;
  onCloseShare: () => void;
  roomId: string;
  connectedUsers: RemoteUser[];
  currentUser: { userId: string; userName: string; userColor: string };
  onUpdateUserName: (name: string) => void;

  // Help Modal
  isHelpModalOpen: boolean;
  onCloseHelp: () => void;
  shortcuts: ShortcutItem[];
  onUpdateShortcuts: (items: ShortcutItem[]) => void;

  // Import Modal (Images, SAP Icons, Draw.io)
  isImportModalOpen?: boolean;
  onCloseImport?: () => void;
  onImportElements?: (elements: BoardElement[]) => void;
  onImportImageFile?: (file: File) => void;
  canvasCenter?: { x: number; y: number };
}

export const WhiteboardModals: React.FC<WhiteboardModalsProps> = React.memo(({
  isOcrModalOpen,
  onCloseOcr,
  ocrResult,
  ocrLoading,
  ocrProgress,
  ocrStatusText,
  onReplaceWithText,
  onInsertBesideText,
  onRunAiOcr,
  onRunTesseractOcr,

  isAiDrawOpen,
  onCloseAiDraw,
  onGenerateDrawing,
  aiDrawLoading,
  onCancelAiDraw,

  isBoardsModalOpen,
  onCloseBoards,
  boards,
  currentBoardId,
  onSelectBoard,
  onCreateNewBoard,
  onDeleteBoard,
  onImportBoard,
  onExportCurrentJson,

  isShareModalOpen,
  onCloseShare,
  roomId,
  connectedUsers,
  currentUser,
  onUpdateUserName,

  isHelpModalOpen,
  onCloseHelp,
  shortcuts,
  onUpdateShortcuts,

  isImportModalOpen = false,
  onCloseImport = () => {},
  onImportElements = () => {},
  onImportImageFile = () => {},
  canvasCenter,
}) => {
  return (
    <>
      <OcrModal
        isOpen={isOcrModalOpen}
        onClose={onCloseOcr}
        ocrResult={ocrResult}
        isLoading={ocrLoading}
        progress={ocrProgress}
        statusText={ocrStatusText}
        onReplaceWithText={onReplaceWithText}
        onInsertBesideText={onInsertBesideText}
        onRunAiOcr={onRunAiOcr}
        onRunTesseractOcr={onRunTesseractOcr}
      />

      <AiDrawModal
        isOpen={isAiDrawOpen}
        onClose={onCloseAiDraw}
        onGenerateDrawing={onGenerateDrawing}
        isLoading={aiDrawLoading}
        onCancel={onCancelAiDraw}
      />

      <BoardsModal
        isOpen={isBoardsModalOpen}
        onClose={onCloseBoards}
        boards={boards}
        currentBoardId={currentBoardId}
        onSelectBoard={onSelectBoard}
        onCreateNewBoard={onCreateNewBoard}
        onDeleteBoard={onDeleteBoard}
        onImportBoard={onImportBoard}
        onExportCurrentJson={onExportCurrentJson}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={onCloseShare}
        roomId={roomId}
        connectedUsers={connectedUsers}
        currentUser={currentUser}
        onUpdateUserName={onUpdateUserName}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={onCloseHelp}
        shortcuts={shortcuts}
        onUpdateShortcuts={onUpdateShortcuts}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={onCloseImport}
        onImportElements={onImportElements}
        onImportImageFile={onImportImageFile}
        canvasCenter={canvasCenter}
      />
    </>
  );
});
WhiteboardModals.displayName = 'WhiteboardModals';
