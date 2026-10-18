import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { WhiteboardModals } from '../components/WhiteboardModals';

describe('WhiteboardModals Component', () => {
  const defaultProps = {
    isOcrModalOpen: false,
    onCloseOcr: vi.fn(),
    ocrResult: null,
    ocrLoading: false,
    ocrProgress: 0,
    ocrStatusText: '',
    onReplaceWithText: vi.fn(),
    onInsertBesideText: vi.fn(),
    onRunAiOcr: vi.fn(),
    onRunTesseractOcr: vi.fn(),

    isAiDrawOpen: false,
    onCloseAiDraw: vi.fn(),
    onGenerateDrawing: vi.fn(),
    aiDrawLoading: false,
    onCancelAiDraw: vi.fn(),

    isBoardsModalOpen: false,
    onCloseBoards: vi.fn(),
    boards: [],
    currentBoardId: 'b-1',
    onSelectBoard: vi.fn(),
    onCreateNewBoard: vi.fn(),
    onDeleteBoard: vi.fn(),
    onImportBoard: vi.fn(),
    onExportCurrentJson: vi.fn(),

    isShareModalOpen: false,
    onCloseShare: vi.fn(),
    roomId: 'room-1',
    connectedUsers: [],
    currentUser: { userId: 'u1', userName: 'User', userColor: '#2563eb' },
    onUpdateUserName: vi.fn(),

    isHelpModalOpen: false,
    onCloseHelp: vi.fn(),
    shortcuts: [],
    onUpdateShortcuts: vi.fn(),
  };

  it('renders nothing when all modals are closed', () => {
    const { container } = render(<WhiteboardModals {...defaultProps} />);
    expect(screen.queryByTestId('ocr-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-draw-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('boards-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('share-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument();
  });

  it('renders active modal when flagged open', () => {
    const { rerender } = render(<WhiteboardModals {...defaultProps} isOcrModalOpen={true} />);
    expect(screen.getByTestId('ocr-modal')).toBeInTheDocument();

    rerender(<WhiteboardModals {...defaultProps} isAiDrawOpen={true} />);
    expect(screen.getByTestId('ai-draw-modal')).toBeInTheDocument();

    rerender(<WhiteboardModals {...defaultProps} isBoardsModalOpen={true} />);
    expect(screen.getByTestId('boards-modal')).toBeInTheDocument();

    rerender(<WhiteboardModals {...defaultProps} isShareModalOpen={true} />);
    expect(screen.getByTestId('share-modal')).toBeInTheDocument();

    rerender(<WhiteboardModals {...defaultProps} isHelpModalOpen={true} />);
    expect(screen.getByTestId('help-modal')).toBeInTheDocument();

    rerender(<WhiteboardModals {...defaultProps} isImportModalOpen={true} />);
    expect(screen.getByTestId('import-modal')).toBeInTheDocument();
  });
});
