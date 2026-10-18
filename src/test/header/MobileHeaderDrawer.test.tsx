import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MobileHeaderDrawer } from '../../components/header/MobileHeaderDrawer';

describe('MobileHeaderDrawer Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onOpenBoardsModal: vi.fn(),
    onNewBoard: vi.fn(),
    onOpenClearConfirm: vi.fn(),
    onImportPictureClick: vi.fn(),
    onOpenAiDraw: vi.fn(),
    isDarkMode: false,
    onToggleDarkMode: vi.fn(),
    onOpenShareModal: vi.fn(),
    onOpenHelpModal: vi.fn(),
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<MobileHeaderDrawer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all action buttons when isOpen is true', () => {
    render(<MobileHeaderDrawer {...defaultProps} />);

    expect(screen.getByTestId('mobile-header-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('btn-close-mobile-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-boards')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-new-board')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-share')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-ai-draw')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-import')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-toggle-dark-mode')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-help')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-btn-clear')).toBeInTheDocument();
  });

  it('triggers onOpenBoardsModal and closes drawer', () => {
    const onOpenBoardsModal = vi.fn();
    const onClose = vi.fn();
    render(
      <MobileHeaderDrawer
        {...defaultProps}
        onOpenBoardsModal={onOpenBoardsModal}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('mobile-btn-boards'));
    expect(onOpenBoardsModal).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onNewBoard and closes drawer', () => {
    const onNewBoard = vi.fn();
    const onClose = vi.fn();
    render(<MobileHeaderDrawer {...defaultProps} onNewBoard={onNewBoard} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('mobile-btn-new-board'));
    expect(onNewBoard).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenShareModal and closes drawer', () => {
    const onOpenShareModal = vi.fn();
    const onClose = vi.fn();
    render(
      <MobileHeaderDrawer
        {...defaultProps}
        onOpenShareModal={onOpenShareModal}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('mobile-btn-share'));
    expect(onOpenShareModal).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenAiDraw and closes drawer', () => {
    const onOpenAiDraw = vi.fn();
    const onClose = vi.fn();
    render(
      <MobileHeaderDrawer
        {...defaultProps}
        onOpenAiDraw={onOpenAiDraw}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('mobile-btn-ai-draw'));
    expect(onOpenAiDraw).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onImportPictureClick and closes drawer', () => {
    const onImportPictureClick = vi.fn();
    const onClose = vi.fn();
    render(
      <MobileHeaderDrawer
        {...defaultProps}
        onImportPictureClick={onImportPictureClick}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('mobile-btn-import'));
    expect(onImportPictureClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onToggleDarkMode and displays dark/light label correctly', () => {
    const onToggleDarkMode = vi.fn();
    const onClose = vi.fn();
    const { rerender } = render(
      <MobileHeaderDrawer
        {...defaultProps}
        isDarkMode={false}
        onToggleDarkMode={onToggleDarkMode}
        onClose={onClose}
      />
    );

    const toggleBtn = screen.getByTestId('mobile-btn-toggle-dark-mode');
    expect(toggleBtn).toHaveTextContent('Dark Mode');

    fireEvent.click(toggleBtn);
    expect(onToggleDarkMode).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <MobileHeaderDrawer
        {...defaultProps}
        isDarkMode={true}
        onToggleDarkMode={onToggleDarkMode}
        onClose={onClose}
      />
    );
    expect(screen.getByTestId('mobile-btn-toggle-dark-mode')).toHaveTextContent('Light Mode');
  });

  it('triggers onOpenHelpModal and onOpenClearConfirm', () => {
    const onOpenHelpModal = vi.fn();
    const onOpenClearConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <MobileHeaderDrawer
        {...defaultProps}
        onOpenHelpModal={onOpenHelpModal}
        onOpenClearConfirm={onOpenClearConfirm}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('mobile-btn-help'));
    expect(onOpenHelpModal).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('mobile-btn-clear'));
    expect(onOpenClearConfirm).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking the backdrop overlay or close icon', () => {
    const onClose = vi.fn();
    render(<MobileHeaderDrawer {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('btn-close-mobile-drawer'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('mobile-header-drawer'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
