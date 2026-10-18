import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../components/Header';

describe('Header Component', () => {
  const defaultProps = {
    boardName: 'Brainstorming Session',
    onRenameBoard: vi.fn(),
    background: 'dots' as const,
    onChangeBackground: vi.fn(),
    onNewBoard: vi.fn(),
    onOpenBoardsModal: vi.fn(),
    onClearBoard: vi.fn(),
    onExportPNG: vi.fn(),
    onExportPDF: vi.fn(),
    onExportSVG: vi.fn(),
    onOpenShareModal: vi.fn(),
    connectedUsers: [],
    currentUser: { userId: 'u1', userName: 'Tester', userColor: '#2563eb' },
    isSocketConnected: true,
  };

  it('renders branding and board title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('AIdboard')).toBeInTheDocument();
    expect(screen.getByTestId('header-board-title')).toHaveTextContent('Brainstorming Session');
  });

  it('allows renaming board title', () => {
    const onRenameBoard = vi.fn();
    render(<Header {...defaultProps} onRenameBoard={onRenameBoard} />);

    // Click title to enter editing mode
    fireEvent.click(screen.getByTestId('header-board-title'));
    const input = screen.getByTestId('header-title-input');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Sprint 4 Retro' } });
    fireEvent.click(screen.getByTestId('header-title-save'));
    expect(onRenameBoard).toHaveBeenCalledWith('Sprint 4 Retro');
  });

  it('handles clear board with confirmation and cancel', () => {
    const onClearBoard = vi.fn();
    render(<Header {...defaultProps} onClearBoard={onClearBoard} />);

    // Click clear button opens confirmation dialog
    fireEvent.click(screen.getByTestId('btn-clear-board'));
    expect(screen.getByTestId('clear-confirm-dialog')).toBeInTheDocument();

    // Cancel does not call onClearBoard
    fireEvent.click(screen.getByTestId('btn-cancel-clear'));
    expect(onClearBoard).not.toHaveBeenCalled();

    // Click clear and confirm
    fireEvent.click(screen.getByTestId('btn-clear-board'));
    fireEvent.click(screen.getByTestId('btn-confirm-clear'));
    expect(onClearBoard).toHaveBeenCalledTimes(1);
  });

  it('switches canvas background styles', () => {
    const onChangeBackground = vi.fn();
    render(<Header {...defaultProps} onChangeBackground={onChangeBackground} />);

    // Open background options menu
    fireEvent.click(screen.getByTestId('btn-bg-menu'));
    expect(screen.getByTestId('bg-options-menu')).toBeInTheDocument();

    // Select blueprint
    fireEvent.click(screen.getByTestId('bg-option-blueprint'));
    expect(onChangeBackground).toHaveBeenCalledWith('blueprint');
  });

  it('handles export menu for PNG, PDF, and SVG', () => {
    const onExportPNG = vi.fn();
    const onExportPDF = vi.fn();
    const onExportSVG = vi.fn();
    render(
      <Header
        {...defaultProps}
        onExportPNG={onExportPNG}
        onExportPDF={onExportPDF}
        onExportSVG={onExportSVG}
      />
    );

    // Open export dropdown
    fireEvent.click(screen.getByTestId('btn-export-menu'));
    expect(screen.getByTestId('export-dropdown-menu')).toBeInTheDocument();

    // Click PNG
    fireEvent.click(screen.getByTestId('btn-export-png'));
    expect(onExportPNG).toHaveBeenCalledTimes(1);

    // Reopen and click PDF
    fireEvent.click(screen.getByTestId('btn-export-menu'));
    fireEvent.click(screen.getByTestId('btn-export-pdf'));
    expect(onExportPDF).toHaveBeenCalledTimes(1);

    // Reopen and click SVG
    fireEvent.click(screen.getByTestId('btn-export-menu'));
    fireEvent.click(screen.getByTestId('btn-export-svg'));
    expect(onExportSVG).toHaveBeenCalledTimes(1);
  });

  it('opens share modal when clicking share button or collaborators avatar', () => {
    const onOpenShareModal = vi.fn();
    render(<Header {...defaultProps} onOpenShareModal={onOpenShareModal} />);

    fireEvent.click(screen.getByTestId('btn-share-modal'));
    expect(onOpenShareModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-collaborators'));
    expect(onOpenShareModal).toHaveBeenCalledTimes(2);
  });

  it('triggers dark mode toggle, AI draw, and picture import', () => {
    const onToggleDarkMode = vi.fn();
    const onOpenAiDraw = vi.fn();
    const onImportImageFile = vi.fn();

    render(
      <Header
        {...defaultProps}
        isDarkMode={false}
        onToggleDarkMode={onToggleDarkMode}
        onOpenAiDraw={onOpenAiDraw}
        onImportImageFile={onImportImageFile}
      />
    );

    // Dark mode button
    const darkToggle = screen.getByTestId('btn-toggle-dark-mode');
    expect(darkToggle).toBeInTheDocument();
    fireEvent.click(darkToggle);
    expect(onToggleDarkMode).toHaveBeenCalledTimes(1);

    // AI Draw button
    const aiDrawBtn = screen.getByTestId('btn-header-ai-draw');
    expect(aiDrawBtn).toBeInTheDocument();
    fireEvent.click(aiDrawBtn);
    expect(onOpenAiDraw).toHaveBeenCalledTimes(1);

    // Import button
    const importBtn = screen.getByTestId('btn-header-import');
    expect(importBtn).toBeInTheDocument();
  });

  it('triggers onOpenHelpModal when help icon button is clicked', () => {
    const onOpenHelpModal = vi.fn();
    render(<Header {...defaultProps} onOpenHelpModal={onOpenHelpModal} />);

    const helpBtn = screen.getByTestId('btn-help-modal');
    expect(helpBtn).toBeInTheDocument();
    fireEvent.click(helpBtn);
    expect(onOpenHelpModal).toHaveBeenCalledTimes(1);
  });

  it('triggers mobile menu drawer toggle and mobile actions', () => {
    render(<Header {...defaultProps} />);

    const menuToggle = screen.getByTestId('btn-mobile-menu-toggle');
    expect(menuToggle).toBeInTheDocument();

    fireEvent.click(menuToggle);
    expect(screen.getByTestId('mobile-header-drawer')).toBeInTheDocument();
  });

  it('renders collaborators overflow badge when more than 2 users connected', () => {
    const manyUsers = [
      { userId: 'u2', userName: 'Bob', userColor: '#10b981', cursor: undefined },
      { userId: 'u3', userName: 'Charlie', userColor: '#f59e0b', cursor: undefined },
      { userId: 'u4', userName: 'Dave', userColor: '#ec4899', cursor: undefined },
    ];

    render(<Header {...defaultProps} connectedUsers={manyUsers} />);
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('handles image file selection and board buttons', () => {
    const onImportImageFile = vi.fn();
    const onOpenBoardsModal = vi.fn();
    const onNewBoard = vi.fn();

    render(
      <Header
        {...defaultProps}
        onImportImageFile={onImportImageFile}
        onOpenBoardsModal={onOpenBoardsModal}
        onNewBoard={onNewBoard}
      />
    );

    fireEvent.click(screen.getByTestId('btn-boards-modal'));
    expect(onOpenBoardsModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-new-board'));
    expect(onNewBoard).toHaveBeenCalledTimes(1);

    const fileInput = screen.getByTestId('header-image-file-input') as HTMLInputElement;
    const testFile = new File(['image bytes'], 'board.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    expect(onImportImageFile).toHaveBeenCalledWith(testFile);

    // Click header import button
    fireEvent.click(screen.getByTestId('btn-header-import'));
  });

  it('triggers onOpenImportModal when Import button is clicked in header', () => {
    const onOpenImportModal = vi.fn();
    render(<Header {...defaultProps} onOpenImportModal={onOpenImportModal} />);

    fireEvent.click(screen.getByTestId('btn-header-import'));
    expect(onOpenImportModal).toHaveBeenCalledTimes(1);
  });

  it('handles mobile drawer clear and import button actions', () => {
    render(<Header {...defaultProps} />);

    // Open mobile menu
    fireEvent.click(screen.getByTestId('btn-mobile-menu-toggle'));

    // Click clear canvas in mobile drawer
    fireEvent.click(screen.getByTestId('mobile-btn-clear'));
    expect(screen.getByTestId('clear-confirm-dialog')).toBeInTheDocument();

    // Reopen mobile drawer to click import
    fireEvent.click(screen.getByTestId('btn-mobile-menu-toggle'));
    fireEvent.click(screen.getByTestId('mobile-btn-import'));
  });
});
